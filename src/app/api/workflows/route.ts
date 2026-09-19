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
    const module = searchParams.get("module") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await WorkflowEngineService.listWorkflows(user, { module, status, search });
    return successResponse(data);
  } catch (error: any) {
    console.error("[Workflows GET Error]:", error);
    return errorResponse(error.message || "Failed to list workflows", "WORKFLOWS_FETCH_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    // RBAC: Only Super Admin, Admins, Executives, or Department Heads can create workflows
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "CTO", "CFO", "CMO", "DEPARTMENT_HEAD"];
    if (!allowedRoles.includes(user.roleCode)) {
      return errorResponse("Forbidden: Insufficient privileges to create automated workflows", "FORBIDDEN", 403);
    }

    const body = await req.json();
    if (!body.name || !body.module || !body.triggerType) {
      return errorResponse("Missing required fields: name, module, triggerType", "VALIDATION_ERROR", 400);
    }

    const workflow = await WorkflowEngineService.createWorkflow(user, body);
    return successResponse(workflow, 201);
  } catch (error: any) {
    console.error("[Workflows POST Error]:", error);
    return errorResponse(error.message || "Failed to create workflow", "WORKFLOW_CREATE_ERROR", 500);
  }
}
