import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CalendarService } from "@/services/calendar.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const now = new Date();
    const startDate = startDateStr ? new Date(startDateStr) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateStr ? new Date(endDateStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const events = await CalendarService.getAggregatedEvents(user, {
      startDate,
      endDate,
      types: ["DEADLINE", "OPERATION", "TASK_DUE"],
    });

    return successResponse({ events });
  } catch (error: any) {
    console.error("[Operations Calendar GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve calendar events", "INTERNAL_ERROR", 500);
  }
}
