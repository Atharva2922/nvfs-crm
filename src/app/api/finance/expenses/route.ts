import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ExpenseService } from "@/services/expense.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createExpenseSchema = z.object({
  category: z.enum([
    "TRAVEL",
    "SOFTWARE_SUBSCRIPTION",
    "HARDWARE_EQUIPMENT",
    "OFFICE_SUPPLIES",
    "MARKETING",
    "MEALS_ENTERTAINMENT",
    "CONSULTING",
    "UTILITIES",
    "OTHER",
  ]),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  currency: z.string().optional(),
  date: z.string().min(1, "Expense date is required"),
  description: z.string().min(2, "Description is required"),
  receiptUrl: z.string().optional(),
  departmentId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const filters = {
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      scope: (searchParams.get("scope") as "my" | "all") || "all",
    };

    const expenses = await ExpenseService.getExpenses(user, filters);
    return successResponse({ expenses });
  } catch (error: any) {
    console.error("[Expenses GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve expenses", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = createExpenseSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const expense = await ExpenseService.createExpense(user, parse.data as any);
    return successResponse(expense, 201);
  } catch (error: any) {
    console.error("[Expense Create Error]:", error);
    return errorResponse(error.message || "Failed to submit expense", "EXPENSE_CREATE_FAILED", 400);
  }
}
