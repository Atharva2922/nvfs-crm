import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AnnouncementService } from "@/services/announcement.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createAnnouncementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(5, "Content must be at least 5 characters"),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).optional(),
  audience: z.enum(["ALL", "DEPARTMENT", "ROLE"]).optional(),
  departmentId: z.string().optional(),
  targetRoles: z.array(z.string()).optional(),
  expiresAt: z.string().optional(),
  attachments: z.array(z.any()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await AnnouncementService.getAnnouncements(
      user.employee.id,
      user.employee.organizationId,
      page,
      limit
    );

    return successResponse(result);
  } catch (error: any) {
    console.error("GET /api/communications/announcements error:", error);
    return errorResponse(error.message || "Failed to load announcements", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Role check: Only authorized roles can publish company-wide/dept announcements
    const allowedRoles = [
      "SUPER_ADMIN",
      "CEO",
      "CHAIRPERSON",
      "CTO",
      "CMO",
      "CFO",
      "ADMIN",
      "HR_MANAGER",
      "DEPARTMENT_HEAD",
      "OPERATIONS_MANAGER",
    ];

    if (!allowedRoles.includes(user.roleCode)) {
      return errorResponse("You do not have permission to publish announcements", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validated = createAnnouncementSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(validated.error.issues[0]?.message || "Invalid payload", "BAD_REQUEST", 400);
    }

    const { title, content, priority, audience, departmentId, targetRoles, expiresAt, attachments } = validated.data;

    const announcement = await AnnouncementService.createAnnouncement({
      organizationId: user.employee.organizationId,
      authorId: user.employee.id,
      title,
      content,
      priority,
      audienceType: audience,
      targetDepartmentId: departmentId,
      targetRole: targetRoles?.[0],
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      attachments,
    });

    return successResponse({ announcement }, 201);
  } catch (error: any) {
    console.error("POST /api/communications/announcements error:", error);
    return errorResponse(error.message || "Failed to publish announcement", "INTERNAL_ERROR", 500);
  }
}
