import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";
import { buildCrmScopeFilter, parseCrmDateRange } from "@/lib/crm-query";

export interface CreateClientInput {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  status?: "LEAD" | "PROSPECT" | "ACTIVE" | "INACTIVE" | "CHURNED";
  tier?: "ENTERPRISE" | "MID_MARKET" | "SMB";
  ownerId?: string;
  annualRevenue?: number;
  notes?: string;
}

export interface ClientQueryFilters {
  status?: string;
  tier?: string;
  industry?: string;
  ownerId?: string;
  search?: string;
  scope?: "my" | "all";
  datePreset?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class ClientService {
  static isExecutive(user: AuthenticatedUser): boolean {
    const execRoles = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "ADMIN", "COO", "CTO", "CFO", "CMO"];
    return execRoles.includes(user.roleCode);
  }

  /**
   * Scoped client directory retrieval with multi-filtering, sorting, and pagination
   */
  static async getClients(user: AuthenticatedUser, filters: ClientQueryFilters = {}) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    // Secure hierarchical scoping
    const scopedWhere = await buildCrmScopeFilter(user, {
      entityOwnerField: "ownerId",
      requestedScope: filters.scope,
      requestedOwnerId: filters.ownerId,
    });
    const where: any = { ...scopedWhere };

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters.tier && filters.tier !== "ALL") {
      where.tier = filters.tier;
    }
    if (filters.industry && filters.industry !== "ALL") {
      where.industry = filters.industry;
    }

    // Date range filter
    const dateBoundary = parseCrmDateRange(filters.datePreset, filters.startDate, filters.endDate);
    if (dateBoundary) {
      where.createdAt = dateBoundary;
    }

    // Search query
    if (filters.search && filters.search.trim()) {
      const clean = filters.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: clean, mode: "insensitive" } },
            { code: { contains: clean, mode: "insensitive" } },
            { email: { contains: clean, mode: "insensitive" } },
            { phone: { contains: clean, mode: "insensitive" } },
            { industry: { contains: clean, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Pagination & Sorting
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(filters.limit || 10, 100));
    const skip = (page - 1) * limit;

    const allowedSortFields = ["name", "code", "tier", "status", "industry", "createdAt", "updatedAt"];
    const sortBy = filters.sortBy && allowedSortFields.includes(filters.sortBy) ? filters.sortBy : "createdAt";
    const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";
    const orderBy: any = [{ [sortBy]: sortOrder }];
    if (sortBy !== "createdAt") {
      orderBy.push({ createdAt: "desc" });
    }

    const [total, clients] = await Promise.all([
      db.client.count({ where }),
      db.client.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              designation: true,
              email: true,
            },
          },
          _count: {
            select: {
              contacts: true,
              opportunities: true,
              activities: true,
              tasks: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      clients,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Full Customer 360 View for a single client
   */
  static async getClient360(clientId: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const client = await db.client.findUnique({
      where: { id: clientId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            email: true,
            phone: true,
          },
        },
        contacts: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
        },
        opportunities: {
          orderBy: { expectedCloseDate: "asc" },
          include: {
            owner: { select: { firstName: true, lastName: true } },
            contact: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        activities: {
          orderBy: { performedAt: "desc" },
          include: {
            performedBy: { select: { firstName: true, lastName: true, designation: true } },
          },
        },
        tasks: {
          orderBy: { dueDate: "asc" },
          include: {
            assignee: { select: { firstName: true, lastName: true } },
          },
        },
        invoices: {
          orderBy: { invoiceDate: "desc" },
          include: { items: true },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!client) throw new Error("Client not found");
    if (client.organizationId !== user.employee.organizationId) {
      throw new Error("Unauthorized: Client belongs to another organization");
    }

    // Permission check for standard staff
    if (!this.isExecutive(user) && user.roleCode !== "DEPARTMENT_HEAD" && client.ownerId !== user.employee.id) {
      throw new Error("Access Denied: You do not have permission to view this client account");
    }

    // Compute Customer 360 Aggregates
    const totalPipelineValue = client.opportunities
      .filter((o) => o.stage !== "CLOSED_LOST" && o.stage !== "CLOSED_WON")
      .reduce((sum, o) => sum + o.value, 0);

    const totalWonRevenue = client.opportunities
      .filter((o) => o.stage === "CLOSED_WON")
      .reduce((sum, o) => sum + o.value, 0);

    const totalInvoiced = client.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = client.payments.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + p.amount, 0);
    const outstandingBalance = client.invoices
      .filter((inv) => inv.status !== "CANCELLED")
      .reduce((sum, inv) => sum + inv.balance, 0);
    const overdueAmount = client.invoices
      .filter((inv) => inv.status !== "CANCELLED" && inv.balance > 0 && new Date(inv.dueDate) < new Date())
      .reduce((sum, inv) => sum + inv.balance, 0);

    return {
      client,
      stats: {
        totalContacts: client.contacts.length,
        openDealsCount: client.opportunities.filter((o) => o.stage !== "CLOSED_LOST" && o.stage !== "CLOSED_WON").length,
        totalPipelineValue,
        totalWonRevenue,
        totalActivities: client.activities.length,
        openTasksCount: client.tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length,
        totalInvoiced,
        totalPaid,
        outstandingBalance,
        overdueAmount,
      },
      billingSnapshot: {
        currency: "INR",
        invoicingStatus: overdueAmount > 0 ? "OVERDUE_PAYMENTS" : client.status === "ACTIVE" ? "GOOD_STANDING" : "PENDING_SETUP",
        paymentTerms: "NET_30",
        creditLimit: client.tier === "ENTERPRISE" ? 500000 : 100000,
        totalInvoiced,
        totalPaid,
        outstandingBalance,
        overdueAmount,
      },
    };
  }

  /**
   * Create new client with duplicate detection
   */
  static async createClient(user: AuthenticatedUser, data: CreateClientInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const orgId = user.employee.organizationId;
    const normalizedName = data.name.trim().toLowerCase();

    // Check for potential duplicate account
    const existing = await db.client.findFirst({
      where: {
        organizationId: orgId,
        name: { equals: data.name },
      },
    });

    if (existing) {
      throw new Error(`A client account with the name "${data.name}" already exists (${existing.code}).`);
    }

    // Generate unique code
    const count = await db.client.count({ where: { organizationId: orgId } });
    const code = `CLI-${String(count + 1).padStart(4, "0")}`;

    const client = await db.client.create({
      data: {
        organizationId: orgId,
        code,
        name: data.name.trim(),
        industry: data.industry || null,
        website: data.website || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || "India",
        postalCode: data.postalCode || null,
        taxId: data.taxId || null,
        status: data.status || "PROSPECT",
        tier: data.tier || "MID_MARKET",
        ownerId: data.ownerId || user.employee.id,
        annualRevenue: data.annualRevenue || null,
        notes: data.notes || null,
      },
    });

    // Record initial activity
    await db.crmActivity.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        type: "STATUS_CHANGE",
        subject: "Client Account Provisioned",
        description: `Account created by ${user.employee.firstName} ${user.employee.lastName}. Status: ${client.status}`,
        performedById: user.employee.id,
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_CLIENT_CREATED",
      entity: "Client",
      entityId: client.id,
      newValue: { code: client.code, name: client.name, status: client.status },
      metadata: { source: "client_service" },
    });

    // Notify assigned owner if not self
    if (client.ownerId && client.ownerId !== user.employee.id) {
      try {
        const ownerEmp = await db.employee.findUnique({
          where: { id: client.ownerId },
          select: { userId: true },
        });
        if (ownerEmp?.userId) {
          await EventBusService.publish({
            type: "CLIENT_ASSIGNED",
            organizationId: orgId,
            actorId: user.id,
            targetUserIds: [ownerEmp.userId],
            title: `Client Account Assigned: ${client.name}`,
            message: `You were assigned as owner of client account ${client.name} (${client.code}).`,
            actionUrl: `/app/crm/clients/${client.id}`,
            metadata: { clientId: client.id, clientCode: client.code },
            priority: "NORMAL",
          });
        }
      } catch (notifErr) {
        console.error("[Notification Warning]: Failed to publish CLIENT_ASSIGNED on create:", notifErr);
      }
    }

    return client;
  }

  /**
   * Update client details
   */
  static async updateClient(clientId: string, user: AuthenticatedUser, data: Partial<CreateClientInput>) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const existing = await db.client.findUnique({ where: { id: clientId } });
    if (!existing) throw new Error("Client not found");
    if (existing.organizationId !== user.employee.organizationId) throw new Error("Unauthorized");

    const updated = await db.client.update({
      where: { id: clientId },
      data,
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_CLIENT_UPDATED",
      entity: "Client",
      entityId: clientId,
      previousValue: { name: existing.name, status: existing.status, tier: existing.tier },
      newValue: { name: updated.name, status: updated.status, tier: updated.tier },
      metadata: { source: "client_service" },
    });

    // Notify new owner if reassigned
    if (data.ownerId && data.ownerId !== existing.ownerId && data.ownerId !== user.employee.id) {
      try {
        const ownerEmp = await db.employee.findUnique({
          where: { id: data.ownerId },
          select: { userId: true },
        });
        if (ownerEmp?.userId) {
          await EventBusService.publish({
            type: "CLIENT_ASSIGNED",
            organizationId: existing.organizationId,
            actorId: user.id,
            targetUserIds: [ownerEmp.userId],
            title: `Client Account Reassigned: ${updated.name}`,
            message: `Ownership of client account ${updated.name} (${updated.code}) was transferred to you.`,
            actionUrl: `/app/crm/clients/${updated.id}`,
            metadata: { clientId: updated.id, clientCode: updated.code },
            priority: "NORMAL",
          });
        }
      } catch (notifErr) {
        console.error("[Notification Warning]: Failed to publish CLIENT_ASSIGNED on update:", notifErr);
      }
    }

    return updated;
  }

  /**
   * Archive / deactivate client account
   */
  static async archiveClient(clientId: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const existing = await db.client.findUnique({ where: { id: clientId } });
    if (!existing) throw new Error("Client not found");
    if (existing.organizationId !== user.employee.organizationId) throw new Error("Unauthorized");

    const isExec = this.isExecutive(user);
    if (!isExec && user.roleCode !== "DEPARTMENT_HEAD" && existing.ownerId !== user.employee.id) {
      throw new Error("Forbidden: You do not have permission to archive this client");
    }

    const updated = await db.client.update({
      where: { id: clientId },
      data: { status: "INACTIVE" },
    });

    await db.crmActivity.create({
      data: {
        organizationId: existing.organizationId,
        clientId,
        type: "STATUS_CHANGE",
        subject: "Client Account Deactivated / Archived",
        description: `Status changed to INACTIVE by ${user.employee.firstName} ${user.employee.lastName}`,
        performedById: user.employee.id,
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_CLIENT_ARCHIVED",
      entity: "Client",
      entityId: clientId,
      previousValue: { status: existing.status },
      newValue: { status: "INACTIVE" },
      metadata: { source: "client_service" },
    });

    return updated;
  }

  /**
   * Add a contact to a client account
   */
  static async addContact(clientId: string, user: AuthenticatedUser, data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    designation?: string;
    department?: string;
    isPrimary?: boolean;
    notes?: string;
  }) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const client = await db.client.findUnique({ where: { id: clientId } });
    if (!client) throw new Error("Client not found");
    if (client.organizationId !== user.employee.organizationId) throw new Error("Unauthorized");

    // If marked as primary, demote existing primary contacts
    if (data.isPrimary) {
      await db.contact.updateMany({
        where: { clientId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await db.contact.create({
      data: {
        clientId,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone || null,
        designation: data.designation || null,
        department: data.department || null,
        isPrimary: data.isPrimary || false,
        notes: data.notes || null,
      },
    });

    // Log activity
    await db.crmActivity.create({
      data: {
        organizationId: client.organizationId,
        clientId,
        type: "NOTE",
        subject: `New Contact Added: ${contact.firstName} ${contact.lastName}`,
        description: `Designation: ${contact.designation || "N/A"}, Email: ${contact.email}`,
        performedById: user.employee.id,
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_CONTACT_CREATED",
      entity: "Contact",
      entityId: contact.id,
      newValue: { name: `${contact.firstName} ${contact.lastName}`, email: contact.email, clientId },
      metadata: { source: "client_service" },
    });

    return contact;
  }

  /**
   * Update contact details
   */
  static async updateContact(contactId: string, user: AuthenticatedUser, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    designation?: string | null;
    department?: string | null;
    isPrimary?: boolean;
    notes?: string | null;
  }) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const existing = await db.contact.findUnique({
      where: { id: contactId },
      include: { client: true },
    });
    if (!existing) throw new Error("Contact not found");
    if (existing.client.organizationId !== user.employee.organizationId) {
      throw new Error("Unauthorized");
    }

    if (data.isPrimary) {
      await db.contact.updateMany({
        where: { clientId: existing.clientId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const updated = await db.contact.update({
      where: { id: contactId },
      data,
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_CONTACT_UPDATED",
      entity: "Contact",
      entityId: contactId,
      previousValue: { name: `${existing.firstName} ${existing.lastName}`, email: existing.email },
      newValue: { name: `${updated.firstName} ${updated.lastName}`, email: updated.email },
      metadata: { source: "client_service" },
    });

    return updated;
  }

  /**
   * Delete contact
   */
  static async deleteContact(contactId: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const existing = await db.contact.findUnique({
      where: { id: contactId },
      include: { client: true },
    });
    if (!existing) throw new Error("Contact not found");
    if (existing.client.organizationId !== user.employee.organizationId) {
      throw new Error("Unauthorized");
    }

    await db.contact.delete({ where: { id: contactId } });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_CONTACT_DELETED",
      entity: "Contact",
      entityId: contactId,
      previousValue: { name: `${existing.firstName} ${existing.lastName}`, email: existing.email, clientId: existing.clientId },
      metadata: { source: "client_service" },
    });

    return { success: true, id: contactId };
  }

  /**
   * Log an interaction on the Customer 360 timeline
   */
  static async logActivity(clientId: string, user: AuthenticatedUser, data: {
    type: "CALL" | "MEETING" | "EMAIL" | "NOTE" | "TASK" | "PROPOSAL" | "STATUS_CHANGE" | "DOCUMENT";
    subject: string;
    description?: string;
    opportunityId?: string;
    metadata?: string | null;
  }) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const client = await db.client.findUnique({ where: { id: clientId } });
    if (!client) throw new Error("Client not found");
    if (client.organizationId !== user.employee.organizationId) throw new Error("Unauthorized");

    const activity = await db.crmActivity.create({
      data: {
        organizationId: client.organizationId,
        clientId,
        opportunityId: data.opportunityId || null,
        type: data.type,
        subject: data.subject,
        description: data.description || null,
        metadata: data.metadata || null,
        performedById: user.employee.id,
        performedAt: new Date(),
      },
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true, designation: true },
        },
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: `CRM_ACTIVITY_${data.type}`,
      entity: "CrmActivity",
      entityId: activity.id,
      newValue: { subject: data.subject, type: data.type, clientId },
      metadata: { source: "client_service" },
    });

    return activity;
  }
}
