import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CrmSearchService } from "@/services/crm-search.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const results = await CrmSearchService.search(user, q);
    return successResponse(results);
  } catch (error: any) {
    console.error("[CRM Search GET Error]:", error);
    return errorResponse(error.message || "Failed to execute CRM search", "INTERNAL_ERROR", 500);
  }
}
