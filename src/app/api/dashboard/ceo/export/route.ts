import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CeoDashboardService, CeoDashboardFilters } from "@/services/ceo-dashboard.service";
import { errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    if (!CeoDashboardService.isAuthorized(user)) {
      return errorResponse(
        "Forbidden: Insufficient permissions for executive dashboard export",
        "FORBIDDEN",
        403
      );
    }

    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get("dateRange") as CeoDashboardFilters["dateRange"]) || "THIS_MONTH";
    const format = searchParams.get("format") || "json";

    const data = await CeoDashboardService.getExecutiveDashboardData(user, { dateRange });

    if (format === "csv") {
      // Build a multi-section executive summary CSV
      const rows: string[] = [];
      rows.push(`"CEO EXECUTIVE REPORT - ${data.organizationName.replace(/"/g, '""')}"`);
      rows.push(`"As of: ${new Date(data.asOf).toLocaleString("en-IN")}"`);
      rows.push(`"Reporting Interval: ${data.filters.dateRange}"`);
      rows.push("");

      // Section 1: Top KPIs
      rows.push('"--- EXECUTIVE KPIS ---"');
      rows.push('"Metric","Current Period (INR)","Previous Period (INR)","Change (%)"');
      rows.push(`"Revenue","${data.kpis.revenue.current}","${data.kpis.revenue.previous}","${data.kpis.revenue.changePercent}%"`);
      rows.push(`"Expenses","${data.kpis.expenses.current}","${data.kpis.expenses.previous}","${data.kpis.expenses.changePercent}%"`);
      rows.push(`"Net Operating Profit","${data.kpis.netProfit.current}","${data.kpis.netProfit.previous}","${data.kpis.netProfit.changePercent}%"`);
      rows.push(`"Outstanding Receivables","${data.kpis.receivables.total}","N/A","Overdue: ${data.kpis.receivables.overdue}"`);
      rows.push(`"Net Cash Position","${data.kpis.cashPosition.amount}","N/A","${data.kpis.cashPosition.label}"`);
      rows.push("");

      // Section 2: CRM & Customers
      rows.push('"--- CRM & CUSTOMER PORTFOLIO ---"');
      rows.push('"Total Customers","Active Customers","New Leads","Pipeline Value (INR)","Won Deals","Win Rate"');
      rows.push(`"${data.crm.topCustomers.length}","${data.customerHealth.activeCustomers}","${data.crm.metrics.newLeads}","${data.crm.metrics.pipelineValue}","${data.crm.metrics.wonDeals}","${data.crm.metrics.conversionRate}%"`);
      rows.push("");

      // Section 3: Operations
      rows.push('"--- OPERATIONS & DELAYS ---"');
      rows.push('"Active Operations","Completed","Delayed Operations"');
      rows.push(`"${data.kpis.operations.active}","${data.kpis.operations.completed}","${data.kpis.operations.delayed}"`);
      rows.push('"Delayed Operation","Client","Owner","Progress","Due Date","Days Delayed","Risk"');
      data.operationsOverview.delayedOperations.forEach((op) => {
        rows.push(`"${op.name.replace(/"/g, '""')}","${op.clientName.replace(/"/g, '""')}","${op.ownerName}","${op.progress}%","${new Date(op.expectedCompletionDate).toLocaleDateString("en-IN")}","${op.daysDelayed} days","${op.riskLevel}"`);
      });
      rows.push("");

      // Section 4: Pending Approvals
      rows.push('"--- CEO PENDING APPROVALS ---"');
      rows.push('"Title","Category","Requester","Priority","Date"');
      data.approvalCenter.items.forEach((app) => {
        rows.push(`"${app.title.replace(/"/g, '""')}","${app.entityType}","${app.requestedByName}","${app.priority}","${new Date(app.createdAt).toLocaleDateString("en-IN")}"`);
      });

      const csvContent = rows.join("\n");
      const filename = `ceo_executive_report_${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Default JSON export
    const filename = `ceo_executive_report_${new Date().toISOString().split("T")[0]}.json`;
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[CEO Export API Error]:", error);
    return errorResponse(error.message || "Failed to generate executive report export", "INTERNAL_ERROR", 500);
  }
}
