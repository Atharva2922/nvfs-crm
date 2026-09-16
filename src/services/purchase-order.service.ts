import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";
import { NotificationService } from "./notification.service";

export interface CreatePurchaseOrderItemInput {
  productId: string;
  description?: string;
  quantity: number;
  unitCost: number;
  discount?: number;
  tax?: number;
}

export interface CreatePurchaseOrderInput {
  vendorId: string;
  purchaseRequestId?: string;
  expectedDeliveryDate: string | Date;
  currency?: string;
  paymentTerms?: string;
  shippingAddress?: string;
  billingAddress?: string;
  discountRate?: number;
  taxRate?: number;
  notes?: string;
  terms?: string;
  items: CreatePurchaseOrderItemInput[];
}

export class PurchaseOrderService {
  /**
   * Helper to recalculate costs server-side strictly
   */
  static calculateTotals(
    items: CreatePurchaseOrderItemInput[],
    discountRate: number = 0,
    taxRate: number = 0
  ) {
    let subtotal = 0;

    const validatedItems = items.map((item) => {
      const qty = Number(item.quantity);
      const cost = Number(item.unitCost);
      const disc = Number(item.discount || 0);
      const tax = Number(item.tax || 0);

      if (qty <= 0) throw new Error("Item quantity must be greater than zero");
      if (cost < 0) throw new Error("Unit cost cannot be negative");

      const lineGross = qty * cost;
      const lineTotal = Math.max(0, lineGross - disc + tax);
      subtotal += lineTotal;

      return {
        productId: item.productId,
        description: item.description?.trim() || "",
        quantity: qty,
        unitCost: cost,
        discount: disc,
        tax,
        total: Math.round(lineTotal * 100) / 100,
        receivedQuantity: 0,
      };
    });

    const discRate = Math.max(0, Math.min(100, Number(discountRate || 0)));
    const txRate = Math.max(0, Number(taxRate || 0));

    const discountAmount = Math.round(subtotal * (discRate / 100) * 100) / 100;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(taxableAmount * (txRate / 100) * 100) / 100;
    const total = Math.round((taxableAmount + taxAmount) * 100) / 100;

    return {
      items: validatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountRate: discRate,
      discountAmount,
      taxRate: txRate,
      taxAmount,
      total,
    };
  }

