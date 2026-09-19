import { db } from "@/lib/db";
import { EventBusService } from "./event-bus.service";

export interface ReminderProcessResult {
  tasksDueProcessed: number;
  tasksOverdueProcessed: number;
  meetingsReminded: number;
  proposalsExpiringProcessed: number;
  workflowsProcessed?: number;
  totalNotificationsCreated: number;
  timestamp: string;
}

export class ReminderEngineService {
  /**
   * Idempotently scans for upcoming deadlines, overdue items, meetings, and expiring proposals.
   * Dispatches notifications with strict deduplication keys so repeated execution never spams users.
   */
  static async processReminders(organizationId?: string): Promise<ReminderProcessResult> {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const todayStr = now.toISOString().slice(0, 10);

    let tasksDueCount = 0;
    let tasksOverdueCount = 0;
    let meetingsCount = 0;
    let proposalsCount = 0;

    // 1. Task Due Reminders (Due within next 24 hours, not completed)
    const taskDueWhere: any = {
      status: { notIn: ["COMPLETED", "CANCELLED"] },
      dueDate: { gte: now, lte: in24Hours },
      assigneeId: { not: null },
    };
    if (organizationId) taskDueWhere.organizationId = organizationId;

    const tasksDue = await db.task.findMany({
      where: taskDueWhere,
      include: {
        assignee: { select: { id: true, userId: true, firstName: true } },
      },
      take: 100,
    });

    for (const task of tasksDue) {
      if (!task.assignee?.userId || !task.dueDate) continue;

      const dedupeKey = `TASK_DUE:${task.id}:${task.dueDate.toISOString().slice(0, 10)}`;
      await EventBusService.publish({
        type: "TASK_DUE",
        organizationId: task.organizationId,
        targetUserIds: [task.assignee.userId],
        title: `Task Due Soon: ${task.title}`,
        message: `Task is due on ${task.dueDate.toLocaleDateString()}. Priority: ${task.priority}.`,
        actionUrl: `/app/tasks`,
        metadata: { taskId: task.id, dueDate: task.dueDate },
        priority: task.priority === "URGENT" ? "HIGH" : "NORMAL",
        dedupeKey,
      });
      tasksDueCount++;
    }

    // 2. Task Overdue Reminders (Due date < now, not completed)
    const taskOverdueWhere: any = {
      status: { notIn: ["COMPLETED", "CANCELLED"] },
      dueDate: { lt: now },
      assigneeId: { not: null },
    };
    if (organizationId) taskOverdueWhere.organizationId = organizationId;

    const tasksOverdue = await db.task.findMany({
      where: taskOverdueWhere,
      include: {
        assignee: { select: { id: true, userId: true, firstName: true } },
      },
      take: 100,
    });

    for (const task of tasksOverdue) {
      if (!task.assignee?.userId || !task.dueDate) continue;

      const dedupeKey = `TASK_OVERDUE:${task.id}:${todayStr}`;
      await EventBusService.publish({
        type: "TASK_OVERDUE",
        organizationId: task.organizationId,
        targetUserIds: [task.assignee.userId],
        title: `Task Overdue: ${task.title}`,
        message: `Attention required: Task was due on ${task.dueDate.toLocaleDateString()} and remains pending.`,
        actionUrl: `/app/tasks?quickFilter=overdue`,
        metadata: { taskId: task.id, dueDate: task.dueDate },
        priority: "HIGH",
        dedupeKey,
      });
      tasksOverdueCount++;
    }

    // 3. Upcoming Meeting Reminders (Starting within the next 1 hour)
    const meetingWhere: any = {
      startDate: { gte: now, lte: in1Hour },
    };
    if (organizationId) meetingWhere.organizationId = organizationId;

    const meetings = await db.calendarEvent.findMany({
      where: meetingWhere,
      take: 100,
    });

    for (const event of meetings) {
      if (!event.attendees) continue;

      let attendeeIds: string[] = [];
      try {
        attendeeIds = JSON.parse(event.attendees);
      } catch {
        continue;
      }

      if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) continue;

      const attendees = await db.employee.findMany({
        where: { id: { in: attendeeIds }, userId: { not: null } },
        select: { userId: true },
      });

      const userIds = attendees.map((a) => a.userId!).filter(Boolean);
      if (userIds.length === 0) continue;

      const timeSlot = event.startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const dedupeKey = `MEETING_UPCOMING:${event.id}:${event.startDate.toISOString().slice(0, 13)}`;

      await EventBusService.publish({
        type: "MEETING_UPCOMING",
        organizationId: event.organizationId,
        targetUserIds: userIds,
        title: `Meeting Starting Soon: ${event.title}`,
        message: `Your scheduled session "${event.title}" starts at ${timeSlot}. Location/Link: ${event.location || "Online"}`,
        actionUrl: "/app/calendar",
        metadata: { eventId: event.id, startTime: event.startDate },
        priority: "HIGH",
        dedupeKey,
      });
      meetingsCount++;
    }

