import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { CrossCompanyResourceService } from "@/services/cross-company-resource.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const targetOrgId =
      searchParams.get("organizationId") ||
      req.headers.get("x-company-id") ||
      user.activeCompany?.id ||
      user.employee?.organizationId;

    const data = await CrossCompanyResourceService.getBorrowRequests(user, targetOrgId);
    return successResponse(data);
  } catch (error: any) {
    console.error("[GET Cross-Company Requests Error]:", error);
    return errorResponse(
      error.message || "Failed to fetch borrow requests",
      "INTERNAL_ERROR",
      500
    );
  }
}
