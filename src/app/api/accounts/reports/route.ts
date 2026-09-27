import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AccountsReportsService } from "@/services/accounts-reports.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "PROFIT_LOSS";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    let reportData: any;

    switch (reportType) {
      case "PROFIT_LOSS":
        reportData = await AccountsReportsService.getProfitAndLoss(user, startDate, endDate);
        break;
      case "BALANCE_SHEET":
        reportData = await AccountsReportsService.getBalanceSheet(user, endDate);
        break;
      case "TRIAL_BALANCE":
        reportData = await AccountsReportsService.getTrialBalance(user);
        break;
      case "CASH_FLOW":
        reportData = await AccountsReportsService.getCashFlow(user);
        break;
      case "TAX":
        reportData = await AccountsReportsService.getTaxReport(user);
        break;
      default:
        return errorResponse(`Unsupported report type: ${reportType}`, "BAD_REQUEST", 400);
    }

    return successResponse(reportData);
  } catch (error: any) {
    console.error("[Accounts Reports GET Error]:", error);
    return errorResponse(error.message || "Failed to generate report", "INTERNAL_ERROR", 500);
  }
}
