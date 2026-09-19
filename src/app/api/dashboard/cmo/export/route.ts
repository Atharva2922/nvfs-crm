import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ExecutiveDashboardService, ExecutiveDashboardFilters } from "@/services/executive-dashboard.service";
import { errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    if (!ExecutiveDashboardService.isCmoAuthorized(user)) {
      return errorResponse("Forbidden: Insufficient permissions for CMO export", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get("dateRange") as ExecutiveDashboardFilters["dateRange"]) || "THIS_MONTH";
    const format = searchParams.get("format") || "json";

    const data = await ExecutiveDashboardService.getCmoDashboardData(user, { dateRange });

    if (format === "csv") {
      const rows: string[] = [];
      rows.push(`"CMO COMMERCIAL & GROWTH REPORT - ${data.organizationName.replace(/"/g, '""')}"`);
      rows.push(`"As of: ${new Date(data.asOf).toLocaleString("en-IN")}"`);
      rows.push("");
      rows.push('"--- COMMERCIAL KPIS ---"');
      rows.push('"Total Leads","New Leads","Qualified Leads","Converted","Conversion Rate","Pipeline Value (INR)","Won Revenue (INR)"');
      rows.push(`"${data.kpis.totalLeads}","${data.kpis.newLeads}","${data.kpis.qualifiedLeads}","${data.kpis.convertedLeads}","${data.kpis.conversionRate}%","${data.kpis.openPipelineValue}","${data.kpis.wonRevenue}"`);
      rows.push("");
      rows.push('"--- TOP CLIENT ACCOUNTS ---"');
      rows.push('"Client","Tier","Paid Revenue (INR)","Open Pipeline (INR)"');
      data.topClients.forEach((c) => {
        rows.push(`"${c.name.replace(/"/g, '""')}","${c.tier}","${c.paidRevenue}","${c.pipeline}"`);
      });

      const csvContent = rows.join("\n");
      const filename = `cmo_growth_report_${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const filename = `cmo_growth_report_${new Date().toISOString().split("T")[0]}.json`;
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[CMO Export API Error]:", error);
    return errorResponse(error.message || "Failed to generate report export", "INTERNAL_ERROR", 500);
  }
}
