import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CommunicationService } from "@/services/communication.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const editMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const validated = editMessageSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(validated.error.issues[0]?.message || "Invalid payload", "BAD_REQUEST", 400);
    }

    const updated = await CommunicationService.editMessage(
      user,
      id,
      validated.data.content
    );

    return successResponse({ message: updated }, 200);
  } catch (error: any) {
    console.error("PATCH /api/communications/messages/[id] error:", error);
    return errorResponse(error.message || "Failed to update message", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const deleted = await CommunicationService.deleteMessage(user, id);

    return successResponse({ message: deleted }, 200);
  } catch (error: any) {
    console.error("DELETE /api/communications/messages/[id] error:", error);
    return errorResponse(error.message || "Failed to delete message", "INTERNAL_ERROR", 500);
  }
}
