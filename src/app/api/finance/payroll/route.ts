import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PayrollFinanceService } from "@/services/payroll-finance.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const periods = await PayrollFinanceService.getFinalizedPeriods(user);
    return successResponse({ periods });
  } catch (error: any) {
    console.error("[Finance Payroll GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve payroll runs", "INTERNAL_ERROR", 500);
  }
}
