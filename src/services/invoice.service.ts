import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export interface CreateInvoiceItemInput {
  description: string;
  productId?: string;
  serviceId?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

export interface CreateInvoiceInput {
  clientId: string;
  contactId?: string;
  opportunityId?: string;
  invoiceDate: string | Date;
  dueDate: string | Date;
  currency?: string;
  taxRate?: number;
  discountRate?: number;
  notes?: string;
  terms?: string;
  items: CreateInvoiceItemInput[];
}

export interface InvoiceFilters {
  status?: string;
  clientId?: string;
  overdueOnly?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export class InvoiceService {
  static isExecutive(user: AuthenticatedUser): boolean {
    const execRoles = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "ADMIN"];
    return execRoles.includes(user.roleCode);
  }

  /**
   * List invoices with filtering and searching
   */
  static async getInvoices(user: AuthenticatedUser, filters?: InvoiceFilters) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const where: any = { organizationId: orgId };

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.overdueOnly) {
      where.dueDate = { lt: new Date() };
      where.balance = { gt: 0 };
      where.status = { not: "CANCELLED" };
    }

    if (filters?.startDate || filters?.endDate) {
      where.invoiceDate = {};
      if (filters.startDate) where.invoiceDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.invoiceDate.lte = new Date(filters.endDate);
    }

    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { invoiceNumber: { contains: q } },
        { notes: { contains: q } },
        { client: { name: { contains: q } } },
      ];
    }

    return db.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, code: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { items: true, payments: true } },
      },
    });
  }

  /**
   * Retrieves single invoice with full items and payments history
   */
  static async getInvoiceById(id: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        contact: true,
        opportunity: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, designation: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, designation: true } },
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
            service: { select: { id: true, serviceCode: true, name: true, billingUnit: true } },
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          include: { recordedBy: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!invoice || invoice.organizationId !== orgId) {
      throw new Error("Invoice not found or unauthorized");
    }

    return invoice;
  }

  /**
   * Creates a new customer invoice with computed totals
   */
  static async createInvoice(user: AuthenticatedUser, data: CreateInvoiceInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    if (!data.items || data.items.length === 0) {
      throw new Error("Invoice must contain at least one line item");
    }

    const client = await db.client.findUnique({ where: { id: data.clientId } });
    if (!client || client.organizationId !== orgId) {
      throw new Error("Invalid client account specified");
    }

    // Generate sequential invoice number (INV-YYYY-XXXX)
    const currentYear = new Date().getFullYear();
    const count = await db.invoice.count({ where: { organizationId: orgId } });
    const invoiceNumber = `INV-${currentYear}-${(count + 1).toString().padStart(4, "0")}`;

    // Calculate line items and totals server-side
    let subtotal = 0;
    const computedItems = data.items.map((it) => {
      const qty = it.quantity || 1;
      const rate = it.unitPrice || 0;
      const disc = it.discount || 0;
      const lineTotal = Math.max(0, qty * rate - disc);
      subtotal += lineTotal;

      return {
        description: it.description.trim(),
        productId: it.productId || null,
        serviceId: it.serviceId || null,
        quantity: qty,
        unitPrice: rate,
        discount: disc,
        taxRate: it.taxRate || 0,
        amount: lineTotal,
      };
    });

    const taxRate = data.taxRate || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discountRate = data.discountRate || 0;
    const discountAmount = (subtotal * discountRate) / 100;
    const total = Math.max(0, subtotal + taxAmount - discountAmount);

    const invoice = await db.invoice.create({
      data: {
        organizationId: orgId,
        invoiceNumber,
        clientId: data.clientId,
        contactId: data.contactId || null,
        opportunityId: data.opportunityId || null,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        currency: data.currency || (client as Record<string, any>).currency || "INR",
        subtotal,
        taxRate,
        taxAmount,
        discountRate,
        discountAmount,
        total,
        paidAmount: 0,
        balance: total,
        status: "DRAFT",
        notes: data.notes || null,
        terms: data.terms || "Net 30. Standard commercial terms apply.",
        createdById: user.employee.id,
        items: {
          create: computedItems,
        },
      },
      include: { client: true, items: true },
    });

    await AuditService.log({
      actorId: user.id,
      action: "INVOICE_CREATED",
      entity: "Invoice",
      entityId: invoice.id,
      newValue: { invoiceNumber, total, clientId: client.id, clientName: client.name },
    });

    return invoice;
  }

  /**
   * Executes validated server-side state transitions
   */
  static async transitionStatus(
    id: string,
    user: AuthenticatedUser,
    action: "SUBMIT" | "APPROVE" | "REJECT" | "SEND" | "CANCEL",
    metadata?: { reason?: string }
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const invoice = await db.invoice.findUnique({ where: { id } });
    if (!invoice || invoice.organizationId !== orgId) {
      throw new Error("Invoice not found or unauthorized");
    }

    const prevStatus = invoice.status;
    let newStatus = prevStatus;
    let approvedById: string | null = invoice.approvedById;
    let approvedAt: Date | null = invoice.approvedAt;
    let cancelledAt: Date | null = invoice.cancelledAt;
    let rejectionReason: string | null = invoice.rejectionReason;

    switch (action) {
      case "SUBMIT":
        if (invoice.status !== "DRAFT" && invoice.status !== "REJECTED") {
          throw new Error(`Cannot submit invoice with status ${invoice.status}`);
        }
        newStatus = "PENDING_APPROVAL";
        break;

      case "APPROVE":
        if (invoice.status !== "PENDING_APPROVAL") {
          throw new Error(`Cannot approve invoice with status ${invoice.status}`);
        }
        // Permission check
        if (!this.isExecutive(user) && !user.permissions.includes("invoice.approve")) {
          throw new Error("Forbidden: You do not have permission to approve customer invoices");
        }
        newStatus = "APPROVED";
        approvedById = user.employee.id;
        approvedAt = new Date();
        rejectionReason = null;
        break;

      case "REJECT":
        if (invoice.status !== "PENDING_APPROVAL") {
          throw new Error(`Cannot reject invoice with status ${invoice.status}`);
        }
        if (!this.isExecutive(user) && !user.permissions.includes("invoice.approve")) {
          throw new Error("Forbidden: You do not have permission to review customer invoices");
        }
        newStatus = "REJECTED";
        rejectionReason = metadata?.reason || "Rejected by finance review";
        break;

      case "SEND":
        if (invoice.status !== "APPROVED") {
          throw new Error("Only approved invoices can be dispatched/sent to clients");
        }
        newStatus = "SENT";
        break;

      case "CANCEL":
        if (invoice.paidAmount > 0) {
          throw new Error("Cannot cancel an invoice with recorded payments. Payments must be reversed first.");
        }
        if (invoice.status === "PAID") {
          throw new Error("Cannot cancel a paid invoice");
        }
        newStatus = "CANCELLED";
        cancelledAt = new Date();
        break;

      default:
        throw new Error(`Invalid invoice transition action: ${action}`);
    }

    const updated = await db.invoice.update({
      where: { id },
      data: {
        status: newStatus,
        approvedById,
        approvedAt,
        cancelledAt,
        rejectionReason,
      },
      include: { client: true },
    });

    await AuditService.log({
      actorId: user.id,
      action: `INVOICE_${action}`,
      entity: "Invoice",
      entityId: invoice.id,
      previousValue: { status: prevStatus },
      newValue: { status: newStatus, reason: metadata?.reason },
    });

    return updated;
  }

  /**
   * Accounts Receivable ledger & aging analysis
   */
  static async getReceivables(user: AuthenticatedUser) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const now = new Date();

    const openInvoices = await db.invoice.findMany({
      where: {
        organizationId: orgId,
        balance: { gt: 0 },
        status: { in: ["APPROVED", "SENT", "PARTIALLY_PAID"] },
      },
      orderBy: { dueDate: "asc" },
      include: {
        client: { select: { id: true, name: true, code: true } },
      },
    });

    const agingBuckets = {
      current: [] as any[],
      days1_30: [] as any[],
      days31_60: [] as any[],
      days61_90: [] as any[],
      days90Plus: [] as any[],
    };

    let totalReceivable = 0;
    let totalOverdue = 0;

    const items = openInvoices.map((inv) => {
      const dueDate = new Date(inv.dueDate);
      const isOverdue = dueDate < now;
      const diffDays = isOverdue ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      totalReceivable += inv.balance;
      if (isOverdue) totalOverdue += inv.balance;

      let bucket: keyof typeof agingBuckets = "current";
      if (isOverdue) {
        if (diffDays <= 30) bucket = "days1_30";
        else if (diffDays <= 60) bucket = "days31_60";
        else if (diffDays <= 90) bucket = "days61_90";
        else bucket = "days90Plus";
      }

      const row = {
        ...inv,
        isOverdue,
        daysOverdue: diffDays,
        bucket,
      };

      agingBuckets[bucket].push(row);
      return row;
    });

    return {
      totalReceivable: Math.round(totalReceivable),
      totalOverdue: Math.round(totalOverdue),
      agingBuckets: {
        current: {
          count: agingBuckets.current.length,
          amount: Math.round(agingBuckets.current.reduce((s, i) => s + i.balance, 0)),
        },
        days1_30: {
          count: agingBuckets.days1_30.length,
          amount: Math.round(agingBuckets.days1_30.reduce((s, i) => s + i.balance, 0)),
        },
        days31_60: {
          count: agingBuckets.days31_60.length,
          amount: Math.round(agingBuckets.days31_60.reduce((s, i) => s + i.balance, 0)),
        },
        days61_90: {
          count: agingBuckets.days61_90.length,
          amount: Math.round(agingBuckets.days61_90.reduce((s, i) => s + i.balance, 0)),
        },
        days90Plus: {
          count: agingBuckets.days90Plus.length,
          amount: Math.round(agingBuckets.days90Plus.reduce((s, i) => s + i.balance, 0)),
        },
      },
      receivablesList: items,
    };
  }
}
