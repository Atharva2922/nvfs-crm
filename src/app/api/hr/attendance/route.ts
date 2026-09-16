import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AttendanceService } from "@/services/attendance.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const attendanceActionSchema = z.object({
  action: z.enum(["CHECK_IN", "CHECK_OUT"]),
  workMode: z.enum(["ON_SITE", "REMOTE", "HYBRID"]).optional().default("ON_SITE"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const isOverview = searchParams.get("overview") === "true";
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month"); // e.g. "2026-09"

    // Today's date at 00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let myTodayRecord = null;
    if (user.employee) {
      myTodayRecord = await db.attendanceRecord.findUnique({
        where: {
          employeeId_date: {
            employeeId: user.employee.id,
            date: today,
          },
        },
      });
    }

    if (isOverview) {
      const overview = await AttendanceService.getTodayOverview();
      return successResponse({
        ...overview,
        myTodayRecord,
      });
    }

    // Filtered attendance records query
    const whereClause: any = {};
    if (employeeId) {
      whereClause.employeeId = employeeId;
    } else if (searchParams.get("scope") === "my" && user.employee) {
      whereClause.employeeId = user.employee.id;
    }

    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;
      const startOfMonth = new Date(y, m, 1);
      const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59);
      whereClause.date = { gte: startOfMonth, lte: endOfMonth };
    }

    const records = await db.attendanceRecord.findMany({
      where: whereClause,
      take: 100,
      orderBy: { date: "desc" },
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
    });

    return successResponse({ records, myTodayRecord });
  } catch (error: any) {
    console.error("[Attendance GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve attendance", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized: Employee profile required", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const parse = attendanceActionSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    let record;
    if (parse.data.action === "CHECK_IN") {
      record = await AttendanceService.recordCheckIn(user.employee.id, parse.data.workMode);
    } else {
      record = await AttendanceService.recordCheckOut(user.employee.id);
    }

    return successResponse(record);
  } catch (error: any) {
    console.error("[Attendance POST Error]:", error);
    return errorResponse(error.message || "Attendance action failed", "BAD_REQUEST", 400);
  }
}
