import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApprovalEngineService } from "@/services/approval-engine.service";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
    const mineOnly = searchParams.get("mine") === "true";

    const approvals = await ApprovalEngineService.list(user, {
      status,
      type,
      mineOnly,
    });

    return successResponse(approvals);
  } catch (error: any) {
    console.error("[Approvals API GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch approvals", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const { type, title, description, metadata } = body;

    if (!type || !title) {
      return errorResponse("Type and Title are required", "VALIDATION_ERROR", 400);
    }

    const created = await ApprovalEngineService.initiateWorkflow(user, {
      type,
      title,
      description,
      metadata,
    });

    return successResponse(created);
  } catch (error: any) {
    console.error("[Approvals API POST Error]:", error);
    return errorResponse(error.message || "Failed to initiate workflow", "INTERNAL_ERROR", 500);
  }
}
