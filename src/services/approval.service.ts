import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { EventBusService } from "./event-bus.service";
import { AuditService } from "./audit.service";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

export interface CreateApprovalInput {
  entityType: "OPERATION" | "PURCHASE_ORDER" | "EXPENSE" | "BUDGET_CHANGE" | "OTHER";
  entityId: string;
  operationId?: string;
  title: string;
  description?: string;
  metadata?: any;
}

export class ApprovalService {
  static async createRequest(user: AuthenticatedUser, data: CreateApprovalInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const approval = await db.approvalRequest.create({
      data: {
        organizationId: orgId,
        entityType: data.entityType,
        entityId: data.entityId,
        operationId: data.operationId || null,
        title: data.title,
        description: data.description || null,
        requestedById: user.employee.id,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        status: "PENDING",
      },
      include: {
        requestedBy: true,
      },
    });

    if (data.operationId) {
      await db.operationActivity.create({
        data: {
          operationId: data.operationId,
          type: "APPROVAL_REQUESTED",
          description: `Approval requested: "${data.title}" by ${user.employee.firstName} ${user.employee.lastName}`,
          performedById: user.employee.id,
        },
      });
    }

    await AuditService.logMutation({
      actorId: user.id,
      action: "APPROVAL_REQUESTED",
      entity: "ApprovalRequest",
      entityId: approval.id,
      newValue: { title: data.title, entityType: data.entityType },
    });

    return approval;
  }

  static async decide(
    user: AuthenticatedUser,
    approvalId: string,
    decision: "APPROVED" | "REJECTED",
    comment?: string
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    // RBAC validation: user must have approve permission or be at manager level
    const canApprove =
      hasPermission(user.roleCode as any, PERMISSIONS.OPERATIONS_APPROVE) ||
      ["SUPER_ADMIN", "ADMIN", "CEO", "CTO", "CFO", "HEAD_OF_DEPARTMENT"].includes(user.roleCode);

    if (!canApprove) {
      throw new Error("Forbidden: You do not possess approval authorization for operational decisions");
    }

    const existing = await db.approvalRequest.findFirst({
      where: { id: approvalId, organizationId: orgId },
      include: { requestedBy: true, operation: true },
    });
    if (!existing) throw new Error("Approval request not found");
    if (existing.status !== "PENDING") throw new Error(`Approval already decided (${existing.status})`);

    // Separation of duties: requester cannot approve their own request
    if (existing.requestedById === user.employee.id && user.roleCode !== "SUPER_ADMIN") {
      throw new Error("Separation of duties: You cannot approve your own approval request");
    }

    const updated = await db.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: decision,
        decisionDate: new Date(),
        approverId: user.employee.id,
        comment: comment || null,
      },
      include: { approver: true },
    });

    if (existing.operationId) {
      await db.operationActivity.create({
        data: {
          operationId: existing.operationId,
          type: "APPROVAL_DECIDED",
          description: `Approval "${existing.title}" ${decision.toLowerCase()} by ${user.employee.firstName} ${user.employee.lastName}${comment ? `: ${comment}` : ""}`,
          performedById: user.employee.id,
        },
      });
    }

    // Notify requester
    if (existing.requestedBy.userId) {
      await EventBusService.publish({
        type: "SYSTEM",
        organizationId: orgId,
        actorId: user.id,
        targetUserIds: [existing.requestedBy.userId],
        title: `Approval Request ${decision}: ${existing.title}`,
        message: `Your request was ${decision.toLowerCase()} by ${user.employee.firstName} ${user.employee.lastName}.`,
        priority: decision === "REJECTED" ? "HIGH" : "NORMAL",
        actionUrl: existing.operationId ? `/app/operations/${existing.operationId}` : `/app/operations`,
        metadata: { approvalId: updated.id, status: decision },
      });
    }

    await AuditService.logMutation({
      actorId: user.id,
      action: decision === "APPROVED" ? "APPROVAL_GRANTED" : "APPROVAL_REJECTED",
      entity: "ApprovalRequest",
      entityId: approvalId,
      newValue: { status: decision, comment },
    });

    return updated;
  }

  static async list(
    user: AuthenticatedUser,
    filters: { status?: string; entityType?: string; operationId?: string } = {}
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const where: any = { organizationId: orgId };
    if (filters.status) where.status = filters.status;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.operationId) where.operationId = filters.operationId;

    return db.approvalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        approver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        operation: { select: { id: true, operationCode: true, name: true } },
      },
    });
  }
}
