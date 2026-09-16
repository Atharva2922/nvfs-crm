import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LegalCaseService } from "@/services/legal-case.service";
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
    const legalCase = await LegalCaseService.getCaseById(user, id);
    return successResponse(legalCase);
  } catch (error: any) {
    console.error("GET /api/legal/cases/[id] error:", error);
    return errorResponse(error.message || "Failed to load legal case", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_CASES_MANAGE) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_UPDATE)) {
      return errorResponse("Forbidden: Insufficient permissions to update legal case", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const updated = await LegalCaseService.updateCase(user, id, body);
    return successResponse(updated);
  } catch (error: any) {
    console.error("PATCH /api/legal/cases/[id] error:", error);
    return errorResponse(error.message || "Failed to update legal case", "INTERNAL_ERROR", 500);
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
      return errorResponse("Forbidden: Insufficient permissions to delete legal cases", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const result = await LegalCaseService.deleteCase(user, id);
    return successResponse(result);
  } catch (error: any) {
    console.error("DELETE /api/legal/cases/[id] error:", error);
    return errorResponse(error.message || "Failed to delete legal case", "INTERNAL_ERROR", 500);
  }
}
