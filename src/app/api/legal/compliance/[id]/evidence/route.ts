import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ComplianceService } from "@/services/compliance.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { z } from "zod";

const submitEvidenceSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  evidenceType: z.string().optional(),
  fileUrl: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const body = await req.json();
    const validated = submitEvidenceSchema.parse(body);

    const evidence = await ComplianceService.submitEvidence(user, id, validated);
    return successResponse(evidence, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed", "VALIDATION_ERROR", 400, (error as any).errors || error.issues);
    }
    console.error("POST /api/legal/compliance/[id]/evidence error:", error);
    return errorResponse(error.message || "Failed to submit evidence", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_COMPLIANCE_MANAGE) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_APPROVE)) {
      return errorResponse("Forbidden: Insufficient permissions to verify evidence", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const { evidenceId, status } = body;

    if (!evidenceId || !["VERIFIED", "REJECTED"].includes(status)) {
      return errorResponse("evidenceId and valid status (VERIFIED or REJECTED) are required", "BAD_REQUEST", 400);
    }

    const verified = await ComplianceService.verifyEvidence(user, evidenceId, status);
    return successResponse(verified);
  } catch (error: any) {
    console.error("PATCH /api/legal/compliance/[id]/evidence error:", error);
    return errorResponse(error.message || "Failed to verify evidence", "INTERNAL_ERROR", 500);
  }
}
