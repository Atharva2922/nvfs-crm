import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { enforceCompanyIsolation, TenantIsolationError } from "@/lib/scope-guard";

export type WorkflowType =
  | "LEAVE_REQUEST"
  | "MARKETING_BUDGET"
  | "TECH_PURCHASE"
  | "LARGE_FINANCIAL"
  | "SYSTEM_PERMISSION"
  | "STRATEGIC_PROJECT";

export interface ApprovalStepDef {
  stepIndex: number;
  roleRequired: string; // e.g. "MANAGER", "HR", "CMO", "CFO", "CEO", "ADMIN"
  name: string;
}

export interface ApprovalChainTemplate {
  type: WorkflowType;
  title: string;
  steps: ApprovalStepDef[];
}

export const WORKFLOW_TEMPLATES: Record<WorkflowType, ApprovalChainTemplate> = {
  LEAVE_REQUEST: {
    type: "LEAVE_REQUEST",
    title: "Employee Leave Request",
    steps: [
      { stepIndex: 1, roleRequired: "MANAGER", name: "Line Manager Review" },
      { stepIndex: 2, roleRequired: "HR", name: "Human Resources Final Grant" },
    ],
  },
  MARKETING_BUDGET: {
    type: "MARKETING_BUDGET",
    title: "Marketing Budget Allocation",
    steps: [
      { stepIndex: 1, roleRequired: "CMO", name: "Chief Marketing Officer Endorsement" },
      { stepIndex: 2, roleRequired: "CFO", name: "Chief Financial Officer Treasury Approval" },
    ],
  },
  TECH_PURCHASE: {
    type: "TECH_PURCHASE",
    title: "Technology Infrastructure Purchase",
    steps: [
      { stepIndex: 1, roleRequired: "CFO", name: "Financial Feasibility Check" },
      { stepIndex: 2, roleRequired: "CEO", name: "Chief Executive Officer Authorization" },
    ],
  },
  LARGE_FINANCIAL: {
    type: "LARGE_FINANCIAL",
    title: "Large Financial Disbursement (> $50,000)",
    steps: [
      { stepIndex: 1, roleRequired: "CEO", name: "Executive Chief Officer Ratification" },
    ],
  },
  SYSTEM_PERMISSION: {
    type: "SYSTEM_PERMISSION",
    title: "Elevated System Access & Role Assignment",
    steps: [
      { stepIndex: 1, roleRequired: "MANAGER", name: "Department Manager Attestation" },
      { stepIndex: 2, roleRequired: "ADMIN", name: "Company Administrator Security Provisioning" },
    ],
  },
  STRATEGIC_PROJECT: {
    type: "STRATEGIC_PROJECT",
    title: "Strategic Corporate Initiative Launch",
    steps: [
      { stepIndex: 1, roleRequired: "COO", name: "Chief Operating Officer Operational Scoping" },
      { stepIndex: 2, roleRequired: "CEO", name: "Chief Executive Officer Final Mandate" },
    ],
  },
};

export class ApprovalEngineService {
  /**
   * Initiates a new multi-step configurable approval workflow.
   */
  static async initiateWorkflow(
    user: AuthenticatedUser,
    data: {
      type: WorkflowType;
      title: string;
      description?: string;
      metadata?: Record<string, any>;
    }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const companyId = user.activeCompany?.id || user.employee.organizationId;

    const template = WORKFLOW_TEMPLATES[data.type];
    if (!template) throw new Error(`Unknown workflow type: ${data.type}`);

    const workflowPayload = {
      workflowType: data.type,
      currentStepIndex: 1,
      totalSteps: template.steps.length,
      currentRequiredRole: template.steps[0].roleRequired,
      stepsHistory: [],
      data: data.metadata || {},
    };

    const approval = await db.approvalRequest.create({
      data: {
        organizationId: companyId,
        entityType: data.type,
        entityId: `WF-${Date.now()}`,
        title: data.title,
        description: data.description || template.title,
        requestedById: user.employee.id,
        status: "PENDING",
        metadata: JSON.stringify(workflowPayload),
      },
      include: { requestedBy: true },
    });

    await AuditService.logMutation({
      actorId: user.id,
      organizationId: companyId,
      action: "APPROVAL_REQUESTED",
      entity: "ApprovalRequest",
      entityId: approval.id,
      newValue: {
        workflowType: data.type,
        title: data.title,
        initialRequiredRole: template.steps[0].roleRequired,
      },
    });

    return approval;
  }

