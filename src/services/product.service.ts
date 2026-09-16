import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  productType?: "PHYSICAL" | "CONSUMABLE" | "ASSET" | "OTHER";
  unitOfMeasure?: string;
  sellingPrice: number;
  costPrice?: number;
  taxRate?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | "DISCONTINUED";
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  imageUrl?: string;
  preferredVendorId?: string;
  leadTimeDays?: number;
  reorderQuantity?: number;
  initialStock?: {
    warehouseId: string;
    quantity: number;
  };
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  categoryId?: string | null;
  productType?: "PHYSICAL" | "CONSUMABLE" | "ASSET" | "OTHER";
  unitOfMeasure?: string;
  sellingPrice?: number;
  costPrice?: number;
  taxRate?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | "DISCONTINUED";
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  imageUrl?: string;
  preferredVendorId?: string | null;
  leadTimeDays?: number;
  reorderQuantity?: number;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  productType?: string;
  status?: string;
  stockStatus?: "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  warehouseId?: string;
}

export class ProductService {
  static canViewCost(user: AuthenticatedUser): boolean {
    const privileged = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "ADMIN"];
    if (privileged.includes(user.roleCode)) return true;
    return user.permissions?.includes("products.cost.read") || false;
  }

  /**
   * List products with aggregated warehouse inventory and stock status
   */
  static async getProducts(user: AuthenticatedUser, filters?: ProductFilters) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const canSeeCost = this.canViewCost(user);

    const where: any = {
      organizationId: orgId,
    };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { sku: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.productType) {
      where.productType = filters.productType;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        inventoryItems: {
          include: {
            warehouse: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = products.map((p) => {
      const totalStock = p.inventoryItems.reduce((acc, item) => acc + item.quantity, 0);
      const totalReserved = p.inventoryItems.reduce((acc, item) => acc + item.reservedQuantity, 0);
      const availableStock = Math.max(0, totalStock - totalReserved);

      let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
      if (totalStock <= 0) {
        stockStatus = "OUT_OF_STOCK";
      } else if (totalStock <= p.reorderLevel) {
        stockStatus = "LOW_STOCK";
      }

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        categoryName: p.category?.name || "Uncategorized",
        productType: p.productType,
        unitOfMeasure: p.unitOfMeasure,
        sellingPrice: p.sellingPrice,
        costPrice: canSeeCost ? p.costPrice : null,
        taxRate: p.taxRate,
        status: p.status,
        minStockLevel: p.minStockLevel,
        maxStockLevel: p.maxStockLevel,
        reorderLevel: p.reorderLevel,
        imageUrl: p.imageUrl,
        totalStock,
        totalReserved,
        availableStock,
        stockStatus,
        inventoryCount: p.inventoryItems.length,
        leadTimeDays: p.leadTimeDays,
        reorderQuantity: p.reorderQuantity,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    if (filters?.stockStatus && filters.stockStatus !== "ALL") {
      return mapped.filter((p) => p.stockStatus === filters.stockStatus);
    }

    return mapped;
  }

  /**
   * Detailed single product with 5 tabs data
   */
  static async getProductById(id: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const canSeeCost = this.canViewCost(user);

    const product = await db.product.findFirst({
      where: { id, organizationId: orgId },
      include: {
        category: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        inventoryItems: {
          include: {
            warehouse: { select: { id: true, code: true, name: true, city: true, status: true } },
          },
        },
        stockMovements: {
          take: 25,
          orderBy: { createdAt: "desc" },
          include: {
            sourceWarehouse: { select: { id: true, code: true, name: true } },
            destinationWarehouse: { select: { id: true, code: true, name: true } },
            performedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!product) return null;

    const totalStock = product.inventoryItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalReserved = product.inventoryItems.reduce((acc, item) => acc + item.reservedQuantity, 0);
    const availableStock = Math.max(0, totalStock - totalReserved);

    let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
    if (totalStock <= 0) {
      stockStatus = "OUT_OF_STOCK";
    } else if (totalStock <= product.reorderLevel) {
      stockStatus = "LOW_STOCK";
    }

    const totalValuation = canSeeCost ? totalStock * product.costPrice : null;

    return {
      ...product,
      costPrice: canSeeCost ? product.costPrice : null,
      totalStock,
      totalReserved,
      availableStock,
      stockStatus,
      totalValuation,
    };
  }

  /**
   * Create a new product with database-enforced SKU uniqueness
   */
  static async createProduct(user: AuthenticatedUser, data: CreateProductInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    // Check SKU uniqueness in advance for descriptive error
    const existing = await db.product.findFirst({
      where: { organizationId: orgId, sku: data.sku.trim().toUpperCase() },
    });
    if (existing) {
      throw new Error(`Product with SKU [${data.sku.trim().toUpperCase()}] already exists`);
    }

    const product = await db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          organizationId: orgId,
          sku: data.sku.trim().toUpperCase(),
          name: data.name.trim(),
          description: data.description?.trim() || null,
          categoryId: data.categoryId || null,
          productType: data.productType || "PHYSICAL",
          unitOfMeasure: data.unitOfMeasure?.trim() || "UNIT",
          sellingPrice: Number(data.sellingPrice) || 0.0,
          costPrice: Number(data.costPrice) || 0.0,
          taxRate: Number(data.taxRate) || 0.0,
          status: data.status || "ACTIVE",
          minStockLevel: Number(data.minStockLevel) || 0.0,
          maxStockLevel: Number(data.maxStockLevel) || 0.0,
          reorderLevel: Number(data.reorderLevel) || 10.0,
          imageUrl: data.imageUrl || null,
          preferredVendorId: data.preferredVendorId || null,
          leadTimeDays: data.leadTimeDays || 7,
          reorderQuantity: data.reorderQuantity || 20.0,
          createdById: user.employee!.id,
        },
      });

      // Optional initial stock intake
      if (data.initialStock && data.initialStock.warehouseId && data.initialStock.quantity > 0) {
        await tx.inventoryItem.create({
          data: {
            organizationId: orgId,
            productId: created.id,
            warehouseId: data.initialStock.warehouseId,
            quantity: Number(data.initialStock.quantity),
          },
        });

        await tx.stockMovement.create({
          data: {
            organizationId: orgId,
            movementNumber: `MOV-${Date.now()}`,
            productId: created.id,
            type: "STOCK_IN",
            quantity: Number(data.initialStock.quantity),
            destinationWarehouseId: data.initialStock.warehouseId,
            referenceType: "MANUAL",
            reason: "Initial inventory setup on product creation",
            previousBalance: 0.0,
            newBalance: Number(data.initialStock.quantity),
            performedById: user.employee!.id,
            notes: "Automatic initial balance allocation",
          },
        });
      }

      return created;
    });

    await AuditService.log({
      actorId: user.id,
      action: "PRODUCT_CREATED",
      entity: "Product",
      entityId: product.id,
      newValue: {
        sku: product.sku,
        name: product.name,
        sellingPrice: product.sellingPrice,
        reorderLevel: product.reorderLevel,
      },
    });

    // Check if initial stock triggered low stock
    await this.evaluateStockAlert(product.id, orgId);

    return product;
  }

  /**
   * Update existing product
   */
  static async updateProduct(id: string, user: AuthenticatedUser, data: UpdateProductInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.product.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Product not found");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.productType !== undefined) updateData.productType = data.productType;
    if (data.unitOfMeasure !== undefined) updateData.unitOfMeasure = data.unitOfMeasure;
    if (data.sellingPrice !== undefined) updateData.sellingPrice = Number(data.sellingPrice);
    if (data.costPrice !== undefined) {
      if (!this.canViewCost(user)) throw new Error("Unauthorized to update product cost price");
      updateData.costPrice = Number(data.costPrice);
    }
    if (data.taxRate !== undefined) updateData.taxRate = Number(data.taxRate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.minStockLevel !== undefined) updateData.minStockLevel = Number(data.minStockLevel);
    if (data.maxStockLevel !== undefined) updateData.maxStockLevel = Number(data.maxStockLevel);
    if (data.reorderLevel !== undefined) updateData.reorderLevel = Number(data.reorderLevel);
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.leadTimeDays !== undefined) updateData.leadTimeDays = Number(data.leadTimeDays);
    if (data.reorderQuantity !== undefined) updateData.reorderQuantity = Number(data.reorderQuantity);

    const updated = await db.product.update({
      where: { id },
      data: updateData,
    });

    await AuditService.log({
      actorId: user.id,
      action: "PRODUCT_UPDATED",
      entity: "Product",
      entityId: id,
      previousValue: { name: existing.name, status: existing.status },
      newValue: updateData,
    });

    await this.evaluateStockAlert(id, orgId);

    return updated;
  }

  /**
   * Deactivate product
   */
  static async deleteProduct(id: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.product.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Product not found");

    const updated = await db.product.update({
      where: { id },
      data: { status: "ARCHIVED", isActive: false },
    });

    await AuditService.log({
      actorId: user.id,
      action: "PRODUCT_DEACTIVATED",
      entity: "Product",
      entityId: id,
      previousValue: { status: existing.status },
      newValue: { status: "ARCHIVED", isActive: false },
    });

    return updated;
  }

  /**
   * Evaluates stock levels against reorder thresholds and dispatches high-priority notifications
   */
  static async evaluateStockAlert(productId: string, organizationId: string) {
    try {
      const product = await db.product.findUnique({
        where: { id: productId },
        include: { inventoryItems: true },
      });
      if (!product || product.status !== "ACTIVE") return;

      const totalStock = product.inventoryItems.reduce((acc, item) => acc + item.quantity, 0);

      if (totalStock <= 0) {
        // Find warehouse managers or admins to notify
        const admins = await db.user.findMany({
          where: {
            role: { code: { in: ["SUPER_ADMIN", "ADMIN", "CFO", "COO"] } },
            isActive: true,
          },
          select: { id: true },
        });

        await EventBusService.publish({
          organizationId,
          type: "INVENTORY_OUT_OF_STOCK",
          title: `CRITICAL: ${product.name} is OUT OF STOCK`,
          message: `Product [${product.sku}] has reached 0 units on hand across all facilities. Immediate reorder required.`,
          priority: "URGENT",
          actionUrl: `/app/inventory/products/${product.id}`,
          targetUserIds: admins.map((a) => a.id),
        });
      } else if (totalStock <= product.reorderLevel) {
        const admins = await db.user.findMany({
          where: {
            role: { code: { in: ["SUPER_ADMIN", "ADMIN", "CFO", "COO"] } },
            isActive: true,
          },
          select: { id: true },
        });

        await EventBusService.publish({
          organizationId,
          type: "INVENTORY_LOW_STOCK",
          title: `LOW STOCK ALERT: ${product.name}`,
          message: `Product [${product.sku}] stock is ${totalStock} units (at or below reorder threshold of ${product.reorderLevel}).`,
          priority: "HIGH",
          actionUrl: `/app/inventory/products/${product.id}`,
          targetUserIds: admins.map((a) => a.id),
        });
      }
    } catch (e) {
      console.error("[ProductService Error]: Failed to evaluate stock alert", e);
    }
  }
}
