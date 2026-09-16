import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PaymentService } from "@/services/payment.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.number().min(0.01, "Payment amount must be greater than zero"),
  paymentDate: z.string().optional(),
  paymentMethod: z.enum(["BANK_TRANSFER", "CREDIT_CARD", "CHECK", "CASH", "ACH", "WIRE"]),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const filters = {
      invoiceId: searchParams.get("invoiceId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const payments = await PaymentService.getPayments(user, filters);
    return successResponse({ payments });
  } catch (error: any) {
    console.error("[Payments GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve payments", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = recordPaymentSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const result = await PaymentService.recordPayment(user, parse.data as any);
    return successResponse(result, 201);
  } catch (error: any) {
    console.error("[Payment Record Error]:", error);
    return errorResponse(error.message || "Failed to record payment", "PAYMENT_FAILED", 400);
  }
}
