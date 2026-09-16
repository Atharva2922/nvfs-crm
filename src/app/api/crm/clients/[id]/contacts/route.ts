import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ClientService } from "@/services/client.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  isPrimary: z.boolean().optional(),
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

    const body = await req.json();
    const parse = contactSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const contact = await ClientService.addContact(id, user, parse.data);
    return successResponse(contact, 201);
  } catch (error: any) {
    console.error("[Add Contact Error]:", error);
    return errorResponse(error.message || "Failed to add contact", "CONTACT_FAILED", 400);
  }
}