  /**
   * Evaluates and applies an approval decision (APPROVE / REJECT) at the current workflow step.
   */
  static async decide(
    user: AuthenticatedUser,
    approvalId: string,
    decision: "APPROVED" | "REJECTED",
    comment?: string
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const companyId = user.activeCompany?.id || user.employee.organizationId;

    const existing = await db.approvalRequest.findUnique({
      where: { id: approvalId },
      include: { requestedBy: true },
    });

    if (!existing) throw new Error("Approval record not found");

    // Strict Tenant Isolation
    enforceCompanyIsolation(user, existing.organizationId);

    if (existing.status !== "PENDING") {
      throw new Error(`Workflow is already concluded with status: ${existing.status}`);
    }

    // Separation of duties: Requester cannot approve their own item (unless Super Admin)
    if (existing.requestedById === user.employee.id && user.roleCode !== "SUPER_ADMIN") {
      throw new Error("Separation of duties: You cannot approve your own request");
    }

    const payload = existing.metadata ? JSON.parse(existing.metadata) : {};
    const template = WORKFLOW_TEMPLATES[payload.workflowType as WorkflowType];

    // Verify current approver role authority
    const requiredRole = payload.currentRequiredRole;
    const hasRoleAuthority =
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === requiredRole ||
      (requiredRole === "MANAGER" && user.roleLevel >= 30) ||
      (requiredRole === "HR" && (user.roleCode === "HR" || user.roleCode === "ADMIN")) ||
      (requiredRole === "EXECUTIVE" && user.roleLevel >= 80);

    if (!hasRoleAuthority) {
      throw new Error(
        `Forbidden: Current workflow step requires [${requiredRole}] authorization. Your role: [${user.roleCode}].`
      );
    }

    // Record this step's decision in history
    const stepDecisionRecord = {
      stepIndex: payload.currentStepIndex,
      requiredRole: payload.currentRequiredRole,
      decidedById: user.employee.id,
      decidedByName: `${user.employee.firstName} ${user.employee.lastName}`,
      decision,
      comment: comment || null,
      decidedAt: new Date().toISOString(),
    };

    payload.stepsHistory = payload.stepsHistory || [];
    payload.stepsHistory.push(stepDecisionRecord);

    if (decision === "REJECTED") {
      // Rejection immediately terminates workflow
      const updated = await db.approvalRequest.update({
        where: { id: approvalId },
        data: {
          status: "REJECTED",
          approverId: user.employee.id,
          decisionDate: new Date(),
          comment: comment || null,
          metadata: JSON.stringify(payload),
        },
      });

      await AuditService.logMutation({
        actorId: user.id,
        organizationId: companyId,
        action: "APPROVAL_REJECTED",
        entity: "ApprovalRequest",
        entityId: approvalId,
        newValue: { step: payload.currentStepIndex, comment },
      });

      return updated;
    }

    // Decision is APPROVED: check if there's a next step
    const nextStepIndex = payload.currentStepIndex + 1;
    const nextStepDef = template?.steps.find((s) => s.stepIndex === nextStepIndex);

    if (nextStepDef) {
      // Advance to next approval step
      payload.currentStepIndex = nextStepIndex;
      payload.currentRequiredRole = nextStepDef.roleRequired;

      const updated = await db.approvalRequest.update({
        where: { id: approvalId },
        data: {
          metadata: JSON.stringify(payload),
          comment: `Step ${stepDecisionRecord.stepIndex} approved. Advancing to ${nextStepDef.name}.`,
        },
      });

      await AuditService.logMutation({
        actorId: user.id,
        organizationId: companyId,
        action: "APPROVAL_STEP_ADVANCED",
        entity: "ApprovalRequest",
        entityId: approvalId,
        newValue: { nextStep: nextStepIndex, nextRole: nextStepDef.roleRequired },
      });

      return updated;
    }

    // Final step completed: mark overall workflow APPROVED
    const updated = await db.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: "APPROVED",
        approverId: user.employee.id,
        decisionDate: new Date(),
        comment: comment || null,
        metadata: JSON.stringify(payload),
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      organizationId: companyId,
      action: "APPROVAL_GRANTED",
      entity: "ApprovalRequest",
      entityId: approvalId,
      newValue: { status: "APPROVED", totalSteps: payload.totalSteps },
    });

    return updated;
  }

  /**
   * Lists approvals for the active company tenant.
   */
  static async list(
    user: AuthenticatedUser,
    options: {
      status?: string;
      type?: string;
      mineOnly?: boolean;
    } = {}
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const companyId = user.activeCompany?.id || user.employee.organizationId;

    const where: any = {};
    if (user.roleCode !== "SUPER_ADMIN") {
      where.organizationId = companyId;
    } else if (companyId) {
      where.organizationId = companyId;
    }

    if (options.status) where.status = options.status;
    if (options.type) where.entityType = options.type;
    if (options.mineOnly) where.requestedById = user.employee.id;

    return db.approvalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            avatarUrl: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
    });
  }
}
