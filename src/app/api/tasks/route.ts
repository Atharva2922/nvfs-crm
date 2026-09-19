import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { TaskService } from "@/services/task.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(3, "Task title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  departmentId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  relatedEmployeeId: z.string().optional(),
  relatedClientId: z.string().optional(),
  relatedProjectId: z.string().optional(),
  attachments: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const filters = {
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      assigneeId: searchParams.get("assigneeId") || undefined,
      creatorId: searchParams.get("creatorId") || undefined,
      relatedClientId: searchParams.get("relatedClientId") || searchParams.get("clientId") || undefined,
      quickFilter: (searchParams.get("quickFilter") as any) || undefined,
      scope: (searchParams.get("scope") as "my" | "department" | "all") || "all",
      search: searchParams.get("search") || undefined,
      page: searchParams.has("page") ? parseInt(searchParams.get("page")!, 10) : undefined,
      limit: searchParams.has("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    };

    const result = await TaskService.getTasks(user, filters);
    const taskList = result.tasks || result;
    return successResponse(
      { tasks: taskList },
      200,
      {
        total: result.total ?? taskList.length,
        page: result.page ?? 1,
        limit: result.limit ?? taskList.length,
        totalPages: result.totalPages ?? 1,
      } as any
    );
  } catch (error: any) {
    console.error("[Tasks GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve tasks", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = createTaskSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const task = await TaskService.createTask(user, parse.data);
    return successResponse(task, 201);
  } catch (error: any) {
    console.error("[Task Creation Error]:", error);
    const status = error.message.includes("Forbidden") || error.message.includes("Access Denied") ? 403 : 400;
    return errorResponse(error.message || "Failed to create task", "TASK_CREATE_FAILED", status);
  }
}
