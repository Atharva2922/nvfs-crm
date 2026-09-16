import { db } from "@/lib/db";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";

export interface CreateLeaveParams {
  employeeId: string;
  leavePolicyCode: string; // e.g. "CL", "EL", "ML", "LWP"
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
}

export class LeaveService {
  /**
   * Calculates actual business working days between two dates,
   * strictly excluding configured company non-working days (weekends) and public holidays.
   */
  static async calculateWorkingDays(startDateInput: Date | string, endDateInput: Date | string): Promise<number> {
    const start = new Date(startDateInput);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateInput);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      throw new Error("End date cannot be prior to start date");
    }

    // Fetch work day config
    const workDayConfigs = await db.workDayConfig.findMany();
    const workingDayMap = new Map<number, boolean>();
    workDayConfigs.forEach((c) => workingDayMap.set(c.dayOfWeek, c.isWorkingDay));

    // Fetch company holidays in this date range
    const holidays = await db.holiday.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });
    const holidayDateSet = new Set(
      holidays.map((h) => h.date.toISOString().split("T")[0])
    );

    let workingDaysCount = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split("T")[0];

      // Check if this weekday is configured as a working day (default Mon-Fri)
      const isConfiguredWorkDay = workingDayMap.has(dayOfWeek)
        ? workingDayMap.get(dayOfWeek)
        : dayOfWeek >= 1 && dayOfWeek <= 5;

      // Check if day is not a public holiday
      const isHoliday = holidayDateSet.has(dateStr);

      if (isConfiguredWorkDay && !isHoliday) {
        workingDaysCount += 1;
      }

      current.setDate(current.getDate() + 1);
    }

    return workingDaysCount;
  }

  /**
   * Enforces monthly CL limit (e.g. maximum 2 CL per calendar month)
   */
  static async validateMonthlyClLimit(
    employeeId: string,
    startDateInput: Date | string,
    daysRequested: number
  ): Promise<void> {
    const date = new Date(startDateInput);
    const month = date.getMonth();
    const year = date.getFullYear();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    // Find CL policy
    const clPolicy = await db.leavePolicy.findFirst({ where: { code: "CL" } });
    if (!clPolicy || !clPolicy.monthlyLimit) return;

    // Sum existing approved and pending CL days in this month
    const existingRequests = await db.leaveRequest.findMany({
      where: {
        employeeId,
        leavePolicyId: clPolicy.id,
        status: { in: ["APPROVED", "PENDING"] },
        startDate: { gte: monthStart, lte: monthEnd },
      },
      select: { daysCount: true },
    });

    const existingDays = existingRequests.reduce((sum, r) => sum + r.daysCount, 0);

    if (existingDays + daysRequested > clPolicy.monthlyLimit) {
      throw new Error(
        `Monthly Casual Leave limit exceeded: Policy allows a maximum of ${clPolicy.monthlyLimit} CL days per month. You currently have ${existingDays} CL days booked for ${date.toLocaleString("default", { month: "long" })}.`
      );
    }
  }

  /**
   * Validates overlapping leave requests for the same employee
   */
  static async checkOverlappingLeave(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string
  ): Promise<void> {
    const overlapping = await db.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ["PENDING", "APPROVED"] },
        id: excludeRequestId ? { not: excludeRequestId } : undefined,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new Error(
        `Overlapping leave conflict: You already have a ${overlapping.status.toLowerCase()} leave request covering these dates.`
      );
    }
  }

  /**
   * Creates a new leave request and increments pending balance
   */
  static async createLeaveRequest({
    employeeId,
    leavePolicyCode,
    startDate,
    endDate,
    reason,
  }: CreateLeaveParams) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const currentYear = start.getFullYear();

    // 1. Calculate actual working days
    const daysCount = await this.calculateWorkingDays(start, end);
    if (daysCount === 0) {
      throw new Error("Selected date range contains 0 working days (all dates fall on weekends or public holidays).");
    }

    // 2. Find Leave Policy
    const policy = await db.leavePolicy.findFirst({
      where: { code: leavePolicyCode },
    });
    if (!policy) {
      throw new Error(`Invalid leave policy code: ${leavePolicyCode}`);
    }

    // 3. Validate Overlapping Leaves
    await this.checkOverlappingLeave(employeeId, start, end);

    // 4. Validate Monthly CL Limit
    if (policy.code === "CL") {
      await this.validateMonthlyClLimit(employeeId, start, daysCount);
    }

    // 5. Validate Leave Balance (except for unpaid leave LWP)
    const balance = await db.leaveBalance.findUnique({
      where: {
        employeeId_leavePolicyId_year: {
          employeeId,
          leavePolicyId: policy.id,
          year: currentYear,
        },
      },
    });

    if (policy.code !== "LWP" && policy.annualAllowance > 0) {
      if (!balance || balance.remaining < daysCount) {
        throw new Error(
          `Insufficient leave balance: You have ${balance?.remaining ?? 0} ${policy.name} days remaining, but requested ${daysCount} days.`
        );
      }
    }

    // 6. Create request in transaction & update balance
    return await db.$transaction(async (tx) => {
      const request = await tx.leaveRequest.create({
        data: {
          employeeId,
          leavePolicyId: policy.id,
          startDate: start,
          endDate: end,
          daysCount,
          reason,
          status: "PENDING",
        },
        include: {
          leavePolicy: true,
          employee: { include: { manager: true } },
        },
      });

      // Update pending balance
      if (balance) {
        const newPending = balance.pending + daysCount;
        const newRemaining = balance.allocated - balance.used - newPending;
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pending: newPending,
            remaining: newRemaining,
          },
        });
      }

      await AuditService.logMutation({
        actorId: request.employee.userId || undefined,
        action: "LEAVE_REQUEST_CREATED",
        entity: "LeaveRequest",
        entityId: request.id,
        newValue: {
          employeeNumber: request.employee.employeeNumber,
          policy: policy.code,
          daysCount,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        metadata: { source: "leave_service" },
      });

      // Notify manager via EventBus if employee has a manager
      if (request.employee.manager?.userId) {
        await EventBusService.publish({
          type: "LEAVE_REQUEST",
          organizationId: request.employee.organizationId,
          actorId: request.employee.userId || undefined,
          targetUserIds: [request.employee.manager.userId],
          title: `Leave Request: ${request.employee.firstName} ${request.employee.lastName}`,
          message: `${request.employee.firstName} applied for ${request.daysCount} day(s) of ${request.leavePolicy.code}.`,
          actionUrl: "/app/hr/leaves",
          metadata: { leaveRequestId: request.id },
        });
      }

      return request;
    }, { timeout: 20000, maxWait: 15000 });
  }

  /**
   * Approves a leave request, deducts balance, and automatically synchronizes Attendance to ON_LEAVE
   */
  static async approveLeaveRequest(requestId: string, approverEmployeeId: string, notes?: string) {
    const request = await db.leaveRequest.findUnique({
      where: { id: requestId },
      include: { leavePolicy: true, employee: true },
    });

    if (!request) throw new Error("Leave request not found");
    if (request.status !== "PENDING") {
      throw new Error(`Cannot approve a leave request that is already ${request.status.toLowerCase()}`);
    }

    const currentYear = request.startDate.getFullYear();

    return await db.$transaction(async (tx) => {
      // 1. Update request status
      const updatedRequest = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          approvedById: approverEmployeeId,
          approvalNotes: notes || "Approved by management",
        },
      });

      // 2. Update Leave Balance: move from pending to used
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leavePolicyId_year: {
            employeeId: request.employeeId,
            leavePolicyId: request.leavePolicyId,
            year: currentYear,
          },
        },
      });

      if (balance) {
        const newPending = Math.max(0, balance.pending - request.daysCount);
        const newUsed = balance.used + request.daysCount;
        const newRemaining = balance.allocated - newUsed - newPending;

        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pending: newPending,
            used: newUsed,
            remaining: newRemaining,
          },
        });
      }

      // 3. Automated Attendance Synchronization
      // For every working day in the range, create or update AttendanceRecord to ON_LEAVE
      const cur = new Date(request.startDate);
      cur.setHours(0, 0, 0, 0);
      const end = new Date(request.endDate);
      end.setHours(0, 0, 0, 0);

      while (cur <= end) {
        const dayOfWeek = cur.getDay();
        // Only mark working days as ON_LEAVE
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const dateOnly = new Date(cur);
          await tx.attendanceRecord.upsert({
            where: {
              employeeId_date: {
                employeeId: request.employeeId,
                date: dateOnly,
              },
            },
            update: {
              status: "ON_LEAVE",
              leaveRequestId: request.id,
              remarks: `Approved ${request.leavePolicy.name} (${request.leavePolicy.code})`,
            },
            create: {
              employeeId: request.employeeId,
              date: dateOnly,
              status: "ON_LEAVE",
              leaveRequestId: request.id,
              remarks: `Approved ${request.leavePolicy.name} (${request.leavePolicy.code})`,
            },
          });
        }
        cur.setDate(cur.getDate() + 1);
      }

      await AuditService.logMutation({
        action: "LEAVE_REQUEST_APPROVED",
        entity: "LeaveRequest",
        entityId: request.id,
        newValue: {
          requestId: request.id,
          approvedBy: approverEmployeeId,
          status: "APPROVED",
        },
        metadata: { source: "leave_service" },
      });

      // Notify employee via EventBus
      if (request.employee.userId) {
        await EventBusService.publish({
          type: "LEAVE_APPROVED",
          organizationId: request.employee.organizationId,
          actorId: approverEmployeeId,
          targetUserIds: [request.employee.userId],
          title: "Leave Request Approved",
          message: `Your ${request.leavePolicy.code} leave request for ${request.daysCount} day(s) was approved.`,
          actionUrl: "/app/hr/leaves",
          metadata: { leaveRequestId: request.id },
        });
      }

      return updatedRequest;
    }, { timeout: 20000, maxWait: 15000 });
  }

  /**
   * Rejects a leave request and releases pending balance
   */
  static async rejectLeaveRequest(requestId: string, approverEmployeeId: string, reason: string) {
    const request = await db.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true },
    });

    if (!request) throw new Error("Leave request not found");
    if (request.status !== "PENDING") {
      throw new Error(`Cannot reject a leave request that is already ${request.status.toLowerCase()}`);
    }

    const currentYear = request.startDate.getFullYear();

    return await db.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          approvedById: approverEmployeeId,
          rejectionReason: reason,
        },
      });

      // Release pending balance
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leavePolicyId_year: {
            employeeId: request.employeeId,
            leavePolicyId: request.leavePolicyId,
            year: currentYear,
          },
        },
      });

      if (balance) {
        const newPending = Math.max(0, balance.pending - request.daysCount);
        const newRemaining = balance.allocated - balance.used - newPending;
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pending: newPending,
            remaining: newRemaining,
          },
        });
      }

      await AuditService.logMutation({
        action: "LEAVE_REQUEST_REJECTED",
        entity: "LeaveRequest",
        entityId: request.id,
        newValue: {
          requestId: request.id,
          rejectedBy: approverEmployeeId,
          reason,
        },
        metadata: { source: "leave_service" },
      });

      return updated;
    }, { timeout: 20000, maxWait: 15000 });
  }

  /**
   * Cancels a leave request and rolls back balances and attendance
   */
  static async cancelLeaveRequest(requestId: string, employeeId: string) {
    const request = await db.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error("Leave request not found");
    if (request.employeeId !== employeeId) {
      throw new Error("Unauthorized: You can only cancel your own leave requests");
    }
    if (request.status === "CANCELLED" || request.status === "REJECTED") {
      throw new Error(`Request is already ${request.status.toLowerCase()}`);
    }

    const currentYear = request.startDate.getFullYear();

    return await db.$transaction(async (tx) => {
      const wasApproved = request.status === "APPROVED";

      const updated = await tx.leaveRequest.update({
        where: { id: requestId },
        data: { status: "CANCELLED" },
      });

      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leavePolicyId_year: {
            employeeId: request.employeeId,
            leavePolicyId: request.leavePolicyId,
            year: currentYear,
          },
        },
      });

      if (balance) {
        if (wasApproved) {
          const newUsed = Math.max(0, balance.used - request.daysCount);
          const newRemaining = balance.allocated - newUsed - balance.pending;
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: { used: newUsed, remaining: newRemaining },
          });

          // Remove or revert associated attendance records
          await tx.attendanceRecord.deleteMany({
            where: { leaveRequestId: request.id },
          });
        } else {
          // was pending
          const newPending = Math.max(0, balance.pending - request.daysCount);
          const newRemaining = balance.allocated - balance.used - newPending;
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: { pending: newPending, remaining: newRemaining },
          });
        }
      }

      await AuditService.logMutation({
        action: "LEAVE_REQUEST_CANCELLED",
        entity: "LeaveRequest",
        entityId: request.id,
        newValue: { requestId: request.id, status: "CANCELLED" },
        metadata: { source: "leave_service" },
      });

      return updated;
    }, { timeout: 20000, maxWait: 15000 });
  }
}
