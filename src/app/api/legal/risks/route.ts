import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LegalRiskService } from "@/services/legal-risk.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { z } from "zod";

const createRiskSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  contractId: z.string().optional(),
  caseId: z.string().optional(),
  complianceId: z.string().optional(),
  probability: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  ownerId: z.string().optional(),
  mitigationPlan: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_READ)) {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const matrixOnly = searchParams.get("matrixOnly") === "true";

    if (matrixOnly) {
      const matrix = await LegalRiskService.getRiskMatrix(user);
      return successResponse(matrix);
    }

    const search = searchParams.get("search") || undefined;
    const riskLevel = searchParams.get("riskLevel") || undefined;
    const status = searchParams.get("status") || undefined;
    const contractId = searchParams.get("contractId") || undefined;
    const caseId = searchParams.get("caseId") || undefined;
    const complianceId = searchParams.get("complianceId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const [risksData, matrix] = await Promise.all([
      LegalRiskService.getRisks(user, { search, riskLevel, status, contractId, caseId, complianceId, page, limit }),
      LegalRiskService.getRiskMatrix(user),
    ]);

    return successResponse({
      ...risksData,
      matrix,
    });
  } catch (error: any) {
    console.error("GET /api/legal/risks error:", error);
    return errorResponse(error.message || "Failed to load legal risks", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_RISK_MANAGE) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_WRITE)) {
      return errorResponse("Forbidden: Insufficient permissions to manage legal risks", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validated = createRiskSchema.parse(body);

    const risk = await LegalRiskService.createRisk(user, validated);
    return successResponse(risk, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed", "VALIDATION_ERROR", 400, (error as any).errors || error.issues);
    }
    console.error("POST /api/legal/risks error:", error);
    return errorResponse(error.message || "Failed to register risk", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_RISK_MANAGE) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_UPDATE)) {
      return errorResponse("Forbidden: Insufficient permissions to update legal risks", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return errorResponse("Risk ID is required", "BAD_REQUEST", 400);

    const updated = await LegalRiskService.updateRisk(user, id, data);
    return successResponse(updated);
  } catch (error: any) {
    console.error("PATCH /api/legal/risks error:", error);
    return errorResponse(error.message || "Failed to update risk", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_DELETE)) {
      return errorResponse("Forbidden: Insufficient permissions to delete risks", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("Risk ID is required", "BAD_REQUEST", 400);

    const result = await LegalRiskService.deleteRisk(user, id);
    return successResponse(result);
  } catch (error: any) {
    console.error("DELETE /api/legal/risks error:", error);
    return errorResponse(error.message || "Failed to delete risk", "INTERNAL_ERROR", 500);
  }
}
