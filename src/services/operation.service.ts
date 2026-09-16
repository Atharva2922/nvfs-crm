import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { EventBusService } from "./event-bus.service";
import { AuditService } from "./audit.service";

export interface CreateOperationInput {
  name: string;
  description?: string;
  operationType?: string;
  departmentId: string;
  ownerId: string;
  clientId?: string;
  opportunityId?: string;
  projectName?: string;
  purchaseOrderId?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status?: "PLANNING" | "SCHEDULED" | "IN_PROGRESS" | "QUALITY_REVIEW" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskDescription?: string;
  mitigationPlan?: string;
  startDate: string | Date;
  expectedCompletionDate: string | Date;
  estimatedHours?: number;
  estimatedCost?: number;
  approvedBudget?: number;
  internalNotes?: string;
  attachments?: string;
  teamMembers?: { employeeId: string; role?: string; assignedHours?: number }[];
  inventoryItems?: { productId: string; warehouseId?: string; requiredQuantity: number; unitCost?: number }[];
  vendors?: { vendorId: string; purchaseOrderId?: string; role?: string; estimatedCost?: number }[];
}

export interface UpdateOperationInput {
  name?: string;
  description?: string;
  operationType?: string;
  departmentId?: string;
  ownerId?: string;
  clientId?: string;
  opportunityId?: string;
  projectName?: string;
  purchaseOrderId?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status?: "PLANNING" | "SCHEDULED" | "IN_PROGRESS" | "QUALITY_REVIEW" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskDescription?: string;
  mitigationPlan?: string;
  startDate?: string | Date;
  expectedCompletionDate?: string | Date;
  actualCompletionDate?: string | Date | null;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  estimatedCost?: number;
  approvedBudget?: number;
  actualCost?: number;
  internalNotes?: string;
  attachments?: string;
}

export interface OperationFilters {
  status?: string;
  priority?: string;
  riskLevel?: string;
  departmentId?: string;
  ownerId?: string;
  clientId?: string;
  search?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

export class OperationService {
  /**
   * Helper: Generate unique Operation Code e.g. OP-2026-0001
   */
  private static async generateOperationCode(orgId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.operation.count({
      where: { organizationId: orgId },
    });
    const seq = (count + 1).toString().padStart(4, "0");
    return `OP-${year}-${seq}`;
  }

  /**
   * List operations with multi-filtering, sorting, and pagination
   */
  static async list(
    user: AuthenticatedUser,
    filters: OperationFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.clientId) where.clientId = filters.clientId;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { operationCode: { contains: filters.search } },
        { projectName: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) where.startDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.startDate.lte = new Date(filters.endDate);
    }

