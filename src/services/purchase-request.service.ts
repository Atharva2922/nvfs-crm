import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";
import { NotificationService } from "./notification.service";

export interface CreatePurchaseRequestItemInput {
  productId: string;
  description?: string;
  quantity: number;
  estimatedUnitCost?: number;
}

export interface CreatePurchaseRequestInput {
  departmentId?: string;
  requiredDate: string | Date;
  reason: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  notes?: string;
  items: CreatePurchaseRequestItemInput[];
  submitImmediately?: boolean;
}

export class PurchaseRequestService {
  /**
   * Create a Purchase Request
   */
  static async createPurchaseRequest(user: AuthenticatedUser, data: CreatePurchaseRequestInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const departmentId = data.departmentId || user.employee.departmentId;
    if (!departmentId) throw new Error("Department is required for purchase request");

    if (!data.items || data.items.length === 0) {
      throw new Error("At least one item is required in a purchase request");
    }

    const year = new Date().getFullYear();
    const count = await db.purchaseRequest.count({ where: { organizationId: orgId } });
    const requestNumber = `PR-${year}-${String(count + 1).padStart(4, "0")}`;

    // Validate products and compute server-side estimated cost
    const productIds = data.items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, organizationId: orgId },
      include: {
        vendorProducts: {
          where: { isPreferred: true, status: "ACTIVE" },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalEstimatedCost = 0;
    const verifiedItems = data.items.map((item) => {
      const prod = productMap.get(item.productId);
      if (!prod) throw new Error(`Product ${item.productId} not found`);
      const qty = Number(item.quantity);
      if (qty <= 0) throw new Error(`Invalid quantity for product ${prod.name}`);

      // Determine unit cost: preferred vendor price, or product costPrice, or provided estimated cost
      let unitCost = item.estimatedUnitCost ?? 0;
      if (!unitCost || unitCost <= 0) {
        if (prod.vendorProducts && prod.vendorProducts.length > 0) {
          unitCost = prod.vendorProducts[0].purchasePrice;
        } else {
          unitCost = prod.costPrice > 0 ? prod.costPrice : prod.sellingPrice * 0.7;
        }
      }

      const lineTotal = Math.round(qty * unitCost * 100) / 100;
      totalEstimatedCost += lineTotal;

      return {
        productId: item.productId,
        description: item.description?.trim() || prod.name,
        quantity: qty,
        estimatedUnitCost: unitCost,
        estimatedTotal: lineTotal,
      };
    });

    const initialStatus = data.submitImmediately ? "SUBMITTED" : "DRAFT";

    const pr = await db.purchaseRequest.create({
      data: {
        organizationId: orgId,
        requestNumber,
        requesterId: user.employee.id,
        departmentId,
        requestDate: new Date(),
        requiredDate: new Date(data.requiredDate),
        reason: data.reason.trim(),
        priority: data.priority || "MEDIUM",
        estimatedCost: Math.round(totalEstimatedCost * 100) / 100,
        status: initialStatus,
        notes: data.notes?.trim() || null,
        items: {
          create: verifiedItems,
        },
      },
      include: {
        items: {
          include: { product: { select: { id: true, sku: true, name: true, unitOfMeasure: true } } },
        },
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: initialStatus === "SUBMITTED" ? "PURCHASE_REQUEST_SUBMITTED" : "PURCHASE_REQUEST_CREATED",
      entity: "PurchaseRequest",
      entityId: pr.id,
      metadata: { requestNumber: pr.requestNumber, estimatedCost: pr.estimatedCost },
    });

    if (initialStatus === "SUBMITTED") {
      await EventBusService.publish({
        type: "SYSTEM",
        organizationId: orgId,
        actorId: user.employee.id,
        targetUserIds: [],
        title: "Purchase Request Submitted",
        message: `Purchase request ${pr.requestNumber} submitted by ${user.employee.firstName} ${user.employee.lastName}`,
      });
    }

    return pr;
  }

  /**
   * List Purchase Requests
   */
  static async getPurchaseRequests(
    user: AuthenticatedUser,
    filters?: {
      status?: string;
      departmentId?: string;
      priority?: string;
      search?: string;
    }
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const where: any = { organizationId: orgId };
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.departmentId && filters.departmentId !== "ALL") where.departmentId = filters.departmentId;
    if (filters?.priority && filters.priority !== "ALL") where.priority = filters.priority;
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { requestNumber: { contains: q } },
        { reason: { contains: q } },
      ];
    }

