import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AIService } from "@/services/ai/ai.service";
import { successResponse, errorResponse } from "@/lib/api-response";

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
    const conversation = await AIService.getConversationById(user, id);

    return successResponse({ conversation }, 200);
  } catch (error: any) {
    console.error("GET /api/ai/conversations/[id] error:", error);
    return errorResponse(error.message || "Failed to retrieve conversation", "INTERNAL_ERROR", 500);
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
    await AIService.deleteConversation(user, id);

    return successResponse({ deleted: true }, 200);
  } catch (error: any) {
    console.error("DELETE /api/ai/conversations/[id] error:", error);
    return errorResponse(error.message || "Failed to delete conversation", "INTERNAL_ERROR", 500);
  }
}
