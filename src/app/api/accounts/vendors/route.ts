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

    const vendors = await db.vendor.findMany({
      where: { organizationId: orgId },
      include: {
        invoices: {
          where: { invoiceType: "VENDOR_PURCHASE" },
          select: { total: true, paidAmount: true, balance: true, status: true, dueDate: true },
        },
        payments: {
          select: { amount: true, paymentDate: true },
        },
      },
      orderBy: { displayName: "asc" },
    });

    const now = new Date();

    const profiles = vendors.map((v) => {
      let totalPurchases = 0;
      let totalPaid = 0;
      let outstanding = 0;
      let overdue = 0;

      for (const bill of v.invoices) {
        if (bill.status === "CANCELLED") continue;
        totalPurchases += bill.total;
        totalPaid += bill.paidAmount;
        outstanding += bill.balance;
        if (new Date(bill.dueDate) < now && bill.balance > 0) {
          overdue += bill.balance;
        }
      }

      return {
        id: v.id,
        displayName: v.displayName,
        legalName: v.legalName,
        vendorCode: v.vendorCode,
        email: v.email,
        phone: v.phone,
        address: v.address,
        taxId: v.taxId,
        paymentTerms: v.paymentTerms,
        totalPurchases,
        totalPaid,
        outstanding,
        overdue,
        billsCount: v.invoices.length,
      };
    });

    return successResponse(profiles);
  } catch (error: any) {
    console.error("[Accounts Vendors GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch vendors", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const orgId = AccountsService.getOrgId(user);

    const body = await req.json();
    const { displayName, legalName, email, phone, address, taxId, paymentTerms, bankName, bankAccountNumberMasked } = body;

    if (!displayName) return errorResponse("Vendor display name is required", "BAD_REQUEST", 400);

    const vendorCode = `VEN-${Date.now().toString().slice(-4)}`;

    const vendor = await db.vendor.create({
      data: {
        organizationId: orgId,
        vendorCode,
        displayName,
        legalName: legalName || displayName,
        email: email || "accounts@vendor.com",
        phone,
        address,
        taxId,
        paymentTerms: paymentTerms || "NET_30",
        bankName,
        bankAccountNumberMasked,
        createdById: user.employee?.id || "",
        status: "ACTIVE",
      },
    });

    return successResponse(vendor, 201);
  } catch (error: any) {
    console.error("[Accounts Vendors POST Error]:", error);
    return errorResponse(error.message || "Failed to create vendor", "INTERNAL_ERROR", 500);
  }
}
