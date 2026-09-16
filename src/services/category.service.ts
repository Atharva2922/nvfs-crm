import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export interface CreateCategoryInput {
  name: string;
  code: string;
  description?: string;
  type?: "PRODUCT" | "SERVICE" | "BOTH";
  parentId?: string;
  status?: "ACTIVE" | "INACTIVE";
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  type?: "PRODUCT" | "SERVICE" | "BOTH";
  parentId?: string | null;
  status?: "ACTIVE" | "INACTIVE";
}

export class CategoryService {
  static async getCategories(organizationId: string, type?: string) {
    const where: any = { organizationId };
    if (type && type !== "ALL") {
      where.OR = [{ type }, { type: "BOTH" }];
    }

    const categories = await db.productCategory.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true, code: true } },
        children: { select: { id: true, name: true, code: true } },
        _count: {
          select: { products: true, services: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return categories;
  }

  static async getCategoryTree(organizationId: string) {
    const all = await db.productCategory.findMany({
      where: { organizationId },
      include: {
        _count: { select: { products: true, services: true } },
      },
      orderBy: { name: "asc" },
    });

    // Build hierarchical tree
    const rootNodes = all.filter((c) => !c.parentId);
    const buildNode = (node: any): any => {
      const children: any[] = all.filter((c) => c.parentId === node.id).map(buildNode);
      return {
        ...node,
        children,
      };
    };

    return rootNodes.map(buildNode);
  }

  static async createCategory(user: AuthenticatedUser, data: CreateCategoryInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.productCategory.findFirst({
      where: { organizationId: orgId, code: data.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new Error(`Category with code [${data.code.trim().toUpperCase()}] already exists`);
    }

    const category = await db.productCategory.create({
      data: {
        organizationId: orgId,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        type: data.type || "BOTH",
        parentId: data.parentId || null,
        status: data.status || "ACTIVE",
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "CATEGORY_CREATED",
      entity: "ProductCategory",
      entityId: category.id,
      newValue: { code: category.code, name: category.name, type: category.type },
    });

    return category;
  }

  static async updateCategory(id: string, user: AuthenticatedUser, data: UpdateCategoryInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.productCategory.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Category not found");

    if (data.parentId && data.parentId === id) {
      throw new Error("A category cannot be its own parent");
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await db.productCategory.update({
      where: { id },
      data: updateData,
    });

    await AuditService.log({
      actorId: user.id,
      action: "CATEGORY_UPDATED",
      entity: "ProductCategory",
      entityId: id,
      previousValue: { name: existing.name },
      newValue: updateData,
    });

    return updated;
  }
}
