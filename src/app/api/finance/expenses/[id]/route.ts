import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const expense = await db.expense.findUnique({
      where: { id },
      include: {
        employee: true,
        department: true,
        approver: true,
        transactions: true,
      },
    });

    if (!expense || expense.organizationId !== user.employee.organizationId) {
      return errorResponse("Expense not found", "NOT_FOUND", 404);
    }

    return successResponse(expense);
  } catch (error: any) {
    console.error("[Expense Detail GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve expense", "INTERNAL_ERROR", 500);
  }
}
