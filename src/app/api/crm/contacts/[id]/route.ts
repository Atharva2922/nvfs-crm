import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ClientService } from "@/services/client.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateContactSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().nullable().optional(),
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
    const parse = updateContactSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const updated = await ClientService.updateContact(id, user, parse.data);
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Contact Update Error]:", error);
    return errorResponse(error.message || "Failed to update contact", "UPDATE_FAILED", 400);
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

    const result = await ClientService.deleteContact(id, user);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Contact Delete Error]:", error);
    return errorResponse(error.message || "Failed to delete contact", "DELETE_FAILED", 400);
  }
}
