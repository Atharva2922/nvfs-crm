import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ExecutiveDashboardService, ExecutiveDashboardFilters } from "@/services/executive-dashboard.service";
import { errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    if (!ExecutiveDashboardService.isCfoAuthorized(user)) {
      return errorResponse("Forbidden: Insufficient permissions for CFO export", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get("dateRange") as ExecutiveDashboardFilters["dateRange"]) || "THIS_MONTH";
    const format = searchParams.get("format") || "json";

    const data = await ExecutiveDashboardService.getCfoDashboardData(user, { dateRange });

    if (format === "csv") {
      const rows: string[] = [];
      rows.push(`"CFO FINANCIAL COMMAND REPORT - ${data.organizationName.replace(/"/g, '""')}"`);
      rows.push(`"As of: ${new Date(data.asOf).toLocaleString("en-IN")}"`);
      rows.push("");
      rows.push('"--- FINANCIAL COMMAND KPIS ---"');
      rows.push('"Total Invoiced (INR)","Total Collected (INR)","Total Expenses (INR)","Net Profit (INR)","Accounts Receivable (INR)","Overdue Receivables (INR)","Accounts Payable (INR)"');
      rows.push(`"${data.kpis.totalInvoiced}","${data.kpis.totalCollected}","${data.kpis.totalExpenses}","${data.kpis.netProfit}","${data.kpis.accountsReceivable}","${data.kpis.overdueReceivables}","${data.kpis.accountsPayable}"`);
      rows.push("");
      rows.push('"--- TOP OVERDUE DEBTORS ---"');
      rows.push('"Invoice Number","Client","Balance (INR)","Due Date","Days Overdue"');
      data.topDebtors.forEach((d) => {
        rows.push(`"${d.invoiceNumber}","${d.client.replace(/"/g, '""')}","${d.balance}","${new Date(d.dueDate).toLocaleDateString("en-IN")}","${d.daysOverdue}"`);
      });

      const csvContent = rows.join("\n");
      const filename = `cfo_financial_report_${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const filename = `cfo_financial_report_${new Date().toISOString().split("T")[0]}.json`;
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[CFO Export API Error]:", error);
    return errorResponse(error.message || "Failed to generate report export", "INTERNAL_ERROR", 500);
  }
}
