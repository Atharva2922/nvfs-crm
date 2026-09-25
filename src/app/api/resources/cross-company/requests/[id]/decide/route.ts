import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { CrossCompanyResourceService } from "@/services/cross-company-resource.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const { decision, comment } = body;

    if (!decision || (decision !== "APPROVED" && decision !== "REJECTED")) {
      return errorResponse("Valid decision (APPROVED or REJECTED) is required", "VALIDATION_ERROR", 400);
    }

    const targetOrgId =
      req.nextUrl.searchParams.get("organizationId") ||
      req.headers.get("x-company-id") ||
      user.activeCompany?.id ||
      user.employee.organizationId;

    const result = await CrossCompanyResourceService.decideBorrowRequest(
      user,
      id,
      decision,
      comment,
      targetOrgId
    );

    return successResponse(result);
  } catch (error: any) {
    console.error("[POST Cross-Company Decide Error]:", error);
    return errorResponse(
      error.message || "Failed to process borrow decision",
      "DECISION_ERROR",
      400
    );
  }
}
