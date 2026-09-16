import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const employeeId = user.employee.id;

    // Fetch projects (Operations) where employee is owner OR assigned team member
    const operations = await db.operation.findMany({
      where: {
        organizationId: user.employee.organizationId,
        OR: [
          { ownerId: employeeId },
          { teamMembers: { some: { employeeId: employeeId } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        operationCode: true,
        name: true,
        progress: true,
        status: true,
        startDate: true,
        expectedCompletionDate: true,
        department: { select: { name: true } },
        teamMembers: {
          where: { employeeId: employeeId },
          select: { role: true },
        },
      },
    });

    const formatted = operations.map((op) => ({
      id: op.id,
      operationCode: op.operationCode,
      name: op.name,
      progress: op.progress || 0,
      status: op.status,
      startDate: op.startDate,
      expectedCompletionDate: op.expectedCompletionDate,
      departmentName: op.department?.name,
      role: op.teamMembers[0]?.role || "MEMBER",
    }));

    return successResponse(formatted);
  } catch (error: any) {
    console.error("[My Projects API Error]:", error);
    return errorResponse("Failed to fetch my projects", "INTERNAL_ERROR", 500);
  }
}
