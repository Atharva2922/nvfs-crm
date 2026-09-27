import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AccountsSeedService } from "./accounts-seed.service";
import { AuditService } from "./audit.service";

export interface CompanyBreakdownItem {
  id: string;
  name: string;
  code: string;
  currency: string;
  revenue: number;
  expenses: number;
  receivables: number;
  payables: number;
  netProfit: number;
  cashAndBank: number;
  outstandingInvoicesCount: number;
  outstandingBillsCount: number;
}

export interface EmployeeFinancialProfile {
  employee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string | null;
    designation: string;
    departmentName: string;
    departmentId: string | null;
    employmentStatus: string;
    employmentType: string;
    hireDate: string;
    workMode: string;
    location: string;
    avatarUrl?: string | null;
    manager: {
      id: string;
      name: string;
      designation: string;
      employeeNumber: string;
    } | null;
    company: {
      id: string;
      name: string;
      code: string;
      currency: string;
    };
  };
  financialSummary: {
    totalExpensesSubmitted: number;
    approvedExpenses: number;
    pendingExpenses: number;
    reimbursedExpenses: number;
    outstandingReimbursableBalance: number;
    advancesTotal: number;
  };
  expenses: Array<{
    id: string;
    expenseNumber: string;
    date: string;
    category: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    description: string | null;
    receiptUrl: string | null;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    type: string;
    reference: string;
    amount: number;
    status: string;
  }>;
}

export interface AccountsDashboardData {
  company: {
    id?: string;
    name: string;
    code: string;
    currency: string;
    fiscalYear: string;
    currentPeriod: string;
  };
  isConsolidated?: boolean;
  accessibleCompanies?: Array<{
    id: string;
    name: string;
    code: string;
    logo?: string | null;
    primaryColor?: string | null;
  }>;
  companyBreakdown?: CompanyBreakdownItem[];
  kpis: {
    revenue: {
      current: number;
      previous: number;
      changePercentage: number;
      trend: "up" | "down" | "flat";
    };
    receivables: {
      total: number;
      current: number;
      overdue: number;
      dueThisWeek: number;
    };
    payables: {
      total: number;
      overdue: number;
      dueThisWeek: number;
    };
    expenses: {
      current: number;
      previous: number;
      changePercentage: number;
      trend: "up" | "down" | "flat";
    };
    netProfit: {
      current: number;
      previous: number;
      changePercentage: number;
      marginPercentage: number;
    };
    cashAndBank: {
      total: number;
      bankBalances: number;
      cashBalances: number;
      accountsCount: number;
    };
    inventoryValue: {
      totalValue: number;
      itemsCount: number;
      lowStockCount: number;
    };
    taxLiability: {
      outputTax: number;
      inputTax: number;
      netTaxPayable: number;
    };
  };
  charts: {
    revenueVsExpenses: Array<{
      month: string;
      revenue: number;
      expenses: number;
      netProfit: number;
    }>;
    cashFlow: {
      inflow: number;
      outflow: number;
      net: number;
      monthly: Array<{ month: string; inflow: number; outflow: number; net: number }>;
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
      current: number;
      days1_30: number;
      days31_60: number;
      days61_90: number;
      days90Plus: number;
      total: number;
    };
    expenseBreakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  receivables: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    customerId?: string;
    companyName?: string;
    companyCode?: string;
    companyId?: string;
    invoiceDate: string;
    dueDate: string;
    total: number;
    paidAmount: number;
    balance: number;
    daysOverdue: number;
    status: string;
  }>;
  payables: Array<{
    id: string;
    billNumber: string;
    vendorName: string;
    vendorId?: string;
    companyName?: string;
    companyCode?: string;
    companyId?: string;
    billDate: string;
    dueDate: string;
    total: number;
    paidAmount: number;
    balance: number;
    daysOverdue: number;
    status: string;
  }>;
  banking: Array<{
    id: string;
    accountName: string;
    bankName: string;
    accountNumber: string;
    accountType: string;
    companyName?: string;
    companyCode?: string;
    companyId?: string;
    currentBalance: number;
    availableBalance: number;
    unreconciledCount: number;
    lastSyncedAt: string | null;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    type: string;
    reference: string;
    partyName: string;
    companyName?: string;
    companyCode?: string;
    companyId?: string;
    amount: number;
    direction: "INFLOW" | "OUTFLOW" | "NEUTRAL";
    paymentMethod: string;
    status: string;
  }>;
}

export class AccountsService {
  /**
   * Evaluates if the authenticated user has cross-company Central Accounts authorization
   */
  static isGlobalAccountsAuthorized(user: AuthenticatedUser): boolean {
    const role = (user.roleCode || user.roleName || "").toUpperCase();
    if (["SUPER_ADMIN", "ADMIN", "CFO", "CEO", "CHAIRPERSON", "ACCOUNTANT"].includes(role)) {
      return true;
    }
    const permissions = (user as unknown as { permissions?: string[] }).permissions || [];
    if (
      permissions.includes("accounts.global.view") ||
      permissions.includes("accounts.view") ||
      permissions.includes("all")
    ) {
      return true;
    }
    return false;
  }

