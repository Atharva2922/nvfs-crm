import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AccountsService } from "@/services/accounts.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") || undefined;
    const period = searchParams.get("period") || undefined;

    const data = await AccountsService.getDashboard(user, companyId, period);
    return successResponse(data);
  } catch (error: any) {
    console.error("[Accounts Dashboard GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve accounts dashboard", "INTERNAL_ERROR", 500);
  }
}
