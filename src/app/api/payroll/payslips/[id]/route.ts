import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PayrollService } from "@/services/payroll.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const payslip = await PayrollService.getPayslip(id, user);

    return successResponse(payslip);
  } catch (error: any) {
    console.error("[Single Payslip GET Error]:", error);
    const statusCode = error.message?.includes("Access Denied") ? 403 : 404;
    return errorResponse(error.message || "Failed to retrieve payslip", statusCode === 403 ? "FORBIDDEN" : "NOT_FOUND", statusCode);
  }
}
