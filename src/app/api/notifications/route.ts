import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationService } from "@/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(Number(searchParams.get("limit") || 30), 100);
    const offset = Number(searchParams.get("offset") || 0);
    const type = searchParams.get("type") || undefined;

    const result = await NotificationService.getUserNotifications(user.id, {
      unreadOnly,
      limit,
      offset,
      type,
    });

    return successResponse(result);
  } catch (error: any) {
    console.error("[Notifications GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve notifications", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const result = await NotificationService.markAllAsRead(user.id);
    return successResponse({ count: result.count, markedAllRead: true });
  } catch (error: any) {
    console.error("[Notifications Mark All Read Error]:", error);
    return errorResponse(error.message || "Failed to mark notifications as read", "INTERNAL_ERROR", 500);
  }
}
