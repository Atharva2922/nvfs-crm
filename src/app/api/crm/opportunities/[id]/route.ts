import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OpportunityService } from "@/services/opportunity.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateOppSchema = z.object({
  name: z.string().min(1).optional(),
  stage: z.enum(["DISCOVERY", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"]).optional(),
  probability: z.number().min(0).max(100).optional(),
  value: z.number().optional(),
  expectedCloseDate: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  lossReason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const opp = await OpportunityService.getOpportunityById(id, user);
    return successResponse(opp);
  } catch (error: any) {
    console.error("[Opportunity GET Error]:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 404;
    return errorResponse(error.message || "Failed to retrieve opportunity", "NOT_FOUND", status);
  }
}

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

    const updated = await OpportunityService.updateOpportunity(id, user, parse.data);
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Opportunity Update Error]:", error);
    return errorResponse(error.message || "Failed to update opportunity", "UPDATE_FAILED", 400);
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

    const result = await OpportunityService.deleteOpportunity(id, user);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Opportunity Delete Error]:", error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return errorResponse(error.message || "Failed to delete opportunity", "DELETE_FAILED", status);
  }
}
