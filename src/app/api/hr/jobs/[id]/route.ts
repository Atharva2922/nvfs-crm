import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { HrJobService } from "@/services/hr-job.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)) {
      return errorResponse("Valid status is required", "VALIDATION_ERROR", 400);
    }

    const updated = await HrJobService.updateJobStatus(user, id, status);
    return successResponse(updated);
  } catch (error: any) {
    console.error("[PATCH HR Job Error]:", error);
    const statusCode = error.message?.includes("Forbidden") ? 403 : 400;
    return errorResponse(error.message || "Failed to update job status", "UPDATE_ERROR", statusCode);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const result = await HrJobService.deleteJob(user, id);
    return successResponse(result);
  } catch (error: any) {
    console.error("[DELETE HR Job Error]:", error);
    const statusCode = error.message?.includes("Forbidden") ? 403 : 400;
    return errorResponse(error.message || "Failed to delete job", "DELETE_ERROR", statusCode);
  }
}
