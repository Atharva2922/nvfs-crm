import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export interface CreateWarehouseInput {
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  managerId?: string;
  status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  isDefault?: boolean;
}

export interface UpdateWarehouseInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  managerId?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  isDefault?: boolean;
}

export class WarehouseService {
  static async getWarehouses(organizationId: string) {
    const warehouses = await db.warehouse.findMany({
      where: { organizationId },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        inventoryItems: {
          select: { quantity: true, reservedQuantity: true, productId: true },
        },
      },
      orderBy: { code: "asc" },
    });

    return warehouses.map((w) => {
      const totalUnits = w.inventoryItems.reduce((acc, item) => acc + item.quantity, 0);
      const totalReserved = w.inventoryItems.reduce((acc, item) => acc + item.reservedQuantity, 0);
      const uniqueSkusCount = new Set(w.inventoryItems.map((i) => i.productId)).size;

      return {
        id: w.id,
        code: w.code,
        name: w.name,
        address: w.address,
        city: w.city,
        state: w.state,
        country: w.country,
        managerId: w.managerId,
        managerName: w.manager ? `${w.manager.firstName} ${w.manager.lastName}` : "Unassigned",
        status: w.status,
        isDefault: w.isDefault,
        totalUnits,
        totalReserved,
        availableUnits: Math.max(0, totalUnits - totalReserved),
        uniqueSkusCount,
        createdAt: w.createdAt,
      };
    });
  }

  static async getWarehouseById(id: string, organizationId: string) {
    const warehouse = await db.warehouse.findFirst({
      where: { id, organizationId },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        inventoryItems: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unitOfMeasure: true,
                sellingPrice: true,
                reorderLevel: true,
                status: true,
              },
            },
          },
        },
        sourceMovements: {
          take: 15,
          orderBy: { createdAt: "desc" },
          include: {
            product: { select: { sku: true, name: true } },
            destinationWarehouse: { select: { code: true, name: true } },
          },
        },
        destinationMovements: {
          take: 15,
          orderBy: { createdAt: "desc" },
          include: {
            product: { select: { sku: true, name: true } },
            sourceWarehouse: { select: { code: true, name: true } },
          },
        },
      },
    });

    if (!warehouse) return null;

    const totalUnits = warehouse.inventoryItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalReserved = warehouse.inventoryItems.reduce((acc, item) => acc + item.reservedQuantity, 0);

    return {
      ...warehouse,
      totalUnits,
      totalReserved,
      availableUnits: Math.max(0, totalUnits - totalReserved),
    };
  }

  static async createWarehouse(user: AuthenticatedUser, data: CreateWarehouseInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.warehouse.findFirst({
      where: { organizationId: orgId, code: data.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new Error(`Warehouse with code [${data.code.trim().toUpperCase()}] already exists`);
    }

    // If setting as default, unset previous default
    if (data.isDefault) {
      await db.warehouse.updateMany({
        where: { organizationId: orgId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const warehouse = await db.warehouse.create({
      data: {
        organizationId: orgId,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        country: data.country?.trim() || "India",
        managerId: data.managerId || null,
        status: data.status || "ACTIVE",
        isDefault: data.isDefault || false,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "WAREHOUSE_CREATED",
      entity: "Warehouse",
      entityId: warehouse.id,
      newValue: { code: warehouse.code, name: warehouse.name, city: warehouse.city },
    });

    return warehouse;
  }

  static async updateWarehouse(id: string, user: AuthenticatedUser, data: UpdateWarehouseInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.warehouse.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Warehouse not found");

    if (data.isDefault) {
      await db.warehouse.updateMany({
        where: { organizationId: orgId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.city !== undefined) updateData.city = data.city?.trim() || null;
    if (data.state !== undefined) updateData.state = data.state?.trim() || null;
    if (data.country !== undefined) updateData.country = data.country?.trim() || null;
    if (data.managerId !== undefined) updateData.managerId = data.managerId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    const updated = await db.warehouse.update({
      where: { id },
      data: updateData,
    });

    await AuditService.log({
      actorId: user.id,
      action: "WAREHOUSE_UPDATED",
      entity: "Warehouse",
      entityId: id,
      previousValue: { name: existing.name, status: existing.status },
      newValue: updateData,
    });

    return updated;
  }
}
