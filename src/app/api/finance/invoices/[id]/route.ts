import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { InvoiceService } from "@/services/invoice.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const invoice = await InvoiceService.getInvoiceById(id, user);
    return successResponse(invoice);
  } catch (error: any) {
    console.error("[Invoice GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve invoice", "NOT_FOUND", 404);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const invoice = await db.invoice.findUnique({ where: { id } });
    if (!invoice || invoice.organizationId !== user.employee.organizationId) {
      return errorResponse("Invoice not found", "NOT_FOUND", 404);
    }

    if (invoice.status !== "DRAFT") {
      return errorResponse("Only draft invoices can be permanently deleted", "BAD_REQUEST", 400);
    }

    await db.invoice.delete({ where: { id } });
    return successResponse({ deleted: true, id });
  } catch (error: any) {
    console.error("[Invoice Delete Error]:", error);
    return errorResponse(error.message || "Failed to delete invoice", "INTERNAL_ERROR", 500);
  }
}
