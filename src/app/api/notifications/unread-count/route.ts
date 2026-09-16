import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationService } from "@/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const unreadCount = await NotificationService.getUnreadCount(user.id);
    return successResponse({ unreadCount });
  } catch (error: any) {
    console.error("[Unread Count Error]:", error);
    return errorResponse(error.message || "Failed to count unread notifications", "INTERNAL_ERROR", 500);
  }
}
