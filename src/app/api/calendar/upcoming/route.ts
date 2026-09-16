import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const now = new Date();
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = await db.calendarEvent.findMany({
      where: {
        organizationId: user.employee.organizationId,
        startDate: { gte: now, lte: endOfWeek },
        OR: [
          { creatorId: user.employee.id },
          { departmentId: user.employee.departmentId },
          { departmentId: null }, // Org-wide events
        ],
      },
      orderBy: { startDate: "asc" },
      take: 5,
    });

    return successResponse(events);
  } catch (error: any) {
    console.error("[Upcoming Calendar API Error]:", error);
    return errorResponse("Failed to fetch upcoming schedule", "INTERNAL_ERROR", 500);
  }
}
