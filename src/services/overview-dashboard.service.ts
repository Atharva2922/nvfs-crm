import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";

export interface OverviewTelemetryData {
  todayAttendance: {
    id?: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    status: string;
    workMode: string;
  } | null;
  tasks: {
    total: number;
    pending: number;
    dueToday: number;
    overdue: number;
    completed: number;
    recentTasks: Array<{
      id: string;
      title: string;
      priority: string;
      status: string;
      dueDate: string | null;
    }>;
  };
  leaveBalances: Array<{
    code: string;
    name: string;
    allocated: number;
    used: number;
    pending: number;
    remaining: number;
  }>;
  projects: Array<{
    id: string;
    operationCode: string;
    name: string;
    progress: number;
    status: string;
    role?: string;
    departmentName?: string;
  }>;
  upcomingMeetings: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    type: string;
    location?: string | null;
    meetUrl?: string | null;
  }>;
  recentNotifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: string;
    priority: string;
    isRead: boolean;
  }>;
  expenses: {
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
  };
  requests: {
    pendingCount: number;
    approvedCount: number;
    recentRequests: any[];
  };
  onDuty: {
    activeCount: number;
    recentTrips: any[];
  };
  employeesSummary: {
    totalCount: number;
    activeCount: number;
    departmentsCount: number;
    recentEmployees: Array<{
      id: string;
      employeeNumber: string;
      firstName: string;
      lastName: string;
      email: string;
      designation: string;
      departmentName: string | null;
      roleCode: string | null;
      avatarUrl?: string | null;
      employmentStatus: string;
    }>;
  };
}

interface CachedOverview {
  data: OverviewTelemetryData;
  cachedAt: number;
}

const overviewCache = new Map<string, CachedOverview>();
const OVERVIEW_CACHE_TTL_MS = 15 * 1000; // 15 seconds fresh TTL

export function invalidateOverviewDashboardCache(organizationId?: string) {
  if (organizationId) {
    for (const key of overviewCache.keys()) {
      if (key.startsWith(`${organizationId}:`)) {
        overviewCache.delete(key);
      }
    }
  } else {
    overviewCache.clear();
  }
}

export class OverviewDashboardService {
  static async getOverviewTelemetry(user: AuthenticatedUser): Promise<OverviewTelemetryData> {
    if (!user.employee) {
      return this.getEmptyTelemetry();
    }

    const empId = user.employee.id;
    const orgId = user.activeCompany?.id || user.employee.organizationId;
    const isExec =
      user.roleLevel >= 70 ||
      ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "ADMIN", "COO", "CTO", "CFO", "CMO", "HR"].includes(
        user.roleCode
      );
    const isVirtual = empId.startsWith("virtual_");

    const now = Date.now();
    const cacheKey = `${orgId}:${empId}`;

    // Check memory cache
    const cached = overviewCache.get(cacheKey);
    if (cached && now - cached.cachedAt < OVERVIEW_CACHE_TTL_MS) {
      return cached.data;
    }

