import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OverviewDashboardService } from "@/services/overview-dashboard.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized: Employee profile required", "UNAUTHORIZED", 401);
    }

    const data = await OverviewDashboardService.getOverviewTelemetry(user);
    return successResponse(data);
  } catch (error: any) {
    console.error("[Overview Telemetry API Error]:", error);
    return errorResponse(error.message || "Failed to load overview data", "INTERNAL_ERROR", 500);
  }
}
