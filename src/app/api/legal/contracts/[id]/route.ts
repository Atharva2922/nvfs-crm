import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LegalContractService } from "@/services/legal-contract.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_READ)) {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const contract = await LegalContractService.getById(user, id);
    if (!contract) return errorResponse("Contract not found", "NOT_FOUND", 404);

    return successResponse(contract);
  } catch (error: any) {
    console.error("GET /api/legal/contracts/[id] error:", error);
    return errorResponse(error.message || "Failed to load contract", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (
      !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_UPDATE) &&
      !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_WRITE)
    ) {
      return errorResponse("Forbidden: Insufficient permissions to update contracts", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const updated = await LegalContractService.update(user, id, body);
    return successResponse(updated);
  } catch (error: any) {
    console.error("PATCH /api/legal/contracts/[id] error:", error);
    return errorResponse(error.message || "Failed to update contract", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_DELETE)) {
      return errorResponse("Forbidden: Insufficient permissions to delete contracts", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const result = await LegalContractService.delete(user, id);
    return successResponse(result);
  } catch (error: any) {
    console.error("DELETE /api/legal/contracts/[id] error:", error);
    return errorResponse(error.message || "Failed to delete contract", "INTERNAL_ERROR", 500);
  }
}
