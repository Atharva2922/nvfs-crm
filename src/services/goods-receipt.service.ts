import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";
import { NotificationService } from "./notification.service";

export interface GoodsReceiptLineInput {
  purchaseOrderItemId: string;
  receivedQuantity: number;
  rejectedQuantity?: number;
  rejectionReason?: string;
}

export interface CreateGoodsReceiptInput {
  purchaseOrderId: string;
  warehouseId: string;
  receivedDate?: string | Date;
  notes?: string;
  attachments?: string;
  items: GoodsReceiptLineInput[];
  finalizeImmediately?: boolean;
}

export class GoodsReceiptService {
  /**
   * Create Draft or Finalized Goods Receipt
   */
  static async createGoodsReceipt(user: AuthenticatedUser, data: CreateGoodsReceiptInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    if (!data.items || data.items.length === 0) {
      throw new Error("Goods receipt must contain at least one line item");
    }

    const po = await db.purchaseOrder.findFirst({
      where: { id: data.purchaseOrderId, organizationId: orgId },
      include: {
        vendor: true,
        items: true,
      },
    });
    if (!po) throw new Error("Purchase order not found");
    if (!["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(po.status)) {
      throw new Error(`Cannot receive goods for PO in ${po.status} status. PO must be Approved or Sent.`);
    }

    const warehouse = await db.warehouse.findFirst({
      where: { id: data.warehouseId, organizationId: orgId, status: "ACTIVE" },
    });
    if (!warehouse) throw new Error("Active destination warehouse not found");

    const poItemMap = new Map(po.items.map((i) => [i.id, i]));

    // Validate quantities
    const receiptItemsData = data.items.map((input) => {
      const poItem = poItemMap.get(input.purchaseOrderItemId);
      if (!poItem) throw new Error(`PO Line Item ${input.purchaseOrderItemId} not found`);

      const recQty = Number(input.receivedQuantity);
      const rejQty = Number(input.rejectedQuantity || 0);

      if (recQty <= 0) throw new Error(`Received quantity for item ${poItem.description} must be > 0`);
      if (rejQty < 0) throw new Error(`Rejected quantity cannot be negative`);
      if (rejQty > recQty) throw new Error(`Rejected quantity cannot exceed received quantity`);

      // Over-receipt check against remaining
      const remaining = poItem.quantity - poItem.receivedQuantity;
      if (recQty > remaining + 0.0001) {
        throw new Error(
          `Received quantity (${recQty}) exceeds remaining order balance (${remaining}) for item ${poItem.description}`
        );
      }

      const acceptedQty = recQty - rejQty;

      return {
        purchaseOrderItemId: poItem.id,
        productId: poItem.productId,
        orderedQuantity: poItem.quantity,
        receivedQuantity: recQty,
        rejectedQuantity: rejQty,
        acceptedQuantity: acceptedQty,
        rejectionReason: rejQty > 0 ? input.rejectionReason || "Damaged/Defective upon delivery" : null,
        unitCost: poItem.unitCost,
      };
    });

    const year = new Date().getFullYear();
    const count = await db.goodsReceipt.count({ where: { organizationId: orgId } });
    const receiptNumber = `GR-${year}-${String(count + 1).padStart(4, "0")}`;

    if (data.finalizeImmediately) {
      // Execute atomically
      return await this.executeFinalizeReceipt(user, {
        orgId,
        receiptNumber,
        purchaseOrder: po,
        warehouse,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
        notes: data.notes,
        attachments: data.attachments,
        itemsData: receiptItemsData,
      });
    }

    // Otherwise create draft
    const gr = await db.goodsReceipt.create({
      data: {
        organizationId: orgId,
        receiptNumber,
        purchaseOrderId: po.id,
        vendorId: po.vendorId,
        warehouseId: warehouse.id,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
        receivedById: user.employee.id,
        status: "DRAFT",
        notes: data.notes?.trim() || null,
        attachments: data.attachments || null,
        items: {
          create: receiptItemsData,
        },
      },
      include: {
        items: { include: { product: true } },
        purchaseOrder: true,
        warehouse: true,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "GOODS_RECEIPT_CREATED",
      entity: "GoodsReceipt",
      entityId: gr.id,
      metadata: { receiptNumber: gr.receiptNumber, poNumber: po.poNumber },
    });

    return gr;
  }

  /**
   * Finalize an existing Draft Goods Receipt
   */
  static async finalizeGoodsReceipt(user: AuthenticatedUser, receiptId: string) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const gr = await db.goodsReceipt.findFirst({
      where: { id: receiptId, organizationId: orgId },
      include: {
        items: true,
        purchaseOrder: { include: { items: true, vendor: true } },
        warehouse: true,
      },
    });

    if (!gr) throw new Error("Goods Receipt not found");
    if (gr.status === "FINALIZED") throw new Error("Goods Receipt is already finalized");

    const po = gr.purchaseOrder;
    if (!["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(po.status)) {
      throw new Error(`Cannot finalize receipt for PO in ${po.status} status`);
    }

    const itemsData = gr.items.map((item) => ({
      purchaseOrderItemId: item.purchaseOrderItemId,
      productId: item.productId,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity,
      rejectedQuantity: item.rejectedQuantity,
      acceptedQuantity: item.acceptedQuantity,
      rejectionReason: item.rejectionReason,
      unitCost: item.unitCost,
    }));

    return await this.executeFinalizeReceipt(user, {
      orgId,
      receiptNumber: gr.receiptNumber,
      existingReceiptId: gr.id,
      purchaseOrder: po,
      warehouse: gr.warehouse,
      receivedDate: gr.receivedDate,
      notes: gr.notes || undefined,
      attachments: gr.attachments || undefined,
      itemsData,
    });
  }

  /**
   * Core Atomic Transaction Execution for Goods Receipt Finalization
   */
  private static async executeFinalizeReceipt(
    user: AuthenticatedUser,
    params: {
      orgId: string;
      receiptNumber: string;
      existingReceiptId?: string;
      purchaseOrder: any;
      warehouse: any;
      receivedDate: Date;
      notes?: string;
      attachments?: string;
      itemsData: Array<{
        purchaseOrderItemId: string;
        productId: string;
        orderedQuantity: number;
        receivedQuantity: number;
        rejectedQuantity: number;
        acceptedQuantity: number;
        rejectionReason: string | null;
        unitCost: number;
      }>;
    }
  ) {
    const {
      orgId,
      receiptNumber,
      existingReceiptId,
      purchaseOrder,
      warehouse,
      receivedDate,
      notes,
      attachments,
      itemsData,
    } = params;

    const finalizedResult = await db.$transaction(async (tx) => {
      // 1. Create or Update GoodsReceipt record to FINALIZED
      let receipt: any;
      if (existingReceiptId) {
        receipt = await tx.goodsReceipt.update({
          where: { id: existingReceiptId },
          data: {
            status: "FINALIZED",
            finalizedAt: new Date(),
            finalizedById: user.employee!.id,
          },
          include: { items: true },
        });
      } else {
        receipt = await tx.goodsReceipt.create({
          data: {
            organizationId: orgId,
            receiptNumber,
            purchaseOrderId: purchaseOrder.id,
            vendorId: purchaseOrder.vendorId,
            warehouseId: warehouse.id,
            receivedDate,
            receivedById: user.employee!.id,
            status: "FINALIZED",
            finalizedAt: new Date(),
            finalizedById: user.employee!.id,
            notes: notes?.trim() || null,
            attachments: attachments || null,
            items: {
              create: itemsData,
            },
          },
          include: { items: true },
        });
      }

      // 2. Loop through received items:
      // - Update InventoryItem balance ONLY by acceptedQuantity
      // - Generate StockMovement record for acceptedQuantity
      // - Update PurchaseOrderItem receivedQuantity
      for (const line of itemsData) {
        const accepted = Number(line.acceptedQuantity);

        // Fetch current stock item in warehouse
        const invItem = await tx.inventoryItem.findUnique({
          where: {
            productId_warehouseId: {
              productId: line.productId,
              warehouseId: warehouse.id,
            },
          },
        });

        const previousBalance = invItem ? invItem.quantity : 0.0;
        const newBalance = previousBalance + accepted;

        // Update inventory balance (only accepted goods increase stock!)
        if (accepted > 0) {
          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: line.productId,
                warehouseId: warehouse.id,
              },
            },
            create: {
              organizationId: orgId,
              productId: line.productId,
              warehouseId: warehouse.id,
              quantity: newBalance,
            },
            update: {
              quantity: newBalance,
            },
          });

          // Immutable StockMovement ledger
          const movementCount = await tx.stockMovement.count({ where: { organizationId: orgId } });
          const movementNumber = `MOV-${new Date().getFullYear()}-${String(movementCount + 1).padStart(4, "0")}`;

          await tx.stockMovement.create({
            data: {
              organizationId: orgId,
              movementNumber,
              productId: line.productId,
              type: "STOCK_IN",
              quantity: accepted,
              destinationWarehouseId: warehouse.id,
              referenceType: "PURCHASE_ORDER",
              referenceId: purchaseOrder.id,
              reason: `Goods received against PO ${purchaseOrder.poNumber} (Receipt ${receiptNumber})`,
              previousBalance,
              newBalance,
              performedById: user.employee!.id,
              notes: line.rejectedQuantity > 0 ? `Rejected: ${line.rejectedQuantity}. Reason: ${line.rejectionReason}` : null,
            },
          });
        }

        // Increment cumulative received quantity on PO item
        await tx.purchaseOrderItem.update({
          where: { id: line.purchaseOrderItemId },
          data: {
            receivedQuantity: {
              increment: line.receivedQuantity,
            },
          },
        });
      }

      // 3. Check overall PO fulfillment status
      const updatedPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: purchaseOrder.id },
      });

      let allFullyReceived = true;
      let anyReceived = false;

      for (const item of updatedPoItems) {
        if (item.receivedQuantity < item.quantity) {
          allFullyReceived = false;
        }
        if (item.receivedQuantity > 0) {
          anyReceived = true;
        }
      }

      const newPoStatus = allFullyReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : purchaseOrder.status;

      await tx.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: { status: newPoStatus },
      });

      return { receipt, newPoStatus };
    });

    // 4. Audit Log & Notifications
    await AuditService.log({
      actorId: user.id,
      action: "GOODS_RECEIPT_FINALIZED",
      entity: "GoodsReceipt",
      entityId: finalizedResult.receipt.id,
      metadata: {
        receiptNumber,
        poNumber: purchaseOrder.poNumber,
        warehouseCode: warehouse.code,
        poStatus: finalizedResult.newPoStatus,
      },
    });

    await EventBusService.publish({
      type: "SYSTEM",
      organizationId: orgId,
      actorId: user.employee!.id,
      targetUserIds: [],
      title: "Goods Receipt Finalized",
      message: `Goods receipt ${receiptNumber} finalized for PO ${purchaseOrder.poNumber}. PO is now ${finalizedResult.newPoStatus}.`,
    });

    return finalizedResult.receipt;
  }

  /**
   * List Goods Receipts with filters
   */
  static async getGoodsReceipts(
    user: AuthenticatedUser,
    filters?: {
      purchaseOrderId?: string;
      vendorId?: string;
      warehouseId?: string;
      status?: string;
      search?: string;
    }
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const where: any = { organizationId: orgId };
    if (filters?.purchaseOrderId && filters.purchaseOrderId !== "ALL") where.purchaseOrderId = filters.purchaseOrderId;
    if (filters?.vendorId && filters.vendorId !== "ALL") where.vendorId = filters.vendorId;
    if (filters?.warehouseId && filters.warehouseId !== "ALL") where.warehouseId = filters.warehouseId;
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { receiptNumber: { contains: q } },
        { purchaseOrder: { poNumber: { contains: q } } },
        { vendor: { displayName: { contains: q } } },
      ];
    }

    const receipts = await db.goodsReceipt.findMany({
      where,
      include: {
        vendor: { select: { id: true, vendorCode: true, displayName: true } },
        warehouse: { select: { id: true, code: true, name: true } },
        purchaseOrder: { select: { id: true, poNumber: true, status: true } },
        receivedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { receivedDate: "desc" },
    });

    return receipts;
  }

  /**
   * Get Single Goods Receipt
   */
  static async getGoodsReceiptById(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const receipt = await db.goodsReceipt.findFirst({
      where: { id, organizationId: orgId },
      include: {
        vendor: true,
        warehouse: true,
        purchaseOrder: {
          include: {
            items: { include: { product: true } },
          },
        },
        receivedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        finalizedBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
            purchaseOrderItem: true,
          },
        },
      },
    });

    if (!receipt) throw new Error("Goods Receipt not found");
    return receipt;
  }
}
