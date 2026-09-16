import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApprovalService } from "@/services/approval.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const decideSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();
    const validated = decideSchema.parse(body);

    const updated = await ApprovalService.decide(user, id, validated.decision, validated.comment);
    return successResponse(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Approval Decision Error]:", error);
    return errorResponse(error.message || "Failed to decide approval", "INTERNAL_ERROR", 500);
  }
}
