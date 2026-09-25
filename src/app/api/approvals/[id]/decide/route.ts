import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApprovalEngineService } from "@/services/approval-engine.service";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const { decision, comment } = body;

    if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
      return errorResponse("Decision must be either 'APPROVED' or 'REJECTED'", "VALIDATION_ERROR", 400);
    }

    const updated = await ApprovalEngineService.decide(user, id, decision, comment);
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Approval Decision API Error]:", error);
    const statusCode = error.statusCode || (error.message?.includes("Forbidden") ? 403 : 400);
    return errorResponse(error.message || "Failed to register approval decision", "APPROVAL_ERROR", statusCode);
  }
}
