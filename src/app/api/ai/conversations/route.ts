import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AIService } from "@/services/ai/ai.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const conversations = await AIService.getConversations(user);

    return successResponse({ conversations }, 200);
  } catch (error: any) {
    console.error("GET /api/ai/conversations error:", error);
    return errorResponse(error.message || "Failed to load conversations", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await req.json().catch(() => ({}));
    const conversation = await db.aIConversation.create({
      data: {
        organizationId: user.employee.organizationId,
        userId: user.id,
        title: body.title || "New Intelligence Session",
        contextRecordType: body.contextRecordType,
        contextRecordId: body.contextRecordId,
      },
    });

    return successResponse({ conversation }, 201);
  } catch (error: any) {
    console.error("POST /api/ai/conversations error:", error);
    return errorResponse(error.message || "Failed to create conversation", "INTERNAL_ERROR", 500);
  }
}
