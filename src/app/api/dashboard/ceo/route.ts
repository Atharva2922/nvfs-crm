import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CeoDashboardService, CeoDashboardFilters } from "@/services/ceo-dashboard.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    if (!CeoDashboardService.isAuthorized(user)) {
      return errorResponse(
        "Forbidden: Access restricted to authorized CEO / Executive leadership",
        "FORBIDDEN",
        403
      );
    }

    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get("dateRange") as CeoDashboardFilters["dateRange"]) || "THIS_MONTH";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const forceRefresh = searchParams.get("refresh") === "true";

    const data = await CeoDashboardService.getExecutiveDashboardData(user, {
      dateRange,
      startDate,
      endDate,
      departmentId,
      forceRefresh,
    });

    return successResponse(data);
  } catch (error: any) {
    console.error("[CEO Dashboard API Error]:", error);
    return errorResponse(
      error.message || "Failed to load executive CEO dashboard data",
      "INTERNAL_ERROR",
      500
    );
  }
}
