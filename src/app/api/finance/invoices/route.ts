import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { InvoiceService } from "@/services/invoice.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  currency: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discountRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      productId: z.string().optional(),
      quantity: z.number().min(0.01, "Quantity must be positive"),
      unitPrice: z.number().min(0, "Unit price must be non-negative"),
      discount: z.number().min(0).optional(),
      taxRate: z.number().min(0).optional(),
    })
  ).min(1, "At least one line item is required"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const filters = {
      status: searchParams.get("status") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      overdueOnly: searchParams.get("overdue") === "true",
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    const invoices = await InvoiceService.getInvoices(user, filters);
    return successResponse({ invoices });
  } catch (error: any) {
    console.error("[Invoices GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve invoices", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = createInvoiceSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const invoice = await InvoiceService.createInvoice(user, parse.data);
    return successResponse(invoice, 201);
  } catch (error: any) {
    console.error("[Invoice Create Error]:", error);
    return errorResponse(error.message || "Failed to create invoice", "INVOICE_CREATE_FAILED", 400);
  }
}