  /**
   * Returns list of organizations the user is authorized to access in the Accounts module
   */
  static async getAccessibleOrganizations(user: AuthenticatedUser): Promise<
    Array<{
      id: string;
      name: string;
      code: string;
      currency: string;
      logo?: string | null;
      primaryColor?: string | null;
    }>
  > {
    if (this.isGlobalAccountsAuthorized(user)) {
      return await db.organization.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          code: true,
          currency: true,
          logo: true,
          primaryColor: true,
        },
        orderBy: { name: "asc" },
      });
    }

    const userOrgId = user.activeCompany?.id || user.employee?.organizationId;
    if (!userOrgId) return [];

    const org = await db.organization.findUnique({
      where: { id: userOrgId },
      select: {
        id: true,
        name: true,
        code: true,
        currency: true,
        logo: true,
        primaryColor: true,
      },
    });

    return org ? [org] : [];
  }

  /**
   * Resolves organization ID with multi-company isolation
   */
  static getOrgId(user: AuthenticatedUser): string {
    if (user.activeCompany?.id) return user.activeCompany.id;
    if (user.employee?.organizationId) return user.employee.organizationId;
    throw new Error("Unable to determine active organization context for accounting session");
  }

  /**
   * Calculates isolated accounting metrics and ledger feeds for a specific organization
   */
  private static async calculateSingleCompanyDashboard(
    orgId: string,
    now: Date
  ): Promise<AccountsDashboardData> {
    // Ensure default Chart of Accounts, Bank Accounts, and Tax Rates are primed
    await AccountsSeedService.ensureDefaultAccounts(orgId);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Determine current month and previous month bounds
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPreviousMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // One week from now for due this week
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Parallel fetch all data strictly scoped to organizationId
    const [
      org,
      invoices,
      payments,
      expenses,
      bankAccounts,
      products,
      journalEntries,
      taxRates,
    ] = await Promise.all([
      db.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, code: true, currency: true, fiscalYear: true },
      }),
      db.invoice.findMany({
        where: { organizationId: orgId },
        include: {
          client: { select: { id: true, name: true } },
          vendor: { select: { id: true, displayName: true, legalName: true } },
        },
        orderBy: { invoiceDate: "desc" },
      }),
      db.payment.findMany({
        where: { organizationId: orgId, status: "COMPLETED" },
        include: {
          client: { select: { name: true } },
          vendor: { select: { displayName: true } },
        },
        orderBy: { paymentDate: "desc" },
      }),
      db.expense.findMany({
        where: { organizationId: orgId, status: { not: "REJECTED" } },
        include: {
          employee: { select: { firstName: true, lastName: true } },
        },
        orderBy: { date: "desc" },
      }),
      db.bankAccount.findMany({
        where: { organizationId: orgId },
        include: {
          transactions: {
            where: { status: "UNRECONCILED" },
            select: { id: true },
          },
        },
      }),
      db.product.findMany({
        where: { organizationId: orgId },
        include: { inventoryItems: true },
      }),
      db.journalEntry.findMany({
        where: { organizationId: orgId },
        include: { lines: { include: { account: true } } },
        take: 20,
        orderBy: { date: "desc" },
      }),
      db.taxRate.findMany({
        where: { organizationId: orgId, isActive: true },
      }),
    ]);

    const companyName = org?.name || "Corporate Entity";
    const companyCode = org?.code || "COMP";

    // Split invoices into Sales Invoices vs Vendor Bills
    const salesInvoices = invoices.filter((i) => i.invoiceType !== "VENDOR_PURCHASE");
    const vendorBills = invoices.filter((i) => i.invoiceType === "VENDOR_PURCHASE");

    // 1. Revenue Calculations (Sales Invoices & Payments Received)
    const currentPeriodRevenue = salesInvoices
      .filter((i) => new Date(i.invoiceDate) >= startOfCurrentMonth && i.status !== "CANCELLED")
      .reduce((sum, i) => sum + i.total, 0);

    const prevPeriodRevenue = salesInvoices
      .filter(
        (i) =>
          new Date(i.invoiceDate) >= startOfPreviousMonth &&
          new Date(i.invoiceDate) <= endOfPreviousMonth &&
          i.status !== "CANCELLED"
      )
      .reduce((sum, i) => sum + i.total, 0);

    const revenueChange =
      prevPeriodRevenue === 0
        ? currentPeriodRevenue > 0
          ? 100
          : 0
        : Math.round(((currentPeriodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100);

    // 2. Receivables Calculations (Outstanding Customer Balances)
    let arTotal = 0;
    let arCurrent = 0;
    let arOverdue = 0;
    let arDueThisWeek = 0;

    let agingCurrent = 0;
    let aging1_30 = 0;
    let aging31_60 = 0;
    let aging61_90 = 0;
    let aging90Plus = 0;

    const outstandingReceivablesList: AccountsDashboardData["receivables"] = [];

    for (const inv of salesInvoices) {
      if (inv.status === "CANCELLED" || inv.balance <= 0) continue;

      const balance = inv.balance;
      arTotal += balance;

      const dueDate = new Date(inv.dueDate);
      const isOverdue = dueDate < now;
      const daysOverdue = isOverdue
        ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      if (isOverdue) {
        arOverdue += balance;
        if (daysOverdue <= 30) aging1_30 += balance;
        else if (daysOverdue <= 60) aging31_60 += balance;
        else if (daysOverdue <= 90) aging61_90 += balance;
        else aging90Plus += balance;
      } else {
        arCurrent += balance;
        agingCurrent += balance;
        if (dueDate <= oneWeekFromNow) {
          arDueThisWeek += balance;
        }
      }

      outstandingReceivablesList.push({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.client?.name || "Corporate Customer",
        customerId: inv.clientId || undefined,
        companyName,
        companyCode,
        companyId: orgId,
        invoiceDate: inv.invoiceDate.toISOString().split("T")[0],
        dueDate: inv.dueDate.toISOString().split("T")[0],
        total: inv.total,
        paidAmount: inv.paidAmount,
        balance: inv.balance,
        daysOverdue,
        status: isOverdue && inv.status !== "PAID" ? "OVERDUE" : inv.status,
      });
    }

    // 3. Payables Calculations (Vendor Bills + Approved Pending Expenses)
    let apTotal = 0;
    let apOverdue = 0;
    let apDueThisWeek = 0;

    let apAgingCurrent = 0;
    let apAging1_30 = 0;
    let apAging31_60 = 0;
    let apAging61_90 = 0;
    let apAging90Plus = 0;

    const upcomingPayablesList: AccountsDashboardData["payables"] = [];

    for (const bill of vendorBills) {
      if (bill.status === "CANCELLED" || bill.balance <= 0) continue;

      const balance = bill.balance;
      apTotal += balance;

      const dueDate = new Date(bill.dueDate);
      const isOverdue = dueDate < now;
      const daysOverdue = isOverdue
        ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      if (isOverdue) {
        apOverdue += balance;
        if (daysOverdue <= 30) apAging1_30 += balance;
        else if (daysOverdue <= 60) apAging31_60 += balance;
        else if (daysOverdue <= 90) apAging61_90 += balance;
        else apAging90Plus += balance;
      } else {
        apAgingCurrent += balance;
        if (dueDate <= oneWeekFromNow) {
          apDueThisWeek += balance;
        }
      }

      upcomingPayablesList.push({
        id: bill.id,
        billNumber: bill.invoiceNumber,
        vendorName: bill.vendor?.displayName || bill.vendor?.legalName || "Vendor",
        vendorId: bill.vendorId || undefined,
        companyName,
        companyCode,
        companyId: orgId,
        billDate: bill.invoiceDate.toISOString().split("T")[0],
        dueDate: bill.dueDate.toISOString().split("T")[0],
        total: bill.total,
        paidAmount: bill.paidAmount,
        balance: bill.balance,
        daysOverdue,
        status: isOverdue && bill.status !== "PAID" ? "OVERDUE" : bill.status,
      });
    }

    // Also include approved unpaid employee expenses in payables
    const unpaidApprovedExpenses = expenses.filter(
      (e) => e.status === "APPROVED" && !e.paidAt
    );
    for (const exp of unpaidApprovedExpenses) {
      apTotal += exp.amount;
      apAgingCurrent += exp.amount;
      upcomingPayablesList.push({
        id: exp.id,
        billNumber: exp.expenseNumber,
        vendorName: exp.employee
          ? `${exp.employee.firstName} ${exp.employee.lastName} (Reimbursement)`
          : "Employee Expense",
        companyName,
        companyCode,
        companyId: orgId,
        billDate: exp.date.toISOString().split("T")[0],
        dueDate: exp.date.toISOString().split("T")[0],
        total: exp.amount,
        paidAmount: 0,
        balance: exp.amount,
        daysOverdue: 0,
        status: "APPROVED_PENDING_PAYMENT",
      });
    }

    // 4. Expenses Calculations
    const currentPeriodExpenses = expenses
      .filter((e) => new Date(e.date) >= startOfCurrentMonth)
      .reduce((sum, e) => sum + e.amount, 0);

    const prevPeriodExpenses = expenses
      .filter(
        (e) =>
          new Date(e.date) >= startOfPreviousMonth &&
          new Date(e.date) <= endOfPreviousMonth
      )
      .reduce((sum, e) => sum + e.amount, 0);

    const expenseChange =
      prevPeriodExpenses === 0
        ? currentPeriodExpenses > 0
          ? 100
          : 0
        : Math.round(((currentPeriodExpenses - prevPeriodExpenses) / prevPeriodExpenses) * 100);

    // 5. Net Profit
    const netProfitCurrent = currentPeriodRevenue - currentPeriodExpenses;
    const netProfitPrev = prevPeriodRevenue - prevPeriodExpenses;
    const netProfitChange =
      netProfitPrev === 0
        ? netProfitCurrent > 0
          ? 100
          : 0
        : Math.round(((netProfitCurrent - netProfitPrev) / Math.abs(netProfitPrev)) * 100);
    const marginPercentage =
      currentPeriodRevenue > 0
        ? Math.round((netProfitCurrent / currentPeriodRevenue) * 100)
        : 0;

    // 6. Cash and Bank Balances
    let totalBankBalances = 0;
    let totalCashBalances = 0;

    const bankingData: AccountsDashboardData["banking"] = bankAccounts.map((b) => {
      if (b.accountType === "CASH") {
        totalCashBalances += b.currentBalance;
      } else {
        totalBankBalances += b.currentBalance;
      }
      return {
        id: b.id,
        accountName: b.accountName,
        bankName: b.bankName,
        accountNumber: b.accountNumber,
        accountType: b.accountType,
        companyName,
        companyCode,
        companyId: orgId,
        currentBalance: b.currentBalance,
        availableBalance: b.availableBalance,
        unreconciledCount: b.transactions.length,
        lastSyncedAt: b.lastSyncedAt ? b.lastSyncedAt.toISOString() : null,
      };
    });

    // 7. Inventory Value
    let inventoryTotalValue = 0;
    let lowStockCount = 0;
    for (const prod of products) {
      const onHand = prod.inventoryItems.reduce((acc, item) => acc + item.quantity, 0);
      const unitCost = prod.costPrice > 0 ? prod.costPrice : prod.sellingPrice * 0.6;
      inventoryTotalValue += onHand * unitCost;
      if (onHand <= prod.reorderLevel) {
        lowStockCount++;
      }
    }

    // 8. Tax / GST Liability
    let outputGst = 0;
    let inputGst = 0;
    for (const inv of salesInvoices) {
      if (inv.status !== "CANCELLED") outputGst += inv.taxAmount;
    }
    for (const bill of vendorBills) {
      if (bill.status !== "CANCELLED") inputGst += bill.taxAmount;
    }
    const netTaxPayable = Math.max(0, outputGst - inputGst);

    // 9. Revenue vs Expense Monthly Trend (Last 6 Months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueVsExpensesTrend = [];
    const monthlyCashFlowTrend = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const mStart = new Date(yr, mIdx, 1);
      const mEnd = new Date(yr, mIdx + 1, 0, 23, 59, 59);

      const mRevenue = salesInvoices
        .filter((inv) => {
          const invDate = new Date(inv.invoiceDate);
          return invDate >= mStart && invDate <= mEnd && inv.status !== "CANCELLED";
        })
        .reduce((sum, inv) => sum + inv.total, 0);

      const mExpenses = expenses
        .filter((exp) => {
          const expDate = new Date(exp.date);
          return expDate >= mStart && expDate <= mEnd && exp.status !== "REJECTED";
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

      const mInflow = payments
        .filter((p) => {
          const pDate = new Date(p.paymentDate);
          return pDate >= mStart && pDate <= mEnd && p.clientId !== null;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const mOutflow = payments
        .filter((p) => {
          const pDate = new Date(p.paymentDate);
          return pDate >= mStart && pDate <= mEnd && p.vendorId !== null;
        })
        .reduce((sum, p) => sum + p.amount, 0) + mExpenses;

      revenueVsExpensesTrend.push({
        month: `${monthNames[mIdx]} ${yr.toString().slice(2)}`,
        revenue: mRevenue,
        expenses: mExpenses,
        netProfit: mRevenue - mExpenses,
      });

      monthlyCashFlowTrend.push({
        month: `${monthNames[mIdx]} ${yr.toString().slice(2)}`,
        inflow: mInflow,
        outflow: mOutflow,
        net: mInflow - mOutflow,
      });
    }

    // 10. Expense Breakdown by Category
    const categoryMap = new Map<string, number>();
    let totalCategorizedExpenses = 0;
    for (const exp of expenses) {
      if (exp.status === "REJECTED") continue;
      const cat = exp.category || "General Office";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + exp.amount);
      totalCategorizedExpenses += exp.amount;
    }

    const expenseBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category: category.replace(/_/g, " "),
      amount,
      percentage: totalCategorizedExpenses > 0 ? Math.round((amount / totalCategorizedExpenses) * 100) : 0,
    }));

    // 11. Unified Recent Transactions Feed
    const recentTxns: AccountsDashboardData["recentTransactions"] = [];

    for (const pay of payments.slice(0, 10)) {
      recentTxns.push({
        id: pay.id,
        date: pay.paymentDate.toISOString().split("T")[0],
        type: pay.clientId ? "Customer Payment" : "Vendor Payment",
        reference: pay.paymentReference,
        partyName: pay.client?.name || pay.vendor?.displayName || "Third Party",
        companyName,
        companyCode,
        companyId: orgId,
        amount: pay.amount,
        direction: pay.clientId ? "INFLOW" : "OUTFLOW",
        paymentMethod: pay.paymentMethod,
        status: pay.status,
      });
    }

    for (const exp of expenses.slice(0, 8)) {
      recentTxns.push({
        id: exp.id,
        date: exp.date.toISOString().split("T")[0],
        type: "Expense Disbursed",
        reference: exp.expenseNumber,
        partyName: exp.employee ? `${exp.employee.firstName} ${exp.employee.lastName}` : exp.category,
        companyName,
        companyCode,
        companyId: orgId,
        amount: exp.amount,
        direction: "OUTFLOW",
        paymentMethod: exp.paymentMethod || "Corporate Transfer",
        status: exp.status,
      });
    }

    for (const jrn of journalEntries.slice(0, 5)) {
      recentTxns.push({
        id: jrn.id,
        date: jrn.date.toISOString().split("T")[0],
        type: `Journal Entry (${jrn.sourceType})`,
        reference: jrn.entryNumber,
        partyName: jrn.reference || "Double-Entry Ledger",
        companyName,
        companyCode,
        companyId: orgId,
        amount: jrn.totalAmount,
        direction: "NEUTRAL",
        paymentMethod: "Ledger",
        status: jrn.status,
      });
    }

    // Sort combined transactions by date descending
    recentTxns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      company: {
        id: org?.id,
        name: org?.name || "Enterprise Studio",
        code: org?.code || "APEX",
        currency: org?.currency || "INR",
        fiscalYear: `FY ${currentYear}-${(currentYear + 1).toString().slice(2)}`,
        currentPeriod: `${monthNames[currentMonth]} ${currentYear}`,
      },
      isConsolidated: false,
      kpis: {
        revenue: {
          current: currentPeriodRevenue,
          previous: prevPeriodRevenue,
          changePercentage: revenueChange,
          trend: revenueChange >= 0 ? "up" : "down",
        },
        receivables: {
          total: arTotal,
          current: arCurrent,
          overdue: arOverdue,
          dueThisWeek: arDueThisWeek,
        },
        payables: {
          total: apTotal,
          overdue: apOverdue,
          dueThisWeek: apDueThisWeek,
        },
        expenses: {
          current: currentPeriodExpenses,
          previous: prevPeriodExpenses,
          changePercentage: expenseChange,
          trend: expenseChange >= 0 ? "up" : "down",
        },
        netProfit: {
          current: netProfitCurrent,
          previous: netProfitPrev,
          changePercentage: netProfitChange,
          marginPercentage,
        },
        cashAndBank: {
          total: totalBankBalances + totalCashBalances,
          bankBalances: totalBankBalances,
          cashBalances: totalCashBalances,
          accountsCount: bankAccounts.length,
        },
        inventoryValue: {
          totalValue: inventoryTotalValue,
          itemsCount: products.length,
          lowStockCount,
        },
        taxLiability: {
          outputTax: outputGst,
          inputTax: inputGst,
          netTaxPayable,
        },
      },
      charts: {
        revenueVsExpenses: revenueVsExpensesTrend,
        cashFlow: {
          inflow: payments.filter((p) => p.clientId).reduce((s, p) => s + p.amount, 0),
          outflow: payments.filter((p) => p.vendorId).reduce((s, p) => s + p.amount, 0) + currentPeriodExpenses,
          net:
            payments.filter((p) => p.clientId).reduce((s, p) => s + p.amount, 0) -
            (payments.filter((p) => p.vendorId).reduce((s, p) => s + p.amount, 0) + currentPeriodExpenses),
          monthly: monthlyCashFlowTrend,
        },
        receivablesAging: {
          current: agingCurrent,
          days1_30: aging1_30,
          days31_60: aging31_60,
          days61_90: aging61_90,
          days90Plus: aging90Plus,
          total: arTotal,
        },
        payablesAging: {
          current: apAgingCurrent,
          days1_30: apAging1_30,
          days31_60: apAging31_60,
          days61_90: apAging61_90,
          days90Plus: apAging90Plus,
          total: apTotal,
        },
        expenseBreakdown,
      },
      receivables: outstandingReceivablesList.slice(0, 15),
      payables: upcomingPayablesList.slice(0, 15),
      banking: bankingData,
      recentTransactions: recentTxns.slice(0, 20),
    };
  }

  /**
   * Retrieves complete, real-time Accounts dashboard metrics.
   * If selectedCompanyId === "ALL" (or omitted for cross-company authorized users),
   * aggregates multi-company data into a consolidated corporate view with company-wise breakdown.
   */
  static async getDashboard(
    user: AuthenticatedUser,
    selectedCompanyId?: string,
    period?: string
  ): Promise<AccountsDashboardData> {
    const accessibleOrgs = await this.getAccessibleOrganizations(user);
    if (accessibleOrgs.length === 0) {
      throw new Error("No accessible company accounts found for user");
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // 1. Single Company requested
    if (selectedCompanyId && selectedCompanyId !== "ALL") {
      const isAllowed = accessibleOrgs.some((o) => o.id === selectedCompanyId);
      if (!isAllowed) {
        throw new Error("Forbidden: Cross-company access to this organization is unauthorized");
      }

      const singleDash = await this.calculateSingleCompanyDashboard(selectedCompanyId, now);
      singleDash.accessibleCompanies = accessibleOrgs;
      singleDash.isConsolidated = false;

      // Audit: log single company dashboard access
      await AuditService.log({
        actorId: user.id,
        organizationId: selectedCompanyId,
        action: "ACCOUNTS_DASHBOARD_VIEW",
        entity: "AccountsDashboard",
        entityId: selectedCompanyId,
        metadata: {
          scope: "SINGLE_COMPANY",
          companyId: selectedCompanyId,
          companyName: singleDash.company.name,
          isCrossCompany: (user.activeCompany?.id || user.employee?.organizationId) !== selectedCompanyId,
          viewerRole: user.roleCode || user.roleName,
          period,
        },
      }).catch(() => {}); // non-blocking

      return singleDash;
    }

    // 2. If user only has access to a single company, return that company's dashboard
    if (accessibleOrgs.length === 1) {
      const singleDash = await this.calculateSingleCompanyDashboard(accessibleOrgs[0].id, now);
      singleDash.accessibleCompanies = accessibleOrgs;
      singleDash.isConsolidated = false;
      return singleDash;
    }

    // 3. Consolidated View across all accessible companies
    const companyDashboards = await Promise.all(
      accessibleOrgs.map(async (org) => {
        const dash = await this.calculateSingleCompanyDashboard(org.id, now);
        return { org, dash };
      })
    );

    // Build Company-Wise Financial Breakdown
    const companyBreakdown: CompanyBreakdownItem[] = companyDashboards.map(({ org, dash }) => ({
      id: org.id,
      name: org.name,
      code: org.code,
      currency: org.currency || "INR",
      revenue: dash.kpis.revenue.current,
      expenses: dash.kpis.expenses.current,
      receivables: dash.kpis.receivables.total,
      payables: dash.kpis.payables.total,
      netProfit: dash.kpis.netProfit.current,
      cashAndBank: dash.kpis.cashAndBank.total,
      outstandingInvoicesCount: dash.receivables.length,
      outstandingBillsCount: dash.payables.length,
    }));

    // Aggregate Consolidated KPIs
    let totalRevenueCurrent = 0;
    let totalRevenuePrev = 0;
    let totalReceivables = 0;
    let totalReceivablesCurrent = 0;
    let totalReceivablesOverdue = 0;
    let totalReceivablesDueWeek = 0;
    let totalPayables = 0;
    let totalPayablesOverdue = 0;
    let totalPayablesDueWeek = 0;
    let totalExpensesCurrent = 0;
    let totalExpensesPrev = 0;
    let totalNetProfitCurrent = 0;
    let totalNetProfitPrev = 0;
    let totalCashAndBank = 0;
    let totalBankBalances = 0;
    let totalCashBalances = 0;
    let totalBankAccountsCount = 0;
    let totalInventoryValue = 0;
    let totalInventoryItems = 0;
    let totalLowStockCount = 0;
    let totalOutputTax = 0;
    let totalInputTax = 0;

    for (const { dash } of companyDashboards) {
      totalRevenueCurrent += dash.kpis.revenue.current;
      totalRevenuePrev += dash.kpis.revenue.previous;
      totalReceivables += dash.kpis.receivables.total;
      totalReceivablesCurrent += dash.kpis.receivables.current;
      totalReceivablesOverdue += dash.kpis.receivables.overdue;
      totalReceivablesDueWeek += dash.kpis.receivables.dueThisWeek;
      totalPayables += dash.kpis.payables.total;
      totalPayablesOverdue += dash.kpis.payables.overdue;
      totalPayablesDueWeek += dash.kpis.payables.dueThisWeek;
      totalExpensesCurrent += dash.kpis.expenses.current;
      totalExpensesPrev += dash.kpis.expenses.previous;
      totalNetProfitCurrent += dash.kpis.netProfit.current;
      totalNetProfitPrev += dash.kpis.netProfit.previous;
      totalCashAndBank += dash.kpis.cashAndBank.total;
      totalBankBalances += dash.kpis.cashAndBank.bankBalances;
      totalCashBalances += dash.kpis.cashAndBank.cashBalances;
      totalBankAccountsCount += dash.kpis.cashAndBank.accountsCount;
      totalInventoryValue += dash.kpis.inventoryValue.totalValue;
      totalInventoryItems += dash.kpis.inventoryValue.itemsCount;
      totalLowStockCount += dash.kpis.inventoryValue.lowStockCount;
      totalOutputTax += dash.kpis.taxLiability.outputTax;
      totalInputTax += dash.kpis.taxLiability.inputTax;
    }

    const consolidatedRevenueChange =
      totalRevenuePrev === 0
        ? totalRevenueCurrent > 0
          ? 100
          : 0
        : Math.round(((totalRevenueCurrent - totalRevenuePrev) / totalRevenuePrev) * 100);

    const consolidatedExpenseChange =
      totalExpensesPrev === 0
        ? totalExpensesCurrent > 0
          ? 100
          : 0
        : Math.round(((totalExpensesCurrent - totalExpensesPrev) / totalExpensesPrev) * 100);

    const consolidatedNetProfitChange =
      totalNetProfitPrev === 0
        ? totalNetProfitCurrent > 0
          ? 100
          : 0
        : Math.round(((totalNetProfitCurrent - totalNetProfitPrev) / Math.abs(totalNetProfitPrev || 1)) * 100);

    const consolidatedMarginPercentage =
      totalRevenueCurrent > 0 ? Math.round((totalNetProfitCurrent / totalRevenueCurrent) * 100) : 0;

    // Merge Monthly Chart Trends
    const consolidatedRevenueVsExpenses: AccountsDashboardData["charts"]["revenueVsExpenses"] = [];
    const consolidatedCashFlowMonthly: AccountsDashboardData["charts"]["cashFlow"]["monthly"] = [];

    const monthCount = companyDashboards[0]?.dash.charts.revenueVsExpenses.length || 6;
    for (let i = 0; i < monthCount; i++) {
      const monthLabel = companyDashboards[0]?.dash.charts.revenueVsExpenses[i]?.month || "";
      let mRev = 0;
      let mExp = 0;
      let mInflow = 0;
      let mOutflow = 0;

      for (const { dash } of companyDashboards) {
        const itemRev = dash.charts.revenueVsExpenses[i];
        if (itemRev) {
          mRev += itemRev.revenue;
          mExp += itemRev.expenses;
        }
        const itemCash = dash.charts.cashFlow.monthly[i];
        if (itemCash) {
          mInflow += itemCash.inflow;
          mOutflow += itemCash.outflow;
        }
      }

      consolidatedRevenueVsExpenses.push({
        month: monthLabel,
        revenue: mRev,
        expenses: mExp,
        netProfit: mRev - mExp,
      });

      consolidatedCashFlowMonthly.push({
        month: monthLabel,
        inflow: mInflow,
        outflow: mOutflow,
        net: mInflow - mOutflow,
      });
    }

    // Merge Aging & Categories
    let consolidatedAgingCurrent = 0;
    let consolidatedAging1_30 = 0;
    let consolidatedAging31_60 = 0;
    let consolidatedAging61_90 = 0;
    let consolidatedAging90Plus = 0;

    let consolidatedApAgingCurrent = 0;
    let consolidatedApAging1_30 = 0;
    let consolidatedApAging31_60 = 0;
    let consolidatedApAging61_90 = 0;
    let consolidatedApAging90Plus = 0;

    const consolidatedCategoryMap = new Map<string, number>();

    const allReceivables: AccountsDashboardData["receivables"] = [];
    const allPayables: AccountsDashboardData["payables"] = [];
    const allBanking: AccountsDashboardData["banking"] = [];
    const allRecentTxns: AccountsDashboardData["recentTransactions"] = [];

    for (const { dash } of companyDashboards) {
      consolidatedAgingCurrent += dash.charts.receivablesAging.current;
      consolidatedAging1_30 += dash.charts.receivablesAging.days1_30;
      consolidatedAging31_60 += dash.charts.receivablesAging.days31_60;
      consolidatedAging61_90 += dash.charts.receivablesAging.days61_90;
      consolidatedAging90Plus += dash.charts.receivablesAging.days90Plus;

      consolidatedApAgingCurrent += dash.charts.payablesAging.current;
      consolidatedApAging1_30 += dash.charts.payablesAging.days1_30;
      consolidatedApAging31_60 += dash.charts.payablesAging.days31_60;
      consolidatedApAging61_90 += dash.charts.payablesAging.days61_90;
      consolidatedApAging90Plus += dash.charts.payablesAging.days90Plus;

      for (const cat of dash.charts.expenseBreakdown) {
        consolidatedCategoryMap.set(cat.category, (consolidatedCategoryMap.get(cat.category) || 0) + cat.amount);
      }

      allReceivables.push(...dash.receivables);
      allPayables.push(...dash.payables);
      allBanking.push(...dash.banking);
      allRecentTxns.push(...dash.recentTransactions);
    }

    const totalConsolidatedCatExpenses = Array.from(consolidatedCategoryMap.values()).reduce((s, v) => s + v, 0);
    const consolidatedExpenseBreakdown = Array.from(consolidatedCategoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalConsolidatedCatExpenses > 0 ? Math.round((amount / totalConsolidatedCatExpenses) * 100) : 0,
    }));

    allReceivables.sort((a, b) => b.balance - a.balance);
    allPayables.sort((a, b) => b.balance - a.balance);
    allRecentTxns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalCashInflow = companyDashboards.reduce((s, c) => s + c.dash.charts.cashFlow.inflow, 0);
    const totalCashOutflow = companyDashboards.reduce((s, c) => s + c.dash.charts.cashFlow.outflow, 0);

    const consolidatedResult = {
      company: {
        id: "ALL",
        name: "Consolidated Corporate Accounts",
        code: "ALL",
        currency: "INR",
        fiscalYear: `FY ${currentYear}-${(currentYear + 1).toString().slice(2)}`,
        currentPeriod: `${monthNames[now.getMonth()]} ${currentYear} (All Entities)`,
      },
      isConsolidated: true,
      accessibleCompanies: accessibleOrgs,
      companyBreakdown,
      kpis: {
        revenue: {
          current: totalRevenueCurrent,
          previous: totalRevenuePrev,
          changePercentage: consolidatedRevenueChange,
          trend: consolidatedRevenueChange >= 0 ? "up" : "down",
        },
        receivables: {
          total: totalReceivables,
          current: totalReceivablesCurrent,
          overdue: totalReceivablesOverdue,
          dueThisWeek: totalReceivablesDueWeek,
        },
        payables: {
          total: totalPayables,
          overdue: totalPayablesOverdue,
          dueThisWeek: totalPayablesDueWeek,
        },
        expenses: {
          current: totalExpensesCurrent,
          previous: totalExpensesPrev,
          changePercentage: consolidatedExpenseChange,
          trend: consolidatedExpenseChange >= 0 ? "up" : "down",
        },
        netProfit: {
          current: totalNetProfitCurrent,
          previous: totalNetProfitPrev,
          changePercentage: consolidatedNetProfitChange,
          marginPercentage: consolidatedMarginPercentage,
        },
        cashAndBank: {
          total: totalCashAndBank,
          bankBalances: totalBankBalances,
          cashBalances: totalCashBalances,
          accountsCount: totalBankAccountsCount,
        },
        inventoryValue: {
          totalValue: totalInventoryValue,
          itemsCount: totalInventoryItems,
          lowStockCount: totalLowStockCount,
        },
        taxLiability: {
          outputTax: totalOutputTax,
          inputTax: totalInputTax,
          netTaxPayable: Math.max(0, totalOutputTax - totalInputTax),
        },
      },
      charts: {
        revenueVsExpenses: consolidatedRevenueVsExpenses,
        cashFlow: {
          inflow: totalCashInflow,
          outflow: totalCashOutflow,
          net: totalCashInflow - totalCashOutflow,
          monthly: consolidatedCashFlowMonthly,
        },
        receivablesAging: {
          current: consolidatedAgingCurrent,
          days1_30: consolidatedAging1_30,
          days31_60: consolidatedAging31_60,
          days61_90: consolidatedAging61_90,
          days90Plus: consolidatedAging90Plus,
          total: totalReceivables,
        },
        payablesAging: {
          current: consolidatedApAgingCurrent,
          days1_30: consolidatedApAging1_30,
          days31_60: consolidatedApAging31_60,
          days61_90: consolidatedApAging61_90,
          days90Plus: consolidatedApAging90Plus,
          total: totalPayables,
        },
        expenseBreakdown: consolidatedExpenseBreakdown,
      },
      receivables: allReceivables.slice(0, 15),
      payables: allPayables.slice(0, 15),
      banking: allBanking,
      recentTransactions: allRecentTxns.slice(0, 25),
    };

    // Audit: log consolidated cross-company dashboard access (non-blocking)
    AuditService.log({
      actorId: user.id,
      organizationId: user.activeCompany?.id || user.employee?.organizationId || null,
      action: "ACCOUNTS_DASHBOARD_CONSOLIDATED_VIEW",
      entity: "AccountsDashboard",
      entityId: "ALL",
      metadata: {
        scope: "CONSOLIDATED_ALL_COMPANIES",
        companiesCount: accessibleOrgs.length,
        companyIds: accessibleOrgs.map((o) => o.id),
        viewerRole: user.roleCode || user.roleName,
        period,
      },
    }).catch(() => {});

    return consolidatedResult as AccountsDashboardData;
  }

  /**
   * Centralized Financial Search across ALL companies
   * Supports: Employees, Customers, Vendors, Invoices, Bills, Payments, Expenses, Journals, Accounts, Companies
   */
  static async globalSearch(user: AuthenticatedUser, query: string, companyFilter?: string) {
    if (!query || query.trim().length < 2) {
      return { results: [], byCategory: {}, totalCount: 0 };
    }

    const accessibleOrgs = await this.getAccessibleOrganizations(user);
    const accessibleOrgIds = accessibleOrgs.map((o) => o.id);

    let targetOrgIds = accessibleOrgIds;
    if (companyFilter && companyFilter !== "ALL") {
      if (!accessibleOrgIds.includes(companyFilter)) {
        throw new Error("Forbidden: Cross-company search filter unauthorized");
      }
      targetOrgIds = [companyFilter];
    }

    const q = query.trim();

    // Parallel fetch across all searchable entities in authorized scope
    const [
      employees,
      clients,
      vendors,
      invoices,
      payments,
      expenses,
      journals,
      accounts,
      bankAccounts,
      matchingOrgs,
    ] = await Promise.all([
      db.employee.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { employeeNumber: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { designation: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
        include: {
          organization: { select: { id: true, name: true, code: true } },
          department: { select: { name: true } },
        },
      }),
      db.client.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 6,
        include: { organization: { select: { id: true, name: true, code: true } } },
      }),
      db.vendor.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { legalName: { contains: q, mode: "insensitive" } },
            { vendorCode: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 6,
        include: { organization: { select: { id: true, name: true, code: true } } },
      }),
      db.invoice.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
        include: {
          organization: { select: { id: true, name: true, code: true } },
          client: { select: { name: true } },
          vendor: { select: { displayName: true } },
        },
      }),
      db.payment.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          OR: [
            { paymentReference: { contains: q, mode: "insensitive" } },
            { transactionRef: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 6,
        include: {
          organization: { select: { id: true, name: true, code: true } },
          client: { select: { name: true } },
          vendor: { select: { displayName: true } },
        },
      }),
      db.expense.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          OR: [
            { expenseNumber: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 6,
        include: {
          organization: { select: { id: true, name: true, code: true } },
          employee: { select: { firstName: true, lastName: true } },
        },
      }),
      db.journalEntry.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          OR: [
            { entryNumber: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        include: { organization: { select: { id: true, name: true, code: true } } },
      }),
      db.account.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        include: { organization: { select: { id: true, name: true, code: true } } },
      }),
      db.bankAccount.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          OR: [
            { accountName: { contains: q, mode: "insensitive" } },
            { bankName: { contains: q, mode: "insensitive" } },
            { accountNumber: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 4,
        include: { organization: { select: { id: true, name: true, code: true } } },
      }),
      db.organization.findMany({
        where: {
          id: { in: targetOrgIds },
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 4,
      }),
    ]);

    // Format results with mandatory company context
    interface SearchResultItem {
      id: string;
      category: string;
      type: string;
      title: string;
      subtitle: string;
      url: string;
      status?: string;
      companyId: string;
      companyName: string;
      companyCode: string;
      details?: Record<string, string | number | null | undefined>;
    }

    const results: SearchResultItem[] = [];

    // Companies
    for (const org of matchingOrgs) {
      results.push({
        id: org.id,
        category: "Companies",
        type: "Company",
        title: org.name,
        subtitle: `Code: ${org.code} • Currency: ${org.currency || "INR"}`,
        url: `/app/accounts?companyId=${org.id}`,
        companyId: org.id,
        companyName: org.name,
        companyCode: org.code,
      });
    }

    // Employees
    for (const emp of employees) {
      results.push({
        id: emp.id,
        category: "Employees",
        type: "Employee",
        title: `${emp.firstName} ${emp.lastName}`,
        subtitle: `${emp.designation} • ${emp.department?.name || "General"} • ${emp.employeeNumber}`,
        url: `/app/accounts/employees/${emp.id}`,
        status: emp.employmentStatus,
        companyId: emp.organizationId,
        companyName: emp.organization.name,
        companyCode: emp.organization.code,
        details: {
          employeeNumber: emp.employeeNumber,
          department: emp.department?.name,
          designation: emp.designation,
          email: emp.email,
          phone: emp.phone,
        },
      });
    }

    // Customers / Clients
    for (const c of clients) {
      results.push({
        id: c.id,
        category: "Customers",
        type: "Customer",
        title: c.name,
        subtitle: `${c.code} • ${c.email || "No email"}`,
        url: `/app/accounts/sales/customers?id=${c.id}`,
        companyId: c.organizationId,
        companyName: c.organization.name,
        companyCode: c.organization.code,
      });
    }

    // Vendors
    for (const v of vendors) {
      results.push({
        id: v.id,
        category: "Vendors",
        type: "Vendor",
        title: v.displayName || v.legalName,
        subtitle: `${v.vendorCode} • ${v.email || "No email"}`,
        url: `/app/accounts/purchases/vendors?id=${v.id}`,
        companyId: v.organizationId,
        companyName: v.organization.name,
        companyCode: v.organization.code,
      });
    }

    // Invoices and Bills
    for (const inv of invoices) {
      const isBill = inv.invoiceType === "VENDOR_PURCHASE";
      results.push({
        id: inv.id,
        category: isBill ? "Bills" : "Invoices",
        type: isBill ? "Bill" : "Invoice",
        title: `${isBill ? "Bill" : "Invoice"} #${inv.invoiceNumber}`,
        subtitle: `${inv.client?.name || inv.vendor?.displayName || "N/A"} • ₹${inv.total.toLocaleString("en-IN")}`,
        url: `/app/accounts/${isBill ? "purchases/bills" : "sales/invoices"}?id=${inv.id}`,
        status: inv.status,
        companyId: inv.organizationId,
        companyName: inv.organization.name,
        companyCode: inv.organization.code,
        details: {
          total: inv.total,
          balance: inv.balance,
          paidAmount: inv.paidAmount,
        },
      });
    }

    // Payments
    for (const p of payments) {
      results.push({
        id: p.id,
        category: "Payments",
        type: "Payment",
        title: `Payment #${p.paymentReference}`,
        subtitle: `${p.client?.name || p.vendor?.displayName || "Third Party"} • ₹${p.amount.toLocaleString("en-IN")}`,
        url: `/app/accounts/sales/payments?id=${p.id}`,
        status: p.status,
        companyId: p.organizationId,
        companyName: p.organization.name,
        companyCode: p.organization.code,
      });
    }

    // Expenses
    for (const exp of expenses) {
      results.push({
        id: exp.id,
        category: "Expenses",
        type: "Expense",
        title: `Expense #${exp.expenseNumber} — ${exp.category}`,
        subtitle: `${exp.employee ? `${exp.employee.firstName} ${exp.employee.lastName}` : "Expense"} • ₹${exp.amount.toLocaleString("en-IN")}`,
        url: `/app/accounts/purchases/expenses?id=${exp.id}`,
        status: exp.status,
        companyId: exp.organizationId,
        companyName: exp.organization.name,
        companyCode: exp.organization.code,
      });
    }

    // Journal Entries
    for (const j of journals) {
      results.push({
        id: j.id,
        category: "Journal Entries",
        type: "Journal Entry",
        title: `Journal #${j.entryNumber}`,
        subtitle: `${j.reference || j.sourceType} • ₹${j.totalAmount.toLocaleString("en-IN")}`,
        url: `/app/accounts/accounting/journals?id=${j.id}`,
        status: j.status,
        companyId: j.organizationId,
        companyName: j.organization.name,
        companyCode: j.organization.code,
      });
    }

    // Chart of Accounts
    for (const a of accounts) {
      results.push({
        id: a.id,
        category: "Accounts",
        type: "Account",
        title: `${a.code} - ${a.name}`,
        subtitle: `${a.type} • ${a.subcategory}`,
        url: `/app/accounts/accounting/chart-of-accounts?id=${a.id}`,
        companyId: a.organizationId,
        companyName: a.organization.name,
        companyCode: a.organization.code,
      });
    }

    // Bank Accounts
    for (const b of bankAccounts) {
      results.push({
        id: b.id,
        category: "Accounts",
        type: "Bank Account",
        title: b.accountName,
        subtitle: `${b.bankName} • ${b.accountNumber} • Balance: ₹${b.currentBalance.toLocaleString("en-IN")}`,
        url: `/app/accounts/banking/accounts?id=${b.id}`,
        companyId: b.organizationId,
        companyName: b.organization.name,
        companyCode: b.organization.code,
      });
    }

    // Group by category for quick tabbed filtering
    const byCategory: Record<string, SearchResultItem[]> = {};
    for (const item of results) {
      if (!byCategory[item.category]) {
        byCategory[item.category] = [];
      }
      byCategory[item.category].push(item);
    }

    return {
      results,
      byCategory,
      totalCount: results.length,
      accessibleCompanies: accessibleOrgs,
    };
  }

  /**
   * Retrieves complete Employee Financial Profile for Central Accounts
   * Includes personal info, company context, approved/pending/reimbursed expenses,
   * advances, and transaction history. Logs cross-company audit event.
   */
  static async getEmployeeFinancialProfile(
    user: AuthenticatedUser,
    employeeId: string
  ): Promise<EmployeeFinancialProfile> {
    const accessibleOrgs = await this.getAccessibleOrganizations(user);
    const accessibleOrgIds = accessibleOrgs.map((o) => o.id);

    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        organization: true,
        department: true,
        manager: true,
        user: true,
        submittedExpenses: {
          orderBy: { date: "desc" },
          take: 25,
        },
      },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    if (!accessibleOrgIds.includes(employee.organizationId)) {
      throw new Error("Forbidden: Cross-company access to this employee accounting profile is unauthorized");
    }

    // Requirement 16: Audit cross-company employee access
    await AuditService.log({
      actorId: user.id,
      organizationId: employee.organizationId,
      action: "ACCOUNTS_EMPLOYEE_PROFILE_VIEW",
      entity: "Employee",
      entityId: employee.id,
      metadata: {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeCompany: employee.organization.name,
        viewerRole: user.roleCode || user.roleName,
        isCrossCompany: (user.activeCompany?.id || user.employee?.organizationId) !== employee.organizationId,
      },
    });

    // Compute financial summary from all employee expenses
    const allExpenses = await db.expense.findMany({
      where: { employeeId: employee.id },
    });

    let totalExpensesSubmitted = 0;
    let approvedExpenses = 0;
    let pendingExpenses = 0;
    let reimbursedExpenses = 0;

    for (const exp of allExpenses) {
      totalExpensesSubmitted += exp.amount;
      if (exp.status === "APPROVED") approvedExpenses += exp.amount;
      else if (exp.status === "PENDING" || exp.status === "DRAFT") pendingExpenses += exp.amount;
      else if (exp.status === "REIMBURSED") reimbursedExpenses += exp.amount;
    }

    const outstandingReimbursableBalance = Math.max(0, approvedExpenses - reimbursedExpenses);

    return {
      employee: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        phone: employee.phone,
        designation: employee.designation,
        departmentName: employee.department?.name || "General",
        departmentId: employee.departmentId,
        employmentStatus: employee.employmentStatus,
        employmentType: employee.employmentType,
        hireDate: employee.hireDate ? employee.hireDate.toISOString().split("T")[0] : "N/A",
        workMode: employee.workMode,
        location: employee.location,
        avatarUrl: employee.avatarUrl || null,
        manager: employee.manager
          ? {
              id: employee.manager.id,
              name: `${employee.manager.firstName} ${employee.manager.lastName}`,
              designation: employee.manager.designation,
              employeeNumber: employee.manager.employeeNumber,
            }
          : null,
        company: {
          id: employee.organization.id,
          name: employee.organization.name,
          code: employee.organization.code,
          currency: employee.organization.currency || "INR",
        },
      },
      financialSummary: {
        totalExpensesSubmitted,
        approvedExpenses,
        pendingExpenses,
        reimbursedExpenses,
        outstandingReimbursableBalance,
        advancesTotal: 0,
      },
      expenses: employee.submittedExpenses.map((e) => ({
        id: e.id,
        expenseNumber: e.expenseNumber,
        date: e.date.toISOString().split("T")[0],
        category: e.category,
        amount: e.amount,
        currency: e.currency,
        status: e.status,
        paymentMethod: e.paymentMethod || "REIMBURSEMENT",
        description: e.description,
        receiptUrl: e.receiptUrl,
      })),
      recentTransactions: employee.submittedExpenses.slice(0, 15).map((e) => ({
        id: e.id,
        date: e.date.toISOString().split("T")[0],
        type: "EXPENSE",
        reference: e.expenseNumber,
        amount: e.amount,
        status: e.status,
      })),
    };
  }

  /**
   * Retrieves complete Company Financial Overview for Central Accounts
   */
  static async getCompanyFinancialOverview(user: AuthenticatedUser, companyId: string) {
    const accessibleOrgs = await this.getAccessibleOrganizations(user);
    if (!accessibleOrgs.some((o) => o.id === companyId)) {
      throw new Error("Forbidden: Cross-company access to requested organization profile denied");
    }

    await AccountsSeedService.ensureDefaultAccounts(companyId);
    const now = new Date();
    const dashboard = await this.calculateSingleCompanyDashboard(companyId, now);

    const [empCount, clientCount, vendorCount, invoiceCount, billCount, expCount, journalCount] =
      await Promise.all([
        db.employee.count({ where: { organizationId: companyId } }),
        db.client.count({ where: { organizationId: companyId } }),
        db.vendor.count({ where: { organizationId: companyId } }),
        db.invoice.count({ where: { organizationId: companyId, invoiceType: { not: "VENDOR_PURCHASE" } } }),
        db.invoice.count({ where: { organizationId: companyId, invoiceType: "VENDOR_PURCHASE" } }),
        db.expense.count({ where: { organizationId: companyId } }),
        db.journalEntry.count({ where: { organizationId: companyId } }),
      ]);

    // Audit log
    await AuditService.log({
      actorId: user.id,
      organizationId: companyId,
      action: "ACCOUNTS_COMPANY_OVERVIEW_VIEW",
      entity: "Organization",
      entityId: companyId,
      metadata: {
        viewerRole: user.roleCode || user.roleName,
        companyName: dashboard.company.name,
      },
    });

    return {
      company: dashboard.company,
      kpis: dashboard.kpis,
      counts: {
        employees: empCount,
        customers: clientCount,
        vendors: vendorCount,
        invoices: invoiceCount,
        bills: billCount,
        expenses: expCount,
        journalEntries: journalCount,
      },
      charts: dashboard.charts,
      receivables: dashboard.receivables,
      payables: dashboard.payables,
      banking: dashboard.banking,
    };
  }

  /**
   * Global Transaction Ledger across all accessible companies
   */
  static async getGlobalTransactions(
    user: AuthenticatedUser,
    options: {
      companyId?: string;
      type?: string;
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const accessibleOrgs = await this.getAccessibleOrganizations(user);
    const accessibleOrgIds = accessibleOrgs.map((o) => o.id);

    let targetOrgIds = accessibleOrgIds;
    if (options.companyId && options.companyId !== "ALL") {
      if (!accessibleOrgIds.includes(options.companyId)) {
        throw new Error("Forbidden: Cross-company transaction access denied");
      }
      targetOrgIds = [options.companyId];
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(10, options.limit || 25));
    const skip = (page - 1) * limit;

    const q = options.search?.trim();

    // Query Invoices/Bills, Payments, Expenses across targetOrgIds
    const [invoices, payments, expenses] = await Promise.all([
      db.invoice.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          ...(options.status ? { status: options.status } : {}),
          ...(q
            ? {
                OR: [
                  { invoiceNumber: { contains: q, mode: "insensitive" } },
                  { notes: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          organization: { select: { id: true, name: true, code: true } },
          client: { select: { name: true } },
          vendor: { select: { displayName: true } },
        },
        take: 100,
        orderBy: { invoiceDate: "desc" },
      }),
      db.payment.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          ...(options.status ? { status: options.status } : {}),
          ...(q
            ? {
                OR: [
                  { paymentReference: { contains: q, mode: "insensitive" } },
                  { transactionRef: { contains: q, mode: "insensitive" } },
                  { notes: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          organization: { select: { id: true, name: true, code: true } },
          client: { select: { name: true } },
          vendor: { select: { displayName: true } },
        },
        take: 100,
        orderBy: { paymentDate: "desc" },
      }),
      db.expense.findMany({
        where: {
          organizationId: { in: targetOrgIds },
          ...(options.status ? { status: options.status } : {}),
          ...(q
            ? {
                OR: [
                  { expenseNumber: { contains: q, mode: "insensitive" } },
                  { category: { contains: q, mode: "insensitive" } },
                  { description: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          organization: { select: { id: true, name: true, code: true } },
          employee: { select: { firstName: true, lastName: true } },
        },
        take: 100,
        orderBy: { date: "desc" },
      }),
    ]);

    interface NormalizedTxn {
      id: string;
      date: string;
      transactionId: string;
      type: "INVOICE" | "BILL" | "PAYMENT" | "EXPENSE";
      companyId: string;
      companyName: string;
      companyCode: string;
      partyName: string;
      account: string;
      amount: number;
      paymentMethod: string;
      status: string;
      direction: "INFLOW" | "OUTFLOW" | "NEUTRAL";
      notes?: string | null;
    }

    const allTxns: NormalizedTxn[] = [];

    // Invoices / Bills
    for (const inv of invoices) {
      const isBill = inv.invoiceType === "VENDOR_PURCHASE";
      allTxns.push({
        id: inv.id,
        date: inv.invoiceDate.toISOString().split("T")[0],
        transactionId: inv.invoiceNumber,
        type: isBill ? "BILL" : "INVOICE",
        companyId: inv.organizationId,
        companyName: inv.organization?.name || "Company",
        companyCode: inv.organization?.code || "COMP",
        partyName: isBill ? inv.vendor?.displayName || "Vendor" : inv.client?.name || "Customer",
        account: isBill ? "Accounts Payable" : "Accounts Receivable",
        amount: inv.total,
        paymentMethod: "Credit",
        status: inv.status,
        direction: isBill ? "OUTFLOW" : "INFLOW",
        notes: inv.notes,
      });
    }

    // Payments
    for (const p of payments) {
      allTxns.push({
        id: p.id,
        date: p.paymentDate.toISOString().split("T")[0],
        transactionId: p.paymentReference,
        type: "PAYMENT",
        companyId: p.organizationId,
        companyName: p.organization?.name || "Company",
        companyCode: p.organization?.code || "COMP",
        partyName: p.client?.name || p.vendor?.displayName || "Third Party",
        account: "Bank & Cash",
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        status: p.status,
        direction: p.clientId ? "INFLOW" : "OUTFLOW",
        notes: p.notes,
      });
    }

    // Expenses
    for (const exp of expenses) {
      allTxns.push({
        id: exp.id,
        date: exp.date.toISOString().split("T")[0],
        transactionId: exp.expenseNumber,
        type: "EXPENSE",
        companyId: exp.organizationId,
        companyName: exp.organization?.name || "Company",
        companyCode: exp.organization?.code || "COMP",
        partyName: exp.employee ? `${exp.employee.firstName} ${exp.employee.lastName}` : "Expense",
        account: `Expense: ${exp.category}`,
        amount: exp.amount,
        paymentMethod: exp.paymentMethod || "CORPORATE_TRANSFER",
        status: exp.status,
        direction: "OUTFLOW",
        notes: exp.description,
      });
    }

    // Apply type filter if requested
    let filtered = allTxns;
    if (options.type && options.type !== "ALL") {
      filtered = filtered.filter((t) => t.type === options.type);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalCount = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    return {
      transactions: paginated,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      accessibleCompanies: accessibleOrgs,
    };
  }

  /**
   * Records a Customer Payment with Double-Entry Journal auto-posting
   */
  static async recordCustomerPayment(
    user: AuthenticatedUser,
    data: {
      invoiceId: string;
      amount: number;
      paymentDate?: string;
      paymentMethod: string;
      reference?: string;
      bankAccountId?: string;
      notes?: string;
    }
  ) {
    const orgId = this.getOrgId(user);
    const invoice = await db.invoice.findFirst({
      where: { id: data.invoiceId, organizationId: orgId },
      include: { client: true },
    });

    if (!invoice) throw new Error("Invoice not found in current organization");
    if (data.amount <= 0) throw new Error("Payment amount must be greater than zero");

    const newPaidAmount = invoice.paidAmount + data.amount;
    const newBalance = Math.max(0, invoice.total - newPaidAmount);
    const newStatus = newBalance === 0 ? "PAID" : "PARTIALLY_PAID";

    const paymentRef = data.reference || `PAY-${Date.now().toString().slice(-6)}`;

    // 1. Create Payment record
    const payment = await db.payment.create({
      data: {
        organizationId: orgId,
        paymentReference: paymentRef,
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        amount: data.amount,
        currency: invoice.currency,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        paymentMethod: data.paymentMethod,
        transactionRef: data.reference,
        notes: data.notes,
        status: "COMPLETED",
        recordedById: user.employee?.id || "",
      },
    });

    // 2. Update Invoice
    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      },
    });

    // 3. Post Double-Entry Journal: Dr. Bank / Cr. Accounts Receivable
    const bankAccountAcc = data.bankAccountId
      ? await db.bankAccount.findUnique({ where: { id: data.bankAccountId }, select: { accountId: true } })
      : null;

    const bankAcc =
      (bankAccountAcc?.accountId
        ? await db.account.findUnique({ where: { id: bankAccountAcc.accountId } })
        : null) ||
      (await db.account.findFirst({ where: { organizationId: orgId, code: "1030" } })) ||
      (await db.account.findFirst({ where: { organizationId: orgId, subcategory: "BANK" } }));

    const arAcc =
      (await db.account.findFirst({ where: { organizationId: orgId, code: "1100" } })) ||
      (await db.account.findFirst({ where: { organizationId: orgId, type: "ASSET" } }));

    if (bankAcc && arAcc) {
      const journalNumber = `JRN-${Date.now().toString().slice(-6)}`;
      await db.journalEntry.create({
        data: {
          organizationId: orgId,
          entryNumber: journalNumber,
          reference: `Payment for ${invoice.invoiceNumber}`,
          sourceType: "PAYMENT",
          sourceId: payment.id,
          totalAmount: data.amount,
          status: "POSTED",
          lines: {
            create: [
              {
                accountId: bankAcc.id,
                type: "DEBIT",
                amount: data.amount,
                description: `Payment received from ${invoice.client?.name || "Client"}`,
                entityType: "CLIENT",
                entityId: invoice.clientId || undefined,
              },
              {
                accountId: arAcc.id,
                type: "CREDIT",
                amount: data.amount,
                description: `Settlement for Invoice #${invoice.invoiceNumber}`,
                entityType: "CLIENT",
                entityId: invoice.clientId || undefined,
              },
            ],
          },
        },
      });

      // Update Bank balance
      await db.account.update({
        where: { id: bankAcc.id },
        data: { balance: { increment: data.amount } },
      });
      if (data.bankAccountId) {
        await db.bankAccount.update({
          where: { id: data.bankAccountId },
          data: {
            currentBalance: { increment: data.amount },
            availableBalance: { increment: data.amount },
          },
        });
      }
    }

    // 4. Record Audit Log
    await db.auditLog.create({
      data: {
        organizationId: orgId,
        actorId: user.id,
        action: "PAYMENT_RECORDED",
        entity: "Payment",
        entityId: payment.id,
        newValue: JSON.stringify({ amount: data.amount, invoiceNumber: invoice.invoiceNumber }),
      },
    });

    return payment;
  }

  /**
   * Creates a Journal Entry with strict double-entry balance validation (Debit = Credit)
   */
  static async createJournalEntry(
    user: AuthenticatedUser,
    data: {
      date: string;
      reference?: string;
      notes?: string;
      lines: Array<{
        accountId: string;
        type: "DEBIT" | "CREDIT";
        amount: number;
        description?: string;
      }>;
    }
  ) {
    const orgId = this.getOrgId(user);

    if (!data.lines || data.lines.length < 2) {
      throw new Error("Journal entry must contain at least one Debit and one Credit line");
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of data.lines) {
      if (line.amount <= 0) throw new Error("Line amount must be positive");
      if (line.type === "DEBIT") totalDebit += line.amount;
      else if (line.type === "CREDIT") totalCredit += line.amount;
      else throw new Error(`Invalid line type: ${line.type}`);
    }

    // Financial validation: Debits must strictly equal Credits (with tolerance for floating points)
    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.01) {
      throw new Error(
        `Unbalanced Journal Entry: Total Debit (₹${totalDebit.toFixed(2)}) must equal Total Credit (₹${totalCredit.toFixed(2)}). Difference: ₹${diff.toFixed(2)}`
      );
    }

    const entryNumber = `JRN-${Date.now().toString().slice(-6)}`;

    const journal = await db.journalEntry.create({
      data: {
        organizationId: orgId,
        entryNumber,
        date: new Date(data.date || Date.now()),
        reference: data.reference,
        notes: data.notes,
        totalAmount: totalDebit,
        sourceType: "MANUAL",
        status: "POSTED",
        createdById: user.employee?.id || user.id,
        lines: {
          create: data.lines.map((l) => ({
            accountId: l.accountId,
            type: l.type,
            amount: l.amount,
            description: l.description,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });

    // Update account balances
    for (const line of data.lines) {
      const isDebit = line.type === "DEBIT";
      // Assets & Expenses increase on Debit; Liabilities, Equity & Income increase on Credit
      const acc = await db.account.findUnique({ where: { id: line.accountId } });
      if (acc) {
        let delta = 0;
        if (acc.type === "ASSET" || acc.type === "EXPENSE") {
          delta = isDebit ? line.amount : -line.amount;
        } else {
          delta = isDebit ? -line.amount : line.amount;
        }
        await db.account.update({
          where: { id: acc.id },
          data: { balance: { increment: delta } },
        });
      }
    }

    // Audit trail
    await db.auditLog.create({
      data: {
        organizationId: orgId,
        actorId: user.id,
        action: "JOURNAL_ENTRY_POSTED",
        entity: "JournalEntry",
        entityId: journal.id,
        newValue: JSON.stringify({ entryNumber, totalAmount: totalDebit }),
      },
    });

    return journal;
  }
}
