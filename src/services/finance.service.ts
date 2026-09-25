import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";

export interface FinanceOverviewData {
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    accountsReceivable: number;
    accountsPayable: number;
    outstandingInvoicesCount: number;
    outstandingInvoicesAmount: number;
    overdueInvoicesCount: number;
    overdueInvoicesAmount: number;
    payrollCost: number;
  };
  revenueTrend: Array<{ month: string; invoiced: number; collected: number }>;
  expenseTrend: Array<{ month: string; expenses: number; payroll: number }>;
  cashFlow: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
    recentTransactions: any[];
  };
  receivablesAging: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    days90Plus: number;
    total: number;
  };
  payablesAging: {
    approvedExpenses: number;
    pendingPayroll: number;
    total: number;
  };
}

interface CachedFinanceOverview {
  data: FinanceOverviewData;
  cachedAt: number;
}
const financeOverviewCache = new Map<string, CachedFinanceOverview>();
const FINANCE_CACHE_TTL_MS = 45 * 1000; // 45 seconds

export function invalidateFinanceOverviewCache(organizationId?: string) {
  if (organizationId) {
    financeOverviewCache.delete(organizationId);
  } else {
    financeOverviewCache.clear();
  }
}

export class FinanceService {
  static isFinancialExecutive(user: AuthenticatedUser): boolean {
    const execRoles = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "ADMIN"];
    return execRoles.includes(user.roleCode);
  }

  /**
   * Aggregates real DB data for the executive finance dashboard with in-memory caching
   */
  static async getOverview(user: AuthenticatedUser, forceRefresh = false): Promise<FinanceOverviewData> {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const now = new Date();

    // Check in-memory telemetry cache
    if (!forceRefresh) {
      const cached = financeOverviewCache.get(orgId);
      if (cached && now.getTime() - cached.cachedAt < FINANCE_CACHE_TTL_MS) {
        return cached.data;
      }
    }

    // Execute all queries in parallel
    const [
      invoices,
      payments,
      expenses,
      payrollPeriods,
      pendingPayrollPeriods,
      txns,
      allTxns,
    ] = await Promise.all([
      db.invoice.findMany({
        where: { organizationId: orgId, status: { not: "CANCELLED" } },
        include: { client: { select: { name: true } } },
      }),
      db.payment.findMany({
        where: { organizationId: orgId, status: "COMPLETED" },
      }),
      db.expense.findMany({
        where: { organizationId: orgId, status: { not: "REJECTED" } },
      }),
      db.payrollPeriod.findMany({
        where: { organizationId: orgId, status: { in: ["APPROVED", "PROCESSED"] } },
      }),
      db.payrollPeriod.findMany({
        where: { organizationId: orgId, status: { in: ["CALCULATED", "REVIEWED"] } },
      }),
      db.financialTransaction.findMany({
        where: { organizationId: orgId },
        orderBy: { date: "desc" },
        take: 10,
      }),
      db.financialTransaction.findMany({
        where: { organizationId: orgId },
        select: { amount: true, direction: true, date: true, type: true },
      }),
    ]);

    let totalInvoiced = 0;
    let accountsReceivable = 0;
    let outstandingCount = 0;
    let outstandingAmount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    let agingCurrent = 0;
    let aging1_30 = 0;
    let aging31_60 = 0;
    let aging61_90 = 0;
    let aging90Plus = 0;

    for (const inv of invoices) {
      totalInvoiced += inv.total;
      if (inv.balance > 0) {
        accountsReceivable += inv.balance;
        outstandingCount++;
        outstandingAmount += inv.balance;

        const isOverdue = new Date(inv.dueDate) < now;
        if (isOverdue) {
          overdueCount++;
          overdueAmount += inv.balance;

          const diffMs = now.getTime() - new Date(inv.dueDate).getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays <= 30) aging1_30 += inv.balance;
          else if (diffDays <= 60) aging31_60 += inv.balance;
          else if (diffDays <= 90) aging61_90 += inv.balance;
          else aging90Plus += inv.balance;
        } else {
          agingCurrent += inv.balance;
        }
      }
    }

    const totalCollectedRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    let totalExpenses = 0;
    let approvedUnpaidExpenses = 0;
    for (const exp of expenses) {
      if (exp.status === "PAID" || exp.status === "APPROVED") {
        totalExpenses += exp.amount;
      }
      if (exp.status === "APPROVED") {
        approvedUnpaidExpenses += exp.amount;
      }
    }

    const payrollCost = payrollPeriods.reduce((sum, p) => sum + p.totalNet, 0);
    const pendingPayrollObligation = pendingPayrollPeriods.reduce((sum, p) => sum + p.totalNet, 0);

    const netProfit = totalCollectedRevenue - (totalExpenses + payrollCost);
    const accountsPayable = approvedUnpaidExpenses + pendingPayrollObligation;

    let totalInflow = 0;
    let totalOutflow = 0;
    for (const t of allTxns) {
      if (t.direction === "INFLOW") totalInflow += t.amount;
      else totalOutflow += t.amount;
    }

    // 7. Monthly Trends (Past 6 Months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const revenueTrend: Array<{ month: string; invoiced: number; collected: number }> = [];
    const expenseTrend: Array<{ month: string; expenses: number; payroll: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const label = `${monthNames[mIdx]} ${y.toString().slice(-2)}`;

      const mInvoiced = invoices
        .filter((inv) => {
          const invDate = new Date(inv.invoiceDate);
          return invDate.getMonth() === mIdx && invDate.getFullYear() === y;
        })
        .reduce((sum, inv) => sum + inv.total, 0);

      const mCollected = payments
        .filter((p) => {
          const pDate = new Date(p.paymentDate);
          return pDate.getMonth() === mIdx && pDate.getFullYear() === y;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const mExpenses = expenses
        .filter((exp) => {
          const expDate = new Date(exp.date);
          return expDate.getMonth() === mIdx && expDate.getFullYear() === y && exp.status === "PAID";
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

      const mPayroll = payrollPeriods
        .filter((pp) => pp.month === mIdx + 1 && pp.year === y)
        .reduce((sum, pp) => sum + pp.totalNet, 0);

      revenueTrend.push({ month: label, invoiced: Math.round(mInvoiced), collected: Math.round(mCollected) });
      expenseTrend.push({ month: label, expenses: Math.round(mExpenses), payroll: Math.round(mPayroll) });
    }

    const result: FinanceOverviewData = {
      kpis: {
        totalRevenue: Math.round(totalCollectedRevenue),
        totalExpenses: Math.round(totalExpenses + payrollCost),
        netProfit: Math.round(netProfit),
        accountsReceivable: Math.round(accountsReceivable),
        accountsPayable: Math.round(accountsPayable),
        outstandingInvoicesCount: outstandingCount,
        outstandingInvoicesAmount: Math.round(outstandingAmount),
        overdueInvoicesCount: overdueCount,
        overdueInvoicesAmount: Math.round(overdueAmount),
        payrollCost: Math.round(payrollCost),
      },
      revenueTrend,
      expenseTrend,
      cashFlow: {
        totalInflow: Math.round(totalInflow),
        totalOutflow: Math.round(totalOutflow),
        netCashFlow: Math.round(totalInflow - totalOutflow),
        recentTransactions: txns,
      },
      receivablesAging: {
        current: Math.round(agingCurrent),
        days1_30: Math.round(aging1_30),
        days31_60: Math.round(aging31_60),
        days61_90: Math.round(aging61_90),
        days90Plus: Math.round(aging90Plus),
        total: Math.round(accountsReceivable),
      },
      payablesAging: {
        approvedExpenses: Math.round(approvedUnpaidExpenses),
        pendingPayroll: Math.round(pendingPayrollObligation),
        total: Math.round(accountsPayable),
      },
    };

    financeOverviewCache.set(orgId, { data: result, cachedAt: Date.now() });
    return result;
  }
}
