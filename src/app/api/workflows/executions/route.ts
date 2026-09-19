import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { WorkflowEngineService } from "@/services/workflow-engine.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get("workflowId") || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;

    const data = await WorkflowEngineService.getExecutions(user, { workflowId, status, limit, page });
    return successResponse(data);
  } catch (error: any) {
    console.error("[Workflow Executions GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch workflow executions", "EXECUTIONS_ERROR", 500);
  }
}
