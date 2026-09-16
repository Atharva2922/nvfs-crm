import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PayrollService } from "@/services/payroll.service";
import { SalaryService } from "@/services/salary.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createPeriodSchema = z.object({
  code: z.string().min(4, "Period code required (e.g. 2026-10)"),
  name: z.string().min(3, "Period name required"),
  year: z.number().int().min(2020),
  month: z.number().int().min(1).max(12),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  remarks: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const orgId = user.employee.organizationId;
    const periods = await db.payrollPeriod.findMany({
      where: { organizationId: orgId },
      orderBy: { code: "desc" },
      include: {
        _count: { select: { entries: true } },
      },
    });

    return successResponse({ periods });
  } catch (error: any) {
    console.error("[Payroll Periods GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve payroll periods", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!SalaryService.isPrivilegedPayrollUser(user)) {
      return errorResponse("Forbidden: Restricted to payroll administrators", "FORBIDDEN", 403);
    }

    const orgId = user.employee.organizationId;
    const body = await req.json();
    const parse = createPeriodSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const period = await PayrollService.createPeriod(orgId, parse.data);
    return successResponse(period, 201);
  } catch (error: any) {
    console.error("[Payroll Period Creation Error]:", error);
    return errorResponse(error.message || "Failed to create payroll period", "BAD_REQUEST", 400);
  }
}
