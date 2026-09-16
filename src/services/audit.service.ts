import { db } from "@/lib/db";

export interface LogMutationParams {
  actorId?: string | null;
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
      return await db.auditLog.create({
        data: {
          actorId: actorId || null,
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
   * Retrieves audit logs with optional filtering
   */
  static async getLogs(limit = 50, entity?: string) {
    return db.auditLog.findMany({
      where: entity ? { entity } : undefined,
      take: Math.min(limit, 100),
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            role: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }
}
