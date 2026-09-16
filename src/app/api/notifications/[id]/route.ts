import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationService } from "@/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const updated = await NotificationService.markAsRead(id, user.id);
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Notification Mark Read Error]:", error);
    return errorResponse(error.message || "Failed to update notification", "UPDATE_FAILED", 400);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const deleted = await NotificationService.deleteNotification(id, user.id);
    return successResponse(deleted);
  } catch (error: any) {
    console.error("[Notification Delete Error]:", error);
    return errorResponse(error.message || "Failed to delete notification", "DELETE_FAILED", 400);
  }
}
