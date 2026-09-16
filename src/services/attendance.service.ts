import { db } from "@/lib/db";
import { AuditService } from "./audit.service";

export class AttendanceService {
  /**
   * Records daily check-in for an employee
   */
  static async recordCheckIn(employeeId: string, workMode = "ON_SITE") {
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
   * Retrieves today's corporate attendance overview
   */
  static async getTodayOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEmployees, records] = await Promise.all([
      db.employee.count({ where: { employmentStatus: "ACTIVE" } }),
      db.attendanceRecord.findMany({
        where: { date: today },
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
