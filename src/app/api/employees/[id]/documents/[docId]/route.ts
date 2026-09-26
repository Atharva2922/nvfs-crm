import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { EmployeeOnboardingService } from "@/services/employee-onboarding.service";
import { db } from "@/lib/db";
import { z } from "zod";

const verifySchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  notes: z.string().optional().default(""),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Must be HR, Super Admin, Admin, or CEO to verify documents
    const canVerify = ["SUPER_ADMIN", "ADMIN", "CEO", "HR"].includes(user.roleCode);
    if (!canVerify) {
      return errorResponse("Forbidden: Only HR or Admins can verify documents", "FORBIDDEN", 403);
    }

    const { docId } = await params;
    const body = await req.json();
    const parse = verifySchema.safeParse(body);

    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const verifierName = `${user.employee?.firstName || ""} ${user.employee?.lastName || ""}`.trim() || user.email;

    const doc = await EmployeeOnboardingService.verifyDocument(
      docId,
      parse.data.status,
      parse.data.notes,
      user.id,
      verifierName
    );

    return successResponse(doc);
  } catch (error: any) {
    console.error("[Employee Document Verify PATCH Error]:", error);
    return errorResponse(error.message || "Failed to verify document", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id, docId } = await params;

    await db.employeeDocument.delete({
      where: { id: docId, employeeId: id },
    });

    // Recalculate score after deleting
    const dossier = await EmployeeOnboardingService.getEmployeeDossier(id);

    return successResponse({ deleted: true, dossier });
  } catch (error: any) {
    console.error("[Employee Document DELETE Error]:", error);
    return errorResponse(error.message || "Failed to delete document", "INTERNAL_ERROR", 500);
  }
}
