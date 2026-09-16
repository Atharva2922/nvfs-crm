import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OperationService } from "@/services/operation.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const status = searchParams.get("status") || undefined;

    const data = await OperationService.getGanttData(user, { departmentId, status });
    return successResponse(data);
  } catch (error: any) {
    console.error("[Operations Gantt GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve Gantt data", "INTERNAL_ERROR", 500);
  }
}
