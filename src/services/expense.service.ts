import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export interface CreateExpenseInput {
  category: "TRAVEL" | "SOFTWARE_SUBSCRIPTION" | "HARDWARE_EQUIPMENT" | "OFFICE_SUPPLIES" | "MARKETING" | "MEALS_ENTERTAINMENT" | "CONSULTING" | "UTILITIES" | "OTHER";
  amount: number;
  currency?: string;
  date: string | Date;
  description: string;
  receiptUrl?: string;
  departmentId?: string;
}

export interface ExpenseFilters {
  category?: string;
  status?: string;
  departmentId?: string;
  employeeId?: string;
  scope?: "my" | "all";
}

export class ExpenseService {
  static isExecutive(user: AuthenticatedUser): boolean {
    const execRoles = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "ADMIN"];
    return execRoles.includes(user.roleCode);
  }

  /**
   * Scoped query of employee expenses
   */
  static async getExpenses(user: AuthenticatedUser, filters?: ExpenseFilters) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const where: any = { organizationId: orgId };

    // Standard staff only see their own expenses unless scoped/privileged
    if (filters?.scope === "my" || (!this.isExecutive(user) && user.roleCode !== "DEPARTMENT_HEAD" && user.roleCode !== "MANAGER")) {
      where.employeeId = user.employee.id;
    } else if (user.roleCode === "DEPARTMENT_HEAD" && filters?.scope !== "all") {
      where.departmentId = user.employee.departmentId;
    }

    if (filters?.category && filters.category !== "ALL") {
      where.category = filters.category;
    }
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }

    return db.expense.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        department: { select: { id: true, name: true, code: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Submit or draft a new corporate expense
   */
  static async createExpense(user: AuthenticatedUser, data: CreateExpenseInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    if (data.amount <= 0) {
      throw new Error("Expense amount must be greater than zero");
    }

    const currentYear = new Date().getFullYear();
    const count = await db.expense.count({ where: { organizationId: orgId } });
    const expenseNumber = `EXP-${currentYear}-${(count + 1).toString().padStart(4, "0")}`;

    const departmentId = data.departmentId || user.employee.departmentId;
    if (!departmentId) throw new Error("Employee must be associated with a department");

    const expense = await db.expense.create({
      data: {
        organizationId: orgId,
        expenseNumber,
        employeeId: user.employee.id,
        departmentId,
        category: data.category,
        amount: data.amount,
        currency: data.currency || "INR",
        date: new Date(data.date),
        description: data.description.trim(),
        receiptUrl: data.receiptUrl || null,
        status: "SUBMITTED",
      },
      include: { employee: true, department: true },
    });

    await AuditService.log({
      actorId: user.id,
      action: "EXPENSE_SUBMITTED",
      entity: "Expense",
      entityId: expense.id,
      newValue: { expenseNumber, amount: data.amount, category: data.category },
    });

    return expense;
  }

  /**
   * Review, Approve, Reject, or Disburse Payment for an Expense
   */
  static async transitionStatus(
    id: string,
    user: AuthenticatedUser,
    action: "REVIEW" | "APPROVE" | "REJECT" | "PAY",
    metadata?: { reason?: string; paymentMethod?: string; paymentReference?: string }
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const expense = await db.expense.findUnique({
      where: { id },
      include: { employee: true, department: true },
    });

    if (!expense || expense.organizationId !== orgId) {
      throw new Error("Expense not found or unauthorized");
    }

    const prevStatus = expense.status;
    let newStatus = prevStatus;
    let approverId = expense.approverId;
    let approvedAt = expense.approvedAt;
    let rejectionReason = expense.rejectionReason;
    let paidAt = expense.paidAt;
    let paymentMethod = expense.paymentMethod;
    let paymentReference = expense.paymentReference;

    switch (action) {
      case "REVIEW":
        if (expense.status !== "SUBMITTED") {
          throw new Error(`Cannot move expense with status ${expense.status} to under review`);
        }
        newStatus = "UNDER_REVIEW";
        break;

      case "APPROVE":
        if (!["SUBMITTED", "UNDER_REVIEW"].includes(expense.status)) {
          throw new Error(`Cannot approve expense with status ${expense.status}`);
        }
        if (!this.isExecutive(user) && !user.permissions.includes("expense.approve") && user.roleCode !== "DEPARTMENT_HEAD" && user.roleCode !== "MANAGER") {
          throw new Error("Forbidden: You do not have permission to approve corporate expenses");
        }
        newStatus = "APPROVED";
        approverId = user.employee.id;
        approvedAt = new Date();
        rejectionReason = null;
        break;

      case "REJECT":
        if (!["SUBMITTED", "UNDER_REVIEW"].includes(expense.status)) {
          throw new Error(`Cannot reject expense with status ${expense.status}`);
        }
        if (!this.isExecutive(user) && !user.permissions.includes("expense.reject") && user.roleCode !== "DEPARTMENT_HEAD" && user.roleCode !== "MANAGER") {
          throw new Error("Forbidden: You do not have permission to reject expenses");
        }
        newStatus = "REJECTED";
        rejectionReason = metadata?.reason || "Rejected during expense review";
        break;

      case "PAY":
        if (expense.status !== "APPROVED") {
          throw new Error("Only approved expenses can be disbursed and marked as paid");
        }
        if (!this.isExecutive(user) && !user.permissions.includes("finance.manage")) {
          throw new Error("Forbidden: Only finance officers can disburse expense payments");
        }
        newStatus = "PAID";
        paidAt = new Date();
        paymentMethod = metadata?.paymentMethod || "REIMBURSEMENT";
        paymentReference = metadata?.paymentReference || `REIMB-${Date.now().toString().slice(-6)}`;
        break;

      default:
        throw new Error(`Invalid action: ${action}`);
    }

    const updated = await db.$transaction(async (tx) => {
      const exp = await tx.expense.update({
        where: { id },
        data: {
          status: newStatus,
          approverId,
          approvedAt,
          rejectionReason,
          paidAt,
          paymentMethod,
          paymentReference,
        },
        include: { employee: true, department: true },
      });

      // If PAID, create Central Financial Transaction (OUTFLOW)
      if (action === "PAY") {
        const currentYear = new Date().getFullYear();
        const txCount = await tx.financialTransaction.count({ where: { organizationId: orgId } });
        const transactionNumber = `TXN-${currentYear}-${(txCount + 1).toString().padStart(4, "0")}`;

        await tx.financialTransaction.create({
          data: {
            organizationId: orgId,
            transactionNumber,
            type: "EXPENSE",
            direction: "OUTFLOW",
            sourceType: "EXPENSE",
            sourceId: expense.id,
            amount: expense.amount,
            currency: expense.currency,
            date: paidAt || new Date(),
            description: `Expense reimbursement for ${expense.employee.firstName} ${expense.employee.lastName} (${expense.description})`,
            reference: paymentReference,
            departmentId: expense.departmentId,
            createdById: user.employee!.id,
            expenseId: expense.id,
          },
        });
      }

      return exp;
    });

    await AuditService.log({
      actorId: user.id,
      action: `EXPENSE_${action}`,
      entity: "Expense",
      entityId: expense.id,
      previousValue: { status: prevStatus },
      newValue: { status: newStatus, reason: metadata?.reason },
    });

    return updated;
  }

  /**
   * Accounts Payable: Aggregates approved unpaid expenses & pending payroll obligations
   */
  static async getPayables(user: AuthenticatedUser) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const approvedExpenses = await db.expense.findMany({
      where: { organizationId: orgId, status: "APPROVED" },
      orderBy: { date: "asc" },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    const pendingPayroll = await db.payrollPeriod.findMany({
      where: { organizationId: orgId, status: { in: ["APPROVED", "CALCULATED", "REVIEWED"] } },
      orderBy: { startDate: "asc" },
    });

    const totalExpensePayable = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPayrollPayable = pendingPayroll.reduce((sum, p) => sum + p.totalNet, 0);
    const totalPayable = totalExpensePayable + totalPayrollPayable;

    return {
      totalPayable: Math.round(totalPayable),
      totalExpensePayable: Math.round(totalExpensePayable),
      totalPayrollPayable: Math.round(totalPayrollPayable),
      approvedExpenses,
      pendingPayroll,
    };
  }
}
