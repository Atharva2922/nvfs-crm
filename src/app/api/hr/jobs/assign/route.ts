import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { HrJobService } from "@/services/hr-job.service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated: Please log in", "UNAUTHORIZED", 401);
    }

    // Role verification
    const isHr =
      user.roleCode === "HR" ||
      user.roleCode === "SUPER_ADMIN" ||
      user.permissions?.includes("hr.employee.manage");

    if (!isHr) {
      return errorResponse(
        "Forbidden: Only authorized Human Resources (HR) personnel can assign jobs to employees.",
        "FORBIDDEN",
        403
      );
    }

    const body = await req.json();
    const { employeeId, title, description, departmentId, priority, dueDate, estimatedHours } =
      body;

    if (!employeeId || !title) {
      return errorResponse(
        "Target employee and job title are required",
        "VALIDATION_ERROR",
        400
      );
    }

    const job = await HrJobService.assignJob(user, {
      employeeId,
      title,
      description,
      departmentId,
      priority,
      dueDate,
      estimatedHours,
    });

    return successResponse(job, 201);
  } catch (error: any) {
    console.error("[POST HR Assign Job Error]:", error);
    const statusCode = error.message?.includes("Forbidden") ? 403 : 400;
    return errorResponse(error.message || "Failed to assign job", "ASSIGNMENT_ERROR", statusCode);
  }
}
