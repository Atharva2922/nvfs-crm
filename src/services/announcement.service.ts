import { db } from "@/lib/db";
import { EventBusService } from "./event-bus.service";

export interface CreateAnnouncementInput {
  organizationId: string;
  authorId: string;
  title: string;
  content: string;
  priority?: "NORMAL" | "IMPORTANT" | "URGENT";
  audienceType?: "ALL" | "DEPARTMENT" | "ROLE";
  targetDepartmentId?: string;
  targetRole?: string;
  expiresAt?: Date;
  attachments?: any[];
}

export class AnnouncementService {
  /**
   * Create an internal company announcement
   */
  static async createAnnouncement(input: CreateAnnouncementInput) {
    const {
      organizationId,
      authorId,
      title,
      content,
      priority = "NORMAL",
      audienceType = "ALL",
      targetDepartmentId,
      targetRole,
      expiresAt,
      attachments = [],
    } = input;

    // Fetch author details
    const author = await db.employee.findUnique({
      where: { id: authorId },
      include: { user: true },
    });

    const announcement = await db.announcement.create({
      data: {
        organizationId,
        authorId,
        title,
        content,
        priority,
        audienceType,
        targetDepartmentId,
        targetRole,
        expiresAt,
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            avatarUrl: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    // Auto mark as read for the author
    await db.announcementRead.create({
      data: {
        announcementId: announcement.id,
        employeeId: authorId,
      },
    }).catch(() => {});

    // Broadcast event/notification via EventBus
    try {
      const targetEmployees = await db.employee.findMany({
        where: {
          organizationId,
          employmentStatus: "ACTIVE",
          ...(audienceType === "DEPARTMENT" && targetDepartmentId ? { departmentId: targetDepartmentId } : {}),
        },
        select: { userId: true },
      });

      const targetUserIds = targetEmployees
        .map((e) => e.userId)
        .filter((uid): uid is string => Boolean(uid) && uid !== author?.userId);

      if (targetUserIds.length > 0) {
        await EventBusService.publish({
          type: "SYSTEM",
          organizationId,
          targetUserIds,
          title: `📢 Announcement: ${title}`,
          message: content.slice(0, 140),
          priority: priority === "URGENT" ? "URGENT" : "NORMAL",
          actionUrl: "/app/communications",
        });
      }
    } catch (e) {
      console.warn("Could not publish announcement event:", e);
    }

    return announcement;
  }

  /**
   * Get active announcements for an employee based on organization, department, and role
   */
  static async getAnnouncements(employeeId: string, organizationId: string, page = 1, limit = 20) {
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: { include: { role: true } },
        department: true,
      },
    });

    if (!employee || employee.organizationId !== organizationId) {
      return { announcements: [], total: 0, page, limit };
    }

    const now = new Date();
    const userRoleCode = employee.user?.role?.code;

    const where: any = {
      organizationId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
      AND: [
        {
          OR: [
            { audienceType: "ALL" },
            {
              audienceType: "DEPARTMENT",
              targetDepartmentId: employee.departmentId || "NONE",
            },
            {
              audienceType: "ROLE",
              targetRole: userRoleCode || "NONE",
            },
            { authorId: employeeId }, // Always visible to author
          ],
        },
      ],
    };

    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              designation: true,
              avatarUrl: true,
              user: { select: { id: true, email: true } },
            },
          },
          reads: {
            where: { employeeId },
            select: { readAt: true },
          },
          _count: {
            select: { reads: true },
          },
        },
        orderBy: [
          { priority: "desc" },
          { publishedAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      db.announcement.count({ where }),
    ]);

    const formatted = announcements.map((a: any) => ({
      ...a,
      isRead: a.reads.length > 0,
      readAt: a.reads[0]?.readAt || null,
      readCount: a._count.reads,
      authorName: `${a.author.firstName || ""} ${a.author.lastName || ""}`.trim() || "Management",
    }));

    return { announcements: formatted, total, page, limit };
  }

  /**
   * Mark announcement as read
   */
  static async markAnnouncementRead(announcementId: string, employeeId: string) {
    return db.announcementRead.upsert({
      where: {
        announcementId_employeeId: {
          announcementId,
          employeeId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        announcementId,
        employeeId,
      },
    });
  }

  /**
   * Get announcement read stats for administrators
   */
  static async getAnnouncementReadStats(announcementId: string, organizationId: string) {
    const announcement = await db.announcement.findFirst({
      where: { id: announcementId, organizationId },
      include: {
        reads: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                designation: true,
                email: true,
              },
            },
          },
          orderBy: { readAt: "desc" },
        },
      },
    });

    if (!announcement) {
      throw new Error("Announcement not found");
    }

    // Total active employees in org
    const totalEmployees = await db.employee.count({
      where: {
        organizationId,
        employmentStatus: "ACTIVE",
      },
    });

    return {
      announcementId,
      totalRecipients: totalEmployees,
      readCount: announcement.reads.length,
      unreadCount: Math.max(0, totalEmployees - announcement.reads.length),
      reads: announcement.reads.map((r: any) => ({
        employeeId: r.employeeId,
        name: `${r.employee.firstName || ""} ${r.employee.lastName || ""}`.trim() || "Employee",
        email: r.employee.email || "",
        role: r.employee.designation || "",
        readAt: r.readAt,
      })),
    };
  }
}
