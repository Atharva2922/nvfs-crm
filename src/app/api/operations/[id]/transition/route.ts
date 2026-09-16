import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OperationService } from "@/services/operation.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { z } from "zod";

const transitionSchema = z.object({
  status: z.enum(["PLANNING", "SCHEDULED", "IN_PROGRESS", "QUALITY_REVIEW", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  reason: z.string().optional(),
  force: z.boolean().optional(),
});

export async function POST(
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
    const validated = transitionSchema.parse(body);

    // If attempting to mark COMPLETED, perform readiness safety checks first
    if (validated.status === "COMPLETED" && !validated.force) {
      const readiness = await OperationService.checkCompletionReadiness(user, id);
      if (!readiness.isReady) {
        return successResponse({
          requiresConfirmation: true,
          warnings: readiness.warnings,
          message: "Pre-completion conditions have potential warnings. Please confirm transition.",
        });
      }
    }

    const updated = await OperationService.transitionStatus(user, id, validated.status, validated.reason);
    return successResponse({ operation: updated, success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Operation Transition Error]:", error);
    return errorResponse(error.message || "Failed to transition operation status", "INTERNAL_ERROR", 500);
  }
}
