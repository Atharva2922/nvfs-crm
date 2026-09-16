import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LegalContractService } from "@/services/legal-contract.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const body = await req.json();
    const targetState = body.targetState || body.status;
    const notes = body.notes || body.reason;

    if (!targetState) {
      return errorResponse("targetState is required", "BAD_REQUEST", 400);
    }

    if (targetState === "APPROVED" && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_APPROVE)) {
      return errorResponse("Forbidden: Insufficient permissions to approve contracts", "FORBIDDEN", 403);
    }
    if (
      !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_UPDATE) &&
      !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_CONTRACTS_MANAGE)
    ) {
      return errorResponse("Forbidden: Insufficient permissions to change contract status", "FORBIDDEN", 403);
    }

    const updated = await LegalContractService.transitionStatus(user, id, targetState, notes);
    return successResponse(updated);
  } catch (error: any) {
    console.error("POST /api/legal/contracts/[id]/transition error:", error);
    return errorResponse(error.message || "Failed to transition contract", "INTERNAL_ERROR", 500);
  }
}
