import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { InventoryService } from "@/services/inventory.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();
    const action = body.action; // "submit", "approve", "reject"

    if (!["submit", "approve", "reject"].includes(action)) {
      return errorResponse("Invalid action. Expected submit, approve, or reject", "VALIDATION_ERROR", 400);
    }

    const updated = await InventoryService.transitionAdjustment(id, user, action, {
      reason: body.reason,
    });
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Adjustment Transition Error]:", error);
    const statusCode = error.message?.includes("FORBIDDEN") ? 403 : 400;
    return errorResponse(error.message || "Failed to transition adjustment", "WORKFLOW_ERROR", statusCode);
  }
}
