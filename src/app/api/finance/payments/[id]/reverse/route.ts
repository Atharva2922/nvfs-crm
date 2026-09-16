import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PaymentService } from "@/services/payment.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const reverseSchema = z.object({
  reason: z.string().min(3, "Reversal reason is required"),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = reverseSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const result = await PaymentService.reversePayment(id, user, parse.data.reason);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Payment Reversal Error]:", error);
    const status = error.message.includes("Forbidden") ? 403 : 400;
    return errorResponse(error.message || "Failed to reverse payment", "REVERSAL_FAILED", status);
  }
}
