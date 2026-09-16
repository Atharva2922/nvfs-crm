import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { FinanceService } from "@/services/finance.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const data = await FinanceService.getOverview(user);
    return successResponse(data);
  } catch (error: any) {
    console.error("[Finance Overview GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve finance overview", "INTERNAL_ERROR", 500);
  }
}
