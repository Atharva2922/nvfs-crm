import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const activities = await db.operationActivity.findMany({
      where: { operationId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            avatarUrl: true,
          },
        },
      },
    });

    return successResponse(activities);
  } catch (error: any) {
    console.error("[Operation Timeline GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve timeline", "INTERNAL_ERROR", 500);
  }
}
