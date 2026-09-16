import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ExpenseService } from "@/services/expense.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const transitionExpenseSchema = z.object({
  action: z.enum(["REVIEW", "APPROVE", "REJECT", "PAY"]),
  reason: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
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
    const parse = transitionExpenseSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const updated = await ExpenseService.transitionStatus(id, user, parse.data.action, {
      reason: parse.data.reason,
      paymentMethod: parse.data.paymentMethod,
      paymentReference: parse.data.paymentReference,
    });

    return successResponse(updated);
  } catch (error: any) {
    console.error("[Expense Transition Error]:", error);
    const status = error.message.includes("Forbidden") ? 403 : 400;
    return errorResponse(error.message || "Failed to transition expense", "TRANSITION_FAILED", status);
  }
}
