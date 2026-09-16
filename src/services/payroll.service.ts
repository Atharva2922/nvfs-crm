import { db } from "@/lib/db";
import { AuditService } from "./audit.service";
import { SalaryService } from "./salary.service";
import { AuthenticatedUser } from "@/types";

export class PayrollService {
  /**
   * Creates a new monthly payroll period in DRAFT status
   */
  static async createPeriod(
    organizationId: string,
    data: {
      code: string; // e.g. "2026-10"
      name: string;
      year: number;
      month: number;
      startDate: Date | string;
      endDate: Date | string;
      remarks?: string;
    }
  ) {
    const existing = await db.payrollPeriod.findUnique({
      where: {
        organizationId_code: {
          organizationId,
          code: data.code,
        },
      },
    });

    if (existing) {
      throw new Error(`Payroll period for ${data.code} already exists.`);
    }

    const period = await db.payrollPeriod.create({
      data: {
        organizationId,
        code: data.code,
        name: data.name,
        year: data.year,
        month: data.month,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        remarks: data.remarks || null,
        status: "DRAFT",
      },
    });

    await AuditService.logMutation({
      action: "PAYROLL_PERIOD_CREATED",
      entity: "PayrollPeriod",
      entityId: period.id,
      newValue: { code: period.code, name: period.name },
      metadata: { source: "payroll_service" },
    });

    return period;
  }

  /**
   * Batch calculates payroll entries for all employees in a period
   */
  static async calculatePeriod(periodId: string, actorId: string) {
    const period = await db.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) throw new Error("Payroll period not found");
    if (period.status === "APPROVED" || period.status === "PROCESSED") {
      throw new Error(`Cannot re-calculate a payroll period that is already ${period.status.toLowerCase()}`);
    }

