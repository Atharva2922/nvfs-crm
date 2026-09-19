import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CommunicationService } from "@/services/communication.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const unreadCount = await CommunicationService.getUnreadCount(user);

    return successResponse({ unreadCount });
  } catch (error: any) {
    console.error("GET /api/communications/unread-count error:", error);
    return errorResponse(error.message || "Failed to load unread count", "INTERNAL_ERROR", 500);
  }
}
