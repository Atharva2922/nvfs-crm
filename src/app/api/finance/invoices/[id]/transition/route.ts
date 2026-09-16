import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { InvoiceService } from "@/services/invoice.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const transitionSchema = z.object({
  action: z.enum(["SUBMIT", "APPROVE", "REJECT", "SEND", "CANCEL"]),
  reason: z.string().optional(),
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
    const parse = transitionSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const updated = await InvoiceService.transitionStatus(id, user, parse.data.action, {
      reason: parse.data.reason,
    });

    return successResponse(updated);
  } catch (error: any) {
    console.error("[Invoice Transition Error]:", error);
    const status = error.message.includes("Forbidden") ? 403 : 400;
    return errorResponse(error.message || "Failed to update invoice state", "TRANSITION_FAILED", status);
  }
}