    // 1. Fetch active employees with active salary structures in this organization
    const activeAssignments = await db.employeeSalaryStructure.findMany({
      where: {
        isActive: true,
        employee: {
          organizationId: period.organizationId,
          employmentStatus: "ACTIVE",
        },
      },
      include: {
        employee: true,
        salaryStructure: {
          include: {
            items: {
              include: { component: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (activeAssignments.length === 0) {
      throw new Error("No active employee salary structures found for this organization.");
    }

    // 2. Fetch approved unpaid leave (LWP) days for each employee in this period
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);

    const lwpRequests = await db.leaveRequest.findMany({
      where: {
        employee: { organizationId: period.organizationId },
        leavePolicy: { code: "LWP" },
        status: "APPROVED",
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { employeeId: true, daysCount: true },
    });

    const lwpMap = new Map<string, number>();
    lwpRequests.forEach((req) => {
      const cur = lwpMap.get(req.employeeId) || 0;
      lwpMap.set(req.employeeId, cur + req.daysCount);
    });

    const workingDays = 22; // Standard monthly working days baseline
    let periodGross = 0;
    let periodDeductions = 0;
    let periodNet = 0;

    // 3. Calculate and upsert each payroll entry
    const entries = [];
    for (const assign of activeAssignments) {
      const empId = assign.employeeId;
      const unpaidDays = lwpMap.get(empId) || 0;
      const presentDays = Math.max(0, workingDays - unpaidDays);

      const computed = SalaryService.calculateSalaryBreakdown(
        assign.baseSalary,
        assign.salaryStructure.items,
        unpaidDays,
        workingDays
      );

      periodGross += computed.grossSalary;
      periodDeductions += computed.totalDeductions;
      periodNet += computed.netSalary;

      const entry = await db.payrollEntry.upsert({
        where: {
          payrollPeriodId_employeeId: {
            payrollPeriodId: period.id,
            employeeId: empId,
          },
        },
        update: {
          totalPeriodDays: 30,
          workingDays,
          presentDays,
          unpaidLeaveDays: unpaidDays,
          baseSalary: computed.baseSalary,
          grossSalary: computed.grossSalary,
          totalDeductions: computed.totalDeductions,
          netSalary: computed.netSalary,
          earningsBreakdown: JSON.stringify(computed.earnings),
          deductionsBreakdown: JSON.stringify(computed.deductions),
          status: "CALCULATED",
          paymentMethod: assign.paymentMethod,
        },
        create: {
          payrollPeriodId: period.id,
          employeeId: empId,
          totalPeriodDays: 30,
          workingDays,
          presentDays,
          unpaidLeaveDays: unpaidDays,
          baseSalary: computed.baseSalary,
          grossSalary: computed.grossSalary,
          totalDeductions: computed.totalDeductions,
          netSalary: computed.netSalary,
          earningsBreakdown: JSON.stringify(computed.earnings),
          deductionsBreakdown: JSON.stringify(computed.deductions),
          status: "CALCULATED",
          paymentMethod: assign.paymentMethod,
        },
      });

      entries.push(entry);
    }

    // 4. Update Payroll Period totals
    const updatedPeriod = await db.payrollPeriod.update({
      where: { id: period.id },
      data: {
        status: "CALCULATED",
        employeeCount: activeAssignments.length,
        totalGross: Math.round(periodGross * 100) / 100,
        totalDeductions: Math.round(periodDeductions * 100) / 100,
        totalNet: Math.round(periodNet * 100) / 100,
      },
    });

    await AuditService.logMutation({
      actorId,
      action: "PAYROLL_PERIOD_CALCULATED",
      entity: "PayrollPeriod",
      entityId: period.id,
      newValue: {
        code: period.code,
        employeeCount: activeAssignments.length,
        totalGross: updatedPeriod.totalGross,
        totalNet: updatedPeriod.totalNet,
      },
      metadata: { source: "payroll_service" },
    });

    return { period: updatedPeriod, entriesCount: entries.length };
  }

  /**
   * Reviews a calculated payroll run
   */
  static async reviewPeriod(periodId: string, reviewerId: string, remarks?: string) {
    const period = await db.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new Error("Payroll period not found");
    if (period.status !== "CALCULATED") {
      throw new Error(`Only CALCULATED payroll runs can be marked as reviewed (current: ${period.status})`);
    }

    const updated = await db.payrollPeriod.update({
      where: { id: periodId },
      data: {
        status: "REVIEWED",
        remarks: remarks || period.remarks,
      },
    });

    await db.payrollEntry.updateMany({
      where: { payrollPeriodId: periodId },
      data: { status: "REVIEWED" },
    });

    await AuditService.logMutation({
      actorId: reviewerId,
      action: "PAYROLL_PERIOD_REVIEWED",
      entity: "PayrollPeriod",
      entityId: periodId,
      newValue: { status: "REVIEWED" },
      metadata: { source: "payroll_service" },
    });

    return updated;
  }

  /**
   * Executive Approval of payroll run
   */
  static async approvePeriod(periodId: string, approverEmployeeId: string, notes?: string) {
    const period = await db.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new Error("Payroll period not found");
    if (period.status !== "REVIEWED" && period.status !== "CALCULATED") {
      throw new Error(`Cannot approve a payroll run in ${period.status} status`);
    }

    const updated = await db.payrollPeriod.update({
      where: { id: periodId },
      data: {
        status: "APPROVED",
        approvedById: approverEmployeeId,
        remarks: notes || "Executive approval granted for disbursement.",
      },
    });

    await db.payrollEntry.updateMany({
      where: { payrollPeriodId: periodId },
      data: { status: "APPROVED" },
    });

    await AuditService.logMutation({
      actorId: approverEmployeeId,
      action: "PAYROLL_PERIOD_APPROVED",
      entity: "PayrollPeriod",
      entityId: periodId,
      newValue: { status: "APPROVED", approvedBy: approverEmployeeId },
      metadata: { source: "payroll_service" },
    });

    return updated;
  }

  /**
   * Finalizes payroll processing and marks payslips as paid
   */
  static async processPeriod(
    periodId: string,
    processorId: string,
    paymentReference = `ACH-${Date.now()}`
  ) {
    const period = await db.payrollPeriod.findUnique({
      where: { id: periodId },
      include: { entries: true },
    });
    if (!period) throw new Error("Payroll period not found");
    if (period.status !== "APPROVED") {
      throw new Error(`Payroll must be in APPROVED state prior to disbursement (current: ${period.status})`);
    }

    const payDate = new Date();

    const updated = await db.payrollPeriod.update({
      where: { id: periodId },
      data: {
        status: "PROCESSED",
        paymentDate: payDate,
        processedAt: payDate,
      },
    });

    await db.payrollEntry.updateMany({
      where: { payrollPeriodId: periodId },
      data: {
        status: "PAID",
        paymentReference,
        paymentDate: payDate,
      },
    });

    await AuditService.logMutation({
      actorId: processorId,
      action: "PAYROLL_PERIOD_PROCESSED",
      entity: "PayrollPeriod",
      entityId: periodId,
      newValue: {
        status: "PROCESSED",
        paymentReference,
        disbursedNet: period.totalNet,
      },
      metadata: { source: "payroll_service" },
    });

    return updated;
  }

  /**
   * Retrieves single payslip with strict security authorization
   */
  static async getPayslip(entryId: string, requestingUser: AuthenticatedUser) {
    const entry = await db.payrollEntry.findUnique({
      where: { id: entryId },
      include: {
        payrollPeriod: true,
        employee: {
          include: {
            department: true,
            organization: true,
            salaryStructures: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!entry) throw new Error("Payslip record not found");

    const isOwner = requestingUser.employee?.id === entry.employeeId;
    const isPrivileged = SalaryService.isPrivilegedPayrollUser(requestingUser);

    if (!isOwner && !isPrivileged) {
      throw new Error("Access Denied: You are not authorized to view this payslip.");
    }

    return {
      ...entry,
      earnings: JSON.parse(entry.earningsBreakdown || "[]"),
      deductions: JSON.parse(entry.deductionsBreakdown || "[]"),
    };
  }
}
