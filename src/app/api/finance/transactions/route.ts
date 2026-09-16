import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const direction = searchParams.get("direction");
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = { organizationId: user.employee.organizationId };
    if (type && type !== "ALL") where.type = type;
    if (direction && direction !== "ALL") where.direction = direction;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { transactionNumber: { contains: search } },
        { description: { contains: search } },
        { reference: { contains: search } },
      ];
    }

    const transactions = await db.financialTransaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      include: {
        department: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
        payment: { select: { id: true, paymentReference: true } },
        expense: { select: { id: true, expenseNumber: true } },
        payrollPeriod: { select: { id: true, code: true, name: true } },
      },
    });

    return successResponse({ transactions });
  } catch (error: any) {
    console.error("[Transactions GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve transactions", "INTERNAL_ERROR", 500);
  }
}