    const nowDate = new Date();
    const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0);
    const todayEnd = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 23, 59, 59);

    // Parallelize all queries across tables in a single Promise.all
    const taskWhereClause: any = { organizationId: orgId };
    if (!isExec && !isVirtual) {
      taskWhereClause.assigneeId = empId;
    }

    const [
      todayAttendanceRecord,
      allTasks,
      recentTasks,
      leaveBalances,
      activeOperations,
      upcomingCalendar,
      recentAlerts,
      userExpenses,
      employeeRequests,
      onDutyAssignments,
      companyEmployees,
      totalEmployeesCount,
      activeEmployeesCount,
      departmentsCount,
    ] = await Promise.all([
      // 1. Today Attendance
      isVirtual
        ? Promise.resolve(null)
        : db.attendanceRecord.findUnique({
            where: {
              employeeId_date: {
                employeeId: empId,
                date: todayStart,
              },
            },
            select: {
              id: true,
              checkInTime: true,
              checkOutTime: true,
              status: true,
              workMode: true,
            },
          }),

      // 2. All Tasks (Count metrics strictly scoped to orgId)
      db.task.findMany({
        where: taskWhereClause,
        select: { id: true, status: true, dueDate: true },
      }),

      // 3. Recent Tasks (strictly scoped to orgId)
      db.task.findMany({
        where: {
          ...taskWhereClause,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 4,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          dueDate: true,
        },
      }),

      // 4. Leave Balances for the current year
      db.leaveBalance.findMany({
        where: {
          employeeId: empId,
          year: nowDate.getFullYear(),
        },
        include: {
          leavePolicy: {
            select: { code: true, name: true },
          },
        },
        take: 4,
      }),

      // 5. Active Operations / Projects
      db.operation.findMany({
        where: {
          organizationId: orgId,
          status: { in: ["ACTIVE", "PLANNING", "IN_PROGRESS", "SCHEDULED"] },
        },
        take: 4,
        orderBy: { updatedAt: "desc" },
        include: {
          department: {
            select: { name: true },
          },
        },
      }),

      // 6. Upcoming Meetings
      db.calendarEvent.findMany({
        where: {
          organizationId: orgId,
          startDate: { gte: nowDate },
        },
        take: 4,
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          type: true,
          location: true,
        },
      }),

      // 7. Recent Notifications
      db.notification.findMany({
        where: { userId: user.id },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          createdAt: true,
          priority: true,
          isRead: true,
        },
      }),

      // 8. Expenses
      db.expense.findMany({
        where: { employeeId: empId, organizationId: orgId },
        select: { amount: true, status: true },
      }),

      // 9. Employee Requests
      db.employeeRequest.findMany({
        where: { employeeId: empId, organizationId: orgId },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          requestNumber: true,
          category: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),

      // 10. On Duty Assignments
      db.onDutyAssignment.findMany({
        where: {
          employeeId: empId,
        },
        take: 4,
        orderBy: { date: "desc" },
        select: {
          id: true,
          assignmentNumber: true,
          clientName: true,
          location: true,
          date: true,
          purpose: true,
          status: true,
        },
      }),

      // 11. Company Employees Roster (strictly scoped to orgId)
      db.employee.findMany({
        where: { organizationId: orgId },
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: true,
          avatarUrl: true,
          employmentStatus: true,
          department: { select: { name: true } },
          user: { select: { role: { select: { code: true } } } },
        },
      }),

      // 12. Total Employees Count
      db.employee.count({ where: { organizationId: orgId } }),

      // 13. Active Employees Count
      db.employee.count({ where: { organizationId: orgId, employmentStatus: "ACTIVE" } }),

      // 14. Departments Count
      db.department.count({ where: { organizationId: orgId } }),
    ]);

    // Process Task Metrics
    let pendingTasks = 0;
    let dueTodayTasks = 0;
    let overdueTasks = 0;
    let completedTasks = 0;

    allTasks.forEach((t) => {
      if (t.status === "COMPLETED") {
        completedTasks++;
      } else {
        pendingTasks++;
        if (t.dueDate) {
          const d = new Date(t.dueDate);
          if (d < todayStart) {
            overdueTasks++;
          } else if (d >= todayStart && d <= todayEnd) {
            dueTodayTasks++;
          }
        }
      }
    });

    // Process Leave Balances
    const formattedLeaveBalances = leaveBalances.map((b) => ({
      code: b.leavePolicy.code,
      name: b.leavePolicy.name,
      allocated: b.allocated,
      used: b.used,
      pending: b.pending,
      remaining: b.remaining,
    }));

    // Process Expenses
    let expPendingCount = 0;
    let expPendingAmount = 0;
    let expApprovedCount = 0;
    let expApprovedAmount = 0;

    userExpenses.forEach((e) => {
      if (e.status === "SUBMITTED" || e.status === "UNDER_REVIEW") {
        expPendingCount++;
        expPendingAmount += e.amount;
      } else if (e.status === "APPROVED" || e.status === "PAID") {
        expApprovedCount++;
        expApprovedAmount += e.amount;
      }
    });

    // Process Requests
    let reqPendingCount = 0;
    let reqApprovedCount = 0;
    employeeRequests.forEach((r) => {
      if (r.status === "PENDING") reqPendingCount++;
      if (r.status === "APPROVED") reqApprovedCount++;
    });

    const telemetry: OverviewTelemetryData = {
      todayAttendance: todayAttendanceRecord
        ? {
            id: todayAttendanceRecord.id,
            checkInTime: todayAttendanceRecord.checkInTime?.toISOString() || null,
            checkOutTime: todayAttendanceRecord.checkOutTime?.toISOString() || null,
            status: todayAttendanceRecord.status,
            workMode: todayAttendanceRecord.workMode,
          }
        : null,
      tasks: {
        total: allTasks.length,
        pending: pendingTasks,
        dueToday: dueTodayTasks,
        overdue: overdueTasks,
        completed: completedTasks,
        recentTasks: recentTasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate?.toISOString() || null,
        })),
      },
      leaveBalances: formattedLeaveBalances,
      projects: activeOperations.map((p) => ({
        id: p.id,
        operationCode: p.operationCode,
        name: p.name,
        progress: p.progress,
        status: p.status,
        departmentName: p.department?.name,
      })),
      upcomingMeetings: upcomingCalendar.map((m) => ({
        id: m.id,
        title: m.title,
        startDate: m.startDate.toISOString(),
        endDate: m.endDate.toISOString(),
        type: m.type,
        location: m.location,
      })),
      recentNotifications: recentAlerts.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt.toISOString(),
        priority: n.priority,
        isRead: n.isRead,
      })),
      expenses: {
        pendingCount: expPendingCount,
        pendingAmount: expPendingAmount,
        approvedCount: expApprovedCount,
        approvedAmount: expApprovedAmount,
      },
      requests: {
        pendingCount: reqPendingCount,
        approvedCount: reqApprovedCount,
        recentRequests: employeeRequests.map((r) => ({
          id: r.id,
          requestNumber: r.requestNumber,
          category: r.category,
          title: r.title,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        })),
      },
      onDuty: {
        activeCount: onDutyAssignments.filter((a) => a.status === "ASSIGNED" || a.status === "IN_PROGRESS").length,
        recentTrips: onDutyAssignments.map((a) => ({
          id: a.id,
          assignmentNumber: a.assignmentNumber,
          clientName: a.clientName,
          location: a.location,
          date: a.date.toISOString(),
          purpose: a.purpose,
          status: a.status,
        })),
      },
      employeesSummary: {
        totalCount: totalEmployeesCount,
        activeCount: activeEmployeesCount,
        departmentsCount,
        recentEmployees: companyEmployees.map((e) => ({
          id: e.id,
          employeeNumber: e.employeeNumber,
          firstName: e.firstName,
          lastName: e.lastName,
          email: e.email,
          designation: e.designation,
          departmentName: e.department?.name || null,
          roleCode: e.user?.role?.code || null,
          avatarUrl: e.avatarUrl,
          employmentStatus: e.employmentStatus,
        })),
      },
    };

    overviewCache.set(cacheKey, { data: telemetry, cachedAt: now });
    return telemetry;
  }

  static invalidateOverviewCache(organizationId?: string) {
    invalidateOverviewDashboardCache(organizationId);
  }

  private static getEmptyTelemetry(): OverviewTelemetryData {
    return {
      todayAttendance: null,
      tasks: { total: 0, pending: 0, dueToday: 0, overdue: 0, completed: 0, recentTasks: [] },
      leaveBalances: [],
      projects: [],
      upcomingMeetings: [],
      recentNotifications: [],
      expenses: { pendingCount: 0, pendingAmount: 0, approvedCount: 0, approvedAmount: 0 },
      requests: { pendingCount: 0, approvedCount: 0, recentRequests: [] },
      onDuty: { activeCount: 0, recentTrips: [] },
      employeesSummary: { totalCount: 0, activeCount: 0, departmentsCount: 0, recentEmployees: [] },
    };
  }
}
