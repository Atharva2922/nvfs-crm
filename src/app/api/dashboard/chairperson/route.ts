import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ExecutiveDashboardService, ExecutiveDashboardFilters } from "@/services/executive-dashboard.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    if (!ExecutiveDashboardService.isChairpersonAuthorized(user)) {
      return errorResponse("Forbidden: Access restricted to Chairperson & Board Leadership", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get("dateRange") as ExecutiveDashboardFilters["dateRange"]) || "THIS_MONTH";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await ExecutiveDashboardService.getChairpersonDashboardData(user, {
      dateRange,
      startDate,
      endDate,
    });

    return successResponse(data);
  } catch (error: any) {
    console.error("[Chairperson Dashboard API Error]:", error);
    return errorResponse(error.message || "Failed to load chairperson dashboard data", "INTERNAL_ERROR", 500);
  }
}
