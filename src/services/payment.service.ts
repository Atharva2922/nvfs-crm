import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentDate?: string | Date;
  paymentMethod: "BANK_TRANSFER" | "CREDIT_CARD" | "CHECK" | "CASH" | "ACH" | "WIRE";
  transactionRef?: string;
  notes?: string;
}

export class PaymentService {
  static isExecutive(user: AuthenticatedUser): boolean {
    const execRoles = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "ADMIN"];
    return execRoles.includes(user.roleCode);
  }

  /**
   * Retrieves payment records with optional filtering
   */
  static async getPayments(user: AuthenticatedUser, filters?: { invoiceId?: string; clientId?: string; status?: string }) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const where: any = { organizationId: orgId };
    if (filters?.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;

    return db.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        invoice: { select: { id: true, invoiceNumber: true, total: true, balance: true, status: true } },
        client: { select: { id: true, name: true, code: true } },
        recordedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Records a payment against an invoice with atomic integrity checks
   */
  static async recordPayment(user: AuthenticatedUser, data: RecordPaymentInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    if (data.amount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    const invoice = await db.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { client: true },
    });

    if (!invoice || invoice.organizationId !== orgId) {
      throw new Error("Invoice not found or unauthorized");
    }

    if (!["APPROVED", "SENT", "PARTIALLY_PAID"].includes(invoice.status)) {
      throw new Error(`Cannot record payment against an invoice with status ${invoice.status}`);
    }

    // Overpayment prevention
    if (data.amount > invoice.balance + 0.001) {
      throw new Error(
        `Payment amount (₹${data.amount.toLocaleString()}) cannot exceed outstanding invoice balance (₹${invoice.balance.toLocaleString()})`
      );
    }

    const currentYear = new Date().getFullYear();
    const count = await db.payment.count({ where: { organizationId: orgId } });
    const paymentReference = `PAY-${currentYear}-${(count + 1).toString().padStart(4, "0")}`;

    const newPaidAmount = invoice.paidAmount + data.amount;
    const newBalance = Math.max(0, invoice.total - newPaidAmount);
    const newInvoiceStatus = newBalance <= 0.01 ? "PAID" : "PARTIALLY_PAID";

    // Atomic Database Transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create Payment
      const payment = await tx.payment.create({
        data: {
          organizationId: orgId,
          paymentReference,
          invoiceId: invoice.id,
          clientId: invoice.clientId,
          amount: data.amount,
          currency: invoice.currency,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          paymentMethod: data.paymentMethod,
          transactionRef: data.transactionRef || null,
          notes: data.notes || null,
          status: "COMPLETED",
          recordedById: user.employee!.id,
        },
      });

      // 2. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newInvoiceStatus,
        },
      });

      // 3. Create Central Financial Transaction
      const txCount = await tx.financialTransaction.count({ where: { organizationId: orgId } });
      const transactionNumber = `TXN-${currentYear}-${(txCount + 1).toString().padStart(4, "0")}`;

      const finTxn = await tx.financialTransaction.create({
        data: {
          organizationId: orgId,
          transactionNumber,
          type: "INVOICE_PAYMENT",
          direction: "INFLOW",
          sourceType: "PAYMENT",
          sourceId: payment.id,
          amount: data.amount,
          currency: invoice.currency,
          date: payment.paymentDate,
          description: `Payment received for Invoice ${invoice.invoiceNumber} (${invoice.client?.name || "Vendor/Client"})`,
          reference: data.transactionRef || paymentReference,
          createdById: user.employee!.id,
          invoiceId: invoice.id,
          paymentId: payment.id,
        },
      });

      return { payment, invoice: updatedInvoice, transaction: finTxn };
    });

    await AuditService.log({
      actorId: user.id,
      action: "PAYMENT_RECORDED",
      entity: "Payment",
      entityId: result.payment.id,
      newValue: {
        paymentReference,
        invoiceNumber: invoice.invoiceNumber,
        amount: data.amount,
        newInvoiceStatus,
        newBalance,
      },
    });

    return result;
  }

  /**
   * Reverses an existing payment transaction
   */
  static async reversePayment(paymentId: string, user: AuthenticatedUser, reason: string) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    if (!this.isExecutive(user) && !user.permissions.includes("payment.reverse")) {
      throw new Error("Forbidden: You do not have permission to reverse payment transactions");
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment || payment.organizationId !== orgId) {
      throw new Error("Payment record not found");
    }

    if (payment.status === "REVERSED") {
      throw new Error("This payment has already been reversed");
    }

    const currentYear = new Date().getFullYear();
    const newPaidAmount = Math.max(0, payment.invoice.paidAmount - payment.amount);
    const newBalance = payment.invoice.total - newPaidAmount;
    const newInvoiceStatus = newPaidAmount > 0 ? "PARTIALLY_PAID" : "SENT";

    const result = await db.$transaction(async (tx) => {
      // 1. Mark Payment as Reversed
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "REVERSED",
          reversedById: user.employee!.id,
          reversedAt: new Date(),
          reversalReason: reason,
        },
      });

      // 2. Restore Invoice Balance
      const updatedInvoice = await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newInvoiceStatus,
        },
      });

      // 3. Create Offsetting Financial Transaction
      const txCount = await tx.financialTransaction.count({ where: { organizationId: orgId } });
      const transactionNumber = `TXN-${currentYear}-${(txCount + 1).toString().padStart(4, "0")}`;

      await tx.financialTransaction.create({
        data: {
          organizationId: orgId,
          transactionNumber,
          type: "ADJUSTMENT",
          direction: "OUTFLOW",
          sourceType: "PAYMENT",
          sourceId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          date: new Date(),
          description: `Reversal of Payment ${payment.paymentReference} (Reason: ${reason})`,
          reference: payment.paymentReference,
          createdById: user.employee!.id,
          invoiceId: payment.invoiceId,
          paymentId: payment.id,
        },
      });

      return { payment: updatedPayment, invoice: updatedInvoice };
    });

    await AuditService.log({
      actorId: user.id,
      action: "PAYMENT_REVERSED",
      entity: "Payment",
      entityId: payment.id,
      previousValue: { status: "COMPLETED", amount: payment.amount },
      newValue: { status: "REVERSED", reason, restoredBalance: newBalance },
    });

    return result;
  }
}
