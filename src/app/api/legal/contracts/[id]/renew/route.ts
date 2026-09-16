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

    if (
      !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_CONTRACTS_MANAGE) &&
      !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_UPDATE)
    ) {
      return errorResponse("Forbidden: Insufficient permissions to renew contract", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const newExpiry = body.newExpiryDate || body.newEndDate;
    const renewalValue = body.renewalValue !== undefined ? parseFloat(body.renewalValue) : undefined;
    const notes = body.notes;

    if (!newExpiry) {
      return errorResponse("newExpiryDate is required", "BAD_REQUEST", 400);
    }

    const result = await LegalContractService.renewContract(user, id, {
      newExpiryDate: new Date(newExpiry),
      renewalValue,
      notes,
    });

    return successResponse(result);
  } catch (error: any) {
    console.error("POST /api/legal/contracts/[id]/renew error:", error);
    return errorResponse(error.message || "Failed to renew contract", "INTERNAL_ERROR", 500);
  }
}
