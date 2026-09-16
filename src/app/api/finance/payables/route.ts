import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ExpenseService } from "@/services/expense.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const payables = await ExpenseService.getPayables(user);
    return successResponse(payables);
  } catch (error: any) {
    console.error("[Payables GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve payables obligations", "INTERNAL_ERROR", 500);
  }
}
