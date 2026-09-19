import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ExecutiveDashboardService, ExecutiveDashboardFilters } from "@/services/executive-dashboard.service";
import { errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    if (!ExecutiveDashboardService.isCtoAuthorized(user)) {
      return errorResponse("Forbidden: Insufficient permissions for CTO export", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get("dateRange") as ExecutiveDashboardFilters["dateRange"]) || "THIS_MONTH";
    const format = searchParams.get("format") || "json";

    const data = await ExecutiveDashboardService.getCtoDashboardData(user, { dateRange });

    if (format === "csv") {
      const rows: string[] = [];
      rows.push(`"CTO ENGINEERING REPORT - ${data.organizationName.replace(/"/g, '""')}"`);
      rows.push(`"As of: ${new Date(data.asOf).toLocaleString("en-IN")}"`);
      rows.push("");
      rows.push('"--- ENGINEERING KPIS ---"');
      rows.push('"Active Projects","Delayed Projects","Open Incidents","Critical Incidents","Completion Rate","Tech Spend (INR)"');
      rows.push(`"${data.kpis.activeProjectsCount}","${data.kpis.delayedProjectsCount}","${data.kpis.openIncidentsCount}","${data.kpis.criticalIncidentsCount}","${data.kpis.taskCompletionRate}%","${data.kpis.techExpenditure}"`);
      rows.push("");
      rows.push('"--- OPERATIONAL INCIDENTS ---"');
      rows.push('"Incident","Severity","Status","Project","Assignee","Created"');
      data.incidents.forEach((i) => {
        rows.push(`"${i.title.replace(/"/g, '""')}","${i.severity}","${i.status}","${i.operation.replace(/"/g, '""')}","${i.assignedTo}","${new Date(i.createdAt).toLocaleDateString("en-IN")}"`);
      });

      const csvContent = rows.join("\n");
      const filename = `cto_engineering_report_${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const filename = `cto_engineering_report_${new Date().toISOString().split("T")[0]}.json`;
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[CTO Export API Error]:", error);
    return errorResponse(error.message || "Failed to generate report export", "INTERNAL_ERROR", 500);
  }
}
