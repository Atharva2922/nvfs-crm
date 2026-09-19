import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CommunicationService } from "@/services/communication.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).optional(),
  channel: z.enum(["INTERNAL", "EMAIL", "SMS", "WHATSAPP", "OTHER"]).optional(),
  attachments: z.array(z.any()).optional(),
  parentId: z.string().optional(),
});

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
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const before = searchParams.get("before") || undefined;
    const parentId = searchParams.get("parentId") || undefined;

    const messages = await CommunicationService.getMessages(user, id, {
      limit,
      before,
      parentId,
    });

    return successResponse({ messages });
  } catch (error: any) {
    console.error("GET /api/communications/conversations/[id]/messages error:", error);
    return errorResponse(error.message || "Failed to retrieve messages", "INTERNAL_ERROR", 500);
  }
}

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
    const validated = sendMessageSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(validated.error.issues[0]?.message || "Invalid message data", "BAD_REQUEST", 400);
    }

    const { content, priority, channel, attachments, parentId } = validated.data;

    const message = await CommunicationService.sendMessage(user, id, {
      content,
      priority,
      isInternal: channel === "INTERNAL",
      attachments,
      parentId,
    });

    return successResponse({ message }, 201);
  } catch (error: any) {
    console.error("POST /api/communications/conversations/[id]/messages error:", error);
    return errorResponse(error.message || "Failed to send message", "INTERNAL_ERROR", 500);
  }
}
