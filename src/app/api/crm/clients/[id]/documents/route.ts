import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CrmDocumentService } from "@/services/crm-document.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createDocumentSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  fileUrl: z.string().min(1, "File URL is required"),
  fileSize: z.union([z.number(), z.string()]).optional(),
  fileType: z.string().optional(),
  category: z.enum(["CONTRACT", "PROPOSAL", "NDA", "INVOICE", "COMPLIANCE", "OTHER"]).optional(),
  opportunityId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const documents = await CrmDocumentService.getDocuments(user, id);
    return successResponse(documents);
  } catch (error: any) {
    console.error("[Client Documents GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve documents", "INTERNAL_ERROR", 500);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = createDocumentSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const doc = await CrmDocumentService.uploadDocument(user, {
      clientId: id,
      ...parse.data,
    });

    return successResponse(doc, 201);
  } catch (error: any) {
    console.error("[Client Document Create Error]:", error);
    return errorResponse(error.message || "Failed to record document", "DOCUMENT_CREATE_FAILED", 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("activityId");
    if (!activityId) return errorResponse("activityId parameter is required", "VALIDATION_ERROR", 400);

    const result = await CrmDocumentService.deleteDocument(activityId, user);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Client Document Delete Error]:", error);
    return errorResponse(error.message || "Failed to delete document", "DOCUMENT_DELETE_FAILED", 400);
  }
}
