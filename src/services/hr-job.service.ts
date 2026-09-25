import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export interface AssignJobPayload {
  employeeId: string;
  title: string;
  description: string;
  departmentId?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  estimatedHours?: number;
}

export class HrJobService {
  /**
   * Asserts that the authenticated user possesses HR executive authority.
   * Only persons logged in with HR ID/role (or Super Admin) are permitted.
   */
  static assertHrAuthority(user: AuthenticatedUser) {
    const isHr =
      user.roleCode === "HR" ||
      user.roleCode === "SUPER_ADMIN" ||
      user.permissions?.includes("hr.employee.manage") ||
      (user.roleCode === "ADMIN" && user.roleLevel >= 80);

    if (!isHr) {
      throw new Error(
        "Forbidden: Only authorized Human Resources (HR) personnel can assign jobs to employees."
      );
    }
  }

  /**
   * Assigns a new job / work mandate to an employee in the HR user's company.
   */
  static async assignJob(user: AuthenticatedUser, data: AssignJobPayload) {
    this.assertHrAuthority(user);

    if (!user.employee) {
      throw new Error("Authenticated user has no employee profile");
    }

    const companyId = user.activeCompany?.id || user.employee.organizationId;
    if (!companyId) {
      throw new Error("Active company context not found");
    }

    if (!data.employeeId || !data.title) {
      throw new Error("Target employee and job title are required");
    }

    // Verify target employee exists, is ACTIVE, and belongs to this organization
    const targetEmployee = await db.employee.findUnique({
      where: { id: data.employeeId },
      include: { department: true },
    });

    if (!targetEmployee) {
      throw new Error("Target employee not found");
    }

    if (targetEmployee.organizationId !== companyId) {
      throw new Error("Target employee belongs to a different organization");
    }

    if (targetEmployee.employmentStatus !== "ACTIVE") {
      throw new Error("Cannot assign jobs to an employee who is not currently ACTIVE");
    }

    const task = await db.task.create({
      data: {
        organizationId: companyId,
        creatorId: user.employee.id,
        assigneeId: targetEmployee.id,
        departmentId: data.departmentId || targetEmployee.departmentId,
        title: data.title,
        description: data.description || null,
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : null,
        status: "TODO",
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
    });

    // Notify employee of their new job assignment
    if (targetEmployee.userId) {
      db.notification
        .create({
          data: {
            userId: targetEmployee.userId,
            organizationId: companyId,
            type: "TASK_ASSIGNED",
            title: `New Job Assigned: ${data.title}`,
            message: `HR (${user.employee.firstName} ${user.employee.lastName}) has assigned you a job: "${data.title}". Priority: ${data.priority || "MEDIUM"}.`,
            metadata: JSON.stringify({ taskId: task.id }),
          },
        })
        .catch((err) => console.error("[HrJobService] Notification create error:", err));
    }

    // Audit Log
    await AuditService.logMutation({
      actorId: user.id,
      organizationId: companyId,
      action: "HR_JOB_ASSIGNED",
      entity: "Task",
      entityId: task.id,
      newValue: {
        title: data.title,
        assignee: `${targetEmployee.firstName} ${targetEmployee.lastName}`,
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate || null,
      },
    });

    return task;
  }

  /**
   * Lists all jobs assigned to employees within the HR user's organization.
   */
  static async listAssignedJobs(
    user: AuthenticatedUser,
    options: { status?: string; assigneeId?: string } = {}
  ) {
    this.assertHrAuthority(user);

    if (!user.employee) return [];
    const companyId = user.activeCompany?.id || user.employee.organizationId;

    const where: any = { organizationId: companyId };
    if (options.status) where.status = options.status;
    if (options.assigneeId) where.assigneeId = options.assigneeId;

    const tasks = await db.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            avatarUrl: true,
            department: { select: { id: true, name: true } },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
    });

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      estimatedHours: t.estimatedHours,
      assignee: t.assignee
        ? {
            id: t.assignee.id,
            name: `${t.assignee.firstName} ${t.assignee.lastName}`,
            designation: t.assignee.designation,
            department: t.assignee.department?.name || "General",
          }
        : null,
      creator: t.creator
        ? {
            id: t.creator.id,
            name: `${t.creator.firstName} ${t.creator.lastName}`,
            designation: t.creator.designation,
          }
        : null,
    }));
  }

  /**
   * Updates an assigned job's lifecycle status (TODO -> IN_PROGRESS -> COMPLETED).
   */
  static async updateJobStatus(
    user: AuthenticatedUser,
    jobId: string,
    status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  ) {
    this.assertHrAuthority(user);
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const companyId = user.activeCompany?.id || user.employee.organizationId;

    const existing = await db.task.findUnique({
      where: { id: jobId },
    });

    if (!existing || existing.organizationId !== companyId) {
      throw new Error("Job record not found in your organization");
    }

    const updated = await db.task.update({
      where: { id: jobId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      organizationId: companyId,
      action: "HR_JOB_STATUS_UPDATED",
      entity: "Task",
      entityId: jobId,
      previousValue: { status: existing.status },
      newValue: { status },
    });

    return updated;
  }

  /**
   * Revokes / deletes an assigned job.
   */
  static async deleteJob(user: AuthenticatedUser, jobId: string) {
    this.assertHrAuthority(user);
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const companyId = user.activeCompany?.id || user.employee.organizationId;

    const existing = await db.task.findUnique({
      where: { id: jobId },
    });

    if (!existing || existing.organizationId !== companyId) {
      throw new Error("Job record not found in your organization");
    }

    await db.task.delete({ where: { id: jobId } });

    await AuditService.logMutation({
      actorId: user.id,
      organizationId: companyId,
      action: "HR_JOB_REVOKED",
      entity: "Task",
      entityId: jobId,
      previousValue: { title: existing.title },
    });

    return { success: true };
  }
}