    // 4. Commercial Proposal Expiration Reminders (Expiring within 3 days or expired)
    const proposalWhere: any = {
      type: "PROPOSAL",
    };
    if (organizationId) proposalWhere.organizationId = organizationId;

    const proposalActivities = await db.crmActivity.findMany({
      where: proposalWhere,
      include: {
        client: { select: { id: true, name: true, ownerId: true } },
      },
      orderBy: { performedAt: "desc" },
      take: 100,
    });

    for (const act of proposalActivities) {
      let meta: any = {};
      try {
        if (act.metadata) meta = JSON.parse(act.metadata);
      } catch {
        continue;
      }

      if (!meta.validityDate) continue;
      if (["ACCEPTED", "CANCELLED", "REJECTED"].includes(meta.status)) continue;

      const validity = new Date(meta.validityDate);
      const isExpired = validity < now;
      const daysUntil = Math.ceil((validity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (isExpired || (daysUntil >= 0 && daysUntil <= 3)) {
        // Find owner to notify
        const ownerId = act.client?.ownerId || act.performedById;
        if (!ownerId) continue;

        const ownerEmp = await db.employee.findUnique({
          where: { id: ownerId },
          select: { userId: true },
        });

        if (ownerEmp?.userId) {
          const dedupeKey = `PROPOSAL_EXPIRING:${act.id}:${isExpired ? "EXPIRED" : `IN_${daysUntil}D`}:${todayStr}`;

          await EventBusService.publish({
            type: "PROPOSAL_EXPIRED",
            organizationId: act.organizationId,
            targetUserIds: [ownerEmp.userId],
            title: isExpired 
              ? `Proposal Expired: ${meta.proposalNumber || "Quote"}` 
              : `Proposal Expiring in ${daysUntil} Day(s): ${meta.proposalNumber || "Quote"}`,
            message: isExpired
              ? `Proposal for ${act.client?.name || "Client"} expired on ${validity.toLocaleDateString()}. Please review or renew terms.`
              : `Proposal for ${act.client?.name || "Client"} is valid until ${validity.toLocaleDateString()}. Follow up with the buyer.`,
            actionUrl: `/app/crm/clients/${act.clientId}`,
            metadata: { proposalId: act.id, clientId: act.clientId, validityDate: meta.validityDate },
            priority: isExpired ? "HIGH" : "NORMAL",
            dedupeKey,
          });
          proposalsCount++;
        }
      }
    }

    // 5. Workflow Automation Engine: Scan for time-based triggers
    let workflowsProcessed = 0;
    try {
      const { WorkflowEngineService } = await import("./workflow-engine.service");

      // A. Overdue Invoices
      const overdueInvoices = await db.invoice.findMany({
        where: {
          ...(organizationId ? { organizationId } : {}),
          status: { notIn: ["PAID", "CANCELLED"] },
          balance: { gt: 0 },
          dueDate: { lt: now },
        },
        include: { client: { select: { name: true } } },
        take: 20,
      });

      for (const inv of overdueInvoices) {
        const daysOverdue = Math.ceil((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        await WorkflowEngineService.triggerMatchingWorkflows(inv.organizationId, "FINANCE", "DUE_DATE_PASSED", {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.client?.name || "Client",
          balance: inv.balance,
          total: inv.total,
          daysOverdue,
          status: inv.status,
          dueDate: inv.dueDate,
        });
        workflowsProcessed++;
      }

      // B. Delayed Operations / Projects
      const delayedOps = await db.operation.findMany({
        where: {
          ...(organizationId ? { organizationId } : {}),
          status: { in: ["PLANNING", "IN_PROGRESS", "QUALITY_REVIEW"] },
          expectedCompletionDate: { lt: now },
        },
        take: 15,
      });

      for (const op of delayedOps) {
        await WorkflowEngineService.triggerMatchingWorkflows(op.organizationId, "PROJECTS", "DUE_DATE_PASSED", {
          id: op.id,
          name: op.name,
          operationCode: op.operationCode,
          status: op.status,
          ownerId: op.ownerId,
          departmentId: op.departmentId,
          expectedCompletionDate: op.expectedCompletionDate,
        });
        workflowsProcessed++;
      }
    } catch (wfErr) {
      console.error("[ReminderEngine Workflow Trigger Error]:", wfErr);
    }

    return {
      tasksDueProcessed: tasksDueCount,
      tasksOverdueProcessed: tasksOverdueCount,
      meetingsReminded: meetingsCount,
      proposalsExpiringProcessed: proposalsCount,
      workflowsProcessed,
      totalNotificationsCreated: tasksDueCount + tasksOverdueCount + meetingsCount + proposalsCount,
      timestamp: now.toISOString(),
    };
  }
}
