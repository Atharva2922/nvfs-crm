import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LegalDashboardService } from "@/services/legal-dashboard.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_READ)) {
      return errorResponse("Forbidden: Insufficient legal permissions", "FORBIDDEN", 403);
    }

    const data = await LegalDashboardService.getExecutiveDashboard(user);
    return successResponse(data);
  } catch (error: any) {
    console.error("Legal dashboard error:", error);
    return errorResponse(error.message || "Failed to load legal dashboard", "INTERNAL_ERROR", 500);
  }
}
