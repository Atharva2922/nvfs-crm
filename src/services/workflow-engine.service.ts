import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { EventBusService } from "./event-bus.service";
import { AuditService } from "./audit.service";
import { EscalationEngineService } from "./escalation-engine.service";

export interface WorkflowCondition {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "greater_than_or_equal"
    | "less_than_or_equal"
    | "contains"
    | "starts_with"
    | "status_is"
    | "date_before"
    | "date_after";
  value: any;
  logicalOperator?: "AND" | "OR";
}

export interface WorkflowAction {
  type:
    | "CREATE_TASK"
    | "SEND_NOTIFICATION"
    | "CREATE_ALERT"
    | "CREATE_APPROVAL_REQUEST"
    | "ASSIGN_USER"
    | "ASSIGN_DEPARTMENT"
    | "CHANGE_STATUS"
    | "ADD_ACTIVITY"
    | "ESCALATE";
  targetRole?: string;
  target?: string;
  payload: Record<string, any>;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL" | "SKIPPED";
  actionsExecuted: Array<{ action: string; success: boolean; details?: any; error?: string }>;
  durationMs: number;
  error?: string;
}

export class WorkflowEngineService {
  /**
   * Helper: Replace template tokens like {{clientName}}, {{invoiceNumber}}, {{balance}} with real entity data
   */
  static interpolate(template: string, data: Record<string, any>): string {
    if (!template) return "";
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      const val = data[key];
      if (val === undefined || val === null) return "";
      if (val instanceof Date) return val.toLocaleDateString();
      return String(val);
    });
  }

  /**
   * Evaluates an individual condition rule against an entity record
   */
  static evaluateRule(record: Record<string, any>, condition: WorkflowCondition): boolean {
    const recordVal = record[condition.field];
    const targetVal = condition.value;

    switch (condition.operator) {
      case "equals":
        return String(recordVal).toLowerCase() === String(targetVal).toLowerCase();
      case "not_equals":
        return String(recordVal).toLowerCase() !== String(targetVal).toLowerCase();
      case "status_is":
        return String(recordVal).toUpperCase() === String(targetVal).toUpperCase();
      case "greater_than":
        return Number(recordVal) > Number(targetVal);
      case "less_than":
        return Number(recordVal) < Number(targetVal);
      case "greater_than_or_equal":
        return Number(recordVal) >= Number(targetVal);
      case "less_than_or_equal":
        return Number(recordVal) <= Number(targetVal);
      case "contains":
        return String(recordVal || "").toLowerCase().includes(String(targetVal || "").toLowerCase());
      case "starts_with":
        return String(recordVal || "").toLowerCase().startsWith(String(targetVal || "").toLowerCase());
      case "date_before":
        return recordVal ? new Date(recordVal) < new Date(targetVal) : false;
      case "date_after":
        return recordVal ? new Date(recordVal) > new Date(targetVal) : false;
      default:
        return true;
    }
  }

  /**
   * Evaluates all conditions of a workflow against entity data
   */
  static evaluateConditions(record: Record<string, any>, conditions: WorkflowCondition[]): boolean {
    if (!conditions || conditions.length === 0) return true;

    // Evaluate AND-based logic by default
    for (const cond of conditions) {
      const passes = this.evaluateRule(record, cond);
      if (!passes) return false;
    }
    return true;
  }

  /**
   * Dispatches a single action in the workflow sequence
   */
  static async executeAction(
    action: WorkflowAction,
    record: Record<string, any>,
    organizationId: string,
    workflowName: string
  ): Promise<{ success: boolean; details?: any; error?: string }> {
    try {
      switch (action.type) {
        case "SEND_NOTIFICATION": {
          let targetUserIds: string[] = [];

          if (action.targetRole) {
            const users = await db.user.findMany({
              where: {
                isActive: true,
                role: { code: action.targetRole as any },
                employee: { organizationId },
              },
              select: { id: true },
            });
            targetUserIds = users.map((u) => u.id);
          } else if (action.target) {
            targetUserIds = [action.target];
          } else if (record.ownerId || record.assigneeId || record.createdById) {
            // Find user from employee owner
            const empId = record.ownerId || record.assigneeId || record.createdById;
            const emp = await db.employee.findUnique({
              where: { id: empId },
              select: { userId: true },
            });
            if (emp?.userId) targetUserIds = [emp.userId];
          }

          if (targetUserIds.length === 0) {
            // Fallback: Notify Admins / Executive
            const admins = await db.user.findMany({
              where: {
                isActive: true,
                role: { code: { in: ["SUPER_ADMIN", "ADMIN", "CEO"] } },
                employee: { organizationId },
              },
              select: { id: true },
              take: 2,
            });
            targetUserIds = admins.map((u) => u.id);
          }

          const title = this.interpolate(action.payload.title || `Workflow: ${workflowName}`, record);
          const message = this.interpolate(action.payload.message || `Automated alert triggered by ${workflowName}`, record);
          const actionUrl = this.interpolate(action.payload.actionUrl || "/app/overview", record);

          await EventBusService.publish({
            type: "SYSTEM",
            organizationId,
            targetUserIds,
            title,
            message,
            priority: action.priority || "NORMAL",
            actionUrl,
            dedupeKey: `WF_NOTIFY:${workflowName}:${record.id || Date.now()}:${new Date().toISOString().slice(0, 10)}`,
            metadata: { workflow: workflowName, entityId: record.id },
            auditAction: "WORKFLOW_NOTIFICATION_SENT",
          });

          return { success: true, details: { recipients: targetUserIds.length, title } };
        }

        case "CREATE_TASK": {
          // Resolve creator employee (system or first admin)
          const systemEmp = await db.employee.findFirst({
            where: { organizationId, employmentStatus: "ACTIVE" },
            select: { id: true, departmentId: true },
          });

          if (!systemEmp) throw new Error("No active employee found to act as task creator");

          const title = this.interpolate(action.payload.title || `Task from ${workflowName}`, record);
          const description = this.interpolate(action.payload.description || `Generated automatically by ${workflowName}`, record);
          
          let assigneeId = action.target || record.ownerId || record.assigneeId || systemEmp.id;
          if (action.targetRole) {
            const roleEmp = await db.employee.findFirst({
              where: {
                organizationId,
                employmentStatus: "ACTIVE",
                user: { role: { code: action.targetRole as any } },
              },
              select: { id: true },
            });
            if (roleEmp) assigneeId = roleEmp.id;
          }

          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (action.payload.dueDays || 3));

          const task = await db.task.create({
            data: {
              organizationId,
              creatorId: systemEmp.id,
              assigneeId,
              title,
              description: `${description}\n\n[Performed by Workflow Automation: ${workflowName}]`,
              priority: action.payload.priority || action.priority || "MEDIUM",
              status: "TODO",
              dueDate,
              departmentId: record.departmentId || systemEmp.departmentId || null,
              operationId: record.operationId || (record.operationCode ? record.id : null),
              relatedClientId: record.clientId || null,
            },
          });

          return { success: true, details: { taskId: task.id, title: task.title } };
        }

        case "CREATE_ALERT": {
          const alertTitle = this.interpolate(action.payload.title || `Alert: ${workflowName}`, record);
          const alertDesc = this.interpolate(action.payload.description || "Critical automated condition detected", record);

          // Broadcast alert to organization leadership
          const execs = await db.user.findMany({
            where: {
              isActive: true,
              role: { code: { in: ["CEO", "CHAIRPERSON", "CTO", "CFO", "CMO", "SUPER_ADMIN"] } },
              employee: { organizationId },
            },
            select: { id: true },
          });

          await EventBusService.publish({
            type: "SYSTEM",
            organizationId,
            targetUserIds: execs.map((e) => e.id),
            title: `🚨 ${alertTitle}`,
            message: alertDesc,
            priority: "URGENT",
            actionUrl: action.payload.actionUrl || "/app/overview",
            dedupeKey: `WF_ALERT:${workflowName}:${record.id || ""}:${new Date().toISOString().slice(0, 10)}`,
            metadata: { severity: action.payload.severity || "CRITICAL", entityId: record.id },
          });

          return { success: true, details: { alertTitle } };
        }

        case "CREATE_APPROVAL_REQUEST": {
          const approverEmp = await db.employee.findFirst({
            where: { organizationId, employmentStatus: "ACTIVE" },
            select: { id: true },
          });
          if (!approverEmp) throw new Error("No active employee to author approval request");

          const approvalTitle = this.interpolate(action.payload.title || `Approval for ${workflowName}`, record);
          const approvalDesc = this.interpolate(action.payload.description || "Automatic approval requisition", record);

          const approval = await db.approvalRequest.create({
            data: {
              organizationId,
              entityType: action.payload.entityType || "OTHER",
              entityId: record.id || "GENERIC",
              title: approvalTitle,
              description: `${approvalDesc}\n[Generated by Workflow Automation]`,
              requestedById: approverEmp.id,
              status: "PENDING",
              metadata: JSON.stringify({
                workflowName,
                amount: record.amount || record.total,
                automated: true,
              }),
            },
          });

          return { success: true, details: { approvalId: approval.id, title: approval.title } };
        }

        case "ESCALATE": {
          const result = await EscalationEngineService.executeEscalation({
            organizationId,
            entityType: action.payload.entityType || "PROJECT",
            entityId: record.id || "ESCALATION",
            entityTitle: record.name || record.title || record.invoiceNumber || workflowName,
            currentAssigneeId: record.assigneeId || record.ownerId,
            departmentId: record.departmentId,
            hoursElapsed: action.payload.hoursElapsed || 24,
            actionUrl: action.payload.actionUrl || "/app/overview",
            reason: action.payload.reason || "Automated threshold reached",
          });

          return { success: result.escalated, details: result };
        }

        case "CHANGE_STATUS": {
          const targetStatus = action.payload.newStatus;
          const entityType = action.payload.entityType;

          if (entityType === "Lead" && record.id) {
            await db.lead.update({ where: { id: record.id }, data: { status: targetStatus } });
          } else if (entityType === "Task" && record.id) {
            await db.task.update({ where: { id: record.id }, data: { status: targetStatus } });
          } else if (entityType === "Operation" && record.id) {
            await db.operation.update({ where: { id: record.id }, data: { status: targetStatus } });
          }

          return { success: true, details: { entityType, newStatus: targetStatus } };
        }

        case "ADD_ACTIVITY": {
          if (record.id) {
            const emp = await db.employee.findFirst({
              where: { organizationId },
              select: { id: true },
            });
            if (emp) {
              await AuditService.logMutation({
                actorId: emp.id,
                action: "WORKFLOW_AUTOMATION_ACTIVITY",
                entity: action.payload.entityType || "Workflow",
                entityId: record.id,
                newValue: {
                  notes: this.interpolate(action.payload.notes || "Activity recorded by workflow", record),
                  workflow: workflowName,
                },
                metadata: { source: "Workflow Automation" },
              });
            }
          }
          return { success: true, details: { activityAdded: true } };
        }

        default:
          return { success: true, details: { skipped: `Unhandled action type: ${action.type}` } };
      }
    } catch (err: any) {
      console.error(`[Workflow Action Error - ${action.type}]:`, err);
      return { success: false, error: err.message || "Action failed during execution" };
    }
  }

  /**
   * Core execution pipeline:
   * 1. Evaluates conditions
   * 2. Checks deduplication key (idempotency)
   * 3. Dispatches actions
   * 4. Logs execution history
   * 5. Records audit activity
   */
  static async executeWorkflow(
    workflow: any,
    record: Record<string, any>,
    triggerEventName: string
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const conditions: WorkflowCondition[] = typeof workflow.conditions === "string"
      ? JSON.parse(workflow.conditions || "[]")
      : workflow.conditions || [];
    const actions: WorkflowAction[] = typeof workflow.actions === "string"
      ? JSON.parse(workflow.actions || "[]")
      : workflow.actions || [];

    // Step 1: Condition evaluation
    const passes = this.evaluateConditions(record, conditions);
    if (!passes) {
      return {
        executionId: "SKIPPED",
        workflowId: workflow.id,
        status: "SKIPPED",
        actionsExecuted: [],
        durationMs: Date.now() - startTime,
      };
    }

    // Step 2: Idempotency / Duplicate Prevention Check
    // Debounce window: Don't execute the same workflow on the same entity multiple times within 1 hour
    const entityId = record.id || null;
    if (entityId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentExecution = await db.workflowExecution.findFirst({
        where: {
          workflowId: workflow.id,
          entityId,
          executedAt: { gte: oneHourAgo },
          status: { in: ["SUCCESS", "PARTIAL"] },
        },
      });

      if (recentExecution) {
        return {
          executionId: recentExecution.id,
          workflowId: workflow.id,
          status: "SKIPPED",
          actionsExecuted: [{ action: "IDEMPOTENCY_DEBOUNCE", success: true, details: "Skipped to prevent duplicate execution within debounce window" }],
          durationMs: Date.now() - startTime,
        };
      }
    }

    // Step 3: Action Execution Sequence
    const actionResults: Array<{ action: string; success: boolean; details?: any; error?: string }> = [];
    let hasFailure = false;

    for (const action of actions) {
      const res = await this.executeAction(action, record, workflow.organizationId, workflow.name);
      actionResults.push({
        action: action.type,
        success: res.success,
        details: res.details,
        error: res.error,
      });
      if (!res.success) hasFailure = true;
    }

    const durationMs = Date.now() - startTime;
    const allSucceeded = actionResults.every((r) => r.success);
    const someSucceeded = actionResults.some((r) => r.success);
    const overallStatus: "SUCCESS" | "FAILED" | "PARTIAL" = allSucceeded
      ? "SUCCESS"
      : someSucceeded
      ? "PARTIAL"
      : "FAILED";

    // Step 4: Record Execution Log
    const execution = await db.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        organizationId: workflow.organizationId,
        triggerEvent: triggerEventName,
        entityType: workflow.module,
        entityId,
        status: overallStatus,
        actionsExecuted: JSON.stringify(actionResults),
        durationMs,
        metadata: JSON.stringify({
          recordSummary: record.name || record.title || record.invoiceNumber || record.id,
        }),
        error: hasFailure ? actionResults.find((r) => r.error)?.error || "Some actions failed" : null,
      },
    });

    // Step 5: Increment workflow metrics
    await db.workflow.update({
      where: { id: workflow.id },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });

    return {
      executionId: execution.id,
      workflowId: workflow.id,
      status: overallStatus,
      actionsExecuted: actionResults,
      durationMs,
      error: execution.error || undefined,
    };
  }

  /**
   * Dispatches an event to all matching active workflows in the organization
   */
  static async triggerMatchingWorkflows(
    organizationId: string,
    module: string,
    triggerType: string,
    record: Record<string, any>
  ): Promise<WorkflowExecutionResult[]> {
    const activeWorkflows = await db.workflow.findMany({
      where: {
        organizationId,
        module,
        triggerType,
        status: "ACTIVE",
      },
    });

    const results: WorkflowExecutionResult[] = [];
    for (const wf of activeWorkflows) {
      const res = await this.executeWorkflow(wf, record, triggerType);
      results.push(res);
    }
    return results;
  }

  /**
   * Manual run on-demand for testing a workflow
   */
  static async runWorkflowManual(workflowId: string, user: AuthenticatedUser, sampleData?: Record<string, any>) {
    const orgId = user.employee?.organizationId;
    if (!orgId) throw new Error("Unauthorized");

    const workflow = await db.workflow.findFirst({
      where: { id: workflowId, organizationId: orgId },
    });

    if (!workflow) throw new Error("Workflow not found in organization");

    // Synthesize sample record if not provided
    const record = sampleData || {
      id: "MANUAL_TEST_" + Date.now(),
      name: "Manual Test Entity",
      title: "Sample Workflow Execution Record",
      status: "ACTIVE",
      balance: 75000,
      amount: 120000,
      availableQuantity: 5,
      reorderLevel: 10,
      invoiceNumber: "INV-TEST-2026",
      companyName: "Acme Global Industries",
      clientName: "Acme Global Industries",
      contractTitle: "Enterprise SLA Master Agreement",
      contractNumber: "AGR-2026-TEST",
      operationCode: "OP-TEST-001",
      total: 85000,
      daysOverdue: 5,
    };

    return this.executeWorkflow(workflow, record, "MANUAL_TRIGGER");
  }

  /**
   * Management: List Workflows
   */
  static async listWorkflows(user: AuthenticatedUser, filters: { module?: string; status?: string; search?: string } = {}) {
    const orgId = user.employee?.organizationId;
    if (!orgId) throw new Error("Unauthorized");

    const where: any = { organizationId: orgId };
    if (filters.module && filters.module !== "ALL") where.module = filters.module;
    if (filters.status && filters.status !== "ALL") where.status = filters.status;
    if (filters.search && filters.search.trim()) {
      where.OR = [
        { name: { contains: filters.search.trim(), mode: "insensitive" } },
        { description: { contains: filters.search.trim(), mode: "insensitive" } },
        { code: { contains: filters.search.trim(), mode: "insensitive" } },
      ];
    }

    const [workflows, total, activeCount, pausedCount] = await Promise.all([
      db.workflow.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
          _count: { select: { executions: true } },
        },
      }),
      db.workflow.count({ where: { organizationId: orgId } }),
      db.workflow.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
      db.workflow.count({ where: { organizationId: orgId, status: "PAUSED" } }),
    ]);

    return {
      workflows,
      metrics: {
        total,
        active: activeCount,
        paused: pausedCount,
        draft: total - activeCount - pausedCount,
      },
    };
  }

  /**
   * Management: Create Workflow
   */
  static async createWorkflow(user: AuthenticatedUser, data: any) {
    const orgId = user.employee?.organizationId;
    if (!orgId) throw new Error("Unauthorized");

    const count = await db.workflow.count({ where: { organizationId: orgId } });
    const code = `WF-${String(count + 1).padStart(4, "0")}`;

    const workflow = await db.workflow.create({
      data: {
        organizationId: orgId,
        code,
        name: data.name,
        description: data.description || null,
        module: data.module,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig ? JSON.stringify(data.triggerConfig) : null,
        conditions: JSON.stringify(data.conditions || []),
        actions: JSON.stringify(data.actions || []),
        priority: data.priority || "MEDIUM",
        status: data.status || "ACTIVE",
        createdById: user.employee?.id || null,
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "WORKFLOW_CREATED",
      entity: "Workflow",
      entityId: workflow.id,
      newValue: { name: workflow.name, code: workflow.code, module: workflow.module },
      metadata: { source: "Workflow Automation Panel" },
    });

    return workflow;
  }

  /**
   * Management: Update Workflow
   */
  static async updateWorkflow(id: string, user: AuthenticatedUser, data: any) {
    const orgId = user.employee?.organizationId;
    if (!orgId) throw new Error("Unauthorized");

    const existing = await db.workflow.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Workflow not found");

    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.module !== undefined) updatePayload.module = data.module;
    if (data.triggerType !== undefined) updatePayload.triggerType = data.triggerType;
    if (data.triggerConfig !== undefined) updatePayload.triggerConfig = JSON.stringify(data.triggerConfig);
    if (data.conditions !== undefined) updatePayload.conditions = JSON.stringify(data.conditions);
    if (data.actions !== undefined) updatePayload.actions = JSON.stringify(data.actions);
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.status !== undefined) updatePayload.status = data.status;

    const updated = await db.workflow.update({
      where: { id },
      data: updatePayload,
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "WORKFLOW_UPDATED",
      entity: "Workflow",
      entityId: updated.id,
      newValue: updatePayload,
      metadata: { source: "Workflow Automation Panel" },
    });

    return updated;
  }

  /**
   * Management: Delete Workflow
   */
  static async deleteWorkflow(id: string, user: AuthenticatedUser) {
    const orgId = user.employee?.organizationId;
    if (!orgId) throw new Error("Unauthorized");

    const existing = await db.workflow.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Workflow not found");

    await db.workflow.delete({ where: { id } });

    await AuditService.logMutation({
      actorId: user.id,
      action: "WORKFLOW_DELETED",
      entity: "Workflow",
      entityId: id,
      newValue: { name: existing.name, code: existing.code },
      metadata: { source: "Workflow Automation Panel" },
    });

    return { success: true };
  }

  /**
   * Management: List Execution History Logs
   */
  static async getExecutions(
    user: AuthenticatedUser,
    filters: { workflowId?: string; status?: string; limit?: number; page?: number } = {}
  ) {
    const orgId = user.employee?.organizationId;
    if (!orgId) throw new Error("Unauthorized");

    const where: any = { organizationId: orgId };
    if (filters.workflowId) where.workflowId = filters.workflowId;
    if (filters.status && filters.status !== "ALL") where.status = filters.status;

    const limit = Math.min(filters.limit || 50, 100);
    const page = Math.max(filters.page || 1, 1);
    const skip = (page - 1) * limit;

    const [executions, total] = await Promise.all([
      db.workflowExecution.findMany({
        where,
        orderBy: { executedAt: "desc" },
        take: limit,
        skip,
        include: {
          workflow: { select: { id: true, name: true, code: true, module: true } },
        },
      }),
      db.workflowExecution.count({ where }),
    ]);

    return {
      executions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
