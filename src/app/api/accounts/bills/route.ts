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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");

    const where: any = {
      organizationId: orgId,
      invoiceType: "VENDOR_PURCHASE",
    };

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (vendorId) {
      where.vendorId = vendorId;
    }

    const bills = await db.invoice.findMany({
      where,
      include: {
        vendor: { select: { id: true, displayName: true, legalName: true, vendorCode: true } },
        items: true,
        payments: true,
      },
      orderBy: { invoiceDate: "desc" },
    });

    return successResponse(bills);
  } catch (error: any) {
    console.error("[Accounts Bills GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch bills", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const orgId = AccountsService.getOrgId(user);

    const body = await req.json();
    const { vendorId, billDate, dueDate, items, notes, terms } = body;

    if (!vendorId) return errorResponse("Vendor is required", "BAD_REQUEST", 400);
    if (!items || !items.length) return errorResponse("At least one line item is required", "BAD_REQUEST", 400);

    let subtotal = 0;
    let taxAmount = 0;
    const computedItems = items.map((it: any) => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      const rate = Number(it.taxRate) || 0;
      const base = qty * price;
      const tax = (base * rate) / 100;
      const total = base + tax;

      subtotal += base;
      taxAmount += tax;

      return {
        description: it.description || "Vendor Purchase",
        quantity: qty,
        unitPrice: price,
        discount: 0,
        taxRate: rate,
        amount: total,
      };
    });

    const total = subtotal + taxAmount;
    const billNumber = `BILL-${Date.now().toString().slice(-6)}`;

    const bill = await db.invoice.create({
      data: {
        organizationId: orgId,
        invoiceNumber: billNumber,
        invoiceType: "VENDOR_PURCHASE",
        vendorId,
        invoiceDate: billDate ? new Date(billDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000),
        currency: "INR",
        subtotal,
        taxRate: subtotal > 0 ? (taxAmount / subtotal) * 100 : 0,
        taxAmount,
        total,
        balance: total,
        paidAmount: 0,
        status: "APPROVED",
        notes,
        terms,
        createdById: user.employee?.id || "",
        items: {
          create: computedItems,
        },
      },
      include: { vendor: true, items: true },
    });

    // Auto-post double-entry journal entry:
    // Dr. Operating Expense / Direct Costs (subtotal)
    // Dr. Input GST (taxAmount)
    // Cr. Accounts Payable (total)
    const apAcc =
      (await db.account.findFirst({ where: { organizationId: orgId, code: "2010" } })) ||
      (await db.account.findFirst({ where: { organizationId: orgId, subcategory: "CURRENT_LIABILITY" } }));

    const expAcc =
      (await db.account.findFirst({ where: { organizationId: orgId, code: "5010" } })) ||
      (await db.account.findFirst({ where: { organizationId: orgId, type: "EXPENSE" } }));

    const inputGstAcc =
      (await db.account.findFirst({ where: { organizationId: orgId, code: "1320" } })) ||
      (await db.account.findFirst({ where: { organizationId: orgId, subcategory: "TAX_PAYABLE" } }));

    if (apAcc && expAcc) {
      const journalLines: any[] = [
        {
          accountId: expAcc.id,
          type: "DEBIT",
          amount: subtotal,
          description: `Direct Cost / Expense for ${billNumber}`,
          entityType: "VENDOR",
          entityId: vendorId,
        },
        {
          accountId: apAcc.id,
          type: "CREDIT",
          amount: total,
          description: `Accounts Payable for ${billNumber}`,
          entityType: "VENDOR",
          entityId: vendorId,
        },
      ];

      if (taxAmount > 0 && inputGstAcc) {
        journalLines.push({
          accountId: inputGstAcc.id,
          type: "DEBIT",
          amount: taxAmount,
          description: `Input GST Credit for ${billNumber}`,
          entityType: "VENDOR",
          entityId: vendorId,
        });
      }

      await db.journalEntry.create({
        data: {
          organizationId: orgId,
          entryNumber: `JRN-${Date.now().toString().slice(-6)}`,
          reference: billNumber,
          sourceType: "BILL",
          sourceId: bill.id,
          totalAmount: total,
          status: "POSTED",
          lines: { create: journalLines },
        },
      });

      // Update AP balance
      await db.account.update({
        where: { id: apAcc.id },
        data: { balance: { increment: total } },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        organizationId: orgId,
        actorId: user.id,
        action: "BILL_CREATED",
        entity: "Invoice",
        entityId: bill.id,
        newValue: JSON.stringify({ billNumber, total }),
      },
    });

    return successResponse(bill, 201);
  } catch (error: any) {
    console.error("[Accounts Bills POST Error]:", error);
    return errorResponse(error.message || "Failed to create bill", "INTERNAL_ERROR", 500);
  }
}
