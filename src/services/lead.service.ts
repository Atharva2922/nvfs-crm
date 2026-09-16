import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";

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
   * Retrieves leads respecting sales hierarchy and scoping
   */
  static async getLeads(user: AuthenticatedUser, filters: {
    status?: string;
    ownerId?: string;
    search?: string;
    scope?: "my" | "all";
  } = {}) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const orgId = user.employee.organizationId;
    const isExec = this.isExecutive(user);
    const empId = user.employee.id;

    const where: any = { organizationId: orgId };

    if (filters.scope === "my" || (!isExec && user.roleCode !== "DEPARTMENT_HEAD")) {
      where.ownerId = empId;
    }

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }
    if (filters.search) {
      where.AND = [
        {
          OR: [
            { firstName: { contains: filters.search } },
            { lastName: { contains: filters.search } },
            { companyName: { contains: filters.search } },
            { email: { contains: filters.search } },
          ],
        },
      ];
    }

    return db.lead.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
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
        _count: {
          select: { activities: true },
        },
      },
    });
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

    // Notify assigned owner if not self
    if (lead.owner && lead.owner.userId && lead.owner.userId !== user.id) {
      await EventBusService.publish({
        type: "SYSTEM",
        organizationId: orgId,
        actorId: user.id,
        targetUserIds: [lead.owner.userId],
        title: `New Lead Assigned: ${lead.firstName} ${lead.lastName}`,
        message: `${lead.companyName} (${lead.source}). Estimated value: ₹${lead.estimatedValue || 0}`,
        actionUrl: "/app/crm/leads",
        metadata: { leadId: lead.id },
      });
    }

    return lead;
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
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error("Lead not found");
    if (lead.organizationId !== user.employee.organizationId) throw new Error("Unauthorized");
    if (lead.status === "CONVERTED") throw new Error("Cannot modify a lead that is already converted");

    const updated = await db.lead.update({
      where: { id: leadId },
      data: {
        status,
        notes: notes ? `${lead.notes ? lead.notes + "\n" : ""}${notes}` : lead.notes,
      },
    });

    // Log activity
    await db.crmActivity.create({
      data: {
        organizationId: lead.organizationId,
        leadId: lead.id,
        type: "STATUS_CHANGE",
        subject: `Lead Status Changed to ${status}`,
        description: notes || `Status updated by ${user.employee.firstName} ${user.employee.lastName}`,
        performedById: user.employee.id,
      },
    });

    return updated;
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

    return {
      lead: updatedLead,
      client,
      contact,
      opportunity,
    };
  }
}
