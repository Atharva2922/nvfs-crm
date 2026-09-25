import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { CrossCompanyResourceService } from "@/services/cross-company-resource.service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const { targetEmployeeId, title, description, durationDays, startDate, endDate, priority } =
      body;

    if (!targetEmployeeId || !title || !description) {
      return errorResponse(
        "Target employee, title, and description are required",
        "VALIDATION_ERROR",
        400
      );
    }

    const targetOrgId =
      req.nextUrl.searchParams.get("organizationId") ||
      req.headers.get("x-company-id") ||
      body.organizationId ||
      user.activeCompany?.id ||
      user.employee.organizationId;

    const result = await CrossCompanyResourceService.createBorrowRequest(
      user,
      {
        targetEmployeeId,
        title,
        description,
        durationDays: durationDays ? Number(durationDays) : 3,
        startDate,
        endDate,
        priority,
      },
      targetOrgId
    );

    return successResponse(result, 201);
  } catch (error: any) {
    console.error("[POST Cross-Company Borrow Error]:", error);
    return errorResponse(
      error.message || "Failed to submit cross-company borrow request",
      "REQUEST_ERROR",
      400
    );
  }
}
