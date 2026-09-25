import { db } from "@/lib/db";

export interface LogMutationParams {
  actorId?: string | null;
  organizationId?: string | null;
  companyId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  /**
   * Alias for logMutation
   */
  static async log(params: LogMutationParams) {
    return this.logMutation(params);
  }

  /**
   * Records an immutable mutation or security event in the system audit log.
   */
  static async logMutation({
    actorId,
    organizationId,
    companyId,
    action,
    entity,
    entityId,
    previousValue,
    newValue,
    metadata,
    ipAddress,
    userAgent,
  }: LogMutationParams) {
    try {
      const orgId = organizationId || companyId || null;
      return await db.auditLog.create({
        data: {
          actorId: actorId || null,
          organizationId: orgId,
          action,
          entity,
          entityId: entityId || null,
          previousValue: previousValue ? JSON.stringify(previousValue) : null,
          newValue: newValue ? JSON.stringify(newValue) : null,
          metadata: metadata ? JSON.stringify(metadata) : null,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });
    } catch (error) {
      console.error("[AuditService Error]: Failed to write audit trail", error);
      return null;
    }
  }

  /**
   * Retrieves audit logs with optional organization and entity filtering
   */
  static async getLogs(
    options: {
      limit?: number;
      entity?: string;
      action?: string;
      organizationId?: string;
    } = {}
  ) {
    const limit = Math.min(options.limit || 50, 100);
    const where: any = {};

    if (options.organizationId) {
      where.organizationId = options.organizationId;
    }
    if (options.entity) {
      where.entity = options.entity;
    }
    if (options.action) {
      where.action = options.action;
    }

    return db.auditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            primaryColor: true,
          },
        },
        actor: {
          select: {
            id: true,
            email: true,
            role: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
                designation: true,
              },
            },
          },
        },
      },
    });
  }
}
