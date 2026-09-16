import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApprovalService } from "@/services/approval.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createApprovalSchema = z.object({
  entityType: z.enum(["OPERATION", "PURCHASE_ORDER", "EXPENSE", "BUDGET_CHANGE", "OTHER"]).default("OPERATION"),
  entityId: z.string().min(1, "Entity ID is required"),
  operationId: z.string().optional(),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  metadata: z.any().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const operationId = searchParams.get("operationId") || undefined;

    const approvals = await ApprovalService.list(user, { status, entityType, operationId });
    return successResponse(approvals);
  } catch (error: any) {
    console.error("[Approvals GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve approvals", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const validated = createApprovalSchema.parse(body);

    const approval = await ApprovalService.createRequest(user, validated);
    return successResponse(approval, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Approvals POST Error]:", error);
    return errorResponse(error.message || "Failed to create approval request", "INTERNAL_ERROR", 500);
  }
}
