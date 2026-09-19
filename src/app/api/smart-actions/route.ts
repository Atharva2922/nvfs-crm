import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { EventBusService } from "@/services/event-bus.service";
import { AuditService } from "@/services/audit.service";
import { EscalationEngineService } from "@/services/escalation-engine.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const { actionType, entityType, entityId, entityTitle, payload } = body;

    if (!actionType || !entityType || !entityId) {
      return errorResponse("Missing required parameters: actionType, entityType, entityId", "VALIDATION_ERROR", 400);
    }

    const orgId = user.employee.organizationId;
    let resultDetails: any = {};

    switch (actionType) {
      case "CREATE_FOLLOWUP_TASK": {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (payload?.dueDays || 3));

        const task = await db.task.create({
          data: {
            organizationId: orgId,
            creatorId: user.employee.id,
            assigneeId: payload?.assigneeId || user.employee.id,
            title: payload?.title || `Follow-up on ${entityType}: ${entityTitle || entityId}`,
            description: payload?.description || `Contextual follow-up smart action executed by ${user.employee.firstName} ${user.employee.lastName}.`,
            priority: payload?.priority || "HIGH",
            status: "TODO",
            dueDate,
            relatedClientId: entityType === "Client" ? entityId : undefined,
          },
        });
        resultDetails = { taskId: task.id, title: task.title };
        break;
      }

      case "NOTIFY_EXECUTIVE": {
        const role = payload?.targetRole || "CEO";
        const execs = await db.user.findMany({
          where: {
            isActive: true,
            role: { code: role as any },
            employee: { organizationId: orgId },
          },
          select: { id: true },
        });

        await EventBusService.publish({
          type: "SYSTEM",
          organizationId: orgId,
          targetUserIds: execs.map((e) => e.id),
          title: `📌 Smart Action Alert: ${entityTitle || entityId}`,
          message: payload?.message || `Direct executive attention requested on ${entityType}.`,
          priority: "HIGH",
          actionUrl: payload?.actionUrl || "/app/overview",
          dedupeKey: `SMART_NOTIFY:${entityId}:${Date.now()}`,
        });
        resultDetails = { notifiedCount: execs.length, role };
        break;
      }

      case "ESCALATE_ITEM": {
        const escalation = await EscalationEngineService.executeEscalation({
          organizationId: orgId,
          entityType: entityType as any,
          entityId,
          entityTitle: entityTitle || entityId,
          hoursElapsed: payload?.hoursElapsed || 24,
          actionUrl: payload?.actionUrl || "/app/overview",
          reason: payload?.reason || "Manual smart action escalation requested",
        });
        resultDetails = escalation;
        break;
      }

      default:
        return errorResponse(`Unsupported smart action type: ${actionType}`, "BAD_REQUEST", 400);
    }

    // Audit the action
    await AuditService.logMutation({
      actorId: user.id,
      action: "SMART_ACTION_EXECUTED",
      entity: entityType,
      entityId,
      newValue: { actionType, resultDetails },
      metadata: { source: "Smart Actions Toolbar" },
    });

    return successResponse({
      executed: true,
      actionType,
      resultDetails,
    });
  } catch (error: any) {
    console.error("[Smart Actions POST Error]:", error);
    return errorResponse(error.message || "Failed to execute smart action", "SMART_ACTION_ERROR", 500);
  }
}
