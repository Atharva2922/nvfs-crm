import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { WorkflowEngineService } from "@/services/workflow-engine.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const orgId = user.employee?.organizationId;

    const workflow = await db.workflow.findFirst({
      where: { id, organizationId: orgId },
      include: {
        createdBy: { select: { firstName: true, lastName: true, designation: true } },
        executions: {
          orderBy: { executedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!workflow) return errorResponse("Workflow not found", "NOT_FOUND", 404);

    return successResponse(workflow);
  } catch (error: any) {
    console.error("[Workflow Single GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch workflow", "WORKFLOW_FETCH_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "CTO", "CFO", "CMO", "DEPARTMENT_HEAD"];
    if (!allowedRoles.includes(user.roleCode)) {
      return errorResponse("Forbidden: Insufficient privileges to modify automated workflows", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await WorkflowEngineService.updateWorkflow(id, user, body);
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Workflow PATCH Error]:", error);
    return errorResponse(error.message || "Failed to update workflow", "WORKFLOW_UPDATE_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "CTO", "CFO", "CMO"];
    if (!allowedRoles.includes(user.roleCode)) {
      return errorResponse("Forbidden: Only executive administrators can delete workflows", "FORBIDDEN", 403);
    }

    const { id } = await params;
    await WorkflowEngineService.deleteWorkflow(id, user);
    return successResponse({ deleted: true });
  } catch (error: any) {
    console.error("[Workflow DELETE Error]:", error);
    return errorResponse(error.message || "Failed to delete workflow", "WORKFLOW_DELETE_ERROR", 500);
  }
}
