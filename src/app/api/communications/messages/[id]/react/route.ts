import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CommunicationService } from "@/services/communication.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const reactSchema = z.object({
  emoji: z.string().min(1, "Emoji cannot be empty"),
});

export async function POST(
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
    const validated = reactSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(validated.error.issues[0]?.message || "Invalid payload", "BAD_REQUEST", 400);
    }

    const result = await CommunicationService.toggleReaction(
      user,
      id,
      validated.data.emoji
    );

    return successResponse({ reactions: result }, 200);
  } catch (error: any) {
    console.error("POST /api/communications/messages/[id]/react error:", error);
    return errorResponse(error.message || "Failed to toggle reaction", "INTERNAL_ERROR", 500);
  }
}
