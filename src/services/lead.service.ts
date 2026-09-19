import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";
import { buildCrmScopeFilter, parseCrmDateRange } from "@/lib/crm-query";

export interface CreateLeadInput {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  source?: "WEBSITE" | "REFERRAL" | "COLD_OUTREACH" | "CONFERENCE" | "PARTNER";
  estimatedValue?: number;
  ownerId?: string;
  notes?: string;
}

export interface UpdateLeadInput {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string | null;
  jobTitle?: string | null;
  source?: "WEBSITE" | "REFERRAL" | "COLD_OUTREACH" | "CONFERENCE" | "PARTNER";
  status?: "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "LOST" | "CONVERTED";
  estimatedValue?: number | null;
  ownerId?: string | null;
  notes?: string | null;
}

export interface ConvertLeadOptions {
  createOpportunity?: boolean;
  opportunityName?: string;
  dealValue?: number;
  existingClientId?: string;
  notes?: string;
}

export class LeadService {
  static isExecutive(user: AuthenticatedUser): boolean {
    const execRoles = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "ADMIN", "COO", "CTO", "CFO", "CMO"];
    return execRoles.includes(user.roleCode);
  }

  /**
   * Retrieves leads respecting sales hierarchy, multi-filters, sorting, and pagination
   */
  static async getLeads(
    user: AuthenticatedUser,
    filters: {
      status?: string;
      source?: string;
      ownerId?: string;
      search?: string;
      datePreset?: string;
      startDate?: string | Date;
      endDate?: string | Date;
      scope?: "my" | "all";
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ) {
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
    if (filters.source && filters.source !== "ALL") {
      where.source = filters.source;
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
            { firstName: { contains: clean, mode: "insensitive" } },
            { lastName: { contains: clean, mode: "insensitive" } },
            { companyName: { contains: clean, mode: "insensitive" } },
            { email: { contains: clean, mode: "insensitive" } },
            { phone: { contains: clean, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Pagination & Sorting
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(filters.limit || 10, 100));
    const skip = (page - 1) * limit;

    const allowedSortFields = [
      "firstName",
      "companyName",
      "status",
      "source",
      "estimatedValue",
      "createdAt",
      "updatedAt",
    ];
    const sortBy = filters.sortBy && allowedSortFields.includes(filters.sortBy) ? filters.sortBy : "createdAt";
    const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";
    const orderBy: any = [{ [sortBy]: sortOrder }];
    if (sortBy !== "createdAt") {
      orderBy.push({ createdAt: "desc" });
    }

    const [total, leads] = await Promise.all([
      db.lead.count({ where }),
      db.lead.findMany({
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
          convertedClient: {
            select: { id: true, name: true, code: true },
          },
          convertedContact: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { activities: true },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      leads,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get single lead details with activities and conversion status
   */
  static async getLeadById(leadId: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const lead = await db.lead.findUnique({
      where: { id: leadId },
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
        convertedClient: {
          select: { id: true, name: true, code: true, tier: true, status: true },
        },
        convertedContact: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        activities: {
          orderBy: { performedAt: "desc" },
          include: {
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                designation: true,
              },
            },
          },
        },
      },
    });

    if (!lead) throw new Error("Lead not found");
    if (lead.organizationId !== user.employee.organizationId) {
      throw new Error("Unauthorized: Lead belongs to another organization");
    }

    return lead;
  }

  /**
   * Capture a new prospect lead
   */
  static async createLead(user: AuthenticatedUser, data: CreateLeadInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const orgId = user.employee.organizationId;
    const ownerId = data.ownerId || user.employee.id;

    const lead = await db.lead.create({
      data: {
        organizationId: orgId,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        companyName: data.companyName.trim(),
        email: data.email.trim(),
        phone: data.phone || null,
        jobTitle: data.jobTitle || null,
        source: data.source || "WEBSITE",
        status: "NEW",
        estimatedValue: data.estimatedValue || null,
        ownerId,
        notes: data.notes || null,
      },
      include: { owner: true },
    });

    // Record initial timeline activity
    await db.crmActivity.create({
      data: {
        organizationId: orgId,
        leadId: lead.id,
        type: "NOTE",
        subject: "Inbound Lead Captured",
        description: `Source: ${lead.source}. Initial estimated value: ₹${lead.estimatedValue || 0}`,
        performedById: user.employee.id,
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_LEAD_CREATED",
      entity: "Lead",
      entityId: lead.id,
      newValue: {
        name: `${lead.firstName} ${lead.lastName}`,
        company: lead.companyName,
        email: lead.email,
        source: lead.source,
      },
      metadata: { source: "lead_service" },
    });

    // Notify assigned owner if not self
    if (lead.owner && lead.owner.userId && lead.owner.userId !== user.id) {
      try {
        await EventBusService.publish({
          type: "LEAD_ASSIGNED",
          organizationId: orgId,
          actorId: user.id,
          targetUserIds: [lead.owner.userId],
          title: `New Lead Assigned: ${lead.firstName} ${lead.lastName}`,
          message: `${lead.companyName} (${lead.source}). Estimated value: ₹${lead.estimatedValue ? lead.estimatedValue.toLocaleString() : "0"}`,
          actionUrl: `/app/crm/leads?id=${lead.id}`,
          metadata: { leadId: lead.id, company: lead.companyName },
          priority: "NORMAL",
        });
      } catch (notifErr) {
        console.error("[Notification Warning]: Failed to publish LEAD_ASSIGNED:", notifErr);
      }
    }

    return lead;
  }

  /**
   * Updates full lead details (name, company, owner, value, notes, status)
   */
  static async updateLead(leadId: string, user: AuthenticatedUser, data: UpdateLeadInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const existing = await db.lead.findUnique({
      where: { id: leadId },
      include: { owner: true },
    });
    if (!existing) throw new Error("Lead not found");
    if (existing.organizationId !== user.employee.organizationId) {
      throw new Error("Unauthorized");
    }
    if ((existing.status as string) === "CONVERTED" && data.status && data.status !== "CONVERTED") {
      throw new Error("Cannot modify status of an already converted lead");
    }

    const updatePayload: any = {};
    if (data.firstName !== undefined) updatePayload.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updatePayload.lastName = data.lastName.trim();
    if (data.companyName !== undefined) updatePayload.companyName = data.companyName.trim();
    if (data.email !== undefined) updatePayload.email = data.email.trim();
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.jobTitle !== undefined) updatePayload.jobTitle = data.jobTitle;
    if (data.source !== undefined) updatePayload.source = data.source;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.estimatedValue !== undefined) updatePayload.estimatedValue = data.estimatedValue;
    if (data.ownerId !== undefined) updatePayload.ownerId = data.ownerId;
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    const updated = await db.lead.update({
      where: { id: leadId },
      data: updatePayload,
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, userId: true },
        },
      },
    });

    // If status changed, log activity
    if (data.status && data.status !== existing.status) {
      await db.crmActivity.create({
        data: {
          organizationId: existing.organizationId,
          leadId: existing.id,
          type: "STATUS_CHANGE",
          subject: `Lead Status Changed: ${existing.status} → ${data.status}`,
          description: data.notes || `Status updated by ${user.employee.firstName} ${user.employee.lastName}`,
          performedById: user.employee.id,
        },
      });
    }

    // If reassigned, notify new owner
    if (data.ownerId && data.ownerId !== existing.ownerId) {
      await db.crmActivity.create({
        data: {
          organizationId: existing.organizationId,
          leadId: existing.id,
          type: "NOTE",
          subject: "Lead Reassigned",
          description: `Assigned from ${existing.owner ? `${existing.owner.firstName} ${existing.owner.lastName}` : "Unassigned"} to ${updated.owner ? `${updated.owner.firstName} ${updated.owner.lastName}` : "new owner"}`,
          performedById: user.employee.id,
        },
      });

      if (updated.owner?.userId && updated.owner.userId !== user.id) {
        try {
          await EventBusService.publish({
            type: "LEAD_ASSIGNED",
            organizationId: user.employee.organizationId,
            actorId: user.id,
            targetUserIds: [updated.owner.userId],
            title: `Lead Reassigned to You: ${updated.firstName} ${updated.lastName}`,
            message: `${updated.companyName} was reassigned to you. Estimated value: ₹${updated.estimatedValue ? updated.estimatedValue.toLocaleString() : "0"}`,
            actionUrl: `/app/crm/leads?id=${updated.id}`,
            metadata: { leadId: updated.id, company: updated.companyName },
            priority: "NORMAL",
          });
        } catch (notifErr) {
          console.error("[Notification Warning]: Failed to publish LEAD_ASSIGNED on reassign:", notifErr);
        }
      }
    }

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_LEAD_UPDATED",
      entity: "Lead",
      entityId: leadId,
      previousValue: { status: existing.status, ownerId: existing.ownerId, estimatedValue: existing.estimatedValue },
      newValue: { status: updated.status, ownerId: updated.ownerId, estimatedValue: updated.estimatedValue },
      metadata: { source: "lead_service" },
    });

    return updated;
  }

  /**
   * Deletes / archives lead
   */
  static async deleteLead(leadId: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error("Lead not found");
    if (lead.organizationId !== user.employee.organizationId) {
      throw new Error("Unauthorized");
    }

    // Permission check
    const isExec = this.isExecutive(user);
    if (!isExec && user.roleCode !== "DEPARTMENT_HEAD" && lead.ownerId !== user.employee.id) {
      throw new Error("Forbidden: You do not have permission to delete this lead");
    }

    await db.lead.delete({ where: { id: leadId } });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_LEAD_DELETED",
      entity: "Lead",
      entityId: leadId,
      previousValue: { name: `${lead.firstName} ${lead.lastName}`, company: lead.companyName },
      metadata: { source: "lead_service" },
    });

    return { success: true, id: leadId };
  }

  /**
   * Updates lead qualification stage
   */
  static async updateLeadStatus(
    leadId: string,
    user: AuthenticatedUser,
    status: "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "LOST",
    notes?: string
  ) {
    return this.updateLead(leadId, user, { status, notes });
  }

  /**
   * Convert Lead into Client, Contact, and Opportunity with Duplicate Account Prevention
   */
  static async convertLead(leadId: string, user: AuthenticatedUser, options: ConvertLeadOptions = {}) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error("Lead not found");
    if (lead.organizationId !== user.employee.organizationId) throw new Error("Unauthorized");
    if (lead.status === "CONVERTED") throw new Error("This lead is already converted.");

    const orgId = lead.organizationId;

    // 1. DUPLICATE ACCOUNT HANDLING & REUSE
    let client: { id: string; name: string; code: string };

    if (options.existingClientId) {
      // User explicitly selected an existing account
      const existing = await db.client.findUnique({
        where: { id: options.existingClientId },
        select: { id: true, name: true, code: true, organizationId: true },
      });
      if (!existing || existing.organizationId !== orgId) {
        throw new Error("Specified existing client account was not found.");
      }
      client = existing;
    } else {
      // Automatic Duplicate Detection: check case-insensitive match on company name
      const duplicate = await db.client.findFirst({
        where: {
          organizationId: orgId,
          name: { equals: lead.companyName },
        },
        select: { id: true, name: true, code: true },
      });

      if (duplicate) {
        // Reuse duplicate account
        client = duplicate;
      } else {
        // Provision new Client Account
        const count = await db.client.count({ where: { organizationId: orgId } });
        const code = `CLI-${String(count + 1).padStart(4, "0")}`;

        client = await db.client.create({
          data: {
            organizationId: orgId,
            code,
            name: lead.companyName.trim(),
            email: lead.email,
            phone: lead.phone || null,
            status: "ACTIVE",
            tier: "MID_MARKET",
            ownerId: lead.ownerId || user.employee.id,
            notes: `Converted from lead ${lead.firstName} ${lead.lastName}. Source: ${lead.source}`,
          },
          select: { id: true, name: true, code: true },
        });
      }
    }

    // 2. Provision or Reuse Contact Person
    let contact = await db.contact.findFirst({
      where: {
        clientId: client.id,
        email: { equals: lead.email },
      },
    });

    if (!contact) {
      contact = await db.contact.create({
        data: {
          clientId: client.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone || null,
          designation: lead.jobTitle || "Contact",
          isPrimary: true,
          notes: `Created via Lead Conversion on ${new Date().toLocaleDateString()}`,
        },
      });
    }

    // 3. Optionally Provision Opportunity
    let opportunity: { id: string; name: string; value: number } | null = null;
    if (options.createOpportunity || (options.dealValue && options.dealValue > 0) || (lead.estimatedValue && lead.estimatedValue > 0)) {
      const dealName = options.opportunityName || `${lead.companyName} - Core Deployment`;
      const dealValue = options.dealValue ?? lead.estimatedValue ?? 50000;

      opportunity = await db.opportunity.create({
        data: {
          organizationId: orgId,
          clientId: client.id,
          contactId: contact.id,
          ownerId: lead.ownerId || user.employee.id,
          name: dealName,
          value: dealValue,
          stage: "DISCOVERY",
          probability: 25,
          expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 days
          notes: `Created via conversion of lead: ${lead.firstName} ${lead.lastName}`,
        },
        select: { id: true, name: true, value: true },
      });
    }

    // 4. Mark Lead as Converted
    const updatedLead = await db.lead.update({
      where: { id: lead.id },
      data: {
        status: "CONVERTED",
        convertedClientId: client.id,
        convertedContactId: contact.id,
        convertedOpportunityId: opportunity ? opportunity.id : null,
        convertedAt: new Date(),
      },
    });

    // 5. Log Customer 360 Timeline Interaction
    await db.crmActivity.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        leadId: lead.id,
        opportunityId: opportunity ? opportunity.id : null,
        type: "STATUS_CHANGE",
        subject: `Lead Converted: ${lead.firstName} ${lead.lastName}`,
        description: `Successfully converted into Account "${client.name}" (${client.code})${opportunity ? ` with open deal "${opportunity.name}" (₹${opportunity.value.toLocaleString()})` : ""}.`,
        performedById: user.employee.id,
        performedAt: new Date(),
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_LEAD_CONVERTED",
      entity: "Lead",
      entityId: lead.id,
      newValue: {
        clientId: client.id,
        clientName: client.name,
        contactId: contact.id,
        opportunityId: opportunity?.id,
      },
      metadata: { source: "lead_service" },
    });

    // Notify assigned owner if configured
    if (lead.ownerId) {
      try {
        const ownerEmp = await db.employee.findUnique({
          where: { id: lead.ownerId },
          select: { userId: true },
        });
        if (ownerEmp?.userId) {
          await EventBusService.publish({
            type: "LEAD_CONVERTED",
            organizationId: orgId,
            actorId: user.id,
            targetUserIds: [ownerEmp.userId],
            title: `Lead Converted: ${lead.firstName} ${lead.lastName}`,
            message: `Lead successfully converted to corporate client "${client.name}"${opportunity ? ` with open deal "${opportunity.name}"` : ""}.`,
            actionUrl: `/app/crm/clients/${client.id}`,
            metadata: { leadId: lead.id, clientId: client.id, opportunityId: opportunity?.id },
            priority: "HIGH",
          });
        }
      } catch (notifErr) {
        console.error("[Notification Warning]: Failed to publish LEAD_CONVERTED:", notifErr);
      }
    }

    return {
      lead: updatedLead,
      client,
      contact,
      opportunity,
    };
  }
}
