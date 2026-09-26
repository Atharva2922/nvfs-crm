import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { EmployeeOnboardingService } from "@/services/employee-onboarding.service";
import { db } from "@/lib/db";
import { z } from "zod";

const addDocSchema = z.object({
  type: z.string().min(1, "Document type is required"),
  title: z.string().min(1, "Document title is required"),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().min(1, "File content/URL is required"),
  fileSize: z.number().optional().default(1024),
  mimeType: z.string().optional().default("application/pdf"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const documents = await db.employeeDocument.findMany({
      where: { employeeId: id },
      orderBy: { uploadedAt: "desc" },
    });

    return successResponse(documents);
  } catch (error: any) {
    console.error("[Employee Documents GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch documents", "INTERNAL_ERROR", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const parse = addDocSchema.safeParse(body);

    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const doc = await EmployeeOnboardingService.addDocument(id, parse.data);

    return successResponse(doc, 201);
  } catch (error: any) {
    console.error("[Employee Documents POST Error]:", error);
    return errorResponse(error.message || "Failed to save document", "INTERNAL_ERROR", 500);
  }
}
