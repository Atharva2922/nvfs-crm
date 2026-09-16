import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export interface CreateVendorInput {
  legalName: string;
  displayName: string;
  vendorType?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  currency?: string;
  bankName?: string;
  bankAccountNumber?: string; // Will be masked
  bankRoutingCode?: string;
  bankBranch?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  notes?: string;
}

export interface UpdateVendorInput extends Partial<CreateVendorInput> {
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED" | "PENDING_REVIEW";
}

export interface VendorContactInput {
  name: string;
  designation?: string;
  email: string;
  phone?: string;
  isPrimary?: boolean;
  status?: "ACTIVE" | "INACTIVE";
}

export interface VendorProductInput {
  productId: string;
  vendorSku?: string;
  purchasePrice: number;
  currency?: string;
  leadTimeDays?: number;
  minOrderQuantity?: number;
  isPreferred?: boolean;
}

export class VendorService {
  /**
   * Helper to mask bank account numbers for secure storage & display
   */
  static maskAccountNumber(accountNum?: string): string | null {
    if (!accountNum) return null;
    const clean = accountNum.trim();
    if (clean.length <= 4) return `****${clean}`;
    return `****${clean.slice(-4)}`;
  }

  /**
   * Check if user is authorized to view vendor purchase pricing
   */
  static canViewPricing(user: AuthenticatedUser): boolean {
    const privileged = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "ADMIN"];
    if (privileged.includes(user.roleCode)) return true;
    return (
      user.permissions?.includes("vendor_pricing:read") ||
      user.permissions?.includes("finance:read") ||
      false
    );
  }

  /**
   * Create Vendor
   */
  static async createVendor(user: AuthenticatedUser, data: CreateVendorInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    // Generate unique Vendor Code: VEN-YYYY-XXXX
    const count = await db.vendor.count({ where: { organizationId: orgId } });
    const year = new Date().getFullYear();
    const vendorCode = `VEN-${year}-${String(count + 1).padStart(4, "0")}`;

    const maskedBankNum = this.maskAccountNumber(data.bankAccountNumber);

    const vendor = await db.vendor.create({
      data: {
        organizationId: orgId,
        vendorCode,
        legalName: data.legalName.trim(),
        displayName: data.displayName.trim(),
        vendorType: data.vendorType || "SUPPLIER",
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        website: data.website?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        country: data.country?.trim() || "India",
        taxId: data.taxId?.trim() || null,
        paymentTerms: data.paymentTerms || "NET_30",
        currency: data.currency || "INR",
        bankName: data.bankName?.trim() || null,
        bankAccountNumberMasked: maskedBankNum,
        bankRoutingCode: data.bankRoutingCode?.trim() || null,
        bankBranch: data.bankBranch?.trim() || null,
        primaryContactName: data.primaryContactName?.trim() || null,
        primaryContactEmail: data.primaryContactEmail?.trim().toLowerCase() || null,
        primaryContactPhone: data.primaryContactPhone?.trim() || null,
        status: "ACTIVE",
        notes: data.notes?.trim() || null,
        createdById: user.employee.id,
      },
    });

    // If primary contact info was provided, automatically create primary contact record
    if (data.primaryContactName && data.primaryContactEmail) {
      await db.vendorContact.create({
        data: {
          vendorId: vendor.id,
          name: data.primaryContactName.trim(),
          designation: "Primary Contact",
          email: data.primaryContactEmail.trim().toLowerCase(),
          phone: data.primaryContactPhone?.trim() || null,
          isPrimary: true,
          status: "ACTIVE",
        },
      });
    }

    await AuditService.log({
      actorId: user.id,
      action: "VENDOR_CREATED",
      entity: "Vendor",
      entityId: vendor.id,
      metadata: { vendorCode: vendor.vendorCode, displayName: vendor.displayName },
    });

    return vendor;
  }

  /**
   * Update Vendor
   */
  static async updateVendor(user: AuthenticatedUser, id: string, data: UpdateVendorInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.vendor.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Vendor not found");

    const updateData: any = {};
    if (data.legalName !== undefined) updateData.legalName = data.legalName.trim();
    if (data.displayName !== undefined) updateData.displayName = data.displayName.trim();
    if (data.vendorType !== undefined) updateData.vendorType = data.vendorType;
    if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.website !== undefined) updateData.website = data.website?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.city !== undefined) updateData.city = data.city?.trim() || null;
    if (data.state !== undefined) updateData.state = data.state?.trim() || null;
    if (data.country !== undefined) updateData.country = data.country?.trim() || null;
    if (data.taxId !== undefined) updateData.taxId = data.taxId?.trim() || null;
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.bankName !== undefined) updateData.bankName = data.bankName?.trim() || null;
    if (data.bankAccountNumber !== undefined) {
      updateData.bankAccountNumberMasked = this.maskAccountNumber(data.bankAccountNumber);
    }
    if (data.bankRoutingCode !== undefined) updateData.bankRoutingCode = data.bankRoutingCode?.trim() || null;
    if (data.bankBranch !== undefined) updateData.bankBranch = data.bankBranch?.trim() || null;
    if (data.primaryContactName !== undefined) updateData.primaryContactName = data.primaryContactName?.trim() || null;
    if (data.primaryContactEmail !== undefined) updateData.primaryContactEmail = data.primaryContactEmail?.trim().toLowerCase() || null;
    if (data.primaryContactPhone !== undefined) updateData.primaryContactPhone = data.primaryContactPhone?.trim() || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

    const updated = await db.vendor.update({
      where: { id },
      data: updateData,
    });

    await AuditService.log({
      actorId: user.id,
      action: data.status && data.status !== existing.status ? `VENDOR_STATUS_${data.status}` : "VENDOR_UPDATED",
      entity: "Vendor",
      entityId: updated.id,
      metadata: { previousStatus: existing.status, newStatus: updated.status },
    });

    return updated;
  }

  /**
   * List Vendors with filters
   */
  static async getVendors(
    user: AuthenticatedUser,
    filters?: {
      search?: string;
      status?: string;
      vendorType?: string;
      country?: string;
    }
  ) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const where: any = { organizationId: orgId };
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters?.vendorType && filters.vendorType !== "ALL") {
      where.vendorType = filters.vendorType;
    }
    if (filters?.country && filters.country !== "ALL") {
      where.country = filters.country;
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { displayName: { contains: q } },
        { legalName: { contains: q } },
        { vendorCode: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const vendors = await db.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            contacts: true,
            vendorProducts: true,
            purchaseOrders: true,
            goodsReceipts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return vendors;
  }

  /**
   * Get Vendor 360 profile by ID
   */
  static async getVendorById(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;
    const canSeePricing = this.canViewPricing(user);

    const vendor = await db.vendor.findFirst({
      where: { id, organizationId: orgId },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        contacts: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        vendorProducts: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unitOfMeasure: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        purchaseOrders: {
          select: {
            id: true,
            poNumber: true,
            poDate: true,
            expectedDeliveryDate: true,
            currency: true,
            total: canSeePricing,
            status: true,
            createdAt: true,
          },
          orderBy: { poDate: "desc" },
          take: 15,
        },
        goodsReceipts: {
          select: {
            id: true,
            receiptNumber: true,
            receivedDate: true,
            status: true,
            warehouse: { select: { id: true, code: true, name: true } },
            purchaseOrder: { select: { poNumber: true } },
          },
          orderBy: { receivedDate: "desc" },
          take: 15,
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            dueDate: true,
            total: canSeePricing,
            paidAmount: canSeePricing,
            balance: canSeePricing,
            status: true,
          },
          orderBy: { invoiceDate: "desc" },
          take: 10,
        },
        payments: {
          select: {
            id: true,
            paymentReference: true,
            amount: canSeePricing,
            paymentDate: true,
            paymentMethod: true,
            status: true,
          },
          orderBy: { paymentDate: "desc" },
          take: 10,
        },
      },
    });

    if (!vendor) throw new Error("Vendor not found");

    // Redact pricing if user is not authorized
    if (!canSeePricing) {
      vendor.vendorProducts = vendor.vendorProducts.map((vp) => ({
        ...vp,
        purchasePrice: 0,
      }));
    }

    return vendor;
  }

  /**
   * Add Contact to Vendor
   */
  static async addContact(user: AuthenticatedUser, vendorId: string, data: VendorContactInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const vendor = await db.vendor.findFirst({
      where: { id: vendorId, organizationId: user.employee.organizationId },
    });
    if (!vendor) throw new Error("Vendor not found");

    if (data.isPrimary) {
      // Unset previous primary contacts
      await db.vendorContact.updateMany({
        where: { vendorId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await db.vendorContact.create({
      data: {
        vendorId,
        name: data.name.trim(),
        designation: data.designation?.trim() || null,
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        isPrimary: data.isPrimary || false,
        status: data.status || "ACTIVE",
      },
    });

    // Update primary contact on vendor header if primary
    if (data.isPrimary) {
      await db.vendor.update({
        where: { id: vendorId },
        data: {
          primaryContactName: contact.name,
          primaryContactEmail: contact.email,
          primaryContactPhone: contact.phone,
        },
      });
    }

    return contact;
  }

  /**
   * Add or Update Vendor-Product Relationship
   */
  static async addOrUpdateProduct(user: AuthenticatedUser, vendorId: string, data: VendorProductInput) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const vendor = await db.vendor.findFirst({
      where: { id: vendorId, organizationId: orgId },
    });
    if (!vendor) throw new Error("Vendor not found");

    const product = await db.product.findFirst({
      where: { id: data.productId, organizationId: orgId },
    });
    if (!product) throw new Error("Product not found");

    const price = Number(data.purchasePrice);
    if (price < 0) throw new Error("Purchase price cannot be negative");

    const record = await db.vendorProduct.upsert({
      where: {
        vendorId_productId: {
          vendorId,
          productId: data.productId,
        },
      },
      create: {
        vendorId,
        productId: data.productId,
        vendorSku: data.vendorSku?.trim() || null,
        purchasePrice: price,
        currency: data.currency || vendor.currency,
        leadTimeDays: data.leadTimeDays ?? 7,
        minOrderQuantity: data.minOrderQuantity ?? 1,
        isPreferred: data.isPreferred ?? false,
        status: "ACTIVE",
      },
      update: {
        vendorSku: data.vendorSku?.trim() || null,
        purchasePrice: price,
        currency: data.currency || vendor.currency,
        leadTimeDays: data.leadTimeDays ?? 7,
        minOrderQuantity: data.minOrderQuantity ?? 1,
        isPreferred: data.isPreferred ?? false,
      },
    });

    // If marked as preferred vendor, set preferredVendorId on Product master
    if (data.isPreferred) {
      await db.product.update({
        where: { id: data.productId },
        data: {
          preferredVendorId: vendorId,
          leadTimeDays: data.leadTimeDays ?? product.leadTimeDays,
        },
      });
    }

    return record;
  }

  /**
   * Calculate Real Vendor Performance Metrics from Database Records
   */
  static async getVendorPerformance(user: AuthenticatedUser, vendorId: string) {
    if (!user.employee) throw new Error("User has no employee profile");
    const orgId = user.employee.organizationId;

    const vendor = await db.vendor.findFirst({
      where: { id: vendorId, organizationId: orgId },
    });
    if (!vendor) throw new Error("Vendor not found");

    const [pos, goodsReceipts] = await Promise.all([
      db.purchaseOrder.findMany({
        where: { vendorId, organizationId: orgId, status: { not: "CANCELLED" } },
      }),
      db.goodsReceipt.findMany({
        where: { vendorId, organizationId: orgId, status: "FINALIZED" },
        include: {
          purchaseOrder: true,
          items: true,
        },
      }),
    ]);

    const numberOfPos = pos.length;
    const totalPurchaseValue = pos.reduce((sum, po) => sum + po.total, 0);
    const openOrdersCount = pos.filter((po) =>
      ["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(po.status)
    ).length;

    // Delivery times & on-time delivery rate
    let totalDeliveryDays = 0;
    let onTimeReceiptsCount = 0;
    let validDeliverySamples = 0;
    let totalRejectedQuantity = 0;
    let totalReceivedQuantity = 0;

    goodsReceipts.forEach((gr) => {
      if (gr.purchaseOrder) {
        const orderDate = new Date(gr.purchaseOrder.poDate).getTime();
        const receivedDate = new Date(gr.receivedDate).getTime();
        const days = Math.max(0, Math.round((receivedDate - orderDate) / (1000 * 60 * 60 * 24)));
        totalDeliveryDays += days;
        validDeliverySamples++;

        const expectedDate = new Date(gr.purchaseOrder.expectedDeliveryDate).getTime();
        if (receivedDate <= expectedDate) {
          onTimeReceiptsCount++;
        }
      }

      gr.items.forEach((item) => {
        totalReceivedQuantity += item.receivedQuantity;
        totalRejectedQuantity += item.rejectedQuantity;
      });
    });

    const averageDeliveryTimeDays =
      validDeliverySamples > 0 ? Math.round((totalDeliveryDays / validDeliverySamples) * 10) / 10 : 0;
    const onTimeDeliveryRate =
      validDeliverySamples > 0 ? Math.round((onTimeReceiptsCount / validDeliverySamples) * 100) : 100;
    const rejectionRate =
      totalReceivedQuantity > 0 ? Math.round((totalRejectedQuantity / totalReceivedQuantity) * 1000) / 10 : 0;

    return {
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      displayName: vendor.displayName,
      status: vendor.status,
      numberOfPos,
      openOrdersCount,
      totalPurchaseValue: this.canViewPricing(user) ? totalPurchaseValue : null,
      averageDeliveryTimeDays,
      onTimeDeliveryRate,
      totalReceivedQuantity,
      totalRejectedQuantity,
      rejectionRate,
    };
  }
}
