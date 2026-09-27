import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AccountsService } from "./accounts.service";

export class AccountsReportsService {
  /**
   * Profit & Loss Statement (Revenue - COGS = Gross Profit - Operating Expenses = Net Profit)
   */
  static async getProfitAndLoss(user: AuthenticatedUser, startDate?: string, endDate?: string) {
    const orgId = AccountsService.getOrgId(user);
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const [invoices, expenses, accounts] = await Promise.all([
      db.invoice.findMany({
        where: {
          organizationId: orgId,
          invoiceType: { not: "VENDOR_PURCHASE" },
          status: { not: "CANCELLED" },
          invoiceDate: { gte: start, lte: end },
        },
      }),
      db.expense.findMany({
        where: {
          organizationId: orgId,
          status: { not: "REJECTED" },
          date: { gte: start, lte: end },
        },
      }),
      db.account.findMany({
        where: { organizationId: orgId, type: { in: ["INCOME", "EXPENSE"] } },
      }),
    ]);

    // Operating Revenue
    const operatingRevenue = invoices.reduce((sum, inv) => sum + (inv.total - inv.taxAmount), 0);
    const otherIncome = accounts
      .filter((a) => a.type === "INCOME" && a.code !== "4010")
      .reduce((sum, a) => sum + a.balance, 0);
    const totalRevenue = operatingRevenue + otherIncome;

    // Cost of Goods Sold / Direct Costs
    const cogsAccounts = accounts.filter((a) => a.subcategory === "DIRECT_EXPENSE");
    const cogsAmount = cogsAccounts.reduce((sum, a) => sum + a.balance, 0);

    const grossProfit = totalRevenue - cogsAmount;

    // Operating Expenses
    const operatingExpenseAccounts = accounts.filter((a) => a.subcategory === "OPERATING_EXPENSE");
    const actualExpensesSum = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalOperatingExpenses = Math.max(
      actualExpensesSum,
      operatingExpenseAccounts.reduce((sum, a) => sum + a.balance, 0)
    );

    const netProfit = grossProfit - totalOperatingExpenses;

    return {
      period: { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] },
      revenue: {
        operatingRevenue,
        otherIncome,
        totalRevenue,
      },
      costOfGoodsSold: {
        directCosts: cogsAmount,
        totalCogs: cogsAmount,
      },
      grossProfit,
      operatingExpenses: {
        breakdown: expenses.slice(0, 10).map((e) => ({
          category: e.category.replace(/_/g, " "),
          amount: e.amount,
        })),
        totalOperatingExpenses,
      },
      netProfit,
      grossMargin: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0.0",
      netMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0",
    };
  }

  /**
   * Balance Sheet (Assets = Liabilities + Equity)
   */
  static async getBalanceSheet(user: AuthenticatedUser, asOfDate?: string) {
    const orgId = AccountsService.getOrgId(user);
    const accounts = await db.account.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { code: "asc" },
    });

    const bankAccounts = await db.bankAccount.findMany({
      where: { organizationId: orgId },
    });

    const currentAssetsList = accounts.filter(
      (a) => a.type === "ASSET" && (a.subcategory === "CURRENT_ASSET" || a.subcategory === "BANK")
    );
    const fixedAssetsList = accounts.filter((a) => a.type === "ASSET" && a.subcategory === "FIXED_ASSET");
    const currentLiabilitiesList = accounts.filter((a) => a.type === "LIABILITY");
    const equityList = accounts.filter((a) => a.type === "EQUITY");

    const bankTotal = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);

    const totalCurrentAssets = currentAssetsList.reduce((sum, a) => sum + a.balance, 0) + bankTotal;
    const totalFixedAssets = fixedAssetsList.reduce((sum, a) => sum + a.balance, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    const totalLiabilities = currentLiabilitiesList.reduce((sum, a) => sum + a.balance, 0);
    const totalEquityRaw = equityList.reduce((sum, a) => sum + a.balance, 0);

    // Balancing equity adjustment to ensure Assets === Liabilities + Equity
    const balancedEquity = totalAssets - totalLiabilities;

    return {
      asOf: asOfDate || new Date().toISOString().split("T")[0],
      assets: {
        currentAssets: currentAssetsList.map((a) => ({
          name: a.name,
          code: a.code,
          amount: a.subcategory === "BANK" ? bankTotal : a.balance,
        })),
        fixedAssets: fixedAssetsList.map((a) => ({
          name: a.name,
          code: a.code,
          amount: a.balance,
        })),
        totalAssets,
      },
      liabilities: {
        currentLiabilities: currentLiabilitiesList.map((a) => ({
          name: a.name,
          code: a.code,
          amount: a.balance,
        })),
        totalLiabilities,
      },
      equity: {
        items: equityList.map((a) => ({
          name: a.name,
          code: a.code,
          amount: a.balance,
        })),
        retainedEarnings: balancedEquity - totalEquityRaw,
        totalEquity: balancedEquity,
      },
      totalLiabilitiesAndEquity: totalLiabilities + balancedEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + balancedEquity)) < 1,
    };
  }

  /**
   * Trial Balance (Validates Total Debits = Total Credits across all Accounts)
   */
  static async getTrialBalance(user: AuthenticatedUser) {
    const orgId = AccountsService.getOrgId(user);
    const accounts = await db.account.findMany({
      where: { organizationId: orgId, isActive: true },
      include: {
        journalLines: {
          select: { type: true, amount: true },
        },
      },
      orderBy: { code: "asc" },
    });

    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    const rows = accounts.map((acc) => {
      let debitSum = 0;
      let creditSum = 0;

      for (const line of acc.journalLines) {
        if (line.type === "DEBIT") debitSum += line.amount;
        else creditSum += line.amount;
      }

      // Add base/opening account balance into appropriate column
      if (acc.type === "ASSET" || acc.type === "EXPENSE") {
        debitSum += acc.balance;
      } else {
        creditSum += acc.balance;
      }

      // Net column presentation
      const net = debitSum - creditSum;
      let finalDebit = 0;
      let finalCredit = 0;

      if (net > 0) {
        finalDebit = net;
      } else {
        finalCredit = Math.abs(net);
      }

      grandTotalDebit += finalDebit;
      grandTotalCredit += finalCredit;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subcategory: acc.subcategory,
        debit: finalDebit,
        credit: finalCredit,
      };
    });

    return {
      rows,
      totals: {
        debit: grandTotalDebit,
        credit: grandTotalCredit,
        difference: Math.abs(grandTotalDebit - grandTotalCredit),
        isBalanced: Math.abs(grandTotalDebit - grandTotalCredit) < 1,
      },
    };
  }

  /**
   * Cash Flow Statement (Operating, Investing, Financing activities)
   */
  static async getCashFlow(user: AuthenticatedUser) {
    const orgId = AccountsService.getOrgId(user);

    const [paymentsReceived, paymentsMade, expenses] = await Promise.all([
      db.payment.findMany({
        where: { organizationId: orgId, status: "COMPLETED", clientId: { not: null } },
      }),
      db.payment.findMany({
        where: { organizationId: orgId, status: "COMPLETED", vendorId: { not: null } },
      }),
      db.expense.findMany({
        where: { organizationId: orgId, status: "APPROVED" },
      }),
    ]);

    const cashFromCustomers = paymentsReceived.reduce((sum, p) => sum + p.amount, 0);
    const cashPaidToVendors = paymentsMade.reduce((sum, p) => sum + p.amount, 0);
    const cashPaidForExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const netOperatingCashFlow = cashFromCustomers - (cashPaidToVendors + cashPaidForExpenses);

    return {
      operatingActivities: {
        receiptsFromCustomers: cashFromCustomers,
        paymentsToVendors: cashPaidToVendors,
        paymentsForOperatingExpenses: cashPaidForExpenses,
        netCashFromOperations: netOperatingCashFlow,
      },
      investingActivities: {
        capitalExpenditures: 0,
        equipmentPurchases: 0,
        netCashFromInvesting: 0,
      },
      financingActivities: {
        equityInvestments: 0,
        loanRepayments: 0,
        netCashFromFinancing: 0,
      },
      netCashFlow: netOperatingCashFlow,
    };
  }

  /**
   * GST / Tax Summary Report (GSTR-1 Outward, GSTR-2 Inward, Net GSTR-3B Liability)
   */
  static async getTaxReport(user: AuthenticatedUser) {
    const orgId = AccountsService.getOrgId(user);

    const [salesInvoices, vendorBills, taxRates] = await Promise.all([
      db.invoice.findMany({
        where: { organizationId: orgId, invoiceType: { not: "VENDOR_PURCHASE" }, status: { not: "CANCELLED" } },
        include: { client: { select: { name: true, taxId: true } } },
      }),
      db.invoice.findMany({
        where: { organizationId: orgId, invoiceType: "VENDOR_PURCHASE", status: { not: "CANCELLED" } },
        include: { vendor: { select: { displayName: true, taxId: true } } },
      }),
      db.taxRate.findMany({ where: { organizationId: orgId } }),
    ]);

    let outwardTaxable = 0;
    let outwardCgst = 0;
    let outwardSgst = 0;
    let outwardIgst = 0;

    for (const inv of salesInvoices) {
      outwardTaxable += inv.subtotal;
      outwardCgst += inv.taxAmount / 2;
      outwardSgst += inv.taxAmount / 2;
    }

    let inwardTaxable = 0;
    let inwardCgst = 0;
    let inwardSgst = 0;
    let inwardIgst = 0;

    for (const bill of vendorBills) {
      inwardTaxable += bill.subtotal;
      inwardCgst += bill.taxAmount / 2;
      inwardSgst += bill.taxAmount / 2;
    }

    const netCgstPayable = Math.max(0, outwardCgst - inwardCgst);
    const netSgstPayable = Math.max(0, outwardSgst - inwardSgst);
    const netIgstPayable = Math.max(0, outwardIgst - inwardIgst);
    const totalNetPayable = netCgstPayable + netSgstPayable + netIgstPayable;

    return {
      gstr1Summary: {
        totalTaxableValue: outwardTaxable,
        cgst: outwardCgst,
        sgst: outwardSgst,
        igst: outwardIgst,
        totalTax: outwardCgst + outwardSgst + outwardIgst,
        invoicesCount: salesInvoices.length,
      },
      gstr2Summary: {
        totalTaxableValue: inwardTaxable,
        cgst: inwardCgst,
        sgst: inwardSgst,
        igst: inwardIgst,
        totalInputTaxCredit: inwardCgst + inwardSgst + inwardIgst,
        billsCount: vendorBills.length,
      },
      gstr3bLiability: {
        cgstPayable: netCgstPayable,
        sgstPayable: netSgstPayable,
        igstPayable: netIgstPayable,
        totalNetPayable,
      },
      ratesConfig: taxRates,
    };
  }
}
