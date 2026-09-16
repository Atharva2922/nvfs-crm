import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { EventBusService } from "./event-bus.service";
import { AuditService } from "./audit.service";

export type UnifiedEventType =
  | "MEETING"
  | "COMPANY_EVENT"
  | "CLIENT_MEETING"
  | "TASK_DUE"
  | "HOLIDAY"
  | "LEAVE"
  | "DEADLINE";

export interface UnifiedCalendarItem {
  id: string;
  title: string;
  description?: string | null;
  type: UnifiedEventType;
  startDate: string; // ISO
  endDate: string; // ISO
  isAllDay: boolean;
  color: string;
  sourceEntity: "CalendarEvent" | "Task" | "Holiday" | "LeaveRequest" | "ComplianceRecord" | "LegalDeadline" | "LegalCaseEvent" | "LegalContract";
  sourceId: string;
  location?: string | null;
  meetUrl?: string | null;
  badgeLabel?: string;
  metadata?: Record<string, any>;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  type?: "MEETING" | "COMPANY_EVENT" | "CLIENT_MEETING" | "DEADLINE" | "OTHER";
  startDate: string | Date;
  endDate: string | Date;
  isAllDay?: boolean;
  location?: string;
  meetUrl?: string;
  departmentId?: string;
  attendees?: string[]; // Array of employee IDs
  relatedTaskId?: string;
}

