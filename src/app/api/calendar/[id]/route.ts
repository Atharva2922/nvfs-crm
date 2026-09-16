import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const event = await db.calendarEvent.findUnique({
      where: { id },
      include: { creator: true, department: true },
    });

    if (!event) return errorResponse("Calendar event not found", "NOT_FOUND", 404);
    if (event.organizationId !== user.employee.organizationId) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    return successResponse(event);
  } catch (error: any) {
    console.error("[Calendar GET ID Error]:", error);
    return errorResponse(error.message || "Failed to retrieve event", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const event = await db.calendarEvent.findUnique({ where: { id } });
    if (!event) return errorResponse("Calendar event not found", "NOT_FOUND", 404);

    const isCreator = event.creatorId === user.employee.id;
    const isExec = ["SUPER_ADMIN", "ADMIN", "CEO"].includes(user.roleCode);
    if (!isCreator && !isExec) {
      return errorResponse("Forbidden: Only event organizer can delete this event", "FORBIDDEN", 403);
    }

    await db.calendarEvent.delete({ where: { id } });
    return successResponse({ deleted: true, id });
  } catch (error: any) {
    console.error("[Calendar Delete Error]:", error);
    return errorResponse(error.message || "Failed to delete calendar event", "DELETE_FAILED", 500);
  }
}
