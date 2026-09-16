import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { TaskService } from "@/services/task.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(2, "Task title is required"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  dependencyId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const tasks = await TaskService.getTasks(user, { operationId: id });
    return successResponse(tasks);
  } catch (error: any) {
    console.error("[Operation Tasks GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve tasks", "INTERNAL_ERROR", 500);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();
    const validated = createTaskSchema.parse(body);

    const task = await TaskService.createTask(user, {
      ...validated,
      operationId: id,
    });

    return successResponse(task, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Operation Tasks POST Error]:", error);
    return errorResponse(error.message || "Failed to create task", "INTERNAL_ERROR", 500);
  }
}
