import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PayrollFinanceService } from "@/services/payroll-finance.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const transaction = await PayrollFinanceService.postPayrollToLedger(id, user);
    return successResponse(transaction, 201);
  } catch (error: any) {
    console.error("[Post Payroll to Ledger Error]:", error);
    const status = error.message.includes("Forbidden") ? 403 : 400;
    return errorResponse(error.message || "Failed to post payroll to financial ledger", "POST_FAILED", status);
  }
}
