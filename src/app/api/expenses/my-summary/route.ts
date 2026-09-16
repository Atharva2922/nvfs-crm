import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const expenses = await db.expense.findMany({
      where: {
        employeeId: user.employee.id,
        organizationId: user.employee.organizationId,
      },
      select: {
        amount: true,
        status: true,
      },
    });

    let pendingCount = 0;
    let pendingAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;

    expenses.forEach((e) => {
      if (e.status === "SUBMITTED" || e.status === "UNDER_REVIEW") {
        pendingCount++;
        pendingAmount += e.amount;
      } else if (e.status === "APPROVED" || e.status === "PAID") {
        approvedCount++;
        approvedAmount += e.amount;
      }
    });

    return successResponse({
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
    });
  } catch (error: any) {
    console.error("[My Expense Summary API Error]:", error);
    return errorResponse("Failed to fetch expense summary", "INTERNAL_ERROR", 500);
  }
}
