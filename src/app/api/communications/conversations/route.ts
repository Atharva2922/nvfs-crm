import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CommunicationService } from "@/services/communication.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createConversationSchema = z.object({
  type: z.enum(["DIRECT", "GROUP", "CHANNEL", "RECORD"]),
  title: z.string().optional(),
  description: z.string().optional(),
  targetEmployeeId: z.string().optional(),
  recordType: z.string().optional(),
  recordId: z.string().optional(),
  departmentId: z.string().optional(),
  isPrivate: z.boolean().optional(),
  memberEmployeeIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const recordType = searchParams.get("recordType") || undefined;
    const search = searchParams.get("search") || undefined;

    const conversations = await CommunicationService.getConversations(user, {
      type,
      recordType,
      search,
    });

    return successResponse({ conversations });
  } catch (error: any) {
    console.error("GET /api/communications/conversations error:", error);
    return errorResponse(error.message || "Failed to load conversations", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const validated = createConversationSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(validated.error.issues[0]?.message || "Invalid payload", "BAD_REQUEST", 400);
    }

    const { type, title, description, targetEmployeeId, recordType, recordId, departmentId, isPrivate, memberEmployeeIds } = validated.data;

    if (type === "DIRECT") {
      if (!targetEmployeeId) {
        return errorResponse("targetEmployeeId is required for direct conversations", "BAD_REQUEST", 400);
      }
      const conversation = await CommunicationService.getOrCreateDirectConversation(user, targetEmployeeId);
      return successResponse({ conversation }, 200);
    }

    if (type === "RECORD") {
      if (!recordType || !recordId) {
        return errorResponse("recordType and recordId are required for record conversations", "BAD_REQUEST", 400);
      }
      const conversation = await CommunicationService.getOrCreateRecordConversation(
        user,
        recordType,
        recordId,
        title || `${recordType} Discussion`
      );
      return successResponse({ conversation }, 200);
    }

    // GROUP or CHANNEL
    if (!title) {
      return errorResponse("Title is required for groups and channels", "BAD_REQUEST", 400);
    }

    const conversation = await CommunicationService.createGroupConversation(user, {
      title,
      description,
      departmentId,
      isPrivate: isPrivate ?? false,
      memberEmployeeIds: memberEmployeeIds || [],
    });

    return successResponse({ conversation }, 201);
  } catch (error: any) {
    console.error("POST /api/communications/conversations error:", error);
    return errorResponse(error.message || "Failed to create conversation", "INTERNAL_ERROR", 500);
  }
}
