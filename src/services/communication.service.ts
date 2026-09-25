import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { EventBusService } from "./event-bus.service";
import { AuditService } from "./audit.service";
import { TaskService } from "./task.service";

export interface SendMessageInput {
  content: string;
  parentId?: string;
  priority?: "NORMAL" | "IMPORTANT" | "URGENT";
  isInternal?: boolean;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
  mentions?: string[]; // Array of employee IDs or user IDs
}

// In-memory unread count cache to eliminate database polling bottleneck
interface CachedUnreadCount {
  count: number;
  cachedAt: number;
}
const unreadCountCache = new Map<string, CachedUnreadCount>();
const UNREAD_CACHE_TTL_MS = 25 * 1000; // 25s

export function invalidateCommunicationUnreadCache(employeeId?: string) {
  if (employeeId) {
    unreadCountCache.delete(employeeId);
  } else {
    unreadCountCache.clear();
  }
}

export class CommunicationService {
  /**
   * Helper: Extracts @mentions in message body (e.g. @Rahul or @John) and resolves employee IDs
   */
  static async extractAndNotifyMentions(
    content: string,
    organizationId: string,
    senderEmployee: any,
    conversationTitle: string,
    actionUrl: string
  ): Promise<string[]> {
    const mentionRegex = /@(\w+)/g;
    const matches = Array.from(content.matchAll(mentionRegex), (m) => m[1]);
    if (matches.length === 0) return [];

    const mentionedEmployees = await db.employee.findMany({
      where: {
        organizationId,
        employmentStatus: "ACTIVE",
        OR: [
          { firstName: { in: matches, mode: "insensitive" } },
          { lastName: { in: matches, mode: "insensitive" } },
        ],
      },
      select: { id: true, userId: true, firstName: true, lastName: true },
    });

    const targetUserIds = mentionedEmployees
      .map((e) => e.userId)
      .filter((uid): uid is string => Boolean(uid) && uid !== senderEmployee.userId);

    if (targetUserIds.length > 0) {
      await EventBusService.publish({
        type: "SYSTEM",
        organizationId,
        targetUserIds,
        title: `💬 Mentioned by ${senderEmployee.firstName} ${senderEmployee.lastName}`,
        message: `You were mentioned in ${conversationTitle}: "${content.slice(0, 120)}${content.length > 120 ? "..." : ""}"`,
        priority: "HIGH",
        actionUrl,
        dedupeKey: `MENTION:${senderEmployee.id}:${Date.now()}`,
      });
    }

    return mentionedEmployees.map((e) => e.id);
  }

  /**
   * Get or create a 1:1 Direct Message conversation
   */
  static async getOrCreateDirectConversation(user: AuthenticatedUser, otherEmployeeId: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const currentEmpId = user.employee.id;

    if (currentEmpId === otherEmployeeId) {
      throw new Error("Cannot start a direct message with yourself");
    }

    // Verify other employee exists in same organization
    const otherEmp = await db.employee.findFirst({
      where: { id: otherEmployeeId, organizationId: orgId },
      select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true },
    });
    if (!otherEmp) throw new Error("Target employee not found in organization");

