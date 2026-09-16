import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { canAccessEmployeeData } from "@/lib/scope-guard";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const requestedEmployeeId = searchParams.get("employeeId") || user.employee.id;

    // Strict IDOR authorization check
    const allowed = await canAccessEmployeeData(user, requestedEmployeeId);
    if (!allowed) {
      return errorResponse(
        "Forbidden: You do not have permission to view another employee's payslips",
        "FORBIDDEN",
        403
      );
    }

    const payslips = await db.payrollEntry.findMany({
      where: {
        employeeId: requestedEmployeeId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        payrollPeriod: {
          select: {
            code: true,
            name: true,
            year: true,
            month: true,
            status: true,
          },
        },
      },
    });

    return successResponse(payslips);
  } catch (error: any) {
    console.error("[My Payslips API Error]:", error);
    return errorResponse("Failed to fetch payslips", "INTERNAL_ERROR", 500);
  }
}