    const [total, items] = await Promise.all([
      db.operation.count({ where }),
      db.operation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          department: { select: { id: true, name: true, code: true } },
          owner: { select: { id: true, firstName: true, lastName: true, designation: true, email: true, avatarUrl: true } },
          client: { select: { id: true, name: true, code: true } },
          _count: {
            select: {
              tasks: true,
              issues: true,
              teamMembers: true,
              inventoryItems: true,
              vendors: true,
              documents: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single operation 360 workspace with all associated entities
   */
  static async getById(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const operation = await db.operation.findFirst({
      where: { id, organizationId: orgId },
      include: {
        department: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            email: true,
            phone: true,
            avatarUrl: true,
            userId: true,
          },
        },
        client: true,
        opportunity: true,
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            total: true,
            status: true,
            vendor: { select: { id: true, displayName: true } },
          },
        },
        teamMembers: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                designation: true,
                email: true,
                avatarUrl: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
        },
        inventoryItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unitOfMeasure: true,
                sellingPrice: true,
                costPrice: true,
                inventoryItems: {
                  select: {
                    warehouseId: true,
                    quantity: true,
                    reservedQuantity: true,
                  },
                },
              },
            },
            warehouse: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        vendors: {
          include: {
            vendor: {
              select: {
                id: true,
                vendorCode: true,
                displayName: true,
                primaryContactName: true,
                email: true,
                phone: true,
              },
            },
            purchaseOrder: {
              select: {
                id: true,
                poNumber: true,
                total: true,
                status: true,
                expectedDeliveryDate: true,
              },
            },
          },
        },
        tasks: {
          orderBy: { createdAt: "asc" },
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                designation: true,
                avatarUrl: true,
              },
            },
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            dependsOn: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        issues: {
          orderBy: { createdAt: "desc" },
          include: {
            reportedBy: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
            assignedTo: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
            comments: {
              orderBy: { createdAt: "asc" },
              include: {
                author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
        },
        milestones: {
          orderBy: { order: "asc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          include: {
            uploadedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        activities: {
          take: 50,
          orderBy: { createdAt: "desc" },
          include: {
            performedBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
        approvals: {
          orderBy: { createdAt: "desc" },
          include: {
            requestedBy: { select: { id: true, firstName: true, lastName: true } },
            approver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            paidAmount: true,
            status: true,
            invoiceDate: true,
            dueDate: true,
          },
        },
        expenses: {
          select: {
            id: true,
            expenseNumber: true,
            category: true,
            amount: true,
            status: true,
            date: true,
            description: true,
          },
        },
      },
    });

    if (!operation) throw new Error("Operation not found");
    return operation;
  }

  /**
   * Create a new operation with related team, inventory, vendors, and initial activity
   */
  static async create(user: AuthenticatedUser, data: CreateOperationInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const operationCode = await this.generateOperationCode(orgId);

    const operation = await db.operation.create({
      data: {
        organizationId: orgId,
        operationCode,
        name: data.name,
        description: data.description || null,
        operationType: data.operationType || "CLIENT_DELIVERY",
        departmentId: data.departmentId,
        ownerId: data.ownerId,
        clientId: data.clientId || null,
        opportunityId: data.opportunityId || null,
        projectName: data.projectName || null,
        purchaseOrderId: data.purchaseOrderId || null,
        priority: data.priority || "MEDIUM",
        status: data.status || "PLANNING",
        riskLevel: data.riskLevel || "LOW",
        riskDescription: data.riskDescription || null,
        mitigationPlan: data.mitigationPlan || null,
        startDate: new Date(data.startDate),
        expectedCompletionDate: new Date(data.expectedCompletionDate),
        estimatedHours: data.estimatedHours || 0,
        estimatedCost: data.estimatedCost || 0,
        approvedBudget: data.approvedBudget || 0,
        internalNotes: data.internalNotes || null,
        attachments: data.attachments || null,
        teamMembers: data.teamMembers && data.teamMembers.length > 0
          ? {
              create: data.teamMembers.map((m) => ({
                employeeId: m.employeeId,
                role: m.role || "MEMBER",
                assignedHours: m.assignedHours || 0,
              })),
            }
          : undefined,
        inventoryItems: data.inventoryItems && data.inventoryItems.length > 0
          ? {
              create: data.inventoryItems.map((item) => ({
                productId: item.productId,
                warehouseId: item.warehouseId || null,
                requiredQuantity: item.requiredQuantity,
                unitCost: item.unitCost || 0,
              })),
            }
          : undefined,
        vendors: data.vendors && data.vendors.length > 0
          ? {
              create: data.vendors.map((v) => ({
                vendorId: v.vendorId,
                purchaseOrderId: v.purchaseOrderId || null,
                role: v.role || "SUPPLIER",
                estimatedCost: v.estimatedCost || 0,
              })),
            }
          : undefined,
      },
      include: {
        department: true,
        owner: true,
        client: true,
      },
    });

    // Record creation activity
    await db.operationActivity.create({
      data: {
        operationId: operation.id,
        type: "CREATED",
        description: `Operation ${operation.operationCode} ("${operation.name}") initialized by ${user.employee.firstName} ${user.employee.lastName}`,
        performedById: user.employee.id,
      },
    });

    // Audit log
    await AuditService.logMutation({
      actorId: user.id,
      action: "OPERATION_CREATED",
      entity: "Operation",
      entityId: operation.id,
      newValue: { code: operation.operationCode, name: operation.name },
      metadata: { departmentId: operation.departmentId, ownerId: operation.ownerId },
    });

    // Notify owner if created by another user
    if (operation.owner.userId && operation.owner.userId !== user.id) {
      await EventBusService.publish({
        type: "OPERATION_ASSIGNED",
        organizationId: orgId,
        actorId: user.id,
        targetUserIds: [operation.owner.userId],
        title: `Operation Assigned: ${operation.name}`,
        message: `You have been assigned as owner of operation ${operation.operationCode}`,
        priority: operation.priority === "CRITICAL" ? "URGENT" : "NORMAL",
        actionUrl: `/app/operations/${operation.id}`,
        metadata: { operationId: operation.id },
      });
    }

    return operation;
  }

  /**
   * Update operation attributes
   */
  static async update(user: AuthenticatedUser, id: string, data: UpdateOperationInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.operation.findFirst({
      where: { id, organizationId: orgId },
      include: { owner: true },
    });
    if (!existing) throw new Error("Operation not found");

    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.operationType !== undefined) updatePayload.operationType = data.operationType;
    if (data.departmentId !== undefined) updatePayload.departmentId = data.departmentId;
    if (data.ownerId !== undefined) updatePayload.ownerId = data.ownerId;
    if (data.clientId !== undefined) updatePayload.clientId = data.clientId;
    if (data.opportunityId !== undefined) updatePayload.opportunityId = data.opportunityId;
    if (data.projectName !== undefined) updatePayload.projectName = data.projectName;
    if (data.purchaseOrderId !== undefined) updatePayload.purchaseOrderId = data.purchaseOrderId;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.riskLevel !== undefined) updatePayload.riskLevel = data.riskLevel;
    if (data.riskDescription !== undefined) updatePayload.riskDescription = data.riskDescription;
    if (data.mitigationPlan !== undefined) updatePayload.mitigationPlan = data.mitigationPlan;
    if (data.startDate !== undefined) updatePayload.startDate = new Date(data.startDate);
    if (data.expectedCompletionDate !== undefined) updatePayload.expectedCompletionDate = new Date(data.expectedCompletionDate);
    if (data.actualCompletionDate !== undefined) updatePayload.actualCompletionDate = data.actualCompletionDate ? new Date(data.actualCompletionDate) : null;
    if (data.estimatedHours !== undefined) updatePayload.estimatedHours = data.estimatedHours;
    if (data.actualHours !== undefined) updatePayload.actualHours = data.actualHours;
    if (data.progress !== undefined) updatePayload.progress = data.progress;
    if (data.estimatedCost !== undefined) updatePayload.estimatedCost = data.estimatedCost;
    if (data.approvedBudget !== undefined) updatePayload.approvedBudget = data.approvedBudget;
    if (data.actualCost !== undefined) updatePayload.actualCost = data.actualCost;
    if (data.internalNotes !== undefined) updatePayload.internalNotes = data.internalNotes;
    if (data.attachments !== undefined) updatePayload.attachments = data.attachments;

    const updated = await db.operation.update({
      where: { id },
      data: updatePayload,
      include: { owner: true, department: true },
    });

    // Log activity if owner changed
    if (data.ownerId && data.ownerId !== existing.ownerId) {
      await db.operationActivity.create({
        data: {
          operationId: id,
          type: "OWNER_ASSIGNED",
          description: `Operation ownership transferred to ${updated.owner.firstName} ${updated.owner.lastName}`,
          performedById: user.employee.id,
        },
      });

      if (updated.owner.userId && updated.owner.userId !== user.id) {
        await EventBusService.publish({
          type: "OPERATION_ASSIGNED",
          organizationId: orgId,
          actorId: user.id,
          targetUserIds: [updated.owner.userId],
          title: `Operation Assigned: ${updated.name}`,
          message: `You are now the owner of operation ${updated.operationCode}`,
          priority: "NORMAL",
          actionUrl: `/app/operations/${id}`,
        });
      }
    }

    await AuditService.logMutation({
      actorId: user.id,
      action: "OPERATION_UPDATED",
      entity: "Operation",
      entityId: id,
      previousValue: { name: existing.name, priority: existing.priority },
      newValue: { name: updated.name, priority: updated.priority },
    });

    return updated;
  }

  /**
   * Safe delete or archive operation
   */
  static async delete(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const operation = await db.operation.findFirst({
      where: { id, organizationId: orgId },
      include: {
        invoices: { select: { id: true } },
        expenses: { select: { id: true } },
      },
    });
    if (!operation) throw new Error("Operation not found");

    if (operation.invoices.length > 0 || operation.expenses.length > 0) {
      throw new Error("Cannot delete operation with attached financial records. Change status to CANCELLED instead.");
    }

    await db.operation.delete({ where: { id } });

    await AuditService.logMutation({
      actorId: user.id,
      action: "OPERATION_DELETED",
      entity: "Operation",
      entityId: id,
      previousValue: { code: operation.operationCode, name: operation.name },
    });

    return { success: true };
  }

  /**
   * Pre-completion health checks
   */
  static async checkCompletionReadiness(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const operation = await db.operation.findFirst({
      where: { id, organizationId: orgId },
      include: {
        tasks: { where: { status: { not: "COMPLETED" } } },
        issues: { where: { status: { notIn: ["RESOLVED", "CLOSED"] } } },
        approvals: { where: { status: "PENDING" } },
        inventoryItems: true,
      },
    });

    if (!operation) throw new Error("Operation not found");

    const warnings: string[] = [];
    const criticalBlockers: string[] = [];

    // Critical/High Tasks check
    const pendingCriticalTasks = operation.tasks.filter((t) => t.priority === "URGENT" || t.priority === "HIGH");
    if (pendingCriticalTasks.length > 0) {
      warnings.push(`${pendingCriticalTasks.length} critical or high-priority task(s) remain incomplete.`);
    }
    if (operation.tasks.length > 0) {
      warnings.push(`Total of ${operation.tasks.length} task(s) are still active.`);
    }

    // Critical Issues check
    const criticalIssues = operation.issues.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH");
    if (criticalIssues.length > 0) {
      warnings.push(`${criticalIssues.length} unresolved critical or high-severity issue(s) reported.`);
    }

    // Pending Approvals check
    if (operation.approvals.length > 0) {
      warnings.push(`${operation.approvals.length} pending approval request(s) awaiting review.`);
    }

    // Inventory check
    const unconsumedInventory = operation.inventoryItems.filter((i) => i.usedQuantity < i.requiredQuantity);
    if (unconsumedInventory.length > 0) {
      warnings.push(`${unconsumedInventory.length} allocated inventory item(s) have unrecorded consumption.`);
    }

    return {
      isReady: warnings.length === 0,
      warnings,
      criticalBlockers,
    };
  }

  /**
   * Transition operation lifecycle state with safety checks
   */
  static async transitionStatus(
    user: AuthenticatedUser,
    id: string,
    newStatus: string,
    reason?: string
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const operation = await db.operation.findFirst({
      where: { id, organizationId: orgId },
      include: { owner: true },
    });
    if (!operation) throw new Error("Operation not found");

    const validStatuses = ["PLANNING", "SCHEDULED", "IN_PROGRESS", "QUALITY_REVIEW", "ON_HOLD", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const updateData: any = { status: newStatus };

    if (newStatus === "COMPLETED") {
      updateData.actualCompletionDate = new Date();
      updateData.progress = 100;
    } else if (newStatus === "IN_PROGRESS" && operation.progress === 0) {
      updateData.progress = 15;
    }

    const updated = await db.operation.update({
      where: { id },
      data: updateData,
    });

    // Record activity
    await db.operationActivity.create({
      data: {
        operationId: id,
        type: "STATUS_CHANGED",
        description: `Status transitioned from ${operation.status} to ${newStatus}${reason ? `: ${reason}` : ""}`,
        performedById: user.employee.id,
      },
    });

    // Notify owner on completion
    if (newStatus === "COMPLETED" && operation.owner.userId) {
      await EventBusService.publish({
        type: "OPERATION_COMPLETED",
        organizationId: orgId,
        actorId: user.id,
        targetUserIds: [operation.owner.userId],
        title: `Operation Completed: ${operation.operationCode}`,
        message: `Operation ${operation.name} was successfully marked as Completed.`,
        priority: "NORMAL",
        actionUrl: `/app/operations/${id}`,
      });
    }

    return updated;
  }

  /**
   * Operations Dashboard KPI and Health Overview
   */
  static async getDashboardMetrics(user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const now = new Date();

    const [
      allOps,
      criticalIssuesCount,
      todayTasksCount,
      openIssuesCount,
      recentOps,
    ] = await Promise.all([
      db.operation.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          status: true,
          priority: true,
          expectedCompletionDate: true,
          actualCompletionDate: true,
          estimatedHours: true,
          actualHours: true,
          progress: true,
        },
      }),
      db.operationIssue.count({
        where: {
          organizationId: orgId,
          severity: "CRITICAL",
          status: { notIn: ["RESOLVED", "CLOSED"] },
        },
      }),
      db.task.count({
        where: {
          organizationId: orgId,
          operationId: { not: null },
          dueDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
          },
          status: { not: "COMPLETED" },
        },
      }),
      db.operationIssue.count({
        where: {
          organizationId: orgId,
          status: { notIn: ["RESOLVED", "CLOSED"] },
        },
      }),
      db.operation.findMany({
        where: { organizationId: orgId },
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: {
          department: { select: { id: true, name: true, code: true } },
          owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          client: { select: { id: true, name: true } },
        },
      }),
    ]);

    const activeOps = allOps.filter((o) => ["PLANNING", "SCHEDULED", "IN_PROGRESS", "QUALITY_REVIEW"].includes(o.status));
    const pendingOps = allOps.filter((o) => ["PLANNING", "SCHEDULED"].includes(o.status));
    const inProgressOps = allOps.filter((o) => o.status === "IN_PROGRESS");
    const completedOps = allOps.filter((o) => o.status === "COMPLETED");
    const delayedOps = allOps.filter(
      (o) =>
        new Date(o.expectedCompletionDate) < now &&
        !["COMPLETED", "CANCELLED"].includes(o.status)
    );

    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = allOps.filter(
      (o) =>
        new Date(o.expectedCompletionDate) >= now &&
        new Date(o.expectedCompletionDate) <= in7Days &&
        !["COMPLETED", "CANCELLED"].includes(o.status)
    );

    // Operational Health Calculations
    const totalOpsCount = allOps.length;
    const overallCompletionRate = totalOpsCount > 0 ? Math.round((completedOps.length / totalOpsCount) * 100) : 0;

    const onTimeCompleted = completedOps.filter(
      (o) => o.actualCompletionDate && new Date(o.actualCompletionDate) <= new Date(o.expectedCompletionDate)
    ).length;
    const onTimeRate = completedOps.length > 0 ? Math.round((onTimeCompleted / completedOps.length) * 100) : 100;

    // Total workload & hours
    const totalEstHours = allOps.reduce((acc, curr) => acc + (curr.estimatedHours || 0), 0);
    const totalActHours = allOps.reduce((acc, curr) => acc + (curr.actualHours || 0), 0);
    const avgProgress = activeOps.length > 0
      ? Math.round(activeOps.reduce((acc, curr) => acc + curr.progress, 0) / activeOps.length)
      : 0;

    return {
      kpis: {
        activeOperations: activeOps.length,
        pendingOperations: pendingOps.length,
        inProgress: inProgressOps.length,
        completed: completedOps.length,
        delayed: delayedOps.length,
        criticalIssues: criticalIssuesCount,
        todayTasks: todayTasksCount,
        upcomingDeadlines: upcomingDeadlines.length,
      },
      health: {
        overallCompletionRate,
        onTimeRate,
        delayedCount: delayedOps.length,
        resourceUtilization: totalEstHours > 0 ? Math.min(100, Math.round((totalActHours / totalEstHours) * 100)) : 75,
        currentWorkload: activeOps.length,
        openIssues: openIssuesCount,
        averageProgress: avgProgress,
      },
      recentOperations: recentOps,
    };
  }

  /**
   * Team Member Assignment
   */
  static async assignTeamMember(
    user: AuthenticatedUser,
    operationId: string,
    data: { employeeId: string; role?: string; assignedHours?: number; notes?: string }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const operation = await db.operation.findFirst({
      where: { id: operationId, organizationId: orgId },
    });
    if (!operation) throw new Error("Operation not found");

    const emp = await db.employee.findFirst({
      where: { id: data.employeeId, organizationId: orgId },
    });
    if (!emp) throw new Error("Employee not found in organization");

    const member = await db.operationEmployee.upsert({
      where: {
        operationId_employeeId: {
          operationId,
          employeeId: data.employeeId,
        },
      },
      update: {
        role: data.role || "MEMBER",
        assignedHours: data.assignedHours || 0,
        notes: data.notes || null,
      },
      create: {
        operationId,
        employeeId: data.employeeId,
        role: data.role || "MEMBER",
        assignedHours: data.assignedHours || 0,
        notes: data.notes || null,
      },
      include: { employee: true },
    });

    await db.operationActivity.create({
      data: {
        operationId,
        type: "OWNER_ASSIGNED",
        description: `${emp.firstName} ${emp.lastName} assigned to operation as ${member.role}`,
        performedById: user.employee.id,
      },
    });

    return member;
  }

  /**
   * Remove Team Member
   */
  static async removeTeamMember(user: AuthenticatedUser, operationId: string, employeeId: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.operationEmployee.findUnique({
      where: {
        operationId_employeeId: { operationId, employeeId },
      },
      include: { employee: true, operation: true },
    });
    if (!existing || existing.operation.organizationId !== orgId) {
      throw new Error("Team member assignment not found");
    }

    await db.operationEmployee.delete({
      where: { operationId_employeeId: { operationId, employeeId } },
    });

    await db.operationActivity.create({
      data: {
        operationId,
        type: "OWNER_ASSIGNED",
        description: `${existing.employee.firstName} ${existing.employee.lastName} removed from operation roster`,
        performedById: user.employee.id,
      },
    });

    return { success: true };
  }

  /**
   * Required Inventory Management
   */
  static async addInventoryItem(
    user: AuthenticatedUser,
    operationId: string,
    data: { productId: string; warehouseId?: string; requiredQuantity: number; unitCost?: number; notes?: string }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const operation = await db.operation.findFirst({
      where: { id: operationId, organizationId: orgId },
    });
    if (!operation) throw new Error("Operation not found");

    const product = await db.product.findFirst({
      where: { id: data.productId, organizationId: orgId },
    });
    if (!product) throw new Error("Product not found");

    const item = await db.operationInventory.create({
      data: {
        operationId,
        productId: data.productId,
        warehouseId: data.warehouseId || null,
        requiredQuantity: data.requiredQuantity,
        unitCost: data.unitCost || product.costPrice || 0,
        notes: data.notes || null,
        status: "PLANNED",
      },
      include: { product: true, warehouse: true },
    });

    await db.operationActivity.create({
      data: {
        operationId,
        type: "INVENTORY_ALLOCATED",
        description: `Required inventory planned: ${data.requiredQuantity}x ${product.name}`,
        performedById: user.employee.id,
      },
    });

    return item;
  }

  static async updateInventoryUsage(
    user: AuthenticatedUser,
    operationId: string,
    itemId: string,
    data: { allocatedQuantity?: number; usedQuantity?: number; status?: string }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const item = await db.operationInventory.findFirst({
      where: { id: itemId, operationId, operation: { organizationId: orgId } },
      include: { product: true },
    });
    if (!item) throw new Error("Inventory allocation item not found");

    const updated = await db.operationInventory.update({
      where: { id: itemId },
      data: {
        allocatedQuantity: data.allocatedQuantity !== undefined ? data.allocatedQuantity : item.allocatedQuantity,
        usedQuantity: data.usedQuantity !== undefined ? data.usedQuantity : item.usedQuantity,
        status: data.status || (data.usedQuantity && data.usedQuantity >= item.requiredQuantity ? "CONSUMED" : item.status),
      },
    });

    await db.operationActivity.create({
      data: {
        operationId,
        type: "INVENTORY_ALLOCATED",
        description: `Inventory usage updated for ${item.product.name}: ${updated.usedQuantity}/${item.requiredQuantity} used`,
        performedById: user.employee.id,
      },
    });

    return updated;
  }

  static async removeInventoryItem(user: AuthenticatedUser, operationId: string, itemId: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const item = await db.operationInventory.findFirst({
      where: { id: itemId, operationId, operation: { organizationId: orgId } },
    });
    if (!item) throw new Error("Inventory allocation item not found");

    await db.operationInventory.delete({ where: { id: itemId } });
    return { success: true };
  }

  /**
   * Vendor & PO Linkage
   */
  static async linkVendor(
    user: AuthenticatedUser,
    operationId: string,
    data: { vendorId: string; purchaseOrderId?: string; role?: string; estimatedCost?: number; notes?: string }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const vendor = await db.vendor.findFirst({
      where: { id: data.vendorId, organizationId: orgId },
    });
    if (!vendor) throw new Error("Vendor not found");

    const record = await db.operationVendor.create({
      data: {
        operationId,
        vendorId: data.vendorId,
        purchaseOrderId: data.purchaseOrderId || null,
        role: data.role || "SUPPLIER",
        estimatedCost: data.estimatedCost || 0,
        notes: data.notes || null,
      },
      include: { vendor: true, purchaseOrder: true },
    });

    await db.operationActivity.create({
      data: {
        operationId,
        type: "VENDOR_ASSIGNED",
        description: `Vendor "${vendor.displayName}" associated as ${record.role}`,
        performedById: user.employee.id,
      },
    });

    return record;
  }

  static async unlinkVendor(user: AuthenticatedUser, operationId: string, vendorRecordId: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const vendorRecord = await db.operationVendor.findFirst({
      where: { id: vendorRecordId, operationId, operation: { organizationId: orgId } },
    });
    if (!vendorRecord) throw new Error("Vendor linkage not found");

    await db.operationVendor.delete({ where: { id: vendorRecordId } });
    return { success: true };
  }

  /**
   * Resource Utilization Matrix
   */
  static async getResourceUtilization(user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const employees = await db.employee.findMany({
      where: { organizationId: orgId, employmentStatus: "ACTIVE" },
      include: {
        department: { select: { id: true, name: true, code: true } },
        operationAssignments: {
          include: {
            operation: {
              select: {
                id: true,
                operationCode: true,
                name: true,
                status: true,
              },
            },
          },
        },
        assignedTasks: {
          where: { status: { not: "COMPLETED" } },
          select: {
            id: true,
            title: true,
            status: true,
            estimatedHours: true,
            actualHours: true,
            operationId: true,
          },
        },
      },
      orderBy: { firstName: "asc" },
    });

    const employeeUtilization = employees.map((emp) => {
      const activeOps = emp.operationAssignments.filter((a) =>
        ["PLANNING", "SCHEDULED", "IN_PROGRESS", "QUALITY_REVIEW"].includes(a.operation.status)
      );
      const estHours = emp.assignedTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
      const actHours = emp.assignedTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);

      // Baseline monthly capacity = 160 hours
      const capacity = 160;
      const utilizationRate = Math.min(100, Math.round((estHours / capacity) * 100));

      let availability: "AVAILABLE" | "OPTIMAL" | "OVERALLOCATED" = "AVAILABLE";
      if (utilizationRate >= 90) availability = "OVERALLOCATED";
      else if (utilizationRate >= 50) availability = "OPTIMAL";

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        avatarUrl: emp.avatarUrl,
        designation: emp.designation,
        department: emp.department?.name || "General",
        activeOperationsCount: activeOps.length,
        assignedTasksCount: emp.assignedTasks.length,
        estimatedHours: estHours,
        actualHours: actHours,
        utilizationRate,
        availability,
      };
    });

    // Inventory Utilization
    const inventorySummary = await db.operationInventory.groupBy({
      by: ["status"],
      where: { operation: { organizationId: orgId } },
      _count: { id: true },
      _sum: { requiredQuantity: true, allocatedQuantity: true, usedQuantity: true },
    });

    // Vendor Utilization
    const vendorSummary = await db.operationVendor.groupBy({
      by: ["status"],
      where: { operation: { organizationId: orgId } },
      _count: { id: true },
      _sum: { estimatedCost: true, actualCost: true },
    });

    return {
      employees: employeeUtilization,
      inventory: inventorySummary,
      vendors: vendorSummary,
    };
  }

  /**
   * Reports and Analytical Insights
   */
  static async getReportsData(user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const now = new Date();

    const operations = await db.operation.findMany({
      where: { organizationId: orgId },
      include: {
        department: { select: { name: true } },
        tasks: true,
        issues: true,
      },
    });

    const totalOps = operations.length;
    const completedOps = operations.filter((o) => o.status === "COMPLETED");
    const delayedOps = operations.filter((o) => new Date(o.expectedCompletionDate) < now && !["COMPLETED", "CANCELLED"].includes(o.status));
    const cancelledOps = operations.filter((o) => o.status === "CANCELLED");

    // Average duration
    let avgDurationDays = 0;
    if (completedOps.length > 0) {
      const totalDays = completedOps.reduce((acc, o) => {
        const start = new Date(o.startDate).getTime();
        const end = o.actualCompletionDate ? new Date(o.actualCompletionDate).getTime() : new Date(o.expectedCompletionDate).getTime();
        return acc + (end - start) / (1000 * 60 * 60 * 24);
      }, 0);
      avgDurationDays = Math.round(totalDays / completedOps.length);
    }

    // Financial Variance
    const totalEstimatedCost = operations.reduce((acc, o) => acc + o.estimatedCost, 0);
    const totalApprovedBudget = operations.reduce((acc, o) => acc + o.approvedBudget, 0);
    const totalActualCost = operations.reduce((acc, o) => acc + o.actualCost, 0);
    const variance = totalApprovedBudget - totalActualCost;

    // Issue Analysis by Department
    const departmentIssues: Record<string, { open: number; resolved: number }> = {};
    for (const op of operations) {
      const deptName = op.department.name;
      if (!departmentIssues[deptName]) departmentIssues[deptName] = { open: 0, resolved: 0 };
      for (const issue of op.issues) {
        if (["RESOLVED", "CLOSED"].includes(issue.status)) {
          departmentIssues[deptName].resolved++;
        } else {
          departmentIssues[deptName].open++;
        }
      }
    }

    return {
      performance: {
        total: totalOps,
        completed: completedOps.length,
        delayed: delayedOps.length,
        cancelled: cancelledOps.length,
        averageCompletionDays: avgDurationDays,
      },
      financials: {
        estimatedCost: totalEstimatedCost,
        budget: totalApprovedBudget,
        actualCost: totalActualCost,
        variance,
      },
      departmentIssues,
    };
  }

  /**
   * Gantt Chart and Timeline Data Stream
   */
  static async getGanttData(user: AuthenticatedUser, filters: { departmentId?: string; status?: string } = {}) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const now = new Date();

    const where: any = { organizationId: orgId };
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.status) where.status = filters.status;

    const operations = await db.operation.findMany({
      where,
      orderBy: { startDate: "asc" },
      include: {
        department: { select: { name: true, code: true } },
        owner: { select: { firstName: true, lastName: true } },
        tasks: {
          orderBy: { startDate: "asc" },
          include: {
            assignee: { select: { firstName: true, lastName: true } },
            dependsOn: { select: { id: true, title: true } },
          },
        },
        milestones: {
          orderBy: { dueDate: "asc" },
        },
      },
    });

    return operations.map((op) => {
      const isDelayed = new Date(op.expectedCompletionDate) < now && !["COMPLETED", "CANCELLED"].includes(op.status);

      return {
        id: op.id,
        code: op.operationCode,
        name: op.name,
        type: "operation",
        status: op.status,
        priority: op.priority,
        progress: op.progress,
        startDate: op.startDate.toISOString(),
        endDate: op.expectedCompletionDate.toISOString(),
        actualEndDate: op.actualCompletionDate ? op.actualCompletionDate.toISOString() : null,
        isDelayed,
        department: op.department.name,
        owner: `${op.owner.firstName} ${op.owner.lastName}`,
        tasks: op.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          progress: t.completionRate || (t.status === "COMPLETED" ? 100 : 0),
          startDate: t.startDate ? t.startDate.toISOString() : op.startDate.toISOString(),
          endDate: t.dueDate ? t.dueDate.toISOString() : op.expectedCompletionDate.toISOString(),
          dependencyId: t.dependencyId,
          dependsOnTitle: t.dependsOn?.title || null,
          assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : "Unassigned",
        })),
        milestones: op.milestones.map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          date: m.dueDate.toISOString(),
        })),
      };
    });
  }

  /**
   * Unified Operations Search
   */
  static async search(user: AuthenticatedUser, query: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const q = query.trim();
    if (!q) return { operations: [], tasks: [], issues: [] };

    const [operations, tasks, issues] = await Promise.all([
      db.operation.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { name: { contains: q } },
            { operationCode: { contains: q } },
            { projectName: { contains: q } },
            { client: { name: { contains: q } } },
            { owner: { firstName: { contains: q } } },
            { owner: { lastName: { contains: q } } },
          ],
        },
        take: 10,
        include: {
          department: { select: { name: true } },
          owner: { select: { firstName: true, lastName: true } },
        },
      }),
      db.task.findMany({
        where: {
          organizationId: orgId,
          operationId: { not: null },
          title: { contains: q },
        },
        take: 10,
        include: {
          operation: { select: { id: true, operationCode: true, name: true } },
        },
      }),
      db.operationIssue.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { title: { contains: q } },
            { issueCode: { contains: q } },
            { description: { contains: q } },
          ],
        },
        take: 10,
        include: {
          operation: { select: { id: true, operationCode: true, name: true } },
        },
      }),
    ]);

    return { operations, tasks, issues };
  }
}