    // Look for existing direct conversation between both employees
    const existing = await db.conversation.findFirst({
      where: {
        organizationId: orgId,
        type: "DIRECT",
        AND: [
          { participants: { some: { employeeId: currentEmpId } } },
          { participants: { some: { employeeId: otherEmployeeId } } },
        ],
      },
      include: {
        participants: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (existing) return existing;

    // Create new direct conversation
    const conversation = await db.conversation.create({
      data: {
        organizationId: orgId,
        type: "DIRECT",
        isPrivate: true,
        createdById: currentEmpId,
        participants: {
          create: [
            { employeeId: currentEmpId, role: "OWNER" },
            { employeeId: otherEmployeeId, role: "MEMBER" },
          ],
        },
      },
      include: {
        participants: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return conversation;
  }

  /**
   * Get or create a conversation attached to a CRM record
   */
  static async getOrCreateRecordConversation(
    user: AuthenticatedUser,
    recordType: string,
    recordId: string,
    title?: string
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const empId = user.employee.id;

    const cleanRecordType = recordType.toUpperCase();

    let conversation = await db.conversation.findFirst({
      where: {
        organizationId: orgId,
        recordType: cleanRecordType,
        recordId,
      },
      include: {
        participants: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          organizationId: orgId,
          type: "RECORD",
          title: title || `${cleanRecordType} Discussion`,
          recordType: cleanRecordType,
          recordId,
          createdById: empId,
          participants: {
            create: [{ employeeId: empId, role: "OWNER" }],
          },
        },
        include: {
          participants: {
            include: {
              employee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
          },
        },
      });
    } else {
      // Ensure current employee is a participant
      const isParticipant = conversation.participants.some((p) => p.employeeId === empId);
      if (!isParticipant) {
        await db.conversationParticipant.create({
          data: { conversationId: conversation.id, employeeId: empId, role: "MEMBER" },
        });
      }
    }

    return conversation;
  }

  /**
   * Create an internal group or department channel
   */
  static async createGroupConversation(
    user: AuthenticatedUser,
    data: {
      title: string;
      description?: string;
      channelCode?: string;
      departmentId?: string;
      memberEmployeeIds?: string[];
      isPrivate?: boolean;
    }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const empId = user.employee.id;

    const memberIds = Array.from(new Set([empId, ...(data.memberEmployeeIds || [])]));

    const conversation = await db.conversation.create({
      data: {
        organizationId: orgId,
        type: data.departmentId ? "CHANNEL" : "GROUP",
        title: data.title,
        description: data.description || null,
        channelCode: data.channelCode || data.title.toLowerCase().replace(/\s+/g, "-"),
        departmentId: data.departmentId || null,
        isPrivate: data.isPrivate ?? false,
        createdById: empId,
        participants: {
          create: memberIds.map((id) => ({
            employeeId: id,
            role: id === empId ? "OWNER" : "MEMBER",
          })),
        },
      },
      include: {
        participants: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, designation: true } },
          },
        },
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "COMMUNICATION_GROUP_CREATED",
      entity: "Conversation",
      entityId: conversation.id,
      newValue: { title: data.title, memberCount: memberIds.length },
    });

    return conversation;
  }

  /**
   * List all conversations accessible by the authenticated user
   */
  static async getConversations(
    user: AuthenticatedUser,
    filters: { type?: string; recordType?: string; search?: string } = {}
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const empId = user.employee.id;

    const where: any = {
      organizationId: orgId,
      isArchived: false,
      OR: [
        { participants: { some: { employeeId: empId } } },
        // Public department channels can be seen by department members
        { isPrivate: false, type: { in: ["CHANNEL", "GROUP"] } },
      ],
    };

    if (filters.type && filters.type !== "ALL") where.type = filters.type;
    if (filters.recordType) where.recordType = filters.recordType;
    if (filters.search && filters.search.trim()) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: filters.search.trim(), mode: "insensitive" } },
            { description: { contains: filters.search.trim(), mode: "insensitive" } },
            { channelCode: { contains: filters.search.trim(), mode: "insensitive" } },
          ],
        },
      ];
    }

    const conversations = await db.conversation.findMany({
      where,
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      include: {
        participants: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true },
            },
          },
        },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    // Compute unread counts and display metadata
    return conversations.map((conv) => {
      const myParticipant = conv.participants.find((p) => p.employeeId === empId);
      const lastRead = myParticipant?.lastReadAt ? new Date(myParticipant.lastReadAt) : new Date(0);
      const lastMsg = conv.messages[0];
      const hasUnread = lastMsg ? new Date(lastMsg.createdAt) > lastRead : false;

      // For direct conversations, label title with other person's name
      let displayTitle = conv.title;
      let displayAvatar = null;
      let otherPerson: any = null;

      if (conv.type === "DIRECT") {
        otherPerson = conv.participants.find((p) => p.employeeId !== empId)?.employee;
        displayTitle = otherPerson ? `${otherPerson.firstName} ${otherPerson.lastName}` : "Direct Message";
        displayAvatar = otherPerson?.avatarUrl;
      }

      return {
        id: conv.id,
        type: conv.type,
        title: displayTitle,
        description: conv.description,
        recordType: conv.recordType,
        recordId: conv.recordId,
        channelCode: conv.channelCode,
        isPrivate: conv.isPrivate,
        participantCount: conv.participants.length,
        participants: conv.participants,
        otherPerson,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              content: lastMsg.content,
              senderName: `${lastMsg.sender.firstName} ${lastMsg.sender.lastName}`,
              createdAt: lastMsg.createdAt,
              priority: lastMsg.priority,
            }
          : null,
        lastMessageAt: conv.lastMessageAt || conv.createdAt,
        hasUnread,
      };
    });
  }

  /**
   * Get single conversation with verification that user has permission
   */
  static async getConversationById(user: AuthenticatedUser, conversationId: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const empId = user.employee.id;

    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, organizationId: orgId },
      include: {
        participants: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!conversation) throw new Error("Conversation not found");

    // Privacy & Security Check:
    // If it's private or direct, authenticated employee MUST be a participant
    const isMember = conversation.participants.some((p) => p.employeeId === empId);
    if (conversation.isPrivate && !isMember) {
      throw new Error("Access Denied: You are not an authorized participant of this private conversation");
    }

    // Mark as read for this employee
    await db.conversationParticipant.updateMany({
      where: { conversationId, employeeId: empId },
      data: { lastReadAt: new Date() },
    });

    invalidateCommunicationUnreadCache(empId);

    return conversation;
  }

  /**
   * Fetch paginated messages for a conversation
   */
  static async getMessages(
    user: AuthenticatedUser,
    conversationId: string,
    filters: { limit?: number; before?: string; parentId?: string } = {}
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const empId = user.employee.id;

    // Validate access
    await this.getConversationById(user, conversationId);

    const limit = Math.min(filters.limit || 50, 100);
    const where: any = {
      conversationId,
      parentId: filters.parentId || null, // Root messages by default
    };

    if (filters.before) {
      where.createdAt = { lt: new Date(filters.before) };
    }

    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true, userId: true },
        },
        replies: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      content: m.isDeleted ? "[This message was deleted]" : m.content,
      sender: m.sender,
      isMine: m.senderId === empId,
      priority: m.priority,
      isInternal: m.isInternal,
      isEdited: m.isEdited,
      isDeleted: m.isDeleted,
      editedAt: m.editedAt,
      attachments: m.attachments ? JSON.parse(m.attachments) : [],
      mentions: m.mentions ? JSON.parse(m.mentions) : [],
      reactions: m.reactions ? JSON.parse(m.reactions) : [],
      replyCount: m.replies.length,
      replies: m.replies.map((r) => ({
        id: r.id,
        content: r.isDeleted ? "[This message was deleted]" : r.content,
        sender: r.sender,
        isMine: r.senderId === empId,
        createdAt: r.createdAt,
      })),
      createdAt: m.createdAt,
    }));
  }

  /**
   * Send a new message or threaded reply in a conversation
   */
  static async sendMessage(user: AuthenticatedUser, conversationId: string, data: SendMessageInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const senderEmp = user.employee;

    // Validate access
    const conversation = await this.getConversationById(user, conversationId);

    if (!data.content || !data.content.trim()) {
      throw new Error("Message content cannot be empty");
    }

    // 1. Create message record
    const message = await db.message.create({
      data: {
        conversationId,
        senderId: senderEmp.id,
        content: data.content.trim(),
        parentId: data.parentId || null,
        priority: data.priority || "NORMAL",
        isInternal: data.isInternal ?? true,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true, userId: true },
        },
      },
    });

    // 2. Update conversation lastMessageAt and sender lastReadAt
    await Promise.all([
      db.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
      db.conversationParticipant.updateMany({
        where: { conversationId, employeeId: senderEmp.id },
        data: { lastReadAt: new Date() },
      }),
    ]);

    invalidateCommunicationUnreadCache();

    // 3. Process @Mentions
    const actionUrl = conversation.recordType && conversation.recordId
      ? `/app/communications?conversationId=${conversation.id}`
      : `/app/communications?conversationId=${conversation.id}`;

    const mentionedIds = await this.extractAndNotifyMentions(
      data.content,
      orgId,
      senderEmp,
      conversation.title || "Conversation",
      actionUrl
    );

    if (mentionedIds.length > 0) {
      await db.message.update({
        where: { id: message.id },
        data: { mentions: JSON.stringify(mentionedIds) },
      });
    }

    // 4. If message is URGENT, notify all other participants immediately
    if (data.priority === "URGENT") {
      const otherParticipantEmps = conversation.participants
        .filter((p) => p.employeeId !== senderEmp.id)
        .map((p) => p.employee);

      const targetUserIds = (
        await db.employee.findMany({
          where: { id: { in: otherParticipantEmps.map((e) => e.id) } },
          select: { userId: true },
        })
      )
        .map((e) => e.userId)
        .filter((uid): uid is string => Boolean(uid));

      if (targetUserIds.length > 0) {
        await EventBusService.publish({
          type: "SYSTEM",
          organizationId: orgId,
          targetUserIds,
          title: `🚨 URGENT Message: ${conversation.title || "Direct Message"}`,
          message: `${senderEmp.firstName} ${senderEmp.lastName}: ${data.content.slice(0, 100)}`,
          priority: "URGENT",
          actionUrl,
        });
      }
    }

    // 5. If conversation is linked to a CRM record, record timeline activity
    if (conversation.recordType && conversation.recordId) {
      if (conversation.recordType === "CLIENT") {
        await db.crmActivity.create({
          data: {
            organizationId: orgId,
            clientId: conversation.recordId,
            type: "NOTE",
            subject: `Team Discussion: ${senderEmp.firstName} commented`,
            description: data.content.slice(0, 200),
            performedById: senderEmp.id,
          },
        });
      } else if (conversation.recordType === "OPERATION") {
        await db.operationActivity.create({
          data: {
            operationId: conversation.recordId,
            type: "COMMENT_ADDED",
            description: `${senderEmp.firstName} ${senderEmp.lastName} posted in team channel: "${data.content.slice(0, 140)}"`,
            performedById: senderEmp.id,
          },
        });
      }
    }

    return message;
  }

  /**
   * Edit own message
   */
  static async editMessage(user: AuthenticatedUser, messageId: string, newContent: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const empId = user.employee.id;

    const message = await db.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new Error("Message not found");
    if (message.senderId !== empId) {
      throw new Error("Forbidden: You can only edit your own messages");
    }

    const updated = await db.message.update({
      where: { id: messageId },
      data: {
        content: newContent.trim(),
        isEdited: true,
        editedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Soft-delete own message
   */
  static async deleteMessage(user: AuthenticatedUser, messageId: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const empId = user.employee.id;

    const message = await db.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new Error("Message not found");
    if (message.senderId !== empId && user.roleCode !== "SUPER_ADMIN") {
      throw new Error("Forbidden: You can only delete your own messages");
    }

    const deleted = await db.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: "[This message was deleted]",
      },
    });

    return deleted;
  }

  /**
   * Add or toggle emoji reaction on a message
   */
  static async toggleReaction(user: AuthenticatedUser, messageId: string, emoji: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const empId = user.employee.id;
    const empName = `${user.employee.firstName} ${user.employee.lastName}`;

    const message = await db.message.findUnique({ where: { id: messageId } });
    if (!message) throw new Error("Message not found");

    const currentReactions: Array<{ emoji: string; employeeId: string; employeeName: string }> = message.reactions
      ? JSON.parse(message.reactions)
      : [];

    const existingIndex = currentReactions.findIndex(
      (r) => r.emoji === emoji && r.employeeId === empId
    );

    let updatedReactions;
    if (existingIndex > -1) {
      // Remove reaction
      updatedReactions = currentReactions.filter((_, i) => i !== existingIndex);
    } else {
      // Add reaction
      updatedReactions = [...currentReactions, { emoji, employeeId: empId, employeeName: empName }];
    }

    await db.message.update({
      where: { id: messageId },
      data: { reactions: JSON.stringify(updatedReactions) },
    });

    return updatedReactions;
  }

  /**
   * Convert a message into a real CRM Task (Requirement 13)
   */
  static async convertMessageToTask(
    user: AuthenticatedUser,
    messageId: string,
    taskOverrides?: { title?: string; assigneeId?: string; priority?: string; dueDays?: number }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const creatorEmpId = user.employee.id;

    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
        sender: { select: { firstName: true, lastName: true } },
      },
    });
    if (!message) throw new Error("Message not found");

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (taskOverrides?.dueDays || 3));

    const taskTitle = taskOverrides?.title || `Follow-up on message from ${message.sender.firstName}: "${message.content.slice(0, 40)}..."`;
    const taskDesc = `[Converted from Communication Hub message]\n\n"${message.content}"\n\nOriginal Author: ${message.sender.firstName} ${message.sender.lastName}`;

    const task = await TaskService.createTask(user, {
      title: taskTitle,
      description: taskDesc,
      priority: (taskOverrides?.priority as any) || (message.priority === "URGENT" ? "URGENT" : "MEDIUM"),
      dueDate: dueDate.toISOString(),
      assigneeId: taskOverrides?.assigneeId || creatorEmpId,
      relatedClientId: message.conversation.recordType === "CLIENT" ? message.conversation.recordId || undefined : undefined,
      operationId: message.conversation.recordType === "OPERATION" ? message.conversation.recordId || undefined : undefined,
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "COMMUNICATION_MESSAGE_CONVERTED_TO_TASK",
      entity: "Task",
      entityId: task.id,
      newValue: { messageId, title: task.title },
    });

    return task;
  }

  /**
   * Global Communication Search (Messages, Records, Attachments)
   */
  static async searchCommunications(user: AuthenticatedUser, query: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const empId = user.employee.id;

    if (!query || !query.trim()) return { messages: [], conversations: [] };

    const clean = query.trim();

    const [messages, conversations] = await Promise.all([
      db.message.findMany({
        where: {
          conversation: {
            organizationId: orgId,
            OR: [
              { participants: { some: { employeeId: empId } } },
              { isPrivate: false },
            ],
          },
          content: { contains: clean, mode: "insensitive" },
          isDeleted: false,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          conversation: { select: { id: true, title: true, type: true, recordType: true } },
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      db.conversation.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { title: { contains: clean, mode: "insensitive" } },
            { description: { contains: clean, mode: "insensitive" } },
            { channelCode: { contains: clean, mode: "insensitive" } },
          ],
        },
        take: 10,
      }),
    ]);

    return { messages, conversations };
  }

  /**
   * Get unread message count for global header badge with fast in-memory caching and batch query
   */
  static async getUnreadCount(user: AuthenticatedUser): Promise<number> {
    if (!user.employee) return 0;
    const orgId = user.employee.organizationId;
    const empId = user.employee.id;

    // Check fast in-memory cache
    const cached = unreadCountCache.get(empId);
    const now = Date.now();
    if (cached && now - cached.cachedAt < UNREAD_CACHE_TTL_MS) {
      return cached.count;
    }

    const myParticipations = await db.conversationParticipant.findMany({
      where: {
        employeeId: empId,
        conversation: { organizationId: orgId, isArchived: false },
      },
      select: { conversationId: true, lastReadAt: true },
    });

    if (myParticipations.length === 0) {
      unreadCountCache.set(empId, { count: 0, cachedAt: now });
      return 0;
    }

    const conditions = myParticipations.map((p) => ({
      conversationId: p.conversationId,
      senderId: { not: empId },
      isDeleted: false,
      createdAt: { gt: p.lastReadAt },
    }));

    // Single batch query with distinct conversationIds eliminates N+1 loops
    const unreadMessages = await db.message.findMany({
      where: {
        OR: conditions,
      },
      select: {
        conversationId: true,
      },
      distinct: ["conversationId"],
    });

    const totalUnread = unreadMessages.length;
    unreadCountCache.set(empId, { count: totalUnread, cachedAt: Date.now() });
    return totalUnread;
  }
}
