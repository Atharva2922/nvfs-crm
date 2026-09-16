import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OperationService } from "@/services/operation.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { z } from "zod";

const updateOperationSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  operationType: z.string().optional(),
  departmentId: z.string().optional(),
  ownerId: z.string().optional(),
  clientId: z.string().nullable().optional(),
  opportunityId: z.string().nullable().optional(),
  projectName: z.string().nullable().optional(),
  purchaseOrderId: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["PLANNING", "SCHEDULED", "IN_PROGRESS", "QUALITY_REVIEW", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  riskDescription: z.string().nullable().optional(),
  mitigationPlan: z.string().nullable().optional(),
  startDate: z.string().optional(),
  expectedCompletionDate: z.string().optional(),
  actualCompletionDate: z.string().nullable().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  progress: z.number().min(0).max(100).optional(),
  estimatedCost: z.number().optional(),
  approvedBudget: z.number().optional(),
  actualCost: z.number().optional(),
  internalNotes: z.string().nullable().optional(),
  attachments: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const operation = await OperationService.getById(user, id);
    return successResponse(operation);
  } catch (error: any) {
    console.error("[Operation GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve operation", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (
      !hasPermission(user.roleCode as any, PERMISSIONS.OPERATIONS_WRITE) &&
      !hasPermission(user.roleCode as any, PERMISSIONS.OPERATIONS_UPDATE)
    ) {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const { id } = await context.params;
    const body = await req.json();
    const validated = updateOperationSchema.parse(body);

    const updated = await OperationService.update(user, id, validated as any);
    return successResponse(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Operation PATCH Error]:", error);
    return errorResponse(error.message || "Failed to update operation", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (
      !hasPermission(user.roleCode as any, PERMISSIONS.OPERATIONS_WRITE) &&
      !hasPermission(user.roleCode as any, PERMISSIONS.OPERATIONS_DELETE)
    ) {
      return errorResponse("Forbidden: Insufficient permissions to delete operations", "FORBIDDEN", 403);
    }

    const { id } = await context.params;
    const result = await OperationService.delete(user, id);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Operation DELETE Error]:", error);
    return errorResponse(error.message || "Failed to delete operation", "INTERNAL_ERROR", 500);
  }
}
