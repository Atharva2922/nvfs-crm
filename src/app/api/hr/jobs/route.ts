import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { HrJobService } from "@/services/hr-job.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated: Please log in", "UNAUTHORIZED", 401);
    }

    const isHr =
      user.roleCode === "HR" ||
      user.roleCode === "SUPER_ADMIN" ||
      user.permissions?.includes("hr.employee.manage");

    if (!isHr) {
      return errorResponse(
        "Forbidden: Only authorized Human Resources (HR) personnel can access delegated jobs.",
        "FORBIDDEN",
        403
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const assigneeId = searchParams.get("assigneeId") || undefined;

    const jobs = await HrJobService.listAssignedJobs(user, { status, assigneeId });
    return successResponse(jobs);
  } catch (error: any) {
    console.error("[GET HR Jobs Error]:", error);
    return errorResponse(error.message || "Failed to fetch jobs", "INTERNAL_ERROR", 500);
  }
}
