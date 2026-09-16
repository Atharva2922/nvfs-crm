import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PurchaseRequestService } from "@/services/purchase-request.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const body = await req.json();

    if (!body.transition) {
      return errorResponse("Transition action is required (SUBMIT, REVIEW, APPROVE, REJECT, CANCEL)", "VALIDATION_ERROR", 400);
    }

    const updated = await PurchaseRequestService.transitionStatus(
      user,
      id,
      body.transition,
      body.notesOrReason
    );

    return successResponse(updated);
  } catch (error: any) {
    console.error("[Purchase Request Transition Error]:", error);
    return errorResponse(error.message || "Failed to transition purchase request", "INTERNAL_ERROR", 400);
  }
}
