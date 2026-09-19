import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CommunicationService } from "@/services/communication.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const conversation = await CommunicationService.getConversationById(user, id);

    if (!conversation) {
      return errorResponse("Conversation not found or access denied", "NOT_FOUND", 404);
    }

    return successResponse({ conversation });
  } catch (error: any) {
    console.error("GET /api/communications/conversations/[id] error:", error);
    return errorResponse(error.message || "Failed to retrieve conversation", "INTERNAL_ERROR", 500);
  }
}

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

    const conversation = await db.conversation.findFirst({
      where: {
        id,
        organizationId: user.employee.organizationId,
      },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      return errorResponse("Conversation not found", "NOT_FOUND", 404);
    }

    // Check if user is participant or creator
    const isParticipant = conversation.participants.some((p: any) => p.employeeId === user.employee!.id);
    const isCreator = conversation.createdById === user.employee.id;

    if (!isParticipant && !isCreator && user.roleCode !== "SUPER_ADMIN") {
      return errorResponse("Access denied", "FORBIDDEN", 403);
    }

    const updated = await db.conversation.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : conversation.title,
        description: body.description !== undefined ? body.description : conversation.description,
        isArchived: body.isArchived !== undefined ? Boolean(body.isArchived) : conversation.isArchived,
      },
    });

    return successResponse({ conversation: updated }, 200);
  } catch (error: any) {
    console.error("PATCH /api/communications/conversations/[id] error:", error);
    return errorResponse(error.message || "Failed to update conversation", "INTERNAL_ERROR", 500);
  }
}