export class CalendarService {
  /**
   * Aggregates multiple enterprise data streams into a unified corporate calendar
   */
  static async getAggregatedEvents(
    user: AuthenticatedUser,
    options: {
      startDate: Date;
      endDate: Date;
      types?: string[];
      departmentId?: string;
    }
  ): Promise<UnifiedCalendarItem[]> {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const orgId = user.employee.organizationId;
    const { startDate, endDate, types } = options;

    const includeAll = !types || types.length === 0 || types.includes("ALL");
    const canInclude = (t: string) => includeAll || (types && types.includes(t));

    const results: UnifiedCalendarItem[] = [];

    // 1. Direct Calendar Events (Meetings, Company Events, Client Demos)
    if (canInclude("MEETING") || canInclude("COMPANY_EVENT") || canInclude("CLIENT_MEETING")) {
      const calEvents = await db.calendarEvent.findMany({
        where: {
          organizationId: orgId,
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
        include: {
          creator: { select: { firstName: true, lastName: true } },
        },
      });

      for (const ev of calEvents) {
        let color = "#3b82f6"; // Blue for general meetings
        if (ev.type === "COMPANY_EVENT") color = "#8b5cf6"; // Purple
        if (ev.type === "CLIENT_MEETING") color = "#06b6d4"; // Cyan
        if (ev.type === "DEADLINE") color = "#f43f5e"; // Rose

        results.push({
          id: `cal-${ev.id}`,
          title: ev.title,
          description: ev.description,
          type: ev.type as UnifiedEventType,
          startDate: ev.startDate.toISOString(),
          endDate: ev.endDate.toISOString(),
          isAllDay: ev.isAllDay,
          color,
          sourceEntity: "CalendarEvent",
          sourceId: ev.id,
          location: ev.location,
          meetUrl: ev.meetUrl,
          badgeLabel: ev.type.replace(/_/g, " "),
          metadata: {
            creatorName: `${ev.creator.firstName} ${ev.creator.lastName}`,
            attendees: ev.attendees ? JSON.parse(ev.attendees) : [],
          },
        });
      }
    }

    // 2. Corporate Holidays (HR Core)
    if (canInclude("HOLIDAY")) {
      const holidays = await db.holiday.findMany({
        where: {
          organizationId: orgId,
          date: { gte: startDate, lte: endDate },
        },
      });

      for (const h of holidays) {
        results.push({
          id: `hol-${h.id}`,
          title: `🎉 ${h.name}`,
          description: h.description,
          type: "HOLIDAY",
          startDate: new Date(h.date).toISOString(),
          endDate: new Date(h.date).toISOString(),
          isAllDay: true,
          color: "#10b981", // Emerald
          sourceEntity: "Holiday",
          sourceId: h.id,
          badgeLabel: "Public Holiday",
          metadata: { isRecurring: h.isRecurring },
        });
      }
    }

    // 3. Approved Employee Leaves (HR Core)
    if (canInclude("LEAVE")) {
      const leaves = await db.leaveRequest.findMany({
        where: {
          employee: { organizationId: orgId },
          status: "APPROVED",
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
        include: {
          employee: { select: { firstName: true, lastName: true } },
          leavePolicy: { select: { code: true, name: true } },
        },
      });

      for (const lv of leaves) {
        results.push({
          id: `leave-${lv.id}`,
          title: `🌴 ${lv.employee.firstName} ${lv.employee.lastName} on ${lv.leavePolicy.code}`,
          description: `Approved Leave: ${lv.leavePolicy.name} (${lv.daysCount} days)`,
          type: "LEAVE",
          startDate: lv.startDate.toISOString(),
          endDate: lv.endDate.toISOString(),
          isAllDay: true,
          color: "#a855f7", // Fuchsia / Lavender
          sourceEntity: "LeaveRequest",
          sourceId: lv.id,
          badgeLabel: lv.leavePolicy.code,
          metadata: {
            employeeName: `${lv.employee.firstName} ${lv.employee.lastName}`,
            daysCount: lv.daysCount,
          },
        });
      }
    }

    // 4. Tasks with Due Dates in range
    if (canInclude("TASK_DUE")) {
      const tasks = await db.task.findMany({
        where: {
          organizationId: orgId,
          dueDate: { gte: startDate, lte: endDate },
          status: { notIn: ["CANCELLED"] },
        },
        include: {
          assignee: { select: { firstName: true, lastName: true } },
        },
      });

      for (const t of tasks) {
        const isUrgent = t.priority === "URGENT";
        results.push({
          id: `task-${t.id}`,
          title: `📌 Due: ${t.title}`,
          description: t.description,
          type: "TASK_DUE",
          startDate: t.dueDate!.toISOString(),
          endDate: t.dueDate!.toISOString(),
          isAllDay: true,
          color: isUrgent ? "#ef4444" : "#f59e0b", // Amber or Red
          sourceEntity: "Task",
          sourceId: t.id,
          badgeLabel: `Task (${t.status})`,
          metadata: {
            priority: t.priority,
            status: t.status,
            assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : "Unassigned",
          },
        });
      }
    }

    // 5. Statutory Compliance Deadlines (HR Core)
    if (canInclude("DEADLINE")) {
      const compliance = await db.complianceRecord.findMany({
        where: {
          organizationId: orgId,
          dueDate: { gte: startDate, lte: endDate },
          status: { in: ["PENDING", "UNDER_REVIEW"] },
        },
      });

      for (const c of compliance) {
        results.push({
          id: `comp-${c.id}`,
          title: `⚖️ Compliance Due: ${c.item}`,
          description: c.notes || undefined,
          type: "DEADLINE",
          startDate: c.dueDate.toISOString(),
          endDate: c.dueDate.toISOString(),
          isAllDay: true,
          color: "#e11d48", // Rose Red
          sourceEntity: "ComplianceRecord",
          sourceId: c.id,
          badgeLabel: "Statutory",
          metadata: {
            item: c.item,
            status: c.status,
          },
        });
      }
    }

    // 6. Operational Milestones & Deadlines (Block 9)
    if (canInclude("DEADLINE") || canInclude("OPERATION")) {
      const operations = await db.operation.findMany({
        where: {
          organizationId: orgId,
          expectedCompletionDate: { gte: startDate, lte: endDate },
        },
        include: {
          owner: { select: { firstName: true, lastName: true } },
          department: { select: { name: true } },
        },
      });

      for (const op of operations) {
        results.push({
          id: `op-${op.id}`,
          title: `[Op Deadline] ${op.name}`,
          description: op.description || `Operation ${op.operationCode} scheduled delivery`,
          type: "DEADLINE",
          startDate: op.expectedCompletionDate.toISOString(),
          endDate: op.expectedCompletionDate.toISOString(),
          isAllDay: true,
          color: op.priority === "CRITICAL" ? "#ef4444" : "#f59e0b",
          sourceEntity: "Task" as any,
          sourceId: op.id,
          badgeLabel: `Op ${op.status}`,
          metadata: {
            code: op.operationCode,
            ownerName: `${op.owner.firstName} ${op.owner.lastName}`,
            department: op.department.name,
            actionUrl: `/app/operations/${op.id}`,
          },
        });
      }

      const milestones = await db.operationMilestone.findMany({
        where: {
          operation: { organizationId: orgId },
          dueDate: { gte: startDate, lte: endDate },
        },
        include: {
          operation: { select: { id: true, operationCode: true, name: true } },
        },
      });

      for (const m of milestones) {
        results.push({
          id: `ms-${m.id}`,
          title: `[Milestone] ${m.title}`,
          description: m.description,
          type: "DEADLINE",
          startDate: m.dueDate.toISOString(),
          endDate: m.dueDate.toISOString(),
          isAllDay: true,
          color: "#8b5cf6",
          sourceEntity: "Task" as any,
          sourceId: m.operationId,
          badgeLabel: "Milestone",
          metadata: {
            operationCode: m.operation.operationCode,
            actionUrl: `/app/operations/${m.operation.id}`,
          },
        });
      }
    }

    // 7. Legal Deadlines, Case Hearings & Contract Milestones (Block 10)
    if (canInclude("DEADLINE") || canInclude("LEGAL")) {
      const [legalDeadlines, caseEvents, expiringContracts] = await Promise.all([
        db.legalDeadline.findMany({
          where: {
            organizationId: orgId,
            dueDate: { gte: startDate, lte: endDate },
          },
          include: {
            owner: { select: { firstName: true, lastName: true } },
            contract: { select: { contractNumber: true, title: true } },
            case: { select: { caseNumber: true, title: true } },
          },
        }),
        db.legalCaseEvent.findMany({
          where: {
            case: { organizationId: orgId },
            eventDate: { gte: startDate, lte: endDate },
          },
          include: {
            case: { select: { id: true, caseNumber: true, title: true } },
          },
        }),
        db.legalContract.findMany({
          where: {
            organizationId: orgId,
            expiryDate: { gte: startDate, lte: endDate },
            status: { in: ["ACTIVE", "EXPIRING_SOON"] },
          },
        }),
      ]);

      for (const ld of legalDeadlines) {
        let color = "#e11d48"; // Red for critical
        if (ld.priority === "HIGH") color = "#f97316";
        else if (ld.priority === "MEDIUM") color = "#f59e0b";
        else if (ld.priority === "LOW") color = "#10b981";

        results.push({
          id: `ld-${ld.id}`,
          title: `⚖️ [Legal] ${ld.title}`,
          description: ld.notes || `Legal deadline: ${ld.deadlineType}`,
          type: "DEADLINE",
          startDate: ld.dueDate.toISOString(),
          endDate: ld.dueDate.toISOString(),
          isAllDay: true,
          color,
          sourceEntity: "LegalDeadline",
          sourceId: ld.id,
          badgeLabel: ld.priority,
          metadata: {
            deadlineType: ld.deadlineType,
            status: ld.status,
            ownerName: `${ld.owner.firstName} ${ld.owner.lastName}`,
            actionUrl: ld.contractId
              ? `/app/legal/contracts/${ld.contractId}`
              : ld.caseId
              ? `/app/legal/cases/${ld.caseId}`
              : `/app/legal/deadlines`,
          },
        });
      }

      for (const ce of caseEvents) {
        results.push({
          id: `ce-${ce.id}`,
          title: `🏛️ [Court/Case] ${ce.title} (${ce.case.caseNumber})`,
          description: ce.description || `Case hearing/proceeding: ${ce.eventType}`,
          type: "DEADLINE",
          startDate: ce.eventDate.toISOString(),
          endDate: ce.eventDate.toISOString(),
          isAllDay: true,
          color: "#8b5cf6", // Purple
          sourceEntity: "LegalCaseEvent",
          sourceId: ce.id,
          location: ce.location,
          badgeLabel: ce.eventType,
          metadata: {
            caseId: ce.case.id,
            caseNumber: ce.case.caseNumber,
            actionUrl: `/app/legal/cases/${ce.case.id}`,
          },
        });
      }

      for (const ec of expiringContracts) {
        if (!ec.expiryDate) continue;
        results.push({
          id: `ctr-exp-${ec.id}`,
          title: `📜 [Contract Expiry] ${ec.title} (${ec.contractNumber})`,
          description: `Contract ${ec.contractNumber} expires on this date`,
          type: "DEADLINE",
          startDate: ec.expiryDate.toISOString(),
          endDate: ec.expiryDate.toISOString(),
          isAllDay: true,
          color: "#ef4444",
          sourceEntity: "LegalContract",
          sourceId: ec.id,
          badgeLabel: "Contract Expiry",
          metadata: {
            contractId: ec.id,
            actionUrl: `/app/legal/contracts/${ec.id}`,
          },
        });
      }
    }

    // Sort chronologically
    results.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return results;
  }

  /**
   * Schedule a new corporate meeting or event
   */
  static async createEvent(user: AuthenticatedUser, data: CreateEventInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const orgId = user.employee.organizationId;
    const creatorId = user.employee.id;

    const event = await db.calendarEvent.create({
      data: {
        organizationId: orgId,
        creatorId,
        title: data.title,
        description: data.description || null,
        type: data.type || "MEETING",
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isAllDay: data.isAllDay || false,
        location: data.location || null,
        meetUrl: data.meetUrl || null,
        departmentId: data.departmentId || null,
        attendees: data.attendees ? JSON.stringify(data.attendees) : null,
        relatedTaskId: data.relatedTaskId || null,
      },
      include: { creator: true },
    });

    // Notify attendees if provided
    if (data.attendees && data.attendees.length > 0) {
      const attendeeUsers = await db.employee.findMany({
        where: { id: { in: data.attendees }, userId: { not: null } },
        select: { userId: true },
      });

      const userIds = attendeeUsers.map((a) => a.userId!).filter((uid) => uid !== user.id);
      if (userIds.length > 0) {
        await EventBusService.publish({
          type: "MEETING_REMINDER",
          organizationId: orgId,
          actorId: user.id,
          targetUserIds: userIds,
          title: `Calendar Invite: ${event.title}`,
          message: `${user.employee.firstName} ${user.employee.lastName} invited you to a scheduled ${event.type.toLowerCase().replace("_", " ")}.`,
          actionUrl: "/app/calendar",
          metadata: { eventId: event.id },
        });
      }
    }

    await AuditService.logMutation({
      actorId: user.id,
      action: "CALENDAR_EVENT_CREATED",
      entity: "CalendarEvent",
      entityId: event.id,
      newValue: { title: event.title, type: event.type, start: event.startDate },
      metadata: { source: "calendar_service" },
    });

    return event;
  }
}
