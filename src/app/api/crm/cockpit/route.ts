import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CrmDashboardService } from "@/services/crm-dashboard.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const datePreset = searchParams.get("datePreset") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const ownerId = searchParams.get("ownerId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const scope = (searchParams.get("scope") as "all" | "my" | "department") || undefined;

    const cockpitData = await CrmDashboardService.getCockpitMetrics(user, {
      datePreset,
      startDate,
      endDate,
      ownerId,
      departmentId,
      scope,
    });
    return successResponse(cockpitData);
  } catch (error: any) {
    console.error("[CRM Cockpit GET Error]:", error);
    return errorResponse(error.message || "Failed to load CRM dashboard", "INTERNAL_ERROR", 500);
  }
}
