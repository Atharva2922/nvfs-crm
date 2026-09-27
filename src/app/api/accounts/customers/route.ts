import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountsService } from "@/services/accounts.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const orgId = AccountsService.getOrgId(user);

    const customers = await db.client.findMany({
      where: { organizationId: orgId },
      include: {
        invoices: {
          where: { invoiceType: "SALES" },
          select: { total: true, paidAmount: true, balance: true, status: true, dueDate: true },
        },
        payments: {
          select: { amount: true, paymentDate: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const now = new Date();

    const profiles = customers.map((c) => {
      let totalInvoiced = 0;
      let totalPaid = 0;
      let outstanding = 0;
      let overdue = 0;

      for (const inv of c.invoices) {
        if (inv.status === "CANCELLED") continue;
        totalInvoiced += inv.total;
        totalPaid += inv.paidAmount;
        outstanding += inv.balance;
        if (new Date(inv.dueDate) < now && inv.balance > 0) {
          overdue += inv.balance;
        }
      }

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        state: c.state,
        taxId: c.taxId,
        totalInvoiced,
        totalPaid,
        outstanding,
        overdue,
        invoicesCount: c.invoices.length,
      };
    });

    return successResponse(profiles);
  } catch (error: any) {
    console.error("[Accounts Customers GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch customers", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const orgId = AccountsService.getOrgId(user);

    const body = await req.json();
    const { name, email, phone, address, city, state, postalCode, taxId } = body;

    if (!name) return errorResponse("Customer name is required", "BAD_REQUEST", 400);

    const code = `CLI-${Date.now().toString().slice(-4)}`;

    const customer = await db.client.create({
      data: {
        organizationId: orgId,
        code,
        name,
        email,
        phone,
        address,
        city,
        state,
        postalCode,
        taxId,
        status: "ACTIVE",
      },
    });

    return successResponse(customer, 201);
  } catch (error: any) {
    console.error("[Accounts Customers POST Error]:", error);
    return errorResponse(error.message || "Failed to create customer", "INTERNAL_ERROR", 500);
  }
}
