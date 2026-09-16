import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export interface CreateServiceInput {
  serviceCode: string;
  name: string;
  description?: string;
  categoryId?: string;
  sellingPrice: number;
  costPrice?: number;
  taxRate?: number;
  billingUnit?: "HOURLY" | "FIXED_PRICE" | "MONTHLY_RETAINER" | "DAILY" | "PER_PROJECT";
  status?: "ACTIVE" | "INACTIVE";
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  categoryId?: string | null;
  sellingPrice?: number;
  costPrice?: number;
  taxRate?: number;
  billingUnit?: "HOURLY" | "FIXED_PRICE" | "MONTHLY_RETAINER" | "DAILY" | "PER_PROJECT";
  status?: "ACTIVE" | "INACTIVE";
}

export interface ServiceFilters {
  search?: string;
  categoryId?: string;
  status?: string;
  billingUnit?: string;
}

export class ServiceCatalogService {
  static canViewCost(user: AuthenticatedUser): boolean {
    const privileged = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "ADMIN"];
    if (privileged.includes(user.roleCode)) return true;
    return user.permissions?.includes("products.cost.read") || false;
  }

  static async getServices(user: AuthenticatedUser, filters?: ServiceFilters) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const canSeeCost = this.canViewCost(user);

    const where: any = { organizationId: orgId };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { serviceCode: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.billingUnit) {
      where.billingUnit = filters.billingUnit;
    }

    const services = await db.service.findMany({
      where,
      include: {
        category: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return services.map((s) => ({
      ...s,
      costPrice: canSeeCost ? s.costPrice : null,
      categoryName: s.category?.name || "Uncategorized",
    }));
  }

  static async getServiceById(id: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const canSeeCost = this.canViewCost(user);

    const service = await db.service.findFirst({
      where: { id, organizationId: orgId },
      include: {
        category: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!service) return null;

    return {
      ...service,
      costPrice: canSeeCost ? service.costPrice : null,
    };
  }

  static async createService(user: AuthenticatedUser, data: CreateServiceInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.service.findFirst({
      where: { organizationId: orgId, serviceCode: data.serviceCode.trim().toUpperCase() },
    });
    if (existing) {
      throw new Error(`Service with code [${data.serviceCode.trim().toUpperCase()}] already exists`);
    }

    const service = await db.service.create({
      data: {
        organizationId: orgId,
        serviceCode: data.serviceCode.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        categoryId: data.categoryId || null,
        sellingPrice: Number(data.sellingPrice) || 0.0,
        costPrice: Number(data.costPrice) || 0.0,
        taxRate: Number(data.taxRate) || 0.0,
        billingUnit: data.billingUnit || "HOURLY",
        status: data.status || "ACTIVE",
        createdById: user.employee.id,
      },
      include: { category: true },
    });

    await AuditService.log({
      actorId: user.id,
      action: "SERVICE_CREATED",
      entity: "Service",
      entityId: service.id,
      newValue: {
        serviceCode: service.serviceCode,
        name: service.name,
        sellingPrice: service.sellingPrice,
        billingUnit: service.billingUnit,
      },
    });

    return service;
  }

  static async updateService(id: string, user: AuthenticatedUser, data: UpdateServiceInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.service.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Service not found");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.sellingPrice !== undefined) updateData.sellingPrice = Number(data.sellingPrice);
    if (data.costPrice !== undefined) {
      if (!this.canViewCost(user)) throw new Error("Unauthorized to update service cost price");
      updateData.costPrice = Number(data.costPrice);
    }
    if (data.taxRate !== undefined) updateData.taxRate = Number(data.taxRate);
    if (data.billingUnit !== undefined) updateData.billingUnit = data.billingUnit;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await db.service.update({
      where: { id },
      data: updateData,
    });

    await AuditService.log({
      actorId: user.id,
      action: "SERVICE_UPDATED",
      entity: "Service",
      entityId: id,
      previousValue: { name: existing.name, sellingPrice: existing.sellingPrice },
      newValue: updateData,
    });

    return updated;
  }

  static async deleteService(id: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.service.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Service not found");

    const updated = await db.service.update({
      where: { id },
      data: { status: "INACTIVE", isActive: false },
    });

    await AuditService.log({
      actorId: user.id,
      action: "SERVICE_DEACTIVATED",
      entity: "Service",
      entityId: id,
      previousValue: { status: existing.status },
      newValue: { status: "INACTIVE", isActive: false },
    });

    return updated;
  }
}
