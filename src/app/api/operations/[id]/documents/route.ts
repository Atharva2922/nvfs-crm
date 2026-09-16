import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  category: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const documents = await db.operationDocument.findMany({
      where: { operationId: id },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return successResponse(documents);
  } catch (error: any) {
    console.error("[Operation Documents GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve documents", "INTERNAL_ERROR", 500);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();
    const validated = createDocumentSchema.parse(body);

    const doc = await db.operationDocument.create({
      data: {
        operationId: id,
        name: validated.name,
        fileUrl: validated.fileUrl,
        fileSize: validated.fileSize || null,
        fileType: validated.fileType || null,
        category: validated.category || "DELIVERABLE",
        uploadedById: user.employee.id,
      },
      include: { uploadedBy: true },
    });

    await db.operationActivity.create({
      data: {
        operationId: id,
        type: "DOCUMENT_UPLOADED",
        description: `Document "${doc.name}" uploaded by ${user.employee.firstName} ${user.employee.lastName}`,
        performedById: user.employee.id,
      },
    });

    return successResponse(doc, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Operation Document POST Error]:", error);
    return errorResponse(error.message || "Failed to upload document", "INTERNAL_ERROR", 500);
  }
}
