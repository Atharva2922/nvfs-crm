import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AIService } from "@/services/ai/ai.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const chatSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  conversationId: z.string().optional(),
  contextRecordType: z.string().optional(),
  contextRecordId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const validated = chatSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(validated.error.issues[0]?.message || "Invalid payload", "BAD_REQUEST", 400);
    }

    const result = await AIService.askAssistant(user, validated.data);

    return successResponse(result, 200);
  } catch (error: any) {
    console.error("POST /api/ai/chat error:", error);
    return errorResponse(error.message || "Failed to process AI query", "INTERNAL_ERROR", 500);
  }
}
