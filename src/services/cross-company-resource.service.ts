import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export interface PartnerEmployeeAvailability {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  designation: string;
  department: string;
  workMode: string;
  location: string;
  avatarUrl: string | null;
  isFree: boolean;
  busyReason: string | null;
  workload: {
    activeTasksCount: number;
    activeOpsCount: number;
    activeOnDutyCount: number;
    isBorrowed: boolean;
  };
}

export interface CrossCompanyBorrowRequestPayload {
  targetEmployeeId: string;
  title: string;
  description: string;
  durationDays: number;
  startDate?: string;
  endDate?: string;
  priority?: "NORMAL" | "HIGH" | "URGENT";
}

export class CrossCompanyResourceService {
  /**
   * Resolves the partner organization for the authenticated user's current company.
   */
  static async getPartnerCompany(user: AuthenticatedUser, explicitOrgId?: string) {
    const currentOrgId = explicitOrgId || user.activeCompany?.id || user.employee?.organizationId;
    if (!currentOrgId) return null;

    return db.organization.findFirst({
      where: {
        id: { not: currentOrgId },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        code: true,
        legalName: true,
        primaryColor: true,
        industry: true,
      },
    });
  }

  /**
   * Evaluates if an employee represents an executive, manager, or permanent architecture persona.
   * Only staff employees created by Admin or HR should be eligible to be borrowed.
   */
  static isExcludedExecutiveOrManager(emp: {
    email?: string | null;
    designation?: string | null;
    directReports?: { id: string }[];
    user?: { role?: { code: string; level: number } | null; email?: string | null } | null;
  }): boolean {
    const email = (emp.email || emp.user?.email || "").toLowerCase();
    // Exclude all core structural architecture personas (*.internal)
    if (email.endsWith(".internal")) return true;

    // Exclude anyone with direct reports (they are a manager/supervisor)
    if (emp.directReports && emp.directReports.length > 0) return true;

    // Exclude by role code and level (Managers, Department Heads, Executives, Admins)
    const roleCode = (emp.user?.role?.code || "").toUpperCase();
    const roleLevel = emp.user?.role?.level ?? 10;
    if (roleLevel >= 30 || (roleCode && roleCode !== "EMPLOYEE")) {
      return true;
    }

    // Exclude by designation keywords
    const des = (emp.designation || "").toLowerCase();
    if (
      des.includes("chief") ||
      des.includes("ceo") ||
      des.includes("cto") ||
      des.includes("cio") ||
      des.includes("cfo") ||
      des.includes("coo") ||
      des.includes("cmo") ||
      des.includes("administrator") ||
      des.includes("admin") ||
      des.includes("chairperson") ||
      des.includes("director") ||
      des.includes("human resources") ||
      des.includes("head") ||
      des.includes("vp") ||
      des.includes("vice president") ||
      des.includes("manager") ||
      des.includes("lead") ||
      des.includes("controller") ||
      des.includes("officer") ||
      des.includes("supervisor")
    ) {
      return true;
    }

    return false;
  }