    const prs = await db.purchaseRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: { product: { select: { id: true, sku: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return prs;
  }

  /**
   * Get Single Purchase Request
   */
  static async getPurchaseRequestById(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const pr = await db.purchaseRequest.findFirst({
      where: { id, organizationId: orgId },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, designation: true },
        },
        department: { select: { id: true, name: true, code: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unitOfMeasure: true,
                preferredVendorId: true,
              },
            },
          },
        },
        purchaseOrders: {
          select: { id: true, poNumber: true, status: true, total: true },
        },
      },
    });

    if (!pr) throw new Error("Purchase Request not found");
    return pr;
  }

  /**
   * Transition Purchase Request Status
   */
  static async transitionStatus(
    user: AuthenticatedUser,
    id: string,
    transition: "SUBMIT" | "REVIEW" | "APPROVE" | "REJECT" | "CANCEL",
    notesOrReason?: string
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const pr = await db.purchaseRequest.findFirst({
      where: { id, organizationId: orgId },
      include: { requester: true },
    });
    if (!pr) throw new Error("Purchase Request not found");

    const updateData: any = {};

    switch (transition) {
      case "SUBMIT":
        if (pr.status !== "DRAFT") throw new Error(`Cannot submit PR in ${pr.status} status`);
        updateData.status = "SUBMITTED";
        break;

      case "REVIEW":
        if (pr.status !== "SUBMITTED") throw new Error(`Cannot review PR in ${pr.status} status`);
        updateData.status = "UNDER_REVIEW";
        updateData.reviewedById = user.employee.id;
        updateData.reviewedAt = new Date();
        break;

      case "APPROVE":
        if (!["SUBMITTED", "UNDER_REVIEW"].includes(pr.status)) {
          throw new Error(`Cannot approve PR in ${pr.status} status`);
        }
        // Separation of duties: requester cannot approve their own PR unless SUPER_ADMIN or CEO
        if (pr.requesterId === user.employee.id && !["SUPER_ADMIN", "CEO"].includes(user.roleCode)) {
          throw new Error("Separation of duties: You cannot approve your own purchase request");
        }
        updateData.status = "APPROVED";
        updateData.approvedById = user.employee.id;
        updateData.approvedAt = new Date();
        break;

      case "REJECT":
        if (!["SUBMITTED", "UNDER_REVIEW"].includes(pr.status)) {
          throw new Error(`Cannot reject PR in ${pr.status} status`);
        }
        updateData.status = "REJECTED";
        updateData.rejectionReason = notesOrReason?.trim() || "Rejected during review";
        break;

      case "CANCEL":
        if (["APPROVED", "CONVERTED_TO_PO"].includes(pr.status)) {
          throw new Error(`Cannot cancel PR that is already ${pr.status}`);
        }
        updateData.status = "CANCELLED";
        break;

      default:
        throw new Error("Invalid PR transition action");
    }

    const updated = await db.purchaseRequest.update({
      where: { id },
      data: updateData,
      include: {
        requester: { select: { id: true, userId: true, firstName: true, lastName: true } },
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: `PURCHASE_REQUEST_${transition}ED`,
      entity: "PurchaseRequest",
      entityId: updated.id,
      metadata: { status: updated.status, notesOrReason },
    });

    // Notify requester if approved or rejected
    if (updated.requester.userId && ["APPROVE", "REJECT"].includes(transition)) {
      await db.notification.create({
        data: {
          organizationId: orgId,
          userId: updated.requester.userId,
          type: "SYSTEM",
          title: `Purchase Request ${updated.requestNumber} ${transition === "APPROVE" ? "Approved" : "Rejected"}`,
          message:
            transition === "APPROVE"
              ? `Your purchase request ${updated.requestNumber} for ${updated.estimatedCost} INR has been approved.`
              : `Your purchase request ${updated.requestNumber} for ${updated.estimatedCost} INR was rejected. Rationale: ${updated.rejectionReason || "N/A"}`,
          actionUrl: `/app/inventory/purchase-requests`,
          priority: "HIGH",
        },
      }).catch(() => null);
    }

    return updated;
  }

  /**
   * Convert Approved Purchase Request to Draft Purchase Order
   */
  static async convertToPurchaseOrder(
    user: AuthenticatedUser,
    prId: string,
    vendorId: string,
    expectedDeliveryDate: string | Date,
    paymentTerms?: string
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const pr = await db.purchaseRequest.findFirst({
      where: { id: prId, organizationId: orgId },
      include: { items: { include: { product: true } } },
    });

    if (!pr) throw new Error("Purchase request not found");
    if (pr.status !== "APPROVED") {
      throw new Error(`Only approved purchase requests can be converted to PO. Current status: ${pr.status}`);
    }

    const vendor = await db.vendor.findFirst({
      where: { id: vendorId, organizationId: orgId },
      include: { vendorProducts: true },
    });
    if (!vendor) throw new Error("Vendor not found");

    const vendorProductMap = new Map(vendor.vendorProducts.map((vp) => [vp.productId, vp]));

    const year = new Date().getFullYear();
    const poCount = await db.purchaseOrder.count({ where: { organizationId: orgId } });
    const poNumber = `PO-${year}-${String(poCount + 1).padStart(4, "0")}`;

    let subtotal = 0;
    const poItemsData = pr.items.map((item) => {
      const vp = vendorProductMap.get(item.productId);
      const unitCost = vp ? vp.purchasePrice : item.estimatedUnitCost;
      const lineTotal = Math.round(item.quantity * unitCost * 100) / 100;
      subtotal += lineTotal;

      return {
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitCost,
        discount: 0,
        tax: 0,
        total: lineTotal,
        receivedQuantity: 0,
      };
    });

    const taxAmount = 0;
    const total = subtotal + taxAmount;

    const result = await db.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          organizationId: orgId,
          poNumber,
          vendorId,
          purchaseRequestId: pr.id,
          poDate: new Date(),
          expectedDeliveryDate: new Date(expectedDeliveryDate),
          currency: vendor.currency || "INR",
          paymentTerms: paymentTerms || vendor.paymentTerms || "NET_30",
          subtotal,
          discountRate: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total,
          status: "DRAFT",
          createdById: user.employee!.id,
          items: {
            create: poItemsData,
          },
        },
        include: { items: true, vendor: true },
      });

      await tx.purchaseRequest.update({
        where: { id: pr.id },
        data: {
          status: "CONVERTED_TO_PO",
          convertedPurchaseOrderId: po.id,
        },
      });

      return po;
    });

    await AuditService.log({
      actorId: user.id,
      action: "PURCHASE_REQUEST_CONVERTED_TO_PO",
      entity: "PurchaseOrder",
      entityId: result.id,
      metadata: { prNumber: pr.requestNumber, poNumber: result.poNumber, vendorId },
    });

    return result;
  }

  /**
   * Low Stock Trigger: Generate Purchase Request from Low Stock product
   */
  static async createFromLowStock(
    user: AuthenticatedUser,
    productId: string,
    quantity?: number,
    requiredDate?: string | Date
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const product = await db.product.findFirst({
      where: { id: productId, organizationId: orgId },
      include: {
        inventoryItems: true,
        vendorProducts: {
          where: { isPreferred: true, status: "ACTIVE" },
          take: 1,
        },
      },
    });
    if (!product) throw new Error("Product not found");

    const currentStock = product.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const orderQty = quantity ?? (product.reorderQuantity && product.reorderQuantity > 0 ? product.reorderQuantity : 50);

    const defaultLeadDays = product.leadTimeDays ?? 7;
    const reqDate = requiredDate
      ? new Date(requiredDate)
      : new Date(Date.now() + defaultLeadDays * 24 * 60 * 60 * 1000);

    const pr = await this.createPurchaseRequest(user, {
      departmentId: user.employee.departmentId || undefined,
      requiredDate: reqDate,
      reason: `Auto-generated from Low Stock condition: Current Stock is ${currentStock} (Reorder level is ${product.reorderLevel})`,
      priority: currentStock <= 0 ? "URGENT" : "HIGH",
      items: [
        {
          productId: product.id,
          description: `Replenishment order for ${product.name} (SKU: ${product.sku})`,
          quantity: orderQty,
        },
      ],
      submitImmediately: false,
    });

    return pr;
  }
}
