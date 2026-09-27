import { db } from "@/lib/db";

export class AccountsSeedService {
  /**
   * Initializes standard Chart of Accounts, Bank Accounts, and Tax Rates for an organization
   */
  static async ensureDefaultAccounts(organizationId: string) {
    // 1. Ensure Accounting Settings
    const existingSettings = await db.accountingSetting.findUnique({
      where: { organizationId },
    });

    if (!existingSettings) {
      await db.accountingSetting.create({
        data: {
          organizationId,
          fiscalYearStart: "APR-MAR",
          accountingMethod: "ACCRUAL",
          defaultCurrency: "INR",
          invoicePrefix: "INV-2026-",
          billPrefix: "BILL-2026-",
          estimatePrefix: "EST-2026-",
          journalPrefix: "JRN-2026-",
          paymentTerms: "NET_30",
        },
      });
    }

    // 2. Ensure Chart of Accounts
    const existingAccountsCount = await db.account.count({
      where: { organizationId },
    });

    if (existingAccountsCount === 0) {
      const defaultAccounts = [
        // Assets
        { code: "1010", name: "Cash on Hand", type: "ASSET", subcategory: "CURRENT_ASSET", isSystem: true },
        { code: "1020", name: "Petty Cash", type: "ASSET", subcategory: "CURRENT_ASSET", isSystem: true },
        { code: "1030", name: "HDFC Bank Operating", type: "ASSET", subcategory: "BANK", isSystem: true, balance: 1450000 },
        { code: "1040", name: "ICICI Bank Reserve", type: "ASSET", subcategory: "BANK", isSystem: true, balance: 820000 },
        { code: "1100", name: "Accounts Receivable", type: "ASSET", subcategory: "CURRENT_ASSET", isSystem: true },
        { code: "1200", name: "Inventory Asset", type: "ASSET", subcategory: "CURRENT_ASSET", isSystem: true, balance: 350000 },
        { code: "1300", name: "Input CGST Receivable", type: "ASSET", subcategory: "TAX_PAYABLE", isSystem: true },
        { code: "1310", name: "Input SGST Receivable", type: "ASSET", subcategory: "TAX_PAYABLE", isSystem: true },
        { code: "1320", name: "Input IGST Receivable", type: "ASSET", subcategory: "TAX_PAYABLE", isSystem: true },
        { code: "1500", name: "Office Equipment & Computers", type: "ASSET", subcategory: "FIXED_ASSET", isSystem: true, balance: 520000 },
        
        // Liabilities
        { code: "2010", name: "Accounts Payable", type: "LIABILITY", subcategory: "CURRENT_LIABILITY", isSystem: true },
        { code: "2100", name: "Output CGST Payable", type: "LIABILITY", subcategory: "TAX_PAYABLE", isSystem: true },
        { code: "2110", name: "Output SGST Payable", type: "LIABILITY", subcategory: "TAX_PAYABLE", isSystem: true },
        { code: "2120", name: "Output IGST Payable", type: "LIABILITY", subcategory: "TAX_PAYABLE", isSystem: true },
        { code: "2150", name: "TDS Payable", type: "LIABILITY", subcategory: "CURRENT_LIABILITY", isSystem: true },
        { code: "2200", name: "Salaries & Wages Payable", type: "LIABILITY", subcategory: "CURRENT_LIABILITY", isSystem: true },
        
        // Equity
        { code: "3010", name: "Shareholder Capital", type: "EQUITY", subcategory: "EQUITY", isSystem: true, balance: 2000000 },
        { code: "3020", name: "Retained Earnings", type: "EQUITY", subcategory: "EQUITY", isSystem: true, balance: 1140000 },
        { code: "3030", name: "Opening Balance Equity", type: "EQUITY", subcategory: "EQUITY", isSystem: true },

        // Income
        { code: "4010", name: "Sales & Enterprise Services", type: "INCOME", subcategory: "OPERATING_REVENUE", isSystem: true },
        { code: "4020", name: "Consulting & Implementation", type: "INCOME", subcategory: "OPERATING_REVENUE", isSystem: true },
        { code: "4030", name: "SaaS Subscription Revenue", type: "INCOME", subcategory: "OPERATING_REVENUE", isSystem: true },
        { code: "4100", name: "Interest & Other Income", type: "INCOME", subcategory: "OPERATING_REVENUE", isSystem: true },

        // Expenses
        { code: "5010", name: "Cost of Goods Sold (COGS)", type: "EXPENSE", subcategory: "DIRECT_EXPENSE", isSystem: true },
        { code: "5020", name: "Subcontractor & Freelancer Fees", type: "EXPENSE", subcategory: "DIRECT_EXPENSE", isSystem: true },
        { code: "6010", name: "Salaries & Employee Payroll", type: "EXPENSE", subcategory: "OPERATING_EXPENSE", isSystem: true },
        { code: "6020", name: "Office Rent & Facilities", type: "EXPENSE", subcategory: "OPERATING_EXPENSE", isSystem: true },
        { code: "6030", name: "Cloud Infrastructure & Software", type: "EXPENSE", subcategory: "OPERATING_EXPENSE", isSystem: true },
        { code: "6040", name: "Marketing & Growth Campaigns", type: "EXPENSE", subcategory: "OPERATING_EXPENSE", isSystem: true },
        { code: "6050", name: "Travel & Client Entertainment", type: "EXPENSE", subcategory: "OPERATING_EXPENSE", isSystem: true },
        { code: "6060", name: "Legal & Audit Fees", type: "EXPENSE", subcategory: "OPERATING_EXPENSE", isSystem: true },
        { code: "6070", name: "Bank Charges & Gateway Fees", type: "EXPENSE", subcategory: "OPERATING_EXPENSE", isSystem: true },
      ];

      for (const acc of defaultAccounts) {
        await db.account.create({
          data: {
            organizationId,
            code: acc.code,
            name: acc.name,
            type: acc.type,
            subcategory: acc.subcategory,
            currency: "INR",
            balance: (acc as any).balance || 0.0,
            isSystem: acc.isSystem,
            isActive: true,
          },
        });
      }
    }

    // 3. Ensure Default Bank Accounts
    const existingBankCount = await db.bankAccount.count({
      where: { organizationId },
    });

    if (existingBankCount === 0) {
      const hdfcAcc = await db.account.findFirst({
        where: { organizationId, code: "1030" },
      });
      const iciciAcc = await db.account.findFirst({
        where: { organizationId, code: "1040" },
      });

      const bank1 = await db.bankAccount.create({
        data: {
          organizationId,
          accountId: hdfcAcc?.id,
          accountName: "HDFC Primary Corporate Current",
          bankName: "HDFC Bank Ltd",
          accountNumber: "50200034981120",
          accountType: "CURRENT",
          currency: "INR",
          currentBalance: 1450000,
          availableBalance: 1450000,
          ifscOrSwift: "HDFC0000123",
          branchName: "Nariman Point, Mumbai",
          isDefault: true,
          lastSyncedAt: new Date(),
        },
      });

      const bank2 = await db.bankAccount.create({
        data: {
          organizationId,
          accountId: iciciAcc?.id,
          accountName: "ICICI Strategic Reserve Account",
          bankName: "ICICI Bank Ltd",
          accountNumber: "000405018992",
          accountType: "CURRENT",
          currency: "INR",
          currentBalance: 820000,
          availableBalance: 820000,
          ifscOrSwift: "ICIC0000004",
          branchName: "Bandra Kurla Complex, Mumbai",
          isDefault: false,
          lastSyncedAt: new Date(),
        },
      });

      // Add a couple of initial sample bank transactions
      await db.bankTransaction.createMany({
        data: [
          {
            bankAccountId: bank1.id,
            date: new Date(Date.now() - 2 * 24 * 3600 * 1000),
            type: "DEPOSIT",
            amount: 285000,
            payeeOrPayer: "Apex Corp Client Payment",
            reference: "NEFT-HDFC-9912",
            description: "Invoice #INV-2026-0001 Payment",
            status: "RECONCILED",
            reconciledAt: new Date(),
          },
          {
            bankAccountId: bank1.id,
            date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
            type: "WITHDRAWAL",
            amount: 45000,
            payeeOrPayer: "AWS Web Services India",
            reference: "UPI-AUTOPAY-412",
            description: "Cloud servers monthly retainer",
            status: "UNRECONCILED",
          },
          {
            bankAccountId: bank2.id,
            date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
            type: "DEPOSIT",
            amount: 150000,
            payeeOrPayer: "Treasury Allocation",
            reference: "INT-TRF-001",
            description: "Monthly interest yield deposit",
            status: "RECONCILED",
            reconciledAt: new Date(),
          },
        ],
      });
    }

    // 4. Ensure Standard Tax / GST Rates
    const existingTaxCount = await db.taxRate.count({
      where: { organizationId },
    });

    if (existingTaxCount === 0) {
      const defaultTaxRates = [
        { name: "GST 18% (Standard)", code: "GST_18", rate: 18.0, type: "GST", cgst: 9.0, sgst: 9.0, igst: 0.0, isDefault: true },
        { name: "GST 12%", code: "GST_12", rate: 12.0, type: "GST", cgst: 6.0, sgst: 6.0, igst: 0.0, isDefault: false },
        { name: "GST 5%", code: "GST_5", rate: 5.0, type: "GST", cgst: 2.5, sgst: 2.5, igst: 0.0, isDefault: false },
        { name: "GST 28% (Luxury)", code: "GST_28", rate: 28.0, type: "GST", cgst: 14.0, sgst: 14.0, igst: 0.0, isDefault: false },
        { name: "IGST 18% (Inter-State)", code: "IGST_18", rate: 18.0, type: "IGST", cgst: 0.0, sgst: 0.0, igst: 18.0, isDefault: false },
        { name: "IGST 12% (Inter-State)", code: "IGST_12", rate: 12.0, type: "IGST", cgst: 0.0, sgst: 0.0, igst: 12.0, isDefault: false },
        { name: "GST 0% (Exempt / SEZ)", code: "GST_0", rate: 0.0, type: "GST", cgst: 0.0, sgst: 0.0, igst: 0.0, isDefault: false },
      ];

      for (const tr of defaultTaxRates) {
        await db.taxRate.create({
          data: {
            organizationId,
            name: tr.name,
            code: tr.code,
            rate: tr.rate,
            type: tr.type,
            cgst: tr.cgst,
            sgst: tr.sgst,
            igst: tr.igst,
            isDefault: tr.isDefault,
            isActive: true,
          },
        });
      }
    }
  }
}
