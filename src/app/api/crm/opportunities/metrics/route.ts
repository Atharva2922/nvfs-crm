import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OpportunityService } from "@/services/opportunity.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const metrics = await OpportunityService.getPipelineMetrics(user);
    return successResponse(metrics);
  } catch (error: any) {
    console.error("[Pipeline Metrics GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve pipeline metrics", "INTERNAL_ERROR", 500);
  }
}
