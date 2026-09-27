import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AccountsService } from "@/services/accounts.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    if (!id) return errorResponse("Employee ID is required", "BAD_REQUEST", 400);

    const data = await AccountsService.getEmployeeFinancialProfile(user, id);
    return successResponse(data);
  } catch (error: any) {
    console.error("[Accounts Employee Profile Error]:", error);
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return errorResponse(error.message || "Failed to retrieve employee financial profile", "ERROR", status);
  }
}
