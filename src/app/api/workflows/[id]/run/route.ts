import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { WorkflowEngineService } from "@/services/workflow-engine.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "CTO", "CFO", "CMO", "DEPARTMENT_HEAD"];
    if (!allowedRoles.includes(user.roleCode)) {
      return errorResponse("Forbidden: Insufficient privileges to test workflows", "FORBIDDEN", 403);
    }

    const { id } = await params;
    let customData: Record<string, any> | undefined = undefined;
    try {
      const body = await req.json();
      if (body && typeof body === "object") customData = body;
    } catch {}

    const result = await WorkflowEngineService.runWorkflowManual(id, user, customData);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Workflow Run POST Error]:", error);
    return errorResponse(error.message || "Failed to trigger workflow execution", "WORKFLOW_EXECUTION_ERROR", 500);
  }
}
