import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { VendorService } from "@/services/vendor.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const body = await req.json();

    if (!body.name || !body.email) {
      return errorResponse("Contact Name and Email are required", "VALIDATION_ERROR", 400);
    }

    const contact = await VendorService.addContact(user, id, body);
    return successResponse(contact, 201);
  } catch (error: any) {
    console.error("[Vendor Contact POST Error]:", error);
    return errorResponse(error.message || "Failed to add vendor contact", "INTERNAL_ERROR", 400);
  }
}
