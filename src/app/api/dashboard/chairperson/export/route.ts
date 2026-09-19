import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ExecutiveDashboardService, ExecutiveDashboardFilters } from "@/services/executive-dashboard.service";
import { errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    if (!ExecutiveDashboardService.isChairpersonAuthorized(user)) {
      return errorResponse("Forbidden: Insufficient permissions for chairperson export", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get("dateRange") as ExecutiveDashboardFilters["dateRange"]) || "THIS_MONTH";
    const format = searchParams.get("format") || "json";

    const data = await ExecutiveDashboardService.getChairpersonDashboardData(user, { dateRange });

    if (format === "csv") {
      const rows: string[] = [];
      rows.push(`"CHAIRPERSON STRATEGIC REPORT - ${data.organizationName.replace(/"/g, '""')}"`);
      rows.push(`"As of: ${new Date(data.asOf).toLocaleString("en-IN")}"`);
      rows.push("");
      rows.push('"--- STRATEGIC KPIS ---"');
      rows.push('"Metric","Current (INR)","Previous (INR)","Growth (%)"');
      rows.push(`"Revenue","${data.kpis.revenue.current}","${data.kpis.revenue.previous}","${data.kpis.revenue.growthPercent}%"`);
      rows.push(`"Operating Profit","${data.kpis.profit.current}","${data.kpis.profit.previous}","${data.kpis.profit.growthPercent}%"`);
      rows.push(`"Expenses","${data.kpis.expenses.current}","${data.kpis.expenses.previous}","${data.kpis.expenses.changePercent}%"`);
      rows.push(`"Strategic Capital Commitments","${data.kpis.strategicCommitments}","N/A","N/A"`);
      rows.push("");
      rows.push('"--- MAJOR STRATEGIC PROJECTS ---"');
      rows.push('"Project","Client","Sponsor","Status","Progress","Budget (INR)"');
      data.strategicProjects.forEach((p) => {
        rows.push(`"${p.name.replace(/"/g, '""')}","${p.client.replace(/"/g, '""')}","${p.sponsor}","${p.status}","${p.progress}%","${p.budget}"`);
      });

      const csvContent = rows.join("\n");
      const filename = `chairperson_strategic_report_${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const filename = `chairperson_strategic_report_${new Date().toISOString().split("T")[0]}.json`;
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[Chairperson Export API Error]:", error);
    return errorResponse(error.message || "Failed to generate report export", "INTERNAL_ERROR", 500);
  }
}
