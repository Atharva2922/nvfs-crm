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
    const clientId = searchParams.get("clientId");

    const where: any = {
      organizationId: orgId,
      invoiceType: { not: "VENDOR_PURCHASE" },
    };

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (clientId) {
      where.clientId = clientId;
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true, code: true } },
        items: true,
        payments: true,
      },
      orderBy: { invoiceDate: "desc" },
    });

    return successResponse(invoices);
  } catch (error: any) {
    console.error("[Accounts Invoices GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch invoices", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const orgId = AccountsService.getOrgId(user);

    const body = await req.json();
    const { clientId, invoiceDate, dueDate, items, notes, terms } = body;

    if (!clientId) return errorResponse("Customer/Client is required", "BAD_REQUEST", 400);
    if (!items || !items.length) return errorResponse("At least one line item is required", "BAD_REQUEST", 400);

    // Calculate subtotal, tax and total server-side
    let subtotal = 0;
    let taxAmount = 0;
    const computedItems = items.map((it: any) => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      const discount = Number(it.discount) || 0;
      const rate = Number(it.taxRate) || 0;
      const base = qty * price - discount;
      const tax = (base * rate) / 100;
      const total = base + tax;

      subtotal += base;
      taxAmount += tax;

      return {
        description: it.description || "Product/Service",
        quantity: qty,
        unitPrice: price,
        discount,
        taxRate: rate,
        amount: total,
      };
    });

    const total = subtotal + taxAmount;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const invoice = await db.invoice.create({
      data: {
        organizationId: orgId,
        invoiceNumber,
        invoiceType: "SALES",
        clientId,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000),
        currency: "INR",
        subtotal,
        taxRate: subtotal > 0 ? (taxAmount / subtotal) * 100 : 0,
        taxAmount,
        total,
        balance: total,
        paidAmount: 0,
        status: "SENT",
        notes,
        terms,
        createdById: user.employee?.id || "",
        items: {
          create: computedItems,
        },
      },
      include: { client: true, items: true },
    });

    // Auto-post double-entry journal entry:
    // Dr. Accounts Receivable (total)
    // Cr. Sales Revenue (subtotal)
    // Cr. Output GST (taxAmount)
    const arAcc =
      (await db.account.findFirst({ where: { organizationId: orgId, code: "1100" } })) ||
      (await db.account.findFirst({ where: { organizationId: orgId, subcategory: "CURRENT_ASSET" } }));

    const revAcc =
      (await db.account.findFirst({ where: { organizationId: orgId, code: "4010" } })) ||
      (await db.account.findFirst({ where: { organizationId: orgId, type: "INCOME" } }));

    const gstAcc =
      (await db.account.findFirst({ where: { organizationId: orgId, code: "2120" } })) ||
      (await db.account.findFirst({ where: { organizationId: orgId, subcategory: "TAX_PAYABLE" } }));

    if (arAcc && revAcc) {
      const journalLines: any[] = [
        {
          accountId: arAcc.id,
          type: "DEBIT",
          amount: total,
          description: `Accounts Receivable for ${invoiceNumber}`,
          entityType: "CLIENT",
          entityId: clientId,
        },
        {
          accountId: revAcc.id,
          type: "CREDIT",
          amount: subtotal,
          description: `Sales Revenue for ${invoiceNumber}`,
          entityType: "CLIENT",
          entityId: clientId,
        },
      ];

      if (taxAmount > 0 && gstAcc) {
        journalLines.push({
          accountId: gstAcc.id,
          type: "CREDIT",
          amount: taxAmount,
          description: `Output GST for ${invoiceNumber}`,
          entityType: "CLIENT",
          entityId: clientId,
        });
      }

      await db.journalEntry.create({
        data: {
          organizationId: orgId,
          entryNumber: `JRN-${Date.now().toString().slice(-6)}`,
          reference: invoiceNumber,
          sourceType: "INVOICE",
          sourceId: invoice.id,
          totalAmount: total,
          status: "POSTED",
          lines: { create: journalLines },
        },
      });

      // Update AR balance
      await db.account.update({
        where: { id: arAcc.id },
        data: { balance: { increment: total } },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        organizationId: orgId,
        actorId: user.id,
        action: "INVOICE_CREATED",
        entity: "Invoice",
        entityId: invoice.id,
        newValue: JSON.stringify({ invoiceNumber, total }),
      },
    });

    return successResponse(invoice, 201);
  } catch (error: any) {
    console.error("[Accounts Invoices POST Error]:", error);
    return errorResponse(error.message || "Failed to create invoice", "INTERNAL_ERROR", 500);
  }
}
