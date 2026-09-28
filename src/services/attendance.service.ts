import { db } from "@/lib/db";
import { AuditService } from "./audit.service";

export class AttendanceService {
  /**
   * Records daily check-in for an employee
   */
  static async recordCheckIn(employeeId: string, workMode?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let effectiveWorkMode = workMode;
    if (!effectiveWorkMode) {
      const emp = await db.employee.findUnique({
        where: { id: employeeId },
        include: { user: { include: { role: true } } },
      });
      const roleCode = (emp?.user?.role?.code || "").toUpperCase();
      const roleLevel = emp?.user?.role?.level || 10;
      const des = (emp?.designation || "").toLowerCase();
      const isExecOrHrOrAdmin =
        roleLevel >= 40 ||
        ["SUPER_ADMIN", "ADMIN", "HR", "CHRO", "CEO", "COO", "CFO", "CIO", "CTO", "CMO", "DIRECTOR", "CHAIRPERSON", "VP"].includes(roleCode) ||
        emp?.workMode === "HYBRID" ||
        des.includes("chief") ||
        des.includes("officer") ||
        des.includes("admin") ||
        des.includes("human resources") ||
        des.includes("director");

      effectiveWorkMode = isExecOrHrOrAdmin ? "HYBRID" : (emp?.workMode || "ON_SITE");
    }

    const existing = await db.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (existing && existing.checkInTime) {
      throw new Error(`Already checked in today at ${existing.checkInTime.toLocaleTimeString()}`);
    }

    const record = await db.attendanceRecord.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
      update: {
        checkInTime: new Date(),
        status: existing?.status === "ON_LEAVE" ? "ON_LEAVE" : "PRESENT",
        workMode,
      },
      create: {
        employeeId,
        date: today,
        checkInTime: new Date(),
        status: "PRESENT",
        workMode,
      },
    });

    await AuditService.logMutation({
      action: "ATTENDANCE_CHECK_IN",
      entity: "AttendanceRecord",
      entityId: record.id,
      newValue: { employeeId, checkInTime: record.checkInTime?.toISOString(), workMode },
      metadata: { source: "attendance_service" },
    });

    return record;
  }

  /**
   * Records daily check-out for an employee
   */
  static async recordCheckOut(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await db.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (!existing || !existing.checkInTime) {
      throw new Error("You must check in before checking out");
    }

    const record = await db.attendanceRecord.update({
      where: { id: existing.id },
      data: {
        checkOutTime: new Date(),
      },
    });

    await AuditService.logMutation({
      action: "ATTENDANCE_CHECK_OUT",
      entity: "AttendanceRecord",
      entityId: record.id,
      newValue: { employeeId, checkOutTime: record.checkOutTime?.toISOString() },
      metadata: { source: "attendance_service" },
    });

    return record;
  }

  /**
   * Retrieves today's corporate attendance overview scoped by organization
   */
  static async getTodayOverview(organizationId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const empWhere: any = { employmentStatus: "ACTIVE" };
    const attWhere: any = { date: today };

    if (organizationId) {
      empWhere.organizationId = organizationId;
      attWhere.employee = { organizationId };
    }

    const [totalEmployees, records] = await Promise.all([
      db.employee.count({ where: empWhere }),
      db.attendanceRecord.findMany({
        where: attWhere,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeNumber: true,
              designation: true,
              department: { select: { name: true, code: true } },
            },
          },
        },
      }),
    ]);

    const presentCount = records.filter((r) => r.status === "PRESENT").length;
    const onLeaveCount = records.filter((r) => r.status === "ON_LEAVE").length;
    const notCheckedInCount = Math.max(0, totalEmployees - records.length);

    return {
      totalEmployees,
      presentCount,
      onLeaveCount,
      notCheckedInCount,
      records,
    };
  }
}
