import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LegalDashboardService } from "@/services/legal-dashboard.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_EXPORT) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_READ)) {
      return errorResponse("Forbidden: Insufficient permissions for legal reports", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") || "ALL") as any;

    const data = await LegalDashboardService.getExecutiveReportData(user, { category });
    return successResponse(data);
  } catch (error: any) {
    console.error("GET /api/legal/reports error:", error);
    return errorResponse(error.message || "Failed to generate legal reports", "INTERNAL_ERROR", 500);
  }
}
