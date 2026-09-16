import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OperationService } from "@/services/operation.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const reports = await OperationService.getReportsData(user);
    return successResponse(reports);
  } catch (error: any) {
    console.error("[Operations Reports GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve reports", "INTERNAL_ERROR", 500);
  }
}
