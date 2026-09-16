import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PayrollService } from "@/services/payroll.service";
import { SalaryService } from "@/services/salary.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!SalaryService.isPrivilegedPayrollUser(user)) {
      return errorResponse("Forbidden: Restricted to payroll administrators", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const result = await PayrollService.calculatePeriod(id, user.id);

    return successResponse(result);
  } catch (error: any) {
    console.error("[Payroll Calculate Error]:", error);
    return errorResponse(error.message || "Failed to calculate payroll", "BAD_REQUEST", 400);
  }
}
