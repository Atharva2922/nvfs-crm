import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PayrollService } from "@/services/payroll.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    // Processing disbursements requires CFO or Super Admin level authority
    const disbursementRoles = ["SUPER_ADMIN", "ADMIN", "CFO", "CHAIRPERSON"];
    if (!disbursementRoles.includes(user.roleCode)) {
      return errorResponse("Forbidden: Treasury disbursement authority required", "FORBIDDEN", 403);
    }

    const { id } = await params;
    let paymentReference: string | undefined = undefined;
    try {
      const body = await req.json();
      paymentReference = body.paymentReference;
    } catch {}

    const result = await PayrollService.processPeriod(
      id,
      user.id,
      paymentReference || `ACH-${Date.now()}`
    );

    return successResponse(result);
  } catch (error: any) {
    console.error("[Payroll Process Error]:", error);
    return errorResponse(error.message || "Failed to process payroll disbursement", "BAD_REQUEST", 400);
  }
}
