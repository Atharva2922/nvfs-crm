import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SalaryService } from "@/services/salary.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "my";
    const periodId = searchParams.get("periodId");

    // 1. Employee's own payslips
    if (scope === "my") {
      const payslips = await db.payrollEntry.findMany({
        where: {
          employeeId: user.employee.id,
          status: { in: ["APPROVED", "PAID"] },
        },
        orderBy: { payrollPeriod: { code: "desc" } },
        include: {
          payrollPeriod: true,
        },
      });

      return successResponse({ payslips });
    }

    // 2. Querying all payslips in a specific period -> PRIVILEGE CHECK
    if (periodId) {
      if (!SalaryService.isPrivilegedPayrollUser(user)) {
        return errorResponse("Forbidden: Access to corporate payroll entries is restricted", "FORBIDDEN", 403);
      }

      const entries = await db.payrollEntry.findMany({
        where: { payrollPeriodId: periodId },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
              designation: true,
              department: { select: { name: true, code: true } },
            },
          },
        },
        orderBy: { employee: { employeeNumber: "asc" } },
      });

      const parsedEntries = entries.map((e) => ({
        ...e,
        earnings: JSON.parse(e.earningsBreakdown || "[]"),
        deductions: JSON.parse(e.deductionsBreakdown || "[]"),
      }));

      return successResponse({ entries: parsedEntries });
    }

    return errorResponse("Invalid query parameters", "BAD_REQUEST", 400);
  } catch (error: any) {
    console.error("[Payslips GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve payslips", "INTERNAL_ERROR", 500);
  }
}
