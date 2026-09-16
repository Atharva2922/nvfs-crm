import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LeadService } from "@/services/lead.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateLeadSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "LOST"]).optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        owner: { select: { firstName: true, lastName: true, designation: true } },
        activities: {
          orderBy: { performedAt: "desc" },
          include: { performedBy: { select: { firstName: true, lastName: true } } },
        },
        convertedClient: true,
        convertedContact: true,
      },
    });

    if (!lead) return errorResponse("Lead not found", "NOT_FOUND", 404);
    if (lead.organizationId !== user.employee.organizationId) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    return successResponse(lead);
  } catch (error: any) {
    console.error("[Lead GET ID Error]:", error);
    return errorResponse(error.message || "Failed to retrieve lead", "INTERNAL_ERROR", 500);
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

    if (!parse.data.status) {
      return errorResponse("Status is required for update", "VALIDATION_ERROR", 400);
    }

    const updated = await LeadService.updateLeadStatus(id, user, parse.data.status, parse.data.notes);
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Lead Update Error]:", error);
    return errorResponse(error.message || "Failed to update lead", "UPDATE_FAILED", 400);
  }
}
