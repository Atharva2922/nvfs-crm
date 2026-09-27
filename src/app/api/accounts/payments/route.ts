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
    const type = searchParams.get("type"); // RECEIVED or MADE

    const where: any = { organizationId: orgId };
    if (type === "RECEIVED") {
      where.clientId = { not: null };
    } else if (type === "MADE") {
      where.vendorId = { not: null };
    }

    const payments = await db.payment.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        vendor: { select: { id: true, displayName: true } },
        invoice: { select: { id: true, invoiceNumber: true, total: true, balance: true } },
      },
      orderBy: { paymentDate: "desc" },
    });

    return successResponse(payments);
  } catch (error: any) {
    console.error("[Accounts Payments GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch payments", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const orgId = AccountsService.getOrgId(user);

    const body = await req.json();
    const { invoiceId, amount, paymentDate, paymentMethod, reference, bankAccountId, notes, type } = body;

    if (!invoiceId) return errorResponse("Invoice/Bill reference is required", "BAD_REQUEST", 400);
    if (!amount || amount <= 0) return errorResponse("Valid payment amount is required", "BAD_REQUEST", 400);

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
      include: { client: true, vendor: true },
    });

    if (!invoice) return errorResponse("Invoice/Bill record not found", "NOT_FOUND", 404);

    const isCustomerPayment = invoice.invoiceType !== "VENDOR_PURCHASE";

    if (isCustomerPayment) {
      const payment = await AccountsService.recordCustomerPayment(user, {
        invoiceId,
        amount,
        paymentDate,
        paymentMethod: paymentMethod || "BANK_TRANSFER",
        reference,
        bankAccountId,
        notes,
      });
      return successResponse(payment, 201);
    } else {
      // Vendor bill payment
      const newPaidAmount = invoice.paidAmount + amount;
      const newBalance = Math.max(0, invoice.total - newPaidAmount);
      const newStatus = newBalance === 0 ? "PAID" : "PARTIALLY_PAID";
      const paymentRef = reference || `PAY-VEN-${Date.now().toString().slice(-6)}`;

      const payment = await db.payment.create({
        data: {
          organizationId: orgId,
          paymentReference: paymentRef,
          invoiceId: invoice.id,
          vendorId: invoice.vendorId,
          amount,
          currency: invoice.currency,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod: paymentMethod || "BANK_TRANSFER",
          transactionRef: reference,
          notes,
          status: "COMPLETED",
          recordedById: user.employee?.id || "",
        },
      });

      await db.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus,
        },
      });

      // Double-entry: Dr. Accounts Payable / Cr. Bank
      const apAcc =
        (await db.account.findFirst({ where: { organizationId: orgId, code: "2010" } })) ||
        (await db.account.findFirst({ where: { organizationId: orgId, subcategory: "CURRENT_LIABILITY" } }));

      const bankAcc =
        (await db.account.findFirst({ where: { organizationId: orgId, code: "1030" } })) ||
        (await db.account.findFirst({ where: { organizationId: orgId, subcategory: "BANK" } }));

      if (apAcc && bankAcc) {
        await db.journalEntry.create({
          data: {
            organizationId: orgId,
            entryNumber: `JRN-${Date.now().toString().slice(-6)}`,
            reference: `Vendor Settlement for ${invoice.invoiceNumber}`,
            sourceType: "PAYMENT",
            sourceId: payment.id,
            totalAmount: amount,
            status: "POSTED",
            lines: {
              create: [
                {
                  accountId: apAcc.id,
                  type: "DEBIT",
                  amount,
                  description: `Payment to ${invoice.vendor?.displayName || "Vendor"}`,
                  entityType: "VENDOR",
                  entityId: invoice.vendorId || undefined,
                },
                {
                  accountId: bankAcc.id,
                  type: "CREDIT",
                  amount,
                  description: `Bank disbursement for Bill #${invoice.invoiceNumber}`,
                },
              ],
            },
          },
        });

        await db.account.update({
          where: { id: bankAcc.id },
          data: { balance: { decrement: amount } },
        });

        if (bankAccountId) {
          await db.bankAccount.update({
            where: { id: bankAccountId },
            data: {
              currentBalance: { decrement: amount },
              availableBalance: { decrement: amount },
            },
          });
        }
      }

      await db.auditLog.create({
        data: {
          organizationId: orgId,
          actorId: user.id,
          action: "VENDOR_PAYMENT_RECORDED",
          entity: "Payment",
          entityId: payment.id,
          newValue: JSON.stringify({ amount, billNumber: invoice.invoiceNumber }),
        },
      });

      return successResponse(payment, 201);
    }
  } catch (error: any) {
    console.error("[Accounts Payments POST Error]:", error);
    return errorResponse(error.message || "Failed to record payment", "INTERNAL_ERROR", 500);
  }
}
