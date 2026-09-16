import { db } from "@/lib/db";
import { AuditService } from "./audit.service";
import { AuthenticatedUser } from "@/types";

export interface SalaryBreakdownItem {
  code: string;
  name: string;
  amount: number;
  type: "EARNING" | "DEDUCTION" | "REIMBURSEMENT";
  calcType: string;
}

export interface ComputedSalary {
  baseSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  earnings: SalaryBreakdownItem[];
  deductions: SalaryBreakdownItem[];
}

export class SalaryService {
  /**
   * Calculates dynamic salary breakdown given a base salary, structure items, and unpaid leave days
   */
  static calculateSalaryBreakdown(
    baseSalary: number,
    structureItems: Array<{
      component: { code: string; name: string; type: string };
      calcType: string;
      value: number;
    }>,
    unpaidLeaveDays = 0,
    workingDays = 22
  ): ComputedSalary {
    const earnings: SalaryBreakdownItem[] = [
      {
        code: "BASIC",
        name: "Basic Salary",
        amount: Math.round(baseSalary * 100) / 100,
        type: "EARNING",
        calcType: "FIXED",
      },
    ];

    let runningGross = baseSalary;

    // 1. Calculate Earnings (excluding Basic which is already added)
    for (const item of structureItems) {
      if (item.component.type === "EARNING" && item.component.code !== "BASIC") {
        let amount = 0;
        if (item.calcType === "PERCENTAGE_OF_BASIC") {
          amount = (baseSalary * item.value) / 100;
        } else if (item.calcType === "FIXED") {
          amount = item.value;
        }
        amount = Math.round(amount * 100) / 100;
        runningGross += amount;
        earnings.push({
          code: item.component.code,
          name: item.component.name,
          amount,
          type: "EARNING",
          calcType: item.calcType,
        });
      }
    }

    const deductions: SalaryBreakdownItem[] = [];
    let runningDeductions = 0;

    // 2. Calculate Deductions
    for (const item of structureItems) {
      if (item.component.type === "DEDUCTION") {
        let amount = 0;
        if (item.calcType === "PERCENTAGE_OF_BASIC") {
          amount = (baseSalary * item.value) / 100;
        } else if (item.calcType === "PERCENTAGE_OF_GROSS") {
          amount = (runningGross * item.value) / 100;
        } else if (item.calcType === "FIXED") {
          amount = item.value;
        }
        amount = Math.round(amount * 100) / 100;
        runningDeductions += amount;
        deductions.push({
          code: item.component.code,
          name: item.component.name,
          amount,
          type: "DEDUCTION",
          calcType: item.calcType,
        });
      }
    }

    // 3. Loss of Pay (LOP) for unpaid leave days
    if (unpaidLeaveDays > 0 && workingDays > 0) {
      const dailyRate = baseSalary / workingDays;
      const lopAmount = Math.round(dailyRate * unpaidLeaveDays * 100) / 100;
      runningDeductions += lopAmount;
      deductions.push({
        code: "LOP",
        name: `Loss of Pay (${unpaidLeaveDays} Unpaid Leave Day${unpaidLeaveDays > 1 ? "s" : ""})`,
        amount: lopAmount,
        type: "DEDUCTION",
        calcType: "DAILY_PRORATED",
      });
    }

    const netSalary = Math.round((runningGross - runningDeductions) * 100) / 100;

    return {
      baseSalary: Math.round(baseSalary * 100) / 100,
      grossSalary: Math.round(runningGross * 100) / 100,
      totalDeductions: Math.round(runningDeductions * 100) / 100,
      netSalary,
      earnings,
      deductions,
    };
  }

  /**
   * Restrictive security check for salary information
   */
  static isPrivilegedPayrollUser(user: AuthenticatedUser): boolean {
    const privilegedRoles = ["SUPER_ADMIN", "ADMIN", "CHAIRPERSON", "CEO", "CFO"];
    if (privilegedRoles.includes(user.roleCode)) return true;
    return user.permissions?.includes("payroll.salary.read") || user.permissions?.includes("payroll.salary.manage");
  }

  /**
   * Retrieves an employee's current active salary structure with security check
   */
  static async getEmployeeSalary(employeeId: string, requestingUser: AuthenticatedUser) {
    const isOwner = requestingUser.employee?.id === employeeId;
    const isPrivileged = this.isPrivilegedPayrollUser(requestingUser);

    if (!isOwner && !isPrivileged) {
      throw new Error("Access Denied: You do not have authorization to view this personnel salary information.");
    }

    const assignment = await db.employeeSalaryStructure.findFirst({
      where: { employeeId, isActive: true },
      include: {
        salaryStructure: {
          include: {
            items: {
              include: { component: true },
              orderBy: { order: "asc" },
            },
          },
        },
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeNumber: true,
            designation: true,
            department: { select: { name: true, code: true } },
          },
        },
      },
    });

    if (!assignment) return null;

    const breakdown = this.calculateSalaryBreakdown(
      assignment.baseSalary,
      assignment.salaryStructure.items
    );

    return {
      ...assignment,
      computedBreakdown: breakdown,
    };
  }

  /**
   * Assigns or updates an employee's salary package
   */
  static async assignSalaryPackage({
    actorId,
    employeeId,
    salaryStructureId,
    baseSalary,
    paymentMethod,
    bankName,
    bankAccountMask,
    taxIdNumber,
    effectiveFrom,
  }: {
    actorId: string;
    employeeId: string;
    salaryStructureId: string;
    baseSalary: number;
    paymentMethod?: string;
    bankName?: string;
    bankAccountMask?: string;
    taxIdNumber?: string;
    effectiveFrom?: Date | string;
  }) {
    // 1. Deactivate prior structures for this employee
    await db.employeeSalaryStructure.updateMany({
      where: { employeeId, isActive: true },
      data: { isActive: false },
    });

    // 2. Create active salary assignment
    const assignment = await db.employeeSalaryStructure.create({
      data: {
        employeeId,
        salaryStructureId,
        baseSalary,
        paymentMethod: paymentMethod || "BANK_TRANSFER",
        bankName: bankName || null,
        bankAccountMask: bankAccountMask || null,
        taxIdNumber: taxIdNumber || null,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        isActive: true,
      },
      include: {
        salaryStructure: true,
        employee: true,
      },
    });

    // Also update baseSalary cache on Employee model
    await db.employee.update({
      where: { id: employeeId },
      data: { baseSalary: baseSalary * 12 }, // Annualized
    });

    await AuditService.logMutation({
      actorId,
      action: "SALARY_STRUCTURE_ASSIGNED",
      entity: "EmployeeSalaryStructure",
      entityId: assignment.id,
      newValue: {
        employeeNumber: assignment.employee.employeeNumber,
        structure: assignment.salaryStructure.name,
        monthlyBase: baseSalary,
      },
      metadata: { source: "salary_service" },
    });

    return assignment;
  }
}
