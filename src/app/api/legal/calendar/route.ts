import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CalendarService } from "@/services/calendar.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_READ)) {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    const now = new Date();
    const startDate = startParam ? new Date(startParam) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endParam ? new Date(endParam) : new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const events = await CalendarService.getAggregatedEvents(user, {
      startDate,
      endDate,
      types: ["DEADLINE", "LEGAL"],
    });

    return successResponse(events);
  } catch (error: any) {
    console.error("GET /api/legal/calendar error:", error);
    return errorResponse(error.message || "Failed to load legal calendar", "INTERNAL_ERROR", 500);
  }
}
