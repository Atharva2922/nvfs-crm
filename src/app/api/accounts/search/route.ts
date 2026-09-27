import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AccountsService } from "@/services/accounts.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const companyId = searchParams.get("companyId") || undefined;

    const data = await AccountsService.globalSearch(user, query, companyId);
    return successResponse(data);
  } catch (error: any) {
    console.error("[Accounts Search Error]:", error);
    return errorResponse(error.message || "Failed to search accounts", "INTERNAL_ERROR", 500);
  }
}
