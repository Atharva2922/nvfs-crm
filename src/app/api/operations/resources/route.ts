import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OperationService } from "@/services/operation.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const data = await OperationService.getResourceUtilization(user);
    return successResponse(data);
  } catch (error: any) {
    console.error("[Resource Utilization GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve resource utilization", "INTERNAL_ERROR", 500);
  }
}
