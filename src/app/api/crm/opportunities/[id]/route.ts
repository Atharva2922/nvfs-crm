import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OpportunityService } from "@/services/opportunity.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateOppSchema = z.object({
  stage: z.enum(["DISCOVERY", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"]).optional(),
  probability: z.number().min(0).max(100).optional(),
  value: z.number().optional(),
  lossReason: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = updateOppSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    if (parse.data.stage) {
      const updated = await OpportunityService.updateStage(id, user, parse.data.stage, parse.data.lossReason);
      return successResponse(updated);
    }

    const updated = await db.opportunity.update({
      where: { id },
      data: parse.data,
    });
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Opportunity Update Error]:", error);
    return errorResponse(error.message || "Failed to update opportunity", "UPDATE_FAILED", 400);
  }
}