  /**
   * Create Purchase Order
   */
  static async createPurchaseOrder(user: AuthenticatedUser, data: CreatePurchaseOrderInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    if (!data.items || data.items.length === 0) {
      throw new Error("At least one line item is required for a Purchase Order");
    }

    const vendor = await db.vendor.findFirst({
      where: { id: data.vendorId, organizationId: orgId },
    });
    if (!vendor) throw new Error("Vendor not found");

    // Verify all products exist in Product master
    const productIds = data.items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, organizationId: orgId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    data.items.forEach((i) => {
      const prod = productMap.get(i.productId);
      if (!prod) throw new Error(`Product ${i.productId} does not exist in master catalog`);
      if (!i.description) i.description = prod.name;
    });

    // Calculate strictly server-side
    const calculation = this.calculateTotals(data.items, data.discountRate, data.taxRate);

    const year = new Date().getFullYear();
    const count = await db.purchaseOrder.count({ where: { organizationId: orgId } });
    const poNumber = `PO-${year}-${String(count + 1).padStart(4, "0")}`;

    const po = await db.purchaseOrder.create({
      data: {
        organizationId: orgId,
        poNumber,
        vendorId: data.vendorId,
        purchaseRequestId: data.purchaseRequestId || null,
        poDate: new Date(),
        expectedDeliveryDate: new Date(data.expectedDeliveryDate),
        currency: data.currency || vendor.currency || "INR",
        paymentTerms: data.paymentTerms || vendor.paymentTerms || "NET_30",
        shippingAddress: data.shippingAddress?.trim() || null,
        billingAddress: data.billingAddress?.trim() || null,
        subtotal: calculation.subtotal,
        discountRate: calculation.discountRate,
        discountAmount: calculation.discountAmount,
        taxRate: calculation.taxRate,
        taxAmount: calculation.taxAmount,
        total: calculation.total,
        status: "DRAFT",
        createdById: user.employee.id,
        notes: data.notes?.trim() || null,
        terms: data.terms?.trim() || null,
        items: {
          create: calculation.items,
        },
      },
      include: {
        vendor: true,
        items: { include: { product: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "PURCHASE_ORDER_CREATED",
      entity: "PurchaseOrder",
      entityId: po.id,
      metadata: { poNumber: po.poNumber, vendor: vendor.displayName, total: po.total },
    });

    return po;
  }

  /**
   * List Purchase Orders with filters
   */
  static async getPurchaseOrders(
    user: AuthenticatedUser,
    filters?: {
      status?: string;
      vendorId?: string;
      search?: string;
    }
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const where: any = { organizationId: orgId };
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.vendorId && filters.vendorId !== "ALL") where.vendorId = filters.vendorId;
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { poNumber: { contains: q } },
        { vendor: { displayName: { contains: q } } },
      ];
    }

    const pos = await db.purchaseOrder.findMany({
      where,
      include: {
        vendor: { select: { id: true, vendorCode: true, displayName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { items: true, goodsReceipts: true } },
      },
      orderBy: { poDate: "desc" },
    });

    return pos;
  }

  /**
   * Get Single Purchase Order Document Details
   */
  static async getPurchaseOrderById(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const po = await db.purchaseOrder.findFirst({
      where: { id, organizationId: orgId },
      include: {
        vendor: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true, designation: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        purchaseRequest: {
          select: { id: true, requestNumber: true, status: true, requester: { select: { firstName: true, lastName: true } } },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unitOfMeasure: true,
              },
            },
          },
        },
        goodsReceipts: {
          include: {
            warehouse: { select: { id: true, code: true, name: true } },
            receivedBy: { select: { firstName: true, lastName: true } },
            items: true,
          },
          orderBy: { receivedDate: "desc" },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            dueDate: true,
            total: true,
            paidAmount: true,
            balance: true,
            status: true,
          },
        },
      },
    });

    if (!po) throw new Error("Purchase Order not found");
    return po;
  }

  /**
   * Transition PO Status
   */
  static async transitionStatus(
    user: AuthenticatedUser,
    id: string,
    transition: "SUBMIT" | "APPROVE" | "REJECT" | "SEND" | "CLOSE" | "CANCEL",
    reasonOrNotes?: string
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const po = await db.purchaseOrder.findFirst({
      where: { id, organizationId: orgId },
      include: { vendor: true, createdBy: true },
    });
    if (!po) throw new Error("Purchase Order not found");

    const updateData: any = {};

    switch (transition) {
      case "SUBMIT":
        if (po.status !== "DRAFT") throw new Error(`Cannot submit PO in ${po.status} status`);
        updateData.status = "PENDING_APPROVAL";
        break;

      case "APPROVE":
        if (po.status !== "PENDING_APPROVAL") {
          throw new Error(`Cannot approve PO in ${po.status} status`);
        }
        // Separation of duties
        if (po.createdById === user.employee.id && !["SUPER_ADMIN", "CEO", "CFO"].includes(user.roleCode)) {
          throw new Error("Separation of duties: You cannot approve your own Purchase Order");
        }
        updateData.status = "APPROVED";
        updateData.approvedById = user.employee.id;
        updateData.approvedAt = new Date();
        break;

      case "REJECT":
        if (po.status !== "PENDING_APPROVAL") {
          throw new Error(`Cannot reject PO in ${po.status} status`);
        }
        updateData.status = "DRAFT"; // Returns to draft for corrections
        updateData.notes = `${po.notes ? po.notes + "\n" : ""}[Rejection]: ${reasonOrNotes || "Needs revision"}`;
        break;

      case "SEND":
        if (po.status !== "APPROVED") {
          throw new Error(`Only approved POs can be sent. Current status: ${po.status}`);
        }
        updateData.status = "SENT";
        updateData.sentAt = new Date();
        break;

      case "CLOSE":
        if (!["RECEIVED", "PARTIALLY_RECEIVED", "SENT"].includes(po.status)) {
          throw new Error(`Cannot close PO in status ${po.status}`);
        }
        updateData.status = "CLOSED";
        updateData.closedAt = new Date();
        break;

      case "CANCEL":
        if (["RECEIVED", "CLOSED"].includes(po.status)) {
          throw new Error(`Cannot cancel PO that is already ${po.status}`);
        }
        updateData.status = "CANCELLED";
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = reasonOrNotes?.trim() || "Cancelled by authorized user";
        break;

      default:
        throw new Error("Invalid status transition action");
    }

    const updated = await db.purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    await AuditService.log({
      actorId: user.id,
      action: `PURCHASE_ORDER_${transition}ED`,
      entity: "PurchaseOrder",
      entityId: updated.id,
      metadata: { previousStatus: po.status, newStatus: updated.status, reasonOrNotes },
    });

    return updated;
  }
}
