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

    // Approval requires executive / CFO level authorization
    const approverRoles = ["SUPER_ADMIN", "ADMIN", "CHAIRPERSON", "CEO", "CFO"];
    if (!approverRoles.includes(user.roleCode)) {
      return errorResponse("Forbidden: Executive approval privileges required", "FORBIDDEN", 403);
    }

    const { id } = await params;
    let notes: string | undefined = undefined;
    try {
      const body = await req.json();
      notes = body.notes;
    } catch {}

    const result = await PayrollService.approvePeriod(id, user.employee.id, notes);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Payroll Approve Error]:", error);
    return errorResponse(error.message || "Failed to approve payroll", "BAD_REQUEST", 400);
  }
}
