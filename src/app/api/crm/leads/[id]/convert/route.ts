import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LeadService } from "@/services/lead.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const convertSchema = z.object({
  createOpportunity: z.boolean().optional(),
  opportunityName: z.string().optional(),
  dealValue: z.number().optional(),
  existingClientId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json().catch(() => ({}));
    const parse = convertSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const result = await LeadService.convertLead(id, user, parse.data);
    return successResponse(result, 200);
  } catch (error: any) {
    console.error("[Lead Conversion Error]:", error);
    return errorResponse(error.message || "Failed to convert lead", "CONVERT_FAILED", 400);
  }
}
