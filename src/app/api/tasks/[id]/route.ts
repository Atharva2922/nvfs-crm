import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { TaskService } from "@/services/task.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"]).optional(),
  departmentId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  relatedEmployeeId: z.string().optional(),
  relatedClientId: z.string().optional(),
  relatedProjectId: z.string().optional(),
  attachments: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const task = await TaskService.getTaskById(id, user);
    return successResponse(task);
  } catch (error: any) {
    console.error("[Task GET ID Error]:", error);
    const status = error.message.includes("Access Denied") ? 403 : 404;
    return errorResponse(error.message || "Failed to retrieve task", "NOT_FOUND", status);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = updateTaskSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const updated = await TaskService.updateTask(id, user, parse.data);
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Task Update Error]:", error);
    const status = error.message.includes("Access Denied") || error.message.includes("Forbidden") ? 403 : 400;
    return errorResponse(error.message || "Failed to update task", "UPDATE_FAILED", status);
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

    const task = await db.task.findUnique({ where: { id } });
    if (!task) return errorResponse("Task not found", "NOT_FOUND", 404);

    const isCreator = task.creatorId === user.employee.id;
    const isExec = TaskService.isExecutive(user);
    if (!isCreator && !isExec) {
      return errorResponse("Forbidden: Only the task creator or executives can delete a task", "FORBIDDEN", 403);
    }

    await db.task.delete({ where: { id } });
    return successResponse({ deleted: true, id });
  } catch (error: any) {
    console.error("[Task Delete Error]:", error);
    return errorResponse(error.message || "Failed to delete task", "DELETE_FAILED", 500);
  }
}