  /**
   * Fetches employees from the partner company along with their real-time availability status.
   * Only employees who have 0 active tasks, 0 operations, 0 on-duty assignments,
   * and no active approved secondments are marked as isFree: true.
   */
  static async getPartnerEmployeesWithAvailability(
    user: AuthenticatedUser,
    explicitOrgId?: string
  ): Promise<{
    partnerCompany: { id: string; name: string; code: string; primaryColor: string | null } | null;
    employees: PartnerEmployeeAvailability[];
  }> {
    const partnerOrg = await this.getPartnerCompany(user, explicitOrgId);
    if (!partnerOrg) {
      return { partnerCompany: null, employees: [] };
    }

    // 1. Fetch active approved cross-company secondments to see who is currently borrowed
    const activeSecondments = await db.approvalRequest.findMany({
      where: {
        organizationId: partnerOrg.id,
        entityType: "CROSS_COMPANY_RESOURCE",
        status: "APPROVED",
      },
      select: { metadata: true },
    });

    const borrowedEmployeeIds = new Set<string>();
    const now = new Date();

    for (const sec of activeSecondments) {
      if (!sec.metadata) continue;
      try {
        const meta = JSON.parse(sec.metadata);
        if (meta.targetEmployeeId) {
          if (meta.endDate) {
            const end = new Date(meta.endDate);
            if (end >= now) {
              borrowedEmployeeIds.add(meta.targetEmployeeId);
            }
          } else {
            borrowedEmployeeIds.add(meta.targetEmployeeId);
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    const employees = await db.employee.findMany({
      where: {
        organizationId: partnerOrg.id,
        employmentStatus: "ACTIVE",
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        user: {
          select: {
            email: true,
            role: { select: { code: true, level: true } },
          },
        },
        directReports: {
          select: { id: true },
        },
        assignedTasks: {
          where: { status: { in: ["TODO", "IN_PROGRESS"] } },
          select: { id: true, title: true, status: true, priority: true },
        },
        operationAssignments: {
          include: {
            operation: {
              select: { id: true, operationCode: true, name: true, status: true },
            },
          },
        },
        onDutyAssignments: {
          where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
          select: { id: true, assignmentNumber: true, purpose: true, status: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    // Filter strictly to employees created by Admin or HR (exclude main executives, managers, and structural architecture personas)
    const eligibleEmployees = employees.filter((emp) => !this.isExcludedExecutiveOrManager(emp));

    // 3. Compute availability status for each eligible employee
    const result: PartnerEmployeeAvailability[] = eligibleEmployees.map((emp) => {
      const activeTasksCount = emp.assignedTasks.length;
      const activeOpsCount = emp.operationAssignments.filter((oa) =>
        ["ACTIVE", "SCHEDULED", "IN_PROGRESS"].includes(oa.operation.status)
      ).length;
      const activeOnDutyCount = emp.onDutyAssignments.length;
      const isBorrowed = borrowedEmployeeIds.has(emp.id);

      const isFree =
        activeTasksCount === 0 &&
        activeOpsCount === 0 &&
        activeOnDutyCount === 0 &&
        !isBorrowed;

      let busyReason: string | null = null;
      if (isBorrowed) {
        busyReason = "Currently seconded to partner company";
      } else if (activeOpsCount > 0) {
        busyReason = `Assigned to ${activeOpsCount} active operation(s)`;
      } else if (activeTasksCount > 0) {
        busyReason = `Assigned to ${activeTasksCount} active task(s)`;
      } else if (activeOnDutyCount > 0) {
        busyReason = `On-duty field assignment in progress`;
      }

      return {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        designation: emp.designation,
        department: emp.department?.name || "General Department",
        workMode: emp.workMode,
        location: emp.location,
        avatarUrl: emp.avatarUrl,
        isFree,
        busyReason,
        workload: {
          activeTasksCount,
          activeOpsCount,
          activeOnDutyCount,
          isBorrowed,
        },
      };
    });

    return {
      partnerCompany: {
        id: partnerOrg.id,
        name: partnerOrg.name,
        code: partnerOrg.code,
        primaryColor: partnerOrg.primaryColor,
      },
      employees: result,
    };
  }

  /**
   * Submits a cross-company employee borrow request.
   * STRICT ENFORCEMENT: Target employee must belong to the partner company AND must be currently FREE.
   */
  static async createBorrowRequest(
    user: AuthenticatedUser,
    payload: CrossCompanyBorrowRequestPayload,
    explicitOrgId?: string
  ) {
    if (!user.employee) {
      throw new Error("Authenticated user has no employee profile");
    }

    const currentOrgId = explicitOrgId || user.activeCompany?.id || user.employee.organizationId;
    const currentOrg = await db.organization.findUnique({
      where: { id: currentOrgId },
      select: { id: true, name: true, code: true },
    });

    if (!currentOrg) {
      throw new Error("Current company organization not found");
    }

    const partnerOrg = await this.getPartnerCompany(user, explicitOrgId);
    if (!partnerOrg) {
      throw new Error("No active partner company found to request resources from");
    }

    // 1. Verify target employee exists and belongs to partner company
    const targetEmployee = await db.employee.findUnique({
      where: { id: payload.targetEmployeeId },
      include: {
        department: true,
        directReports: { select: { id: true } },
        user: { select: { email: true, role: { select: { code: true, level: true } } } },
        assignedTasks: { where: { status: { in: ["TODO", "IN_PROGRESS"] } } },
        operationAssignments: {
          include: {
            operation: { select: { status: true } },
          },
        },
        onDutyAssignments: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } } },
      },
    });

    if (!targetEmployee) {
      throw new Error("Target employee not found");
    }

    if (targetEmployee.organizationId !== partnerOrg.id) {
      throw new Error("Target employee does not belong to the partner company");
    }

    if (targetEmployee.employmentStatus !== "ACTIVE") {
      throw new Error("Cannot request an employee who is not currently ACTIVE");
    }

    // Strict validation: Exclude main executives, managers, leadership, and permanent architecture personas
    if (this.isExcludedExecutiveOrManager(targetEmployee)) {
      throw new Error(
        "Forbidden: Main executives, managers, leadership, and core architecture personas cannot be requested as borrowable resources. Only staff employees created by Admin or HR may be requested."
      );
    }

    // 2. Strict Real-Time Free Check
    const activeTasksCount = targetEmployee.assignedTasks.length;
    const activeOpsCount = targetEmployee.operationAssignments.filter((oa) =>
      ["ACTIVE", "SCHEDULED", "IN_PROGRESS"].includes(oa.operation.status)
    ).length;
    const activeOnDutyCount = targetEmployee.onDutyAssignments.length;

    // Check if currently borrowed
    const existingActiveBorrow = await db.approvalRequest.findFirst({
      where: {
        organizationId: partnerOrg.id,
        entityType: "CROSS_COMPANY_RESOURCE",
        status: "APPROVED",
        metadata: { contains: payload.targetEmployeeId },
      },
    });

    if (activeTasksCount > 0 || activeOpsCount > 0 || activeOnDutyCount > 0 || existingActiveBorrow) {
      const reason =
        existingActiveBorrow
          ? "Currently seconded to another assignment"
          : activeTasksCount > 0
          ? `Occupied with ${activeTasksCount} active task(s)`
          : activeOpsCount > 0
          ? `Occupied with ${activeOpsCount} active operation(s)`
          : `Engaged in on-duty assignment`;
      throw new Error(
        `Employee [${targetEmployee.firstName} ${targetEmployee.lastName}] is not free (${reason}). You can only request employees who are currently free.`
      );
    }

    // 3. Resolve Designated Approvers in Employee's Company: CEO, HR, and Direct Manager
    const [ceoEmp, hrEmp, managerEmp] = await Promise.all([
      db.employee.findFirst({
        where: {
          organizationId: partnerOrg.id,
          user: { role: { code: "CEO" } },
        },
        include: { user: true },
      }),
      db.employee.findFirst({
        where: {
          organizationId: partnerOrg.id,
          user: { role: { code: "HR" } },
        },
        include: { user: true },
      }),
      targetEmployee.managerId
        ? db.employee.findUnique({
            where: { id: targetEmployee.managerId },
            include: { user: true },
          })
        : null,
    ]);

    const designatedApprovers = [
      {
        role: "CEO",
        roleTitle: "Chief Executive Officer",
        name: ceoEmp ? `${ceoEmp.firstName} ${ceoEmp.lastName}` : "Chief Executive Officer",
        employeeId: ceoEmp?.id || null,
        userId: ceoEmp?.userId || null,
        email: ceoEmp?.email || null,
      },
      {
        role: "HR",
        roleTitle: "Human Resources Officer",
        name: hrEmp ? `${hrEmp.firstName} ${hrEmp.lastName}` : "Human Resources Officer",
        employeeId: hrEmp?.id || null,
        userId: hrEmp?.userId || null,
        email: hrEmp?.email || null,
      },
      {
        role: "MANAGER",
        roleTitle: "Direct Reporting Manager",
        name: managerEmp
          ? `${managerEmp.firstName} ${managerEmp.lastName}`
          : targetEmployee.department?.name
          ? `${targetEmployee.department.name} Manager`
          : "Direct Manager",
        employeeId: managerEmp?.id || null,
        userId: managerEmp?.userId || null,
        email: managerEmp?.email || null,
      },
    ];

    const approverEmployeeIds = [ceoEmp?.id, hrEmp?.id, managerEmp?.id].filter(Boolean) as string[];
    const approverUserIds = [ceoEmp?.userId, hrEmp?.userId, managerEmp?.userId].filter(Boolean) as string[];

    // 4. Generate Request Number
    const count = await db.employeeRequest.count({
      where: { organizationId: currentOrgId },
    });
    const requestNumber = `REQ-CC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const startDate = payload.startDate || new Date().toISOString();
    const duration = payload.durationDays || 3;
    const endDate =
      payload.endDate ||
      new Date(new Date(startDate).getTime() + duration * 24 * 60 * 60 * 1000).toISOString();

    const metadata = {
      targetOrganizationId: partnerOrg.id,
      targetOrganizationName: partnerOrg.name,
      targetEmployeeId: targetEmployee.id,
      targetEmployeeName: `${targetEmployee.firstName} ${targetEmployee.lastName}`,
      targetEmployeeDesignation: targetEmployee.designation,
      targetEmployeeDepartment: targetEmployee.department?.name || "General",
      targetEmployeeUserId: targetEmployee.userId,
      requesterOrganizationId: currentOrg.id,
      requesterOrganizationName: currentOrg.name,
      durationDays: duration,
      startDate,
      endDate,
      priority: payload.priority || "NORMAL",
      workScope: payload.description,
      designatedApprovers,
      ceoName: designatedApprovers[0].name,
      ceoEmployeeId: designatedApprovers[0].employeeId,
      hrName: designatedApprovers[1].name,
      hrEmployeeId: designatedApprovers[1].employeeId,
      managerName: designatedApprovers[2].name,
      managerEmployeeId: designatedApprovers[2].employeeId,
      approverEmployeeIds,
      approverUserIds,
    };

    // 5. Create EmployeeRequest in Requester's company
    const employeeRequest = await db.employeeRequest.create({
      data: {
        organizationId: currentOrgId,
        requestNumber,
        category: "CROSS_COMPANY_RESOURCE",
        title: payload.title,
        description: payload.description,
        employeeId: user.employee.id,
        departmentId: user.employee.departmentId,
        status: "PENDING",
        metadata: JSON.stringify(metadata),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
    });

    // 6. Create ApprovalRequest in Partner Company specifically addressed to CEO, HR, and Manager
    const approvalRequest = await db.approvalRequest.create({
      data: {
        organizationId: partnerOrg.id,
        entityType: "CROSS_COMPANY_RESOURCE",
        entityId: employeeRequest.id,
        title: `Staff Request from ${currentOrg.name}: ${targetEmployee.firstName} ${targetEmployee.lastName}`,
        description: `Request to borrow ${targetEmployee.firstName} ${targetEmployee.lastName} (${targetEmployee.designation}) for ${duration} days (${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}). Work Scope: ${payload.title} - ${payload.description}`,
        requestedById: user.employee.id,
        status: "PENDING",
        metadata: JSON.stringify({
          ...metadata,
          employeeRequestId: employeeRequest.id,
        }),
      },
    });

    // 7. Dispatch in-app notifications directly to CEO, HR, and Manager of the employee's company
    for (const approver of designatedApprovers) {
      if (approver.userId) {
        await db.notification.create({
          data: {
            organizationId: partnerOrg.id,
            userId: approver.userId,
            type: "CROSS_COMPANY_REQUEST",
            title: `Cross-Company Request: ${targetEmployee.firstName} ${targetEmployee.lastName}`,
            message: `${currentOrg.name} has requested to borrow ${targetEmployee.firstName} ${targetEmployee.lastName} (${targetEmployee.designation}) for ${duration} days from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}. Action required by CEO, HR, or Manager.`,
            priority: "HIGH",
            actionUrl: `/app/requests?tab=cross-company&subtab=INCOMING`,
            metadata: JSON.stringify({
              approvalRequestId: approvalRequest.id,
              employeeRequestId: employeeRequest.id,
              targetEmployeeId: targetEmployee.id,
              borrowingOrgName: currentOrg.name,
            }),
          },
        }).catch(() => {});
      }
    }

    // 8. Audit log
    await AuditService.logMutation({
      actorId: user.id,
      organizationId: currentOrgId,
      action: "CROSS_COMPANY_STAFF_REQUESTED",
      entity: "EmployeeRequest",
      entityId: employeeRequest.id,
      newValue: {
        targetEmployee: `${targetEmployee.firstName} ${targetEmployee.lastName}`,
        partnerOrg: partnerOrg.name,
        durationDays: duration,
        notifiedApprovers: [designatedApprovers[0].name, designatedApprovers[1].name, designatedApprovers[2].name],
      },
    });

    return {
      employeeRequest,
      approvalRequest,
    };
  }

  /**
   * Retrieves both outgoing (requests we made) and incoming (requests made to borrow our staff) requests.
   */
  static async getBorrowRequests(user: AuthenticatedUser, explicitOrgId?: string) {
    if (!user.employee) return { outgoing: [], incoming: [] };
    const currentOrgId = explicitOrgId || user.activeCompany?.id || user.employee.organizationId;

    // 1. Outgoing requests created by our company
    const outgoingRaw = await db.employeeRequest.findMany({
      where: {
        organizationId: currentOrgId,
        category: "CROSS_COMPANY_RESOURCE",
      },
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
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

    const outgoing = outgoingRaw
      .filter((r) => {
        let meta: any = {};
        try {
          if (r.metadata) meta = JSON.parse(r.metadata);
        } catch (e) {}
        // If our company is the lending company (target), this is not an outgoing request from us
        if (meta.targetOrganizationId && meta.targetOrganizationId === currentOrgId) {
          return false;
        }
        return true;
      })
      .map((r) => {
        let meta: any = {};
        try {
          if (r.metadata) meta = JSON.parse(r.metadata);
        } catch (e) {}
        return {
          id: r.id,
          requestNumber: r.requestNumber,
          title: r.title,
          description: r.description,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
          rejectionReason: r.rejectionReason,
          requester: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "Unknown",
          approver: r.approver ? `${r.approver.firstName} ${r.approver.lastName}` : null,
          targetEmployeeName: meta.targetEmployeeName || "Unknown Staff",
          targetEmployeeDesignation: meta.targetEmployeeDesignation || "",
          targetOrganizationName: meta.targetOrganizationName || "Partner Company",
          targetOrganizationId: meta.targetOrganizationId || null,
          requesterOrganizationId: meta.requesterOrganizationId || currentOrgId,
          durationDays: meta.durationDays || 1,
          startDate: meta.startDate,
          endDate: meta.endDate,
          priority: meta.priority || "NORMAL",
          ceoName: meta.ceoName || "CEO",
          hrName: meta.hrName || "HR",
          managerName: meta.managerName || "Direct Manager",
          acceptedBy: meta.acceptedBy || null,
          designatedApprovers: meta.designatedApprovers || [],
        };
      });

    // 2. Incoming requests sent to our company to borrow our staff
    const incomingRaw = await db.approvalRequest.findMany({
      where: {
        organizationId: currentOrgId,
        entityType: "CROSS_COMPANY_RESOURCE",
      },
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            organization: { select: { id: true, name: true, code: true } },
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

    const incoming = incomingRaw
      .filter((r) => {
        let meta: any = {};
        try {
          if (r.metadata) meta = JSON.parse(r.metadata);
        } catch (e) {}
        // CRITICAL ISOLATION: If our current company is the requester, this is NEVER an incoming request to us!
        if (meta.requesterOrganizationId && meta.requesterOrganizationId === currentOrgId) {
          return false;
        }
        // The request must be addressed to our company as the lender of the employee
        if (meta.targetOrganizationId && meta.targetOrganizationId !== currentOrgId) {
          return false;
        }
        return true;
      })
      .map((r) => {
        let meta: any = {};
        try {
          if (r.metadata) meta = JSON.parse(r.metadata);
        } catch (e) {}

        const isCeo = user.roleCode === "CEO" || user.employee?.id === meta.ceoEmployeeId;
        const isHr = user.roleCode === "HR" || user.employee?.id === meta.hrEmployeeId;
        const isManager =
          user.employee?.id === meta.managerEmployeeId ||
          meta.approverEmployeeIds?.includes(user.employee?.id);
        const isAdminOrSuper = ["SUPER_ADMIN", "ADMIN"].includes(user.roleCode);
        const canApprove = isCeo || isHr || isManager || isAdminOrSuper;

        return {
          id: r.id,
          employeeRequestId: meta.employeeRequestId || r.entityId,
          title: r.title,
          description: r.description,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          decisionDate: r.decisionDate ? r.decisionDate.toISOString() : null,
          comment: r.comment,
          requesterName: r.requestedBy ? `${r.requestedBy.firstName} ${r.requestedBy.lastName}` : "Requester",
          requesterDesignation: r.requestedBy?.designation || "",
          requesterOrgName: meta.requesterOrganizationName || r.requestedBy?.organization?.name || "Partner Company",
          requesterOrganizationId: meta.requesterOrganizationId || r.requestedBy?.organization?.id,
          targetEmployeeName: meta.targetEmployeeName || "Our Staff Member",
          targetEmployeeDesignation: meta.targetEmployeeDesignation || "",
          targetEmployeeDepartment: meta.targetEmployeeDepartment || "",
          targetOrganizationId: meta.targetOrganizationId || currentOrgId,
          durationDays: meta.durationDays || 1,
          startDate: meta.startDate,
          endDate: meta.endDate,
          priority: meta.priority || "NORMAL",
          workScope: meta.workScope || r.description,
          ceoName: meta.ceoName || "CEO",
          hrName: meta.hrName || "HR",
          managerName: meta.managerName || "Direct Manager",
          designatedApprovers: meta.designatedApprovers || [],
          acceptedBy: meta.acceptedBy || (r.approver ? { name: `${r.approver.firstName} ${r.approver.lastName}`, role: r.approver.designation } : null),
          canApprove,
        };
      });

    return { outgoing, incoming };
  }

  /**
   * Evaluates and records a decision (APPROVE / REJECT) for an incoming borrow request.
   * Can be accepted by ANY ONE of: CEO, HR, or Direct Manager of the employee.
   * Upon acceptance, the employee is assigned to the requesting company for the specified period.
   */
  static async decideBorrowRequest(
    user: AuthenticatedUser,
    approvalRequestId: string,
    decision: "APPROVED" | "REJECTED",
    comment?: string,
    explicitOrgId?: string
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const currentOrgId = explicitOrgId || user.activeCompany?.id || user.employee.organizationId;

    const approval = await db.approvalRequest.findUnique({
      where: { id: approvalRequestId },
      include: {
        requestedBy: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            organization: true,
          },
        },
      },
    });

    if (!approval) throw new Error("Approval request record not found");

    // Ensure the approval belongs to this user's company
    if (approval.organizationId !== currentOrgId && user.roleCode !== "SUPER_ADMIN") {
      throw new Error("Forbidden: This request does not belong to your organization");
    }

    if (approval.status !== "PENDING") {
      throw new Error(`This request has already been finalized with status: ${approval.status}`);
    }

    let meta: any = {};
    try {
      if (approval.metadata) meta = JSON.parse(approval.metadata);
    } catch (e) {}

    // Verify authority: CEO, HR, Manager of target employee, or Admin/SuperAdmin
    const isCeo = user.roleCode === "CEO" || user.employee.id === meta.ceoEmployeeId;
    const isHr = user.roleCode === "HR" || user.employee.id === meta.hrEmployeeId;
    const isManager =
      user.employee.id === meta.managerEmployeeId ||
      meta.approverEmployeeIds?.includes(user.employee.id);
    const isAdminOrSuper = ["SUPER_ADMIN", "ADMIN"].includes(user.roleCode);

    if (!isCeo && !isHr && !isManager && !isAdminOrSuper) {
      throw new Error(
        "Forbidden: Only the CEO, HR, or direct Manager of the employee's company can accept or decline this borrow request."
      );
    }

    const approverRoleTitle = isCeo
      ? "CEO"
      : isHr
      ? "HR"
      : isManager
      ? "Direct Manager"
      : user.roleCode;

    meta.acceptedBy = {
      name: `${user.employee.firstName} ${user.employee.lastName}`,
      role: user.roleCode,
      roleTitle: approverRoleTitle,
      employeeId: user.employee.id,
      userId: user.id,
      acceptedAt: new Date().toISOString(),
    };
    meta.secondmentStatus = decision === "APPROVED" ? "ACTIVE" : "REJECTED";

    // 1. Update ApprovalRequest
    const updatedApproval = await db.approvalRequest.update({
      where: { id: approvalRequestId },
      data: {
        status: decision,
        approverId: user.employee.id,
        decisionDate: new Date(),
        comment: comment || (decision === "APPROVED" ? `Approved by ${approverRoleTitle} for temporary secondment.` : "Declined"),
        metadata: JSON.stringify(meta),
      },
    });

    // 2. Update linked EmployeeRequest in requester org
    const employeeRequestId = meta.employeeRequestId || approval.entityId;
    if (employeeRequestId) {
      await db.employeeRequest.update({
        where: { id: employeeRequestId },
        data: {
          status: decision,
          approvedAt: new Date(),
          approverId: user.employee.id,
          rejectionReason: decision === "REJECTED" ? (comment || `Declined by ${approverRoleTitle}`) : null,
          metadata: JSON.stringify(meta),
        },
      });
    }

    // 3. IF APPROVED: ASSIGN EMPLOYEE FOR THE SELECTED DURATION
    if (decision === "APPROVED") {
      const borrowingOrgId = meta.requesterOrganizationId;
      const targetEmpId = meta.targetEmployeeId;

      // A. Query target employee
      const targetEmp = await db.employee.findUnique({
        where: { id: targetEmpId },
        include: { user: true },
      });

      // B. Grant cross-company membership in borrowing company during secondment
      if (targetEmp?.userId && borrowingOrgId) {
        const employeeRole = await db.role.findUnique({ where: { code: "EMPLOYEE" } });
        await db.userCompanyMembership.upsert({
          where: {
            userId_organizationId: {
              userId: targetEmp.userId,
              organizationId: borrowingOrgId,
            },
          },
          create: {
            userId: targetEmp.userId,
            organizationId: borrowingOrgId,
            roleId: employeeRole?.id,
            status: "ACTIVE",
            isPrimary: false,
          },
          update: {
            status: "ACTIVE",
          },
        }).catch((err) => console.error("Membership assignment error:", err));
      }

      // C. Create assignment Task in borrowing company
      if (borrowingOrgId) {
        await db.task.create({
          data: {
            organizationId: borrowingOrgId,
            title: `[Cross-Company Secondment] ${meta.targetEmployeeName}`,
            description: `Seconded from ${meta.targetOrganizationName} for ${meta.durationDays} days (${new Date(meta.startDate).toLocaleDateString()} to ${new Date(meta.endDate).toLocaleDateString()}). Scope: ${meta.workScope}. Authorized by ${approverRoleTitle} (${user.employee.firstName} ${user.employee.lastName}).`,
            priority: meta.priority === "URGENT" ? "URGENT" : "HIGH",
            status: "IN_PROGRESS",
            dueDate: new Date(meta.endDate),
            assigneeId: targetEmpId,
            creatorId: approval.requestedById,
          },
        }).catch((err) => console.error("Secondment task create error:", err));
      }

      // D. Send Notification to Requester in Borrowing Company
      if (approval.requestedBy?.userId && borrowingOrgId) {
        await db.notification.create({
          data: {
            organizationId: borrowingOrgId,
            userId: approval.requestedBy.userId,
            type: "CROSS_COMPANY_APPROVED",
            title: `Staff Request Approved: ${meta.targetEmployeeName}`,
            message: `Your request to borrow ${meta.targetEmployeeName} has been ACCEPTED by ${meta.acceptedBy.name} (${approverRoleTitle}). ${meta.targetEmployeeName} is assigned to ${meta.requesterOrganizationName} until ${new Date(meta.endDate).toLocaleDateString()}.`,
            priority: "HIGH",
            actionUrl: `/app/requests?tab=cross-company&subtab=OUTGOING`,
          },
        }).catch(() => {});
      }

      // E. Send Notification to the Target Employee
      if (targetEmp?.userId) {
        await db.notification.create({
          data: {
            organizationId: approval.organizationId,
            userId: targetEmp.userId,
            type: "CROSS_COMPANY_ASSIGNMENT",
            title: `Assigned to ${meta.requesterOrganizationName}`,
            message: `You have been temporarily assigned to work for ${meta.requesterOrganizationName} from ${new Date(meta.startDate).toLocaleDateString()} to ${new Date(meta.endDate).toLocaleDateString()} for: "${meta.workScope}". Authorized by ${approverRoleTitle} (${user.employee.firstName} ${user.employee.lastName}).`,
            priority: "HIGH",
            actionUrl: `/app/overview`,
          },
        }).catch(() => {});
      }
    }

    // 4. Audit Log
    await AuditService.logMutation({
      actorId: user.id,
      organizationId: currentOrgId,
      action: decision === "APPROVED" ? "CROSS_COMPANY_STAFF_APPROVED" : "CROSS_COMPANY_STAFF_REJECTED",
      entity: "ApprovalRequest",
      entityId: approvalRequestId,
      newValue: {
        decision,
        targetEmployee: meta.targetEmployeeName,
        requesterOrg: meta.requesterOrganizationName,
        authorizedBy: `${approverRoleTitle} (${user.employee.firstName} ${user.employee.lastName})`,
        durationDays: meta.durationDays,
        comment,
      },
    });

    return updatedApproval;
  }
}
