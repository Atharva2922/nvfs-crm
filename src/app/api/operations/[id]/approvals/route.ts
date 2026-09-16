import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApprovalService } from "@/services/approval.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createApprovalSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  entityType: z.enum(["OPERATION", "PURCHASE_ORDER", "EXPENSE", "BUDGET_CHANGE", "OTHER"]).default("OPERATION"),
  metadata: z.any().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const approvals = await ApprovalService.list(user, { operationId: id });
    return successResponse(approvals);
  } catch (error: any) {
    console.error("[Operation Approvals GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve approvals", "INTERNAL_ERROR", 500);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();
    const validated = createApprovalSchema.parse(body);

    const approval = await ApprovalService.createRequest(user, {
      ...validated,
      operationId: id,
      entityId: id,
    });

    return successResponse(approval, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Operation Approvals POST Error]:", error);
    return errorResponse(error.message || "Failed to request approval", "INTERNAL_ERROR", 500);
  }
}
