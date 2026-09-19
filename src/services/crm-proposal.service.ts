import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";

export interface ProposalLineItem {
  id?: string;
  name?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  lineTotal?: number;
}

export interface CreateProposalInput {
  clientId: string;
  opportunityId?: string;
  contactId?: string;
  title: string;
  items: ProposalLineItem[];
  validityDate?: string | Date;
  terms?: string;
  notes?: string;
  status?: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
}

export class CrmProposalService {
  /**
   * List all proposals for a client or opportunity
   */
  static async getProposals(user: AuthenticatedUser, filters: { clientId?: string; opportunityId?: string }) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const where: any = {
      organizationId: user.employee.organizationId,
      type: "PROPOSAL",
    };
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.opportunityId) where.opportunityId = filters.opportunityId;

    const activities = await db.crmActivity.findMany({
      where,
      orderBy: { performedAt: "desc" },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true, designation: true } },
        client: { select: { id: true, name: true, code: true } },
        opportunity: { select: { id: true, name: true, value: true } },
      },
    });

    return activities.map((act) => {
      let meta: any = {};
      try {
        if (act.metadata) meta = JSON.parse(act.metadata);
      } catch {}

      return {
        id: act.id,
        clientId: act.clientId,
        opportunityId: act.opportunityId,
        title: act.subject,
        description: act.description,
        performedAt: act.performedAt,
        performedBy: act.performedBy,
        client: act.client,
        opportunity: act.opportunity,
        proposalNumber: meta.proposalNumber || `PROP-${act.id.slice(-6).toUpperCase()}`,
        status: meta.status || "DRAFT",
        items: meta.items || [],
        subtotal: meta.subtotal || 0,
        discountTotal: meta.discountTotal || 0,
        taxTotal: meta.taxTotal || 0,
        grandTotal: meta.grandTotal || 0,
        validityDate: meta.validityDate || null,
        terms: meta.terms || null,
        notes: meta.notes || null,
      };
    });
  }

  /**
   * Create a new formal proposal/quote
   */
  static async createProposal(user: AuthenticatedUser, data: CreateProposalInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const client = await db.client.findUnique({ where: { id: data.clientId } });
    if (!client || client.organizationId !== orgId) throw new Error("Client account not found or unauthorized");

    // Calculate line items and totals
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const computedItems = (data.items || []).map((item, idx) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const discPct = Number(item.discountPercent) || 0;
      const taxPct = Number(item.taxPercent) || 0;

      const baseAmount = qty * price;
      const discAmount = (baseAmount * discPct) / 100;
      const taxableAmount = baseAmount - discAmount;
      const taxAmount = (taxableAmount * taxPct) / 100;
      const lineTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

      subtotal += baseAmount;
      discountTotal += discAmount;
      taxTotal += taxAmount;

      return {
        id: item.id || `item-${idx + 1}`,
        name: (item.name || item.description || `Line Item ${idx + 1}`).trim(),
        description: item.description || item.name || null,
        quantity: qty,
        unitPrice: price,
        discountPercent: discPct,
        taxPercent: taxPct,
        lineTotal,
      };
    });

    const grandTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;

    // Count existing proposals in organization for sequence code
    const existingCount = await db.crmActivity.count({
      where: { organizationId: orgId, type: "PROPOSAL" },
    });
    const proposalNumber = `PROP-${new Date().getFullYear()}-${String(existingCount + 1).padStart(4, "0")}`;

    const metadataPayload = {
      title: data.title,
      proposalNumber,
      status: data.status || "DRAFT",
      contactId: data.contactId || null,
      items: computedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal,
      validityDate: data.validityDate || (data as any).validUntil || null,
      terms: data.terms || "Standard commercial terms: Net 30 payment upon approval.",
      notes: data.notes || null,
    };

    const activity = await db.crmActivity.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        opportunityId: data.opportunityId || null,
        type: "PROPOSAL",
        subject: `Proposal: ${data.title} (${proposalNumber})`,
        description: `Grand Total: ₹${grandTotal.toLocaleString()} | Status: ${metadataPayload.status}`,
        metadata: JSON.stringify(metadataPayload),
        performedById: user.employee.id,
        performedAt: new Date(),
      },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true, designation: true } },
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_PROPOSAL_CREATED",
      entity: "Proposal",
      entityId: activity.id,
      newValue: {
        proposalNumber,
        clientId: client.id,
        grandTotal,
        status: metadataPayload.status,
      },
      metadata: { source: "proposal_service" },
    });

    return {
      id: activity.id,
      ...metadataPayload,
    };
  }

  /**
   * Update proposal status (e.g. SENT, ACCEPTED, REJECTED)
   */
  static async updateProposalStatus(
    activityId: string,
    user: AuthenticatedUser,
    newStatus: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED",
    statusNotes?: string
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const activity = await db.crmActivity.findUnique({
      where: { id: activityId },
      include: { client: true },
    });

    if (!activity || activity.type !== "PROPOSAL") throw new Error("Proposal not found");
    if (activity.organizationId !== user.employee.organizationId) throw new Error("Unauthorized");

    let meta: any = {};
    try {
      if (activity.metadata) meta = JSON.parse(activity.metadata);
    } catch {}

    const oldStatus = meta.status || "DRAFT";
    meta.status = newStatus;
    if (statusNotes) meta.statusNotes = statusNotes;

    const updated = await db.crmActivity.update({
      where: { id: activityId },
      data: {
        description: `Grand Total: ₹${(meta.grandTotal || 0).toLocaleString()} | Status: ${newStatus}${statusNotes ? ` (${statusNotes})` : ""}`,
        metadata: JSON.stringify(meta),
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_PROPOSAL_STATUS_CHANGED",
      entity: "Proposal",
      entityId: activityId,
      previousValue: { status: oldStatus },
      newValue: { status: newStatus },
      metadata: { source: "proposal_service" },
    });

    // Notify client owner / proposal creator
    try {
      const recipientIds: string[] = [];
      if (activity.client && (activity.client as any).ownerId) {
        const ownerEmp = await db.employee.findUnique({
          where: { id: (activity.client as any).ownerId },
          select: { userId: true },
        });
        if (ownerEmp?.userId && ownerEmp.userId !== user.id) {
          recipientIds.push(ownerEmp.userId);
        }
      }

      if (activity.performedById) {
        const creatorEmp = await db.employee.findUnique({
          where: { id: activity.performedById },
          select: { userId: true },
        });
        if (creatorEmp?.userId && creatorEmp.userId !== user.id && !recipientIds.includes(creatorEmp.userId)) {
          recipientIds.push(creatorEmp.userId);
        }
      }

      if (recipientIds.length > 0) {
        let eventType: any = "SYSTEM";
        let priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL";
        if (newStatus === "APPROVED") {
          eventType = "PROPOSAL_APPROVED";
          priority = "HIGH";
        } else if (newStatus === "REJECTED") {
          eventType = "PROPOSAL_REJECTED";
          priority = "HIGH";
        } else if (newStatus === "SENT") {
          eventType = "PROPOSAL_SENT";
        } else if (newStatus === "ACCEPTED") {
          eventType = "PROPOSAL_ACCEPTED";
          priority = "HIGH";
        }

        await EventBusService.publish({
          type: eventType,
          organizationId: activity.organizationId,
          actorId: user.id,
          targetUserIds: recipientIds,
          title: `Proposal ${newStatus}: ${meta.proposalNumber || "Commercial Quote"}`,
          message: `Proposal for ${activity.client?.name || "Client"} (${meta.proposalNumber}) was marked as ${newStatus}.${statusNotes ? ` Note: ${statusNotes}` : ""}`,
          actionUrl: `/app/crm/clients/${activity.clientId}`,
          metadata: { proposalId: activityId, clientId: activity.clientId, status: newStatus },
          priority,
        });
      }
    } catch (notifErr) {
      console.error("[Notification Warning]: Failed to publish proposal event:", notifErr);
    }

    return {
      id: updated.id,
      status: newStatus,
      proposalNumber: meta.proposalNumber,
    };
  }
}
