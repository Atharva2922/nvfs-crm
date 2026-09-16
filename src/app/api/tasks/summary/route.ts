import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthorizedScope } from "@/lib/scope-guard";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const requestedScope = searchParams.get("scope") || "SELF";
    const scopeFilter = await getAuthorizedScope(user, "tasks.task");

    let whereClause: any = {
      organizationId: user.employee.organizationId,
    };

    if (requestedScope === "TEAM" && scopeFilter.subordinateIds) {
      whereClause.assigneeId = { in: scopeFilter.subordinateIds };
    } else if (requestedScope === "DEPARTMENT" && scopeFilter.departmentId) {
      whereClause.departmentId = scopeFilter.departmentId;
    } else {
      whereClause.assigneeId = user.employee.id;
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [allTasks, recentTasks] = await Promise.all([
      db.task.findMany({
        where: whereClause,
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      }),
      db.task.findMany({
        where: {
          ...whereClause,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          dueDate: true,
        },
      }),
    ]);

    let pending = 0;
    let dueToday = 0;
    let overdue = 0;
    let completed = 0;

    allTasks.forEach((t) => {
      if (t.status === "COMPLETED") {
        completed++;
      } else {
        pending++;
        if (t.dueDate) {
          const d = new Date(t.dueDate);
          if (d < startOfDay) {
            overdue++;
          } else if (d >= startOfDay && d <= endOfDay) {
            dueToday++;
          }
        }
      }
    });

    return successResponse({
      total: allTasks.length,
      pending,
      dueToday,
      overdue,
      completed,
      recentTasks,
    });
  } catch (error: any) {
    console.error("[Task Summary API Error]:", error);
    return errorResponse("Failed to fetch task summary", "INTERNAL_ERROR", 500);
  }
}
