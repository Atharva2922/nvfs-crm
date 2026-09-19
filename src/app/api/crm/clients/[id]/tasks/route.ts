import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AuditService } from "@/services/audit.service";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(2, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const client = await db.client.findUnique({ where: { id } });
    if (!client || client.organizationId !== user.employee.organizationId) {
      return errorResponse("Client not found", "NOT_FOUND", 404);
    }

    const tasks = await db.task.findMany({
      where: { relatedClientId: id, organizationId: user.employee.organizationId },
      orderBy: { dueDate: "asc" },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, designation: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return successResponse(tasks);
  } catch (error: any) {
    console.error("[Client Tasks GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve client tasks", "INTERNAL_ERROR", 500);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const client = await db.client.findUnique({ where: { id } });
    if (!client || client.organizationId !== user.employee.organizationId) {
      return errorResponse("Client not found", "NOT_FOUND", 404);
    }

    const body = await req.json();
    const parse = createTaskSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const task = await db.task.create({
      data: {
        organizationId: client.organizationId,
        relatedClientId: client.id,
        creatorId: user.employee.id,
        assigneeId: parse.data.assigneeId || user.employee.id,
        title: parse.data.title.trim(),
        description: parse.data.description || null,
        priority: parse.data.priority || "MEDIUM",
        status: "TODO",
        dueDate: parse.data.dueDate ? new Date(parse.data.dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Record activity on customer timeline
    await db.crmActivity.create({
      data: {
        organizationId: client.organizationId,
        clientId: client.id,
        type: "TASK",
        subject: `Task Created: ${task.title}`,
        description: `Priority: ${task.priority}${task.dueDate ? ` | Due: ${new Date(task.dueDate).toLocaleDateString()}` : ""}`,
        performedById: user.employee.id,
        performedAt: new Date(),
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_TASK_CREATED",
      entity: "Task",
      entityId: task.id,
      newValue: { title: task.title, clientId: client.id, priority: task.priority },
      metadata: { source: "client_task_api" },
    });

    return successResponse(task, 201);
  } catch (error: any) {
    console.error("[Client Task Create Error]:", error);
    return errorResponse(error.message || "Failed to create client task", "TASK_CREATE_FAILED", 400);
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

    const client = await db.client.findUnique({ where: { id } });
    if (!client || client.organizationId !== user.employee.organizationId) {
      return errorResponse("Client not found", "NOT_FOUND", 404);
    }

    const body = await req.json();
    const taskId = body.taskId;
    if (!taskId) return errorResponse("taskId is required", "VALIDATION_ERROR", 400);

    const existingTask = await db.task.findUnique({ where: { id: taskId } });
    if (!existingTask || existingTask.organizationId !== client.organizationId) {
      return errorResponse("Task not found", "NOT_FOUND", 404);
    }

    const updated = await db.task.update({
      where: { id: taskId },
      data: {
        status: body.status || existingTask.status,
        priority: body.priority || existingTask.priority,
        completedAt: body.status === "COMPLETED" ? new Date() : existingTask.completedAt,
      },
    });

    if (body.status === "COMPLETED" && existingTask.status !== "COMPLETED") {
      await db.crmActivity.create({
        data: {
          organizationId: client.organizationId,
          clientId: client.id,
          type: "TASK",
          subject: `Task Completed: ${updated.title}`,
          description: `Completed by ${user.employee.firstName} ${user.employee.lastName}`,
          performedById: user.employee.id,
          performedAt: new Date(),
        },
      });
    }

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_TASK_UPDATED",
      entity: "Task",
      entityId: taskId,
      previousValue: { status: existingTask.status },
      newValue: { status: updated.status },
      metadata: { source: "client_task_api" },
    });

    return successResponse(updated);
  } catch (error: any) {
    console.error("[Client Task Update Error]:", error);
    return errorResponse(error.message || "Failed to update client task", "TASK_UPDATE_FAILED", 400);
  }
}

