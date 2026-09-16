import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LegalDocumentService } from "@/services/legal-document.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { z } from "zod";

const createDocSchema = z.object({
  title: z.string().min(2, "Title is required"),
  documentType: z.string().optional(),
  contractId: z.string().optional(),
  caseId: z.string().optional(),
  complianceId: z.string().optional(),
  fileUrl: z.string().min(1, "File URL is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  changeDescription: z.string().optional(),
});

const addVersionSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  changeDescription: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_READ)) {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const documentType = searchParams.get("documentType") || undefined;
    const contractId = searchParams.get("contractId") || undefined;
    const caseId = searchParams.get("caseId") || undefined;
    const complianceId = searchParams.get("complianceId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const result = await LegalDocumentService.listDocuments(
      user,
      { search, documentType, contractId, caseId, complianceId },
      page,
      limit
    );

    return successResponse(result);
  } catch (error: any) {
    console.error("GET /api/legal/documents error:", error);
    return errorResponse(error.message || "Failed to load legal documents", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_DOCUMENTS_MANAGE) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_WRITE)) {
      return errorResponse("Forbidden: Insufficient permissions to manage legal documents", "FORBIDDEN", 403);
    }

    const body = await req.json();

    // Check if adding version or creating new document
    if (body.documentId) {
      const validated = addVersionSchema.parse(body);
      const newVer = await LegalDocumentService.addVersion(user, validated.documentId, validated);
      return successResponse(newVer, 201);
    } else {
      const validated = createDocSchema.parse(body);
      const doc = await LegalDocumentService.createDocumentWithVersion(user, validated);
      return successResponse(doc, 201);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed", "VALIDATION_ERROR", 400, (error as any).errors || error.issues);
    }
    console.error("POST /api/legal/documents error:", error);
    return errorResponse(error.message || "Failed to upload legal document", "INTERNAL_ERROR", 500);
  }
}
