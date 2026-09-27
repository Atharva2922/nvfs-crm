import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AccountsService } from "@/services/accounts.service";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * GET /api/accounts/companies
 * Returns the list of companies the authenticated user can access in the Accounts module.
 * Used by AccountsLayout to populate the company-switcher dropdown.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const companies = await AccountsService.getAccessibleOrganizations(user);
    return successResponse(companies);
  } catch (error: any) {
    console.error("[Accounts Companies GET Error]:", error);
    return errorResponse(
      error.message || "Failed to retrieve accessible companies",
      "INTERNAL_ERROR",
      500
    );
  }
}
