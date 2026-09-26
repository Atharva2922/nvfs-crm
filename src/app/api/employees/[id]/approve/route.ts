import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { EmployeeOnboardingService } from "@/services/employee-onboarding.service";
import { z } from "zod";

const approveSchema = z.object({
  approvalNotes: z.string().optional().default("Employee profile and credentials approved by HR"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Role check: Only HR, Super Admin, Admin, or CEO can approve onboarding
    const isHrOrAdmin = ["SUPER_ADMIN", "ADMIN", "CEO", "HR"].includes(user.roleCode);
    if (!isHrOrAdmin) {
      return errorResponse("Forbidden: Only HR or Admins can approve and activate employee profiles", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parse = approveSchema.safeParse(body);

    const approverName = `${user.employee?.firstName || ""} ${user.employee?.lastName || ""}`.trim() || user.email;

    const activatedEmployee = await EmployeeOnboardingService.approveAndActivateEmployee(
      id,
      user.id,
      approverName,
      parse.success ? parse.data.approvalNotes : "Approved by HR"
    );

    return successResponse({
      message: "Employee successfully approved and activated into active roster",
      employee: activatedEmployee,
    });
  } catch (error: any) {
    console.error("[Employee Approval Error]:", error);
    return errorResponse(error.message || "Failed to approve employee", "INTERNAL_ERROR", 500);
  }
}
