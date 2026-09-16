import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ComplianceService } from "@/services/compliance.service";
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
    const compliance = await ComplianceService.getById(user, id);
    if (!compliance) return errorResponse("Compliance requirement not found", "NOT_FOUND", 404);

    return successResponse(compliance);
  } catch (error: any) {
    console.error("GET /api/legal/compliance/[id] error:", error);
    return errorResponse(error.message || "Failed to load compliance requirement", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_COMPLIANCE_MANAGE) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_UPDATE)) {
      return errorResponse("Forbidden: Insufficient permissions to update compliance requirement", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const updated = await ComplianceService.update(user, id, body);
    return successResponse(updated);
  } catch (error: any) {
    console.error("PATCH /api/legal/compliance/[id] error:", error);
    return errorResponse(error.message || "Failed to update compliance requirement", "INTERNAL_ERROR", 500);
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
      return errorResponse("Forbidden: Insufficient permissions to delete compliance requirements", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const result = await ComplianceService.delete(user, id);
    return successResponse(result);
  } catch (error: any) {
    console.error("DELETE /api/legal/compliance/[id] error:", error);
    return errorResponse(error.message || "Failed to delete compliance requirement", "INTERNAL_ERROR", 500);
  }
}
