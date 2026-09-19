import { db } from "@/lib/db";
import { EventBusService } from "./event-bus.service";
import { AuditService } from "./audit.service";

export interface EscalationTarget {
  userId: string;
  employeeId: string;
  name: string;
  roleCode: string;
  level: number;
}

export interface EscalationRequest {
  organizationId: string;
  entityType: "APPROVAL" | "TASK" | "PROJECT" | "INVOICE" | "CONTRACT" | "COMPLIANCE";
  entityId: string;
  entityTitle: string;
  currentAssigneeId?: string;
  departmentId?: string;
  hoursElapsed: number; // e.g. 24, 48, 72
  actionUrl: string;
  reason?: string;
}

export class EscalationEngineService {
  /**
   * Resolves the appropriate escalation hierarchy for an entity based on time elapsed and organizational structure
   */
  static async resolveEscalationTarget(
    organizationId: string,
    entityType: string,
    currentAssigneeId?: string,
    departmentId?: string,
    hoursElapsed: number = 24
  ): Promise<EscalationTarget | null> {
    // Level 1: After 24h, escalate to direct manager
    if (hoursElapsed <= 24 && currentAssigneeId) {
      const emp = await db.employee.findUnique({
        where: { id: currentAssigneeId },
        include: {
          manager: {
            include: { user: { select: { id: true, email: true } } },
          },
        },
      });

      if (emp?.manager?.user?.id) {
        return {
          userId: emp.manager.user.id,
          employeeId: emp.manager.id,
          name: `${emp.manager.firstName} ${emp.manager.lastName}`,
          roleCode: "MANAGER",
          level: 1,
        };
      }
    }

    // Level 2: After 48h, escalate to Department Head
    if (hoursElapsed <= 48 && departmentId) {
      const dept = await db.department.findUnique({
        where: { id: departmentId },
        select: { managerId: true },
      });

      if (dept?.managerId) {
        const manager = await db.employee.findUnique({
          where: { id: dept.managerId },
          include: {
            user: { select: { id: true, email: true } },
          },
        });

        if (manager?.user?.id) {
          return {
            userId: manager.user.id,
            employeeId: manager.id,
            name: `${manager.firstName} ${manager.lastName}`,
            roleCode: "DEPARTMENT_HEAD",
            level: 2,
          };
        }
      }
    }

    // Level 3: After 72h (or critical items), escalate to C-Suite Executive
    let targetExecutiveRole = "CEO";
    if (entityType === "PROJECT" || entityType === "TASK") {
      targetExecutiveRole = "CTO";
    } else if (entityType === "INVOICE" || entityType === "APPROVAL") {
      targetExecutiveRole = "CFO";
    } else if (entityType === "CONTRACT" || entityType === "COMPLIANCE") {
      targetExecutiveRole = "CEO";
    }

    // Find the executive employee in this organization
    const executiveUser = await db.user.findFirst({
      where: {
        isActive: true,
        role: {
          code: { in: [targetExecutiveRole as any, "CEO", "SUPER_ADMIN"] },
        },
        employee: { organizationId },
      },
      include: {
        employee: true,
        role: true,
      },
    });

    if (executiveUser?.employee) {
      return {
        userId: executiveUser.id,
        employeeId: executiveUser.employee.id,
        name: `${executiveUser.employee.firstName} ${executiveUser.employee.lastName}`,
        roleCode: executiveUser.role.code,
        level: 3,
      };
    }

    return null;
  }

  /**
   * Executes an automated multi-tier escalation
   */
  static async executeEscalation(req: EscalationRequest): Promise<{
    escalated: boolean;
    target?: EscalationTarget;
    message: string;
  }> {
    const target = await this.resolveEscalationTarget(
      req.organizationId,
      req.entityType,
      req.currentAssigneeId,
      req.departmentId,
      req.hoursElapsed
    );

    if (!target) {
      return {
        escalated: false,
        message: "No higher-level escalation authority found in organization hierarchy",
      };
    }

    const dedupeKey = `ESCALATION:${req.entityType}:${req.entityId}:${target.level}:${new Date().toISOString().slice(0, 10)}`;

    const escalationNotice = `[Level ${target.level} Escalation] ${req.entityType} "${req.entityTitle}" has remained unresolved for ${req.hoursElapsed} hours.${req.reason ? ` Reason: ${req.reason}` : ""}`;

    await EventBusService.publish({
      type: "SYSTEM",
      organizationId: req.organizationId,
      targetUserIds: [target.userId],
      title: `⚡ Workflow Escalation: ${req.entityType} Alert`,
      message: escalationNotice,
      priority: "URGENT",
      actionUrl: req.actionUrl,
      dedupeKey,
      metadata: {
        escalationLevel: target.level,
        entityType: req.entityType,
        entityId: req.entityId,
        hoursElapsed: req.hoursElapsed,
        escalatedTo: target.name,
      },
      auditAction: "WORKFLOW_ESCALATION_TRIGGERED",
    });

    // Record audit mutation marked as performed by Workflow Automation
    await AuditService.logMutation({
      actorId: target.userId,
      action: "WORKFLOW_ESCALATION_TRIGGERED",
      entity: req.entityType,
      entityId: req.entityId,
      newValue: {
        level: target.level,
        escalatedTo: target.name,
        role: target.roleCode,
        hoursElapsed: req.hoursElapsed,
        source: "Workflow Automation",
      },
      metadata: {
        executor: "Workflow Engine",
        systemGenerated: true,
      },
    });

    return {
      escalated: true,
      target,
      message: `Successfully escalated to ${target.name} (${target.roleCode})`,
    };
  }
}
