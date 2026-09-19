import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LeadService } from "@/services/lead.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateLeadSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  companyName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  source: z.enum(["WEBSITE", "REFERRAL", "COLD_OUTREACH", "CONFERENCE", "PARTNER"]).optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "LOST"]).optional(),
  estimatedValue: z.number().nullable().optional(),
  ownerId: z.string().nullable().optional(),
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

    const lead = await LeadService.getLeadById(id, user);
    return successResponse(lead);
  } catch (error: any) {
    console.error("[Lead GET ID Error]:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : error.message?.includes("not found") ? 404 : 500;
    return errorResponse(error.message || "Failed to retrieve lead", "INTERNAL_ERROR", status);
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
    const parse = updateLeadSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const updated = await LeadService.updateLead(id, user, parse.data);
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Lead Update Error]:", error);
    return errorResponse(error.message || "Failed to update lead", "UPDATE_FAILED", 400);
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

    const result = await LeadService.deleteLead(id, user);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Lead Delete Error]:", error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return errorResponse(error.message || "Failed to delete lead", "DELETE_FAILED", status);
  }
}
