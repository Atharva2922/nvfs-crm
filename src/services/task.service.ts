import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { EventBusService } from "./event-bus.service";
import { AuditService } from "./audit.service";

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigneeId?: string;
  departmentId?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string | Date;
  relatedEmployeeId?: string;
  relatedClientId?: string;
  relatedProjectId?: string;
  attachments?: string;
  operationId?: string;
  startDate?: string | Date;
  estimatedHours?: number;
  actualHours?: number;
  completionRate?: number;
  dependencyId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assigneeId?: string;
  departmentId?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status?: "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
  dueDate?: string | Date | null;
  relatedEmployeeId?: string;
  relatedClientId?: string;
  relatedProjectId?: string;
  attachments?: string;
  operationId?: string;
  startDate?: string | Date | null;
  estimatedHours?: number;
  actualHours?: number;
  completionRate?: number;
  dependencyId?: string | null;
}

export interface TaskQueryFilters {
  status?: string;
  priority?: string;
  departmentId?: string;
  assigneeId?: string;
  creatorId?: string;
  scope?: "my" | "department" | "all";
  search?: string;
  operationId?: string;
}

export class TaskService {
  /**
   * Helper: check if a user is an executive with global task visibility
   */
  static isExecutive(user: AuthenticatedUser): boolean {
    const execRoles = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "ADMIN", "COO", "CTO", "CFO", "CMO"];
    return execRoles.includes(user.roleCode);
  }

  /**
   * Helper: check if user is a manager or department head
   */
  static isManager(user: AuthenticatedUser): boolean {
    return user.roleCode === "DEPARTMENT_HEAD" || user.roleCode === "MANAGER" || this.isExecutive(user);
  }

  /**
   * Retrieve tasks respecting organization boundary, hierarchy, and permissions
   */
  static async getTasks(user: AuthenticatedUser, filters: TaskQueryFilters = {}) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const orgId = user.employee.organizationId;
    const empId = user.employee.id;
    const isExec = this.isExecutive(user);
    const isDeptHead = user.roleCode === "DEPARTMENT_HEAD";

    const where: any = { organizationId: orgId };

    // Scope-based filtering
    if (filters.scope === "my" || (!isExec && !isDeptHead && filters.scope !== "all")) {
      // Standard employee only sees tasks where they are assignee or creator
      where.OR = [{ assigneeId: empId }, { creatorId: empId }];
    } else if (isDeptHead && filters.scope === "department") {
      // Department head sees tasks for their department or where they are assigned/created
      where.OR = [
        { departmentId: user.employee.departmentName ? undefined : null },
        { assigneeId: empId },
        { creatorId: empId },
        { assignee: { managerId: empId } },
      ];
    } else if (!isExec && filters.scope === "all") {
      // Non-exec attempting to view all is scoped to their department and subordinates
      where.OR = [
        { assigneeId: empId },
        { creatorId: empId },
        { assignee: { managerId: empId } },
      ];
    }

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.creatorId) where.creatorId = filters.creatorId;
    if (filters.operationId) where.operationId = filters.operationId;
    if (filters.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: filters.search } },
            { description: { contains: filters.search } },
            { relatedProjectId: { contains: filters.search } },
            { relatedClientId: { contains: filters.search } },
          ],
        },
      ];
    }

    return db.task.findMany({
      where,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            email: true,
            avatarUrl: true,
            userId: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        dependsOn: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        dependentTasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
  }

  /**
   * Get single task with comments and history
   */
  static async getTaskById(taskId: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            email: true,
            avatarUrl: true,
            userId: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                designation: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!task) throw new Error("Task not found");
    if (task.organizationId !== user.employee.organizationId) {
      throw new Error("Unauthorized: Task belongs to another organization");
    }

    // Authorization check for standard employees
    if (!this.isExecutive(user)) {
      const isAssignee = task.assigneeId === user.employee.id;
      const isCreator = task.creatorId === user.employee.id;
      const isManager = task.assignee?.userId === user.id; // or subordinate
      if (!isAssignee && !isCreator && !isManager && user.roleCode !== "DEPARTMENT_HEAD") {
        throw new Error("Access Denied: You do not have permission to view this task");
      }
    }

    return task;
  }

  /**
   * Create a task respecting assignment permissions
   */
  static async createTask(user: AuthenticatedUser, data: CreateTaskInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const orgId = user.employee.organizationId;
    const creatorId = user.employee.id;

    // Validate assignee if provided
    let assigneeUser: { id: string; userId: string | null } | null = null;
    if (data.assigneeId) {
      const assigneeEmp = await db.employee.findUnique({
        where: { id: data.assigneeId },
        select: { id: true, userId: true, organizationId: true, managerId: true },
      });

      if (!assigneeEmp || assigneeEmp.organizationId !== orgId) {
        throw new Error("Assignee employee not found in organization");
      }

      // Hierarchy validation:
      // Non-executives & non-managers can only assign to themselves or their manager
      if (!this.isManager(user)) {
        if (data.assigneeId !== creatorId) {
          throw new Error("Forbidden: Standard employees cannot assign tasks to other staff without manager privileges");
        }
      }

      assigneeUser = assigneeEmp;
    }

    const task = await db.task.create({
      data: {
        organizationId: orgId,
        departmentId: data.departmentId || null,
        title: data.title,
        description: data.description || null,
        priority: data.priority || "MEDIUM",
        status: "TODO",
        creatorId,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        estimatedHours: data.estimatedHours ?? null,
        actualHours: data.actualHours ?? null,
        completionRate: data.completionRate ?? 0,
        dependencyId: data.dependencyId || null,
        operationId: data.operationId || null,
        relatedEmployeeId: data.relatedEmployeeId || null,
        relatedClientId: data.relatedClientId || null,
        relatedProjectId: data.relatedProjectId || null,
        attachments: data.attachments || null,
      },
      include: {
        creator: true,
        assignee: true,
        dependsOn: true,
      },
    });

    // Dispatch event & notification if assigned to another user
    if (assigneeUser && assigneeUser.userId && assigneeUser.userId !== user.id) {
      await EventBusService.publish({
        type: "TASK_ASSIGNED",
        organizationId: orgId,
        actorId: user.id,
        targetUserIds: [assigneeUser.userId],
        title: `Task Assigned: ${task.title}`,
        message: `${user.employee.firstName} ${user.employee.lastName} assigned you a new ${task.priority.toLowerCase()} priority task.`,
        priority: task.priority === "URGENT" ? "URGENT" : "NORMAL",
        actionUrl: "/app/tasks",
        metadata: { taskId: task.id, assignedBy: `${user.employee.firstName} ${user.employee.lastName}` },
        auditAction: "TASK_ASSIGNED",
      });
    }

    await AuditService.logMutation({
      actorId: user.id,
      action: "TASK_CREATED",
      entity: "Task",
      entityId: task.id,
      newValue: { title: task.title, priority: task.priority, assigneeId: task.assigneeId },
      metadata: { source: "task_service" },
    });

    return task;
  }

  /**
   * Update task status, fields, or completion state
   */
  static async updateTask(taskId: string, user: AuthenticatedUser, data: UpdateTaskInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const existing = await db.task.findUnique({
      where: { id: taskId },
      include: { creator: true, assignee: true },
    });

    if (!existing) throw new Error("Task not found");
    if (existing.organizationId !== user.employee.organizationId) {
      throw new Error("Unauthorized");
    }

    // Permission check
    const isAssignee = existing.assigneeId === user.employee.id;
    const isCreator = existing.creatorId === user.employee.id;
    if (!this.isManager(user) && !isAssignee && !isCreator) {
      throw new Error("Access Denied: You cannot modify this task");
    }

    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.dueDate !== undefined) {
      updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.startDate !== undefined) {
      updatePayload.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.estimatedHours !== undefined) updatePayload.estimatedHours = data.estimatedHours;
    if (data.actualHours !== undefined) updatePayload.actualHours = data.actualHours;
    if (data.completionRate !== undefined) updatePayload.completionRate = data.completionRate;
    if (data.dependencyId !== undefined) updatePayload.dependencyId = data.dependencyId;
    if (data.operationId !== undefined) updatePayload.operationId = data.operationId;
    if (data.relatedEmployeeId !== undefined) updatePayload.relatedEmployeeId = data.relatedEmployeeId;
    if (data.relatedClientId !== undefined) updatePayload.relatedClientId = data.relatedClientId;
    if (data.relatedProjectId !== undefined) updatePayload.relatedProjectId = data.relatedProjectId;
    if (data.attachments !== undefined) updatePayload.attachments = data.attachments;
    if (data.dueDate !== undefined) {
      updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    // Handle status change
    if (data.status !== undefined) {
      updatePayload.status = data.status;
      if (data.status === "COMPLETED" && existing.status !== "COMPLETED") {
        updatePayload.completedAt = new Date();
      } else if (data.status !== "COMPLETED") {
        updatePayload.completedAt = null;
      }
    }

    // Handle re-assignment
    let newAssigneeNotified = false;
    if (data.assigneeId !== undefined && data.assigneeId !== existing.assigneeId) {
      if (!this.isManager(user)) {
        throw new Error("Forbidden: Only managers can reassign tasks to different personnel");
      }
      updatePayload.assigneeId = data.assigneeId;
      newAssigneeNotified = true;
    }

    const updated = await db.task.update({
      where: { id: taskId },
      data: updatePayload,
      include: { creator: true, assignee: true },
    });

    // Notify on completion
    if (data.status === "COMPLETED" && existing.status !== "COMPLETED") {
      if (existing.creator.userId && existing.creator.userId !== user.id) {
        await EventBusService.publish({
          type: "TASK_COMPLETED",
          organizationId: user.employee.organizationId,
          actorId: user.id,
          targetUserIds: [existing.creator.userId],
          title: `Task Completed: ${updated.title}`,
          message: `${user.employee.firstName} ${user.employee.lastName} marked task as Completed.`,
          priority: "NORMAL",
          actionUrl: "/app/tasks",
          metadata: { taskId: updated.id },
        });
      }

      if (updated.operationId) {
        try {
          await db.operationActivity.create({
            data: {
              operationId: updated.operationId,
              type: "TASK_COMPLETED",
              description: `Task "${updated.title}" completed by ${user.employee.firstName} ${user.employee.lastName}`,
              performedById: user.employee.id,
            },
          });
        } catch {}
      }
    }

    // Notify if reassigned
    if (newAssigneeNotified && updated.assignee?.userId && updated.assignee.userId !== user.id) {
      await EventBusService.publish({
        type: "TASK_ASSIGNED",
        organizationId: user.employee.organizationId,
        actorId: user.id,
        targetUserIds: [updated.assignee.userId],
        title: `Task Re-Assigned: ${updated.title}`,
        message: `${user.employee.firstName} ${user.employee.lastName} assigned you this task.`,
        priority: updated.priority === "URGENT" ? "URGENT" : "NORMAL",
        actionUrl: "/app/tasks",
        metadata: { taskId: updated.id },
      });
    }

    return updated;
  }

  /**
   * Post a discussion comment on a task
   */
  static async addComment(taskId: string, user: AuthenticatedUser, content: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { creator: true, assignee: true },
    });

    if (!task) throw new Error("Task not found");
    if (task.organizationId !== user.employee.organizationId) {
      throw new Error("Unauthorized");
    }

    const comment = await db.taskComment.create({
      data: {
        taskId,
        authorId: user.employee.id,
        content,
      },
      include: {
        author: {
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

    // Notify counterpart (if author is assignee, notify creator; if author is creator, notify assignee)
    const targetUserIds: string[] = [];
    if (task.assignee?.userId && task.assignee.userId !== user.id) {
      targetUserIds.push(task.assignee.userId);
    }
    if (task.creator.userId && task.creator.userId !== user.id && !targetUserIds.includes(task.creator.userId)) {
      targetUserIds.push(task.creator.userId);
    }

    if (targetUserIds.length > 0) {
      await EventBusService.publish({
        type: "SYSTEM",
        organizationId: user.employee.organizationId,
        actorId: user.id,
        targetUserIds,
        title: `New Comment on: ${task.title}`,
        message: `${user.employee.firstName} ${user.employee.lastName}: "${content.slice(0, 80)}${content.length > 80 ? "..." : ""}"`,
        actionUrl: "/app/tasks",
        metadata: { taskId: task.id, commentId: comment.id },
      });
    }

    return comment;
  }
}
