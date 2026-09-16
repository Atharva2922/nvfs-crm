import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { ProductService } from "./product.service";

export interface StockInInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  reason: string;
  notes?: string;
}

export interface StockOutInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  reason: string;
  notes?: string;
}

export interface StockTransferInput {
  productId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface CreateAdjustmentInput {
  warehouseId: string;
  reason: "DAMAGED_GOODS" | "LOST_GOODS" | "PHYSICAL_COUNT_DISCREPANCY" | "EXPIRATION" | "CORRECTION" | "OTHER";
  notes?: string;
  items: Array<{
    productId: string;
    countedQuantity: number;
  }>;
  autoSubmit?: boolean;
}

export class InventoryService {
  static canViewCost(user: AuthenticatedUser): boolean {
    const privileged = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "ADMIN"];
    if (privileged.includes(user.roleCode)) return true;
    return user.permissions?.includes("products.cost.read") || false;
  }

  /**
   * Comprehensive Inventory Overview KPIs & Distribution
   */
  static async getOverviewKpis(user: AuthenticatedUser) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const canSeeCost = this.canViewCost(user);

    const [products, servicesCount, inventoryItems, warehouses, categories] = await Promise.all([
      db.product.findMany({
        where: { organizationId: orgId, isActive: true },
        include: {
          inventoryItems: true,
          category: true,
        },
      }),
      db.service.count({
        where: { organizationId: orgId, isActive: true },
      }),
      db.inventoryItem.findMany({
        where: { organizationId: orgId },
        include: {
          product: { select: { costPrice: true, name: true, sku: true } },
          warehouse: { select: { code: true, name: true } },
        },
      }),
      db.warehouse.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        include: {
          inventoryItems: true,
        },
      }),
      db.productCategory.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        include: {
          products: {
            include: { inventoryItems: true },
          },
        },
      }),
    ]);

    let totalInventoryUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValuation = 0;

    const lowStockAlerts: Array<{
      id: string;
      sku: string;
      name: string;
      currentStock: number;
      reorderLevel: number;
      status: "LOW_STOCK" | "OUT_OF_STOCK";
      leadTimeDays: number | null;
      reorderQuantity: number | null;
    }> = [];

    products.forEach((prod) => {
      const stock = prod.inventoryItems.reduce((acc, item) => acc + item.quantity, 0);
      totalInventoryUnits += stock;
      if (canSeeCost) {
        totalValuation += stock * prod.costPrice;
      }

      if (stock <= 0) {
        outOfStockCount++;
        lowStockAlerts.push({
          id: prod.id,
          sku: prod.sku,
          name: prod.name,
          currentStock: stock,
          reorderLevel: prod.reorderLevel,
          status: "OUT_OF_STOCK",
          leadTimeDays: prod.leadTimeDays,
          reorderQuantity: prod.reorderQuantity,
        });
      } else if (stock <= prod.reorderLevel) {
        lowStockCount++;
        lowStockAlerts.push({
          id: prod.id,
          sku: prod.sku,
          name: prod.name,
          currentStock: stock,
          reorderLevel: prod.reorderLevel,
          status: "LOW_STOCK",
          leadTimeDays: prod.leadTimeDays,
          reorderQuantity: prod.reorderQuantity,
        });
      }
    });

    // Warehouse distribution
    const warehouseDistribution = warehouses.map((wh) => {
      const units = wh.inventoryItems.reduce((acc, i) => acc + i.quantity, 0);
      return {
        id: wh.id,
        code: wh.code,
        name: wh.name,
        units,
        skuCount: wh.inventoryItems.length,
      };
    });

    // Category distribution
    const categoryDistribution = categories.map((cat) => {
      const units = cat.products.reduce((acc, prod) => {
        return acc + prod.inventoryItems.reduce((s, i) => s + i.quantity, 0);
      }, 0);
      return {
        id: cat.id,
        name: cat.name,
        code: cat.code,
        productCount: cat.products.length,
        totalUnits: units,
      };
    });

    return {
      totalProducts: products.length,
      totalServices: servicesCount,
      totalInventoryUnits,
      lowStockCount,
      outOfStockCount,
      totalValuation: canSeeCost ? totalValuation : null,
      canViewValuation: canSeeCost,
      lowStockAlerts,
      warehouseDistribution,
      categoryDistribution,
    };
  }

  /**
   * Location-aware stock matrix query
   */
  static async getStockMatrix(user: AuthenticatedUser, filters?: { warehouseId?: string; search?: string }) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const canSeeCost = this.canViewCost(user);

    const where: any = { organizationId: orgId };
    if (filters?.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters?.search) {
      where.product = {
        OR: [
          { name: { contains: filters.search } },
          { sku: { contains: filters.search } },
        ],
      };
    }

    const items = await db.inventoryItem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            productType: true,
            unitOfMeasure: true,
            sellingPrice: true,
            costPrice: true,
            reorderLevel: true,
            category: { select: { name: true } },
          },
        },
        warehouse: {
          select: { id: true, code: true, name: true, city: true },
        },
      },
      orderBy: [{ product: { name: "asc" } }, { warehouse: { code: "asc" } }],
    });

    return items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productSku: i.product.sku,
      productName: i.product.name,
      categoryName: i.product.category?.name || "Uncategorized",
      warehouseId: i.warehouseId,
      warehouseCode: i.warehouse.code,
      warehouseName: i.warehouse.name,
      warehouseCity: i.warehouse.city,
      quantity: i.quantity,
      reservedQuantity: i.reservedQuantity,
      availableQuantity: Math.max(0, i.quantity - i.reservedQuantity),
      unitOfMeasure: i.product.unitOfMeasure,
      sellingPrice: i.product.sellingPrice,
      costPrice: canSeeCost ? i.product.costPrice : null,
      valuation: canSeeCost ? i.quantity * i.product.costPrice : null,
      reorderLevel: i.product.reorderLevel,
      aisle: i.aisle,
      shelf: i.shelf,
      bin: i.bin,
      updatedAt: i.updatedAt,
    }));
  }

  /**
   * Atomic Stock Inward
   */
  static async stockIn(user: AuthenticatedUser, data: StockInInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const qty = Number(data.quantity);
    if (qty <= 0) throw new Error("Quantity must be greater than zero");

    const result = await db.$transaction(async (tx) => {
      const invItem = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
      });

      const previousBalance = invItem ? invItem.quantity : 0.0;
      const newBalance = previousBalance + qty;

      await tx.inventoryItem.upsert({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
        create: {
          organizationId: orgId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: newBalance,
        },
        update: {
          quantity: newBalance,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          organizationId: orgId,
          movementNumber: `MOV-${Date.now()}`,
          productId: data.productId,
          type: "STOCK_IN",
          quantity: qty,
          destinationWarehouseId: data.warehouseId,
          referenceType: data.referenceType || "MANUAL",
          referenceId: data.referenceId || null,
          reason: data.reason,
          previousBalance,
          newBalance,
          performedById: user.employee!.id,
          notes: data.notes || null,
        },
      });

      return { movement, newBalance };
    });

    await AuditService.log({
      actorId: user.id,
      action: "STOCK_IN",
      entity: "StockMovement",
      entityId: result.movement.id,
      newValue: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        quantity: qty,
        newBalance: result.newBalance,
      },
    });

    await ProductService.evaluateStockAlert(data.productId, orgId);

    return result;
  }

  /**
   * Atomic Stock Outward
   */
  static async stockOut(user: AuthenticatedUser, data: StockOutInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const qty = Number(data.quantity);
    if (qty <= 0) throw new Error("Quantity must be greater than zero");

    const result = await db.$transaction(async (tx) => {
      const invItem = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
      });

      if (!invItem || invItem.quantity < qty) {
        throw new Error(
          `Insufficient stock in warehouse. Available: ${invItem?.quantity || 0}, requested: ${qty}`
        );
      }

      const previousBalance = invItem.quantity;
      const newBalance = previousBalance - qty;

      await tx.inventoryItem.update({
        where: { id: invItem.id },
        data: { quantity: newBalance },
      });

      const movement = await tx.stockMovement.create({
        data: {
          organizationId: orgId,
          movementNumber: `MOV-${Date.now()}`,
          productId: data.productId,
          type: "STOCK_OUT",
          quantity: qty,
          sourceWarehouseId: data.warehouseId,
          referenceType: data.referenceType || "MANUAL",
          referenceId: data.referenceId || null,
          reason: data.reason,
          previousBalance,
          newBalance,
          performedById: user.employee!.id,
          notes: data.notes || null,
        },
      });

      return { movement, newBalance };
    });

    await AuditService.log({
      actorId: user.id,
      action: "STOCK_OUT",
      entity: "StockMovement",
      entityId: result.movement.id,
      newValue: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        quantity: qty,
        newBalance: result.newBalance,
      },
    });

    await ProductService.evaluateStockAlert(data.productId, orgId);

    return result;
  }

  /**
   * TRANSACTIONAL STOCK TRANSFER (Warehouse A -> Warehouse B)
   * Guaranteed atomic execution: if either leg fails, rolls back completely.
   */
  static async transferStock(user: AuthenticatedUser, data: StockTransferInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const qty = Number(data.quantity);
    if (qty <= 0) throw new Error("Transfer quantity must be greater than zero");

    if (data.sourceWarehouseId === data.destinationWarehouseId) {
      throw new Error("Source and destination warehouses cannot be the same");
    }

    const transferResult = await db.$transaction(async (tx) => {
      // 1. Verify source inventory item
      const sourceItem = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.sourceWarehouseId,
          },
        },
      });

      if (!sourceItem || sourceItem.quantity < qty) {
        throw new Error(
          `Insufficient stock in source warehouse for transfer. Available: ${sourceItem?.quantity || 0}, Requested: ${qty}`
        );
      }

      // 2. Decrement source warehouse
      const sourcePrev = sourceItem.quantity;
      const sourceNew = sourcePrev - qty;
      await tx.inventoryItem.update({
        where: { id: sourceItem.id },
        data: { quantity: sourceNew },
      });

      // 3. Increment or create destination warehouse inventory item
      const destItem = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.destinationWarehouseId,
          },
        },
      });

      const destPrev = destItem ? destItem.quantity : 0.0;
      const destNew = destPrev + qty;

      await tx.inventoryItem.upsert({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.destinationWarehouseId,
          },
        },
        create: {
          organizationId: orgId,
          productId: data.productId,
          warehouseId: data.destinationWarehouseId,
          quantity: destNew,
        },
        update: {
          quantity: destNew,
        },
      });

      // 4. Log master TRANSFER stock movement
      const movement = await tx.stockMovement.create({
        data: {
          organizationId: orgId,
          movementNumber: `MOV-${Date.now()}`,
          productId: data.productId,
          type: "TRANSFER",
          quantity: qty,
          sourceWarehouseId: data.sourceWarehouseId,
          destinationWarehouseId: data.destinationWarehouseId,
          referenceType: "TRANSFER",
          reason: data.reason,
          previousBalance: sourcePrev,
          newBalance: sourceNew,
          performedById: user.employee!.id,
          notes: data.notes || null,
        },
      });

      return {
        movement,
        sourceNewBalance: sourceNew,
        destinationNewBalance: destNew,
      };
    });

    await AuditService.log({
      actorId: user.id,
      action: "STOCK_TRANSFERRED",
      entity: "StockMovement",
      entityId: transferResult.movement.id,
      newValue: {
        productId: data.productId,
        sourceWarehouseId: data.sourceWarehouseId,
        destinationWarehouseId: data.destinationWarehouseId,
        quantity: qty,
        sourceNewBalance: transferResult.sourceNewBalance,
        destNewBalance: transferResult.destinationNewBalance,
      },
    });

    return transferResult;
  }

  /**
   * Create Inventory Adjustment Request
   */
  static async createAdjustment(user: AuthenticatedUser, data: CreateAdjustmentInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    if (!data.items || data.items.length === 0) {
      throw new Error("Adjustment must contain at least one product count item");
    }

    const count = await db.inventoryAdjustment.count({ where: { organizationId: orgId } });
    const adjustmentNumber = `ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Resolve system quantities and costs
    const productIds = data.items.map((i) => i.productId);
    const [products, invItems] = await Promise.all([
      db.product.findMany({ where: { id: { in: productIds } } }),
      db.inventoryItem.findMany({
        where: { warehouseId: data.warehouseId, productId: { in: productIds } },
      }),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const invMap = new Map(invItems.map((i) => [i.productId, i.quantity]));

    const computedItems = data.items.map((item) => {
      const prod = productMap.get(item.productId);
      if (!prod) throw new Error(`Product ${item.productId} not found`);
      const systemQty = invMap.get(item.productId) || 0.0;
      const countedQty = Number(item.countedQuantity);
      const adjustmentQty = countedQty - systemQty;

      return {
        productId: item.productId,
        systemQuantity: systemQty,
        countedQuantity: countedQty,
        adjustmentQuantity: adjustmentQty,
        unitCost: prod.costPrice,
      };
    });

    const adjustment = await db.inventoryAdjustment.create({
      data: {
        organizationId: orgId,
        adjustmentNumber,
        warehouseId: data.warehouseId,
        status: data.autoSubmit ? "PENDING_APPROVAL" : "DRAFT",
        reason: data.reason,
        notes: data.notes || null,
        requestedById: user.employee.id,
        items: {
          create: computedItems,
        },
      },
      include: {
        items: { include: { product: true } },
        warehouse: true,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "INVENTORY_ADJUSTMENT_CREATED",
      entity: "InventoryAdjustment",
      entityId: adjustment.id,
      newValue: {
        adjustmentNumber,
        warehouseId: data.warehouseId,
        status: adjustment.status,
        itemCount: computedItems.length,
      },
    });

    return adjustment;
  }

  /**
   * Transition Adjustment Workflow (submit, approve, reject)
   */
  static async transitionAdjustment(
    adjustmentId: string,
    user: AuthenticatedUser,
    action: "submit" | "approve" | "reject",
    payload?: { reason?: string }
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const adjustment = await db.inventoryAdjustment.findFirst({
      where: { id: adjustmentId, organizationId: orgId },
      include: { items: true },
    });
    if (!adjustment) throw new Error("Adjustment not found");

    if (action === "submit") {
      if (adjustment.status !== "DRAFT") throw new Error("Only DRAFT adjustments can be submitted");
      return db.inventoryAdjustment.update({
        where: { id: adjustmentId },
        data: { status: "PENDING_APPROVAL" },
      });
    }

    if (action === "reject") {
      if (adjustment.status !== "PENDING_APPROVAL") throw new Error("Only PENDING_APPROVAL can be rejected");
      return db.inventoryAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: "REJECTED",
          rejectionReason: payload?.reason || "Rejected by authorized manager",
        },
      });
    }

    if (action === "approve") {
      // Enforce approval permission
      const privileged = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "ADMIN", "COO"];
      const hasPerm =
        privileged.includes(user.roleCode) ||
        user.permissions?.includes("inventory.adjust.approve") ||
        false;

      if (!hasPerm) {
        throw new Error("FORBIDDEN: User lacks permission [inventory.adjust.approve] to approve adjustments");
      }

      if (adjustment.status !== "PENDING_APPROVAL" && adjustment.status !== "DRAFT") {
        throw new Error("Adjustment is already resolved");
      }

      // Execute atomic balance update and movements
      const approvedResult = await db.$transaction(async (tx) => {
        for (const item of adjustment.items) {
          // Update warehouse inventory item
          await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: adjustment.warehouseId,
              },
            },
            create: {
              organizationId: orgId,
              productId: item.productId,
              warehouseId: adjustment.warehouseId,
              quantity: item.countedQuantity,
            },
            update: {
              quantity: item.countedQuantity,
            },
          });

          // Log Stock Movement
          await tx.stockMovement.create({
            data: {
              organizationId: orgId,
              movementNumber: `MOV-${Date.now()}-${item.id.slice(-4)}`,
              productId: item.productId,
              type: "ADJUSTMENT",
              quantity: Math.abs(item.adjustmentQuantity),
              sourceWarehouseId: item.adjustmentQuantity < 0 ? adjustment.warehouseId : null,
              destinationWarehouseId: item.adjustmentQuantity > 0 ? adjustment.warehouseId : null,
              referenceType: "ADJUSTMENT",
              referenceId: adjustment.adjustmentNumber,
              reason: `Physical count adjustment (${adjustment.reason})`,
              previousBalance: item.systemQuantity,
              newBalance: item.countedQuantity,
              performedById: user.employee!.id,
              notes: `Adjustment approved by ${user.employee!.firstName} ${user.employee!.lastName}`,
            },
          });
        }

        return tx.inventoryAdjustment.update({
          where: { id: adjustmentId },
          data: {
            status: "APPROVED",
            approvedById: user.employee!.id,
            approvedAt: new Date(),
          },
          include: { items: true, warehouse: true },
        });
      });

      await AuditService.log({
        actorId: user.id,
        action: "INVENTORY_ADJUSTMENT_APPROVED",
        entity: "InventoryAdjustment",
        entityId: adjustmentId,
        newValue: {
          adjustmentNumber: adjustment.adjustmentNumber,
          approvedById: user.employee.id,
          itemCount: adjustment.items.length,
        },
      });

      // Check stock alerts for affected products
      for (const item of adjustment.items) {
        await ProductService.evaluateStockAlert(item.productId, orgId);
      }

      return approvedResult;
    }

    throw new Error(`Invalid action: ${action}`);
  }

  /**
   * Movements audit ledger
   */
  static async getMovements(
    user: AuthenticatedUser,
    filters?: { productId?: string; warehouseId?: string; type?: string; limit?: number }
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const where: any = { organizationId: orgId };
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.type && filters.type !== "ALL") where.type = filters.type;
    if (filters?.warehouseId) {
      where.OR = [
        { sourceWarehouseId: filters.warehouseId },
        { destinationWarehouseId: filters.warehouseId },
      ];
    }

    return db.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
        sourceWarehouse: { select: { id: true, code: true, name: true } },
        destinationWarehouse: { select: { id: true, code: true, name: true } },
        performedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 100,
    });
  }

  /**
   * List Adjustments
   */
  static async getAdjustments(user: AuthenticatedUser, filters?: { warehouseId?: string; status?: string }) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const where: any = { organizationId: orgId };
    if (filters?.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;

    return db.inventoryAdjustment.findMany({
      where,
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { sku: true, name: true, unitOfMeasure: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
