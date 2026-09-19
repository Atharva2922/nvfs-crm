import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { WorkflowTemplateService } from "@/services/workflow-template.service";
import { WorkflowEngineService } from "@/services/workflow-engine.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const templates = WorkflowTemplateService.getTemplates();
    return successResponse(templates);
  } catch (error: any) {
    console.error("[Workflow Templates GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch workflow templates", "TEMPLATES_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "CTO", "CFO", "CMO", "DEPARTMENT_HEAD"];
    if (!allowedRoles.includes(user.roleCode)) {
      return errorResponse("Forbidden: Insufficient privileges to deploy workflow templates", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const { templateId } = body;
    if (!templateId) {
      return errorResponse("Missing required templateId", "VALIDATION_ERROR", 400);
    }

    const template = WorkflowTemplateService.getTemplates().find((t) => t.id === templateId);
    if (!template) {
      return errorResponse("Requested template not found", "NOT_FOUND", 404);
    }

    // Deploy template as active workflow in organization
    const workflow = await WorkflowEngineService.createWorkflow(user, {
      name: template.name,
      description: template.description,
      module: template.module,
      triggerType: template.triggerType,
      triggerConfig: template.triggerConfig,
      conditions: template.conditions,
      actions: template.actions,
      priority: template.priority,
      status: "ACTIVE",
    });

    return successResponse(workflow, 201);
  } catch (error: any) {
    console.error("[Workflow Templates POST Error]:", error);
    return errorResponse(error.message || "Failed to deploy template", "TEMPLATE_DEPLOY_ERROR", 500);
  }
}
