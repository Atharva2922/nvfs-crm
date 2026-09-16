import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { EventBusService } from "./event-bus.service";
import { AuditService } from "./audit.service";

export interface CreateIssueInput {
  title: string;
  description: string;
  operationId: string;
  clientId?: string;
  assignedToId?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate?: string | Date;
  attachments?: string;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  assignedToId?: string | null;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status?: "OPEN" | "INVESTIGATING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  dueDate?: string | Date | null;
  resolutionNotes?: string;
  attachments?: string;
}

export interface IssueFilters {
  operationId?: string;
  clientId?: string;
  severity?: string;
  status?: string;
  assignedToId?: string;
  reportedById?: string;
  search?: string;
}

export class IssueService {
  private static async generateIssueCode(orgId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.operationIssue.count({
      where: { organizationId: orgId },
    });
    const seq = (count + 1).toString().padStart(4, "0");
    return `ISS-${year}-${seq}`;
  }

  static async list(
    user: AuthenticatedUser,
    filters: IssueFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };
    if (filters.operationId) where.operationId = filters.operationId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.reportedById) where.reportedById = filters.reportedById;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { issueCode: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const [total, items] = await Promise.all([
      db.operationIssue.count({ where }),
      db.operationIssue.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
        include: {
          operation: { select: { id: true, operationCode: true, name: true } },
          client: { select: { id: true, name: true } },
          reportedBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { comments: true } },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const issue = await db.operationIssue.findFirst({
      where: { id, organizationId: orgId },
      include: {
        operation: {
          select: {
            id: true,
            operationCode: true,
            name: true,
            ownerId: true,
            owner: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        client: true,
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, designation: true, email: true, avatarUrl: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, designation: true, email: true, avatarUrl: true, userId: true },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!issue) throw new Error("Operational issue not found");
    return issue;
  }

  static async create(user: AuthenticatedUser, data: CreateIssueInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const operation = await db.operation.findFirst({
      where: { id: data.operationId, organizationId: orgId },
      include: { owner: true },
    });
    if (!operation) throw new Error("Operation not found");

    const issueCode = await this.generateIssueCode(orgId);

    const issue = await db.operationIssue.create({
      data: {
        organizationId: orgId,
        issueCode,
        title: data.title,
        description: data.description,
        operationId: data.operationId,
        clientId: data.clientId || operation.clientId || null,
        reportedById: user.employee.id,
        assignedToId: data.assignedToId || null,
        severity: data.severity || "MEDIUM",
        status: "OPEN",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        attachments: data.attachments || null,
      },
      include: {
        reportedBy: true,
        assignedTo: true,
        operation: true,
      },
    });

    // Record activity on Operation
    await db.operationActivity.create({
      data: {
        operationId: data.operationId,
        type: "ISSUE_REPORTED",
        description: `Issue ${issue.issueCode} reported (${issue.severity}): "${issue.title}"`,
        performedById: user.employee.id,
      },
    });

    // Notify assignee if specified
    if (issue.assignedTo?.userId && issue.assignedTo.userId !== user.id) {
      await EventBusService.publish({
        type: "TASK_ASSIGNED",
        organizationId: orgId,
        actorId: user.id,
        targetUserIds: [issue.assignedTo.userId],
        title: `Issue Assigned: ${issue.title}`,
        message: `You have been assigned to resolve issue ${issue.issueCode} (${issue.severity}) on operation ${operation.operationCode}`,
        priority: issue.severity === "CRITICAL" ? "URGENT" : "NORMAL",
        actionUrl: `/app/operations/issues`,
        metadata: { issueId: issue.id },
      });
    }

    // Critical issue notification to operation owner if different
    if (issue.severity === "CRITICAL" && operation.owner.userId && operation.owner.userId !== user.id) {
      await EventBusService.publish({
        type: "SYSTEM",
        organizationId: orgId,
        actorId: user.id,
        targetUserIds: [operation.owner.userId],
        title: `CRITICAL Issue Reported: ${operation.operationCode}`,
        message: `A critical operational issue (${issue.issueCode}) was logged by ${user.employee.firstName} ${user.employee.lastName}`,
        priority: "URGENT",
        actionUrl: `/app/operations/${operation.id}`,
        metadata: { issueId: issue.id, operationId: operation.id },
      });
    }

    await AuditService.logMutation({
      actorId: user.id,
      action: "OPERATION_ISSUE_CREATED",
      entity: "OperationIssue",
      entityId: issue.id,
      newValue: { code: issue.issueCode, title: issue.title, severity: issue.severity },
    });

    return issue;
  }

  static async update(user: AuthenticatedUser, id: string, data: UpdateIssueInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.operationIssue.findFirst({
      where: { id, organizationId: orgId },
      include: { operation: true },
    });
    if (!existing) throw new Error("Issue not found");

    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.assignedToId !== undefined) updatePayload.assignedToId = data.assignedToId;
    if (data.severity !== undefined) updatePayload.severity = data.severity;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.dueDate !== undefined) updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.resolutionNotes !== undefined) updatePayload.resolutionNotes = data.resolutionNotes;
    if (data.attachments !== undefined) updatePayload.attachments = data.attachments;

    const updated = await db.operationIssue.update({
      where: { id },
      data: updatePayload,
      include: { assignedTo: true },
    });

    if (data.status && data.status !== existing.status) {
      const type = ["RESOLVED", "CLOSED"].includes(data.status) ? "ISSUE_RESOLVED" : "STATUS_CHANGED";
      await db.operationActivity.create({
        data: {
          operationId: existing.operationId,
          type,
          description: `Issue ${existing.issueCode} status changed to ${data.status}${data.resolutionNotes ? `: ${data.resolutionNotes}` : ""}`,
          performedById: user.employee.id,
        },
      });
    }

    return updated;
  }

  static async addComment(user: AuthenticatedUser, issueId: string, content: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const issue = await db.operationIssue.findFirst({
      where: { id: issueId, organizationId: orgId },
    });
    if (!issue) throw new Error("Issue not found");

    const comment = await db.operationIssueComment.create({
      data: {
        issueId,
        authorId: user.employee.id,
        content,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true },
        },
      },
    });

    return comment;
  }
}
