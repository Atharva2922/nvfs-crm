import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AnnouncementService } from "@/services/announcement.service";
import { successResponse, errorResponse } from "@/lib/api-response";

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
    const read = await AnnouncementService.markAnnouncementRead(id, user.employee.id);

    return successResponse({ read }, 200);
  } catch (error: any) {
    console.error("POST /api/communications/announcements/[id]/read error:", error);
    return errorResponse(error.message || "Failed to mark announcement as read", "INTERNAL_ERROR", 500);
  }
}

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
    const stats = await AnnouncementService.getAnnouncementReadStats(id, user.employee.organizationId);

    return successResponse(stats, 200);
  } catch (error: any) {
    console.error("GET /api/communications/announcements/[id]/read error:", error);
    return errorResponse(error.message || "Failed to get read statistics", "INTERNAL_ERROR", 500);
  }
}
