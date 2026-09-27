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
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("q") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const data = await AccountsService.getGlobalTransactions(user, {
      companyId,
      type,
      status,
      search,
      page,
      limit,
    });

    return successResponse(data);
  } catch (error: any) {
    console.error("[Accounts Global Transactions Error]:", error);
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return errorResponse(error.message || "Failed to retrieve transactions", "ERROR", status);
  }
}
