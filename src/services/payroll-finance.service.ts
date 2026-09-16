import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export class PayrollFinanceService {
  static isExecutive(user: AuthenticatedUser): boolean {
    const execRoles = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "ADMIN"];
    return execRoles.includes(user.roleCode);
  }

  /**
   * Retrieves finalized payroll periods with ledger posting status
   */
  static async getFinalizedPeriods(user: AuthenticatedUser) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const periods = await db.payrollPeriod.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["APPROVED", "PROCESSED"] },
      },
      orderBy: { startDate: "desc" },
      include: {
        financialTransactions: true,
        _count: { select: { entries: true } },
      },
    });

    return periods.map((p) => ({
      ...p,
      isPostedToLedger: p.financialTransactions.length > 0,
      postedTransactionNumber: p.financialTransactions[0]?.transactionNumber || null,
    }));
  }

  /**
   * Posts finalized payroll run as an immutable disbursement to the financial ledger
   */
  static async postPayrollToLedger(payrollPeriodId: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    if (!this.isExecutive(user) && !user.permissions.includes("payroll.post")) {
      throw new Error("Forbidden: You do not have permission to post payroll to the financial ledger");
    }

    const period = await db.payrollPeriod.findUnique({
      where: { id: payrollPeriodId },
      include: { financialTransactions: true },
    });

    if (!period || period.organizationId !== orgId) {
      throw new Error("Payroll period not found or unauthorized");
    }

    if (!["APPROVED", "PROCESSED"].includes(period.status)) {
      throw new Error(`Only approved or processed payroll periods can be posted. Current status: ${period.status}`);
    }

    if (period.financialTransactions.length > 0) {
      throw new Error(`This payroll period has already been posted under ${period.financialTransactions[0].transactionNumber}`);
    }

    const currentYear = new Date().getFullYear();
    const count = await db.financialTransaction.count({ where: { organizationId: orgId } });
    const transactionNumber = `TXN-${currentYear}-${(count + 1).toString().padStart(4, "0")}`;

    const txn = await db.financialTransaction.create({
      data: {
        organizationId: orgId,
        transactionNumber,
        type: "PAYROLL_DISBURSEMENT",
        direction: "OUTFLOW",
        sourceType: "PAYROLL_PERIOD",
        sourceId: period.id,
        amount: period.totalNet,
        currency: "INR",
        date: new Date(),
        description: `Corporate Payroll Disbursement: ${period.name} (${period.code}) for ${period.employeeCount} employees`,
        reference: `PAYROLL-${period.code}`,
        createdById: user.employee.id,
        payrollPeriodId: period.id,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "PAYROLL_POSTED",
      entity: "PayrollPeriod",
      entityId: period.id,
      newValue: {
        transactionNumber,
        periodCode: period.code,
        netDisbursed: period.totalNet,
        employeeCount: period.employeeCount,
      },
    });

    return txn;
  }
}
