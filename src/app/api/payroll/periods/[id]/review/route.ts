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
    let remarks: string | undefined = undefined;
    try {
      const body = await req.json();
      remarks = body.remarks;
    } catch {}

    const result = await PayrollService.reviewPeriod(id, user.id, remarks);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Payroll Review Error]:", error);
    return errorResponse(error.message || "Failed to mark payroll as reviewed", "BAD_REQUEST", 400);
  }
}
