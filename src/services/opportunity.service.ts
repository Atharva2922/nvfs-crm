import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";
import { buildCrmScopeFilter, parseCrmDateRange } from "@/lib/crm-query";

export interface CreateOpportunityInput {
  name: string;
  clientId: string;
  contactId?: string;
  value: number;
  stage?: "DISCOVERY" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";
  probability?: number;
  expectedCloseDate?: string | Date | null;
  ownerId?: string;
  notes?: string;
}

export class OpportunityService {
  static isExecutive(user: AuthenticatedUser): boolean {
    const execRoles = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "ADMIN", "COO", "CTO", "CFO", "CMO"];
    return execRoles.includes(user.roleCode);
  }

  /**
   * Scoped deals list retrieval with advanced multi-filtering, relational search, sorting, and pagination
   */
  static async getOpportunities(
    user: AuthenticatedUser,
    filters: {
      stage?: string;
      clientId?: string;
      ownerId?: string;
      search?: string;
      minValue?: number;
      maxValue?: number;
      minProbability?: number;
      maxProbability?: number;
      closeDatePreset?: string;
      closeDateFrom?: string | Date;
      closeDateTo?: string | Date;
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

    if (filters.stage && filters.stage !== "ALL") {
      where.stage = filters.stage;
    }
    if (filters.clientId && filters.clientId !== "ALL") {
      where.clientId = filters.clientId;
    }

    // Numeric value filter
    if (filters.minValue !== undefined || filters.maxValue !== undefined) {
      where.value = {};
      if (filters.minValue !== undefined && !isNaN(Number(filters.minValue))) {
        where.value.gte = Number(filters.minValue);
      }
      if (filters.maxValue !== undefined && !isNaN(Number(filters.maxValue))) {
        where.value.lte = Number(filters.maxValue);
      }
    }

    // Probability filter
    if (filters.minProbability !== undefined || filters.maxProbability !== undefined) {
      where.probability = {};
      if (filters.minProbability !== undefined && !isNaN(Number(filters.minProbability))) {
        where.probability.gte = Number(filters.minProbability);
      }
      if (filters.maxProbability !== undefined && !isNaN(Number(filters.maxProbability))) {
        where.probability.lte = Number(filters.maxProbability);
      }
    }

    // Expected close date range
    const closeBoundary = parseCrmDateRange(filters.closeDatePreset, filters.closeDateFrom, filters.closeDateTo);
    if (closeBoundary) {
      where.expectedCloseDate = closeBoundary;
    }

    // Created date range
    const createdBoundary = parseCrmDateRange(filters.datePreset, filters.startDate, filters.endDate);
    if (createdBoundary) {
      where.createdAt = createdBoundary;
    }

    // Relational search: Deal name, client name, or owner name
    if (filters.search && filters.search.trim()) {
      const clean = filters.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: clean, mode: "insensitive" } },
            { client: { name: { contains: clean, mode: "insensitive" } } },
            { owner: { firstName: { contains: clean, mode: "insensitive" } } },
            { owner: { lastName: { contains: clean, mode: "insensitive" } } },
          ],
        },
      ];
    }

    // Pagination & Sorting
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(filters.limit || 50, 100));
    const skip = (page - 1) * limit;

    const allowedSortFields = [
      "name",
      "value",
      "stage",
      "probability",
      "expectedCloseDate",
      "createdAt",
      "updatedAt",
    ];
    const sortBy = filters.sortBy && allowedSortFields.includes(filters.sortBy) ? filters.sortBy : "expectedCloseDate";
    const sortOrder = filters.sortOrder === "desc" ? "desc" : "asc";
    const orderBy: any = [{ [sortBy]: sortOrder }];
    if (sortBy !== "createdAt") {
      orderBy.push({ createdAt: "desc" });
    }

    const [total, opportunities] = await Promise.all([
      db.opportunity.count({ where }),
      db.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          client: {
            select: { id: true, name: true, code: true, tier: true },
          },
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          owner: {
            select: { id: true, firstName: true, lastName: true, designation: true },
          },
          _count: {
            select: { activities: true },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      opportunities,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Aggregates real-time sales pipeline KPIs
   */
  static async getPipelineMetrics(user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const orgId = user.employee.organizationId;
    const isExec = this.isExecutive(user);
    const empId = user.employee.id;

    const where: any = { organizationId: orgId };
    if (!isExec && user.roleCode !== "DEPARTMENT_HEAD") {
      where.ownerId = empId;
    }

    const deals = await db.opportunity.findMany({ where });

    let openCount = 0;
    let openValue = 0;
    let weightedForecast = 0;
    let wonCount = 0;
    let wonValue = 0;
    let lostCount = 0;

    const stageBreakdown: Record<string, { count: number; value: number }> = {
      DISCOVERY: { count: 0, value: 0 },
      PROPOSAL: { count: 0, value: 0 },
      NEGOTIATION: { count: 0, value: 0 },
      CLOSED_WON: { count: 0, value: 0 },
      CLOSED_LOST: { count: 0, value: 0 },
    };

    for (const d of deals) {
      if (stageBreakdown[d.stage]) {
        stageBreakdown[d.stage].count++;
        stageBreakdown[d.stage].value += d.value;
      }

      if (d.stage === "CLOSED_WON") {
        wonCount++;
        wonValue += d.value;
      } else if (d.stage === "CLOSED_LOST") {
        lostCount++;
      } else {
        openCount++;
        openValue += d.value;
        weightedForecast += (d.value * d.probability) / 100;
      }
    }

    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

    return {
      openCount,
      openValue,
      pipelineValue: openValue,
      weightedForecast: Math.round(weightedForecast),
      wonCount,
      wonValue,
      lostCount,
      winRate,
      stageBreakdown,
    };
  }

  /**
   * Creates a new deal opportunity
   */
  static async createOpportunity(user: AuthenticatedUser, data: CreateOpportunityInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const orgId = user.employee.organizationId;
    const client = await db.client.findUnique({ where: { id: data.clientId } });
    if (!client || client.organizationId !== orgId) throw new Error("Invalid client account specified");

    const stage = data.stage || "DISCOVERY";
    let defaultProb = 25;
    if (stage === "PROPOSAL") defaultProb = 50;
    if (stage === "NEGOTIATION") defaultProb = 75;
    if (stage === "CLOSED_WON") defaultProb = 100;
    if (stage === "CLOSED_LOST") defaultProb = 0;

    const opportunity = await db.opportunity.create({
      data: {
        organizationId: orgId,
        name: data.name.trim(),
        clientId: data.clientId,
        contactId: data.contactId || null,
        ownerId: data.ownerId || user.employee.id,
        value: data.value,
        stage,
        probability: data.probability !== undefined ? data.probability : defaultProb,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: data.notes || null,
      },
      include: { client: true, owner: true },
    });

    // Log activity on the client
    await db.crmActivity.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        opportunityId: opportunity.id,
        type: "PROPOSAL",
        subject: `New Opportunity Created: ${opportunity.name}`,
        description: `Value: ₹${opportunity.value.toLocaleString()} | Initial Stage: ${stage}`,
        performedById: user.employee.id,
      },
    });

    // Notify assigned owner if not self
    if (opportunity.owner?.userId && opportunity.owner.userId !== user.id) {
      try {
        await EventBusService.publish({
          type: "OPPORTUNITY_ASSIGNED",
          organizationId: orgId,
          actorId: user.id,
          targetUserIds: [opportunity.owner.userId],
          title: `Deal Assigned: ${opportunity.name}`,
          message: `You were assigned as owner of deal "${opportunity.name}" for ${client.name}. Value: ₹${opportunity.value.toLocaleString()}`,
          actionUrl: `/app/crm/opportunities/${opportunity.id}`,
          metadata: { opportunityId: opportunity.id, clientId: client.id, value: opportunity.value },
          priority: "NORMAL",
        });
      } catch (notifErr) {
        console.error("[Notification Warning]: Failed to publish OPPORTUNITY_ASSIGNED on create:", notifErr);
      }
    }

    return opportunity;
  }

  /**
   * Advances or updates deal stage with automatic timeline entry
   */
  static async updateStage(
    opportunityId: string,
    user: AuthenticatedUser,
    newStage: "DISCOVERY" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST",
    lossReason?: string
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const opp = await db.opportunity.findUnique({
      where: { id: opportunityId },
      include: { client: true, owner: true },
    });

    if (!opp) throw new Error("Opportunity not found");
    if (opp.organizationId !== user.employee.organizationId) throw new Error("Unauthorized");

    let probability = opp.probability;
    if (newStage === "DISCOVERY") probability = 25;
    if (newStage === "PROPOSAL") probability = 50;
    if (newStage === "NEGOTIATION") probability = 75;
    if (newStage === "CLOSED_WON") probability = 100;
    if (newStage === "CLOSED_LOST") probability = 0;

    const updated = await db.opportunity.update({
      where: { id: opportunityId },
      data: {
        stage: newStage,
        probability,
        lossReason: newStage === "CLOSED_LOST" ? lossReason || "Not specified" : null,
        actualCloseDate: newStage === "CLOSED_WON" || newStage === "CLOSED_LOST" ? new Date() : null,
      },
    });

    // Log timeline activity
    await db.crmActivity.create({
      data: {
        organizationId: opp.organizationId,
        clientId: opp.clientId,
        opportunityId: opp.id,
        type: "STATUS_CHANGE",
        subject: `Opportunity Stage: ${newStage.replace(/_/g, " ")}`,
        description: `Deal "${opp.name}" (₹${opp.value.toLocaleString()}) moved from ${opp.stage} to ${newStage}.${lossReason ? ` Reason: ${lossReason}` : ""}`,
        performedById: user.employee.id,
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: newStage === "CLOSED_WON" ? "CRM_OPPORTUNITY_WON" : newStage === "CLOSED_LOST" ? "CRM_OPPORTUNITY_LOST" : "CRM_OPPORTUNITY_STAGE_CHANGED",
      entity: "Opportunity",
      entityId: opp.id,
      previousValue: { stage: opp.stage, probability: opp.probability },
      newValue: { stage: newStage, probability },
      metadata: { source: "opportunity_service" },
    });

    // Publish stage notification to owner and stakeholders
    try {
      const targetUserIds: string[] = [];
      if (opp.owner?.userId) {
        targetUserIds.push(opp.owner.userId);
      }

      if (targetUserIds.length > 0) {
        if (newStage === "CLOSED_WON") {
          await EventBusService.publish({
            type: "OPPORTUNITY_WON",
            organizationId: opp.organizationId,
            actorId: user.id,
            targetUserIds,
            title: `Deal Won: ${opp.name}`,
            message: `Congratulations! Deal "${opp.name}" for ${opp.client.name} valued at ₹${opp.value.toLocaleString()} was successfully WON!`,
            actionUrl: `/app/crm/opportunities/${opp.id}`,
            metadata: { opportunityId: opp.id, clientId: opp.clientId, value: opp.value, stage: newStage },
            priority: "HIGH",
          });
        } else if (newStage === "CLOSED_LOST") {
          await EventBusService.publish({
            type: "OPPORTUNITY_LOST",
            organizationId: opp.organizationId,
            actorId: user.id,
            targetUserIds,
            title: `Deal Closed Lost: ${opp.name}`,
            message: `Deal "${opp.name}" for ${opp.client.name} was marked Closed Lost.${lossReason ? ` Reason: ${lossReason}` : ""}`,
            actionUrl: `/app/crm/opportunities/${opp.id}`,
            metadata: { opportunityId: opp.id, clientId: opp.clientId, value: opp.value, stage: newStage, lossReason },
            priority: "NORMAL",
          });
        } else {
          await EventBusService.publish({
            type: "OPPORTUNITY_STAGE_CHANGED",
            organizationId: opp.organizationId,
            actorId: user.id,
            targetUserIds,
            title: `Deal Advanced: ${opp.name}`,
            message: `Deal "${opp.name}" moved to stage ${newStage.replace(/_/g, " ")}. Current value: ₹${opp.value.toLocaleString()}`,
            actionUrl: `/app/crm/opportunities/${opp.id}`,
            metadata: { opportunityId: opp.id, clientId: opp.clientId, value: opp.value, stage: newStage },
            priority: "NORMAL",
          });
        }
      }
    } catch (notifErr) {
      console.error("[Notification Warning]: Failed to publish opportunity stage notification:", notifErr);
    }

    return updated;
  }

  /**
   * Retrieves single deal opportunity by ID with client, contact, and owner
   */
  static async getOpportunityById(oppId: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const opp = await db.opportunity.findUnique({
      where: { id: oppId },
      include: {
        client: { select: { id: true, name: true, code: true, tier: true, status: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        owner: { select: { id: true, firstName: true, lastName: true, designation: true, email: true } },
        activities: {
          orderBy: { performedAt: "desc" },
          include: { performedBy: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!opp) throw new Error("Opportunity not found");
    if (opp.organizationId !== user.employee.organizationId) {
      throw new Error("Unauthorized: Opportunity belongs to another organization");
    }

    return opp;
  }

  /**
   * Full deal opportunity update
   */
  static async updateOpportunity(oppId: string, user: AuthenticatedUser, data: {
    name?: string;
    value?: number;
    stage?: "DISCOVERY" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";
    probability?: number;
    expectedCloseDate?: string | Date | null;
    contactId?: string | null;
    ownerId?: string | null;
    lossReason?: string | null;
    notes?: string | null;
  }) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const existing = await db.opportunity.findUnique({
      where: { id: oppId },
      include: { client: true, owner: true },
    });

    if (!existing) throw new Error("Opportunity not found");
    if (existing.organizationId !== user.employee.organizationId) throw new Error("Unauthorized");

    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.value !== undefined) updatePayload.value = Number(data.value);
    if (data.probability !== undefined) updatePayload.probability = Number(data.probability);
    if (data.expectedCloseDate !== undefined) {
      updatePayload.expectedCloseDate = data.expectedCloseDate ? new Date(data.expectedCloseDate) : existing.expectedCloseDate;
    }
    if (data.contactId !== undefined) updatePayload.contactId = data.contactId;
    if (data.ownerId !== undefined) updatePayload.ownerId = data.ownerId;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.lossReason !== undefined) updatePayload.lossReason = data.lossReason;

    // Handle stage change
    if (data.stage && data.stage !== existing.stage) {
      updatePayload.stage = data.stage;
      if (data.probability === undefined) {
        if (data.stage === "DISCOVERY") updatePayload.probability = 25;
        if (data.stage === "PROPOSAL") updatePayload.probability = 50;
        if (data.stage === "NEGOTIATION") updatePayload.probability = 75;
        if (data.stage === "CLOSED_WON") updatePayload.probability = 100;
        if (data.stage === "CLOSED_LOST") updatePayload.probability = 0;
      }
      if (data.stage === "CLOSED_WON" || data.stage === "CLOSED_LOST") {
        updatePayload.actualCloseDate = new Date();
      }

      await db.crmActivity.create({
        data: {
          organizationId: existing.organizationId,
          clientId: existing.clientId,
          opportunityId: existing.id,
          type: "STATUS_CHANGE",
          subject: `Deal Stage: ${data.stage.replace(/_/g, " ")}`,
          description: `Deal "${existing.name}" moved from ${existing.stage} to ${data.stage}. Value: ₹${(data.value ?? existing.value).toLocaleString()}`,
          performedById: user.employee.id,
        },
      });
    }

    const updated = await db.opportunity.update({
      where: { id: oppId },
      data: updatePayload,
      include: {
        client: { select: { id: true, name: true, code: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_OPPORTUNITY_UPDATED",
      entity: "Opportunity",
      entityId: oppId,
      previousValue: { name: existing.name, value: existing.value, stage: existing.stage },
      newValue: { name: updated.name, value: updated.value, stage: updated.stage },
      metadata: { source: "opportunity_service" },
    });

    return updated;
  }

  /**
   * Delete deal opportunity
   */
  static async deleteOpportunity(oppId: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const existing = await db.opportunity.findUnique({ where: { id: oppId } });
    if (!existing) throw new Error("Opportunity not found");
    if (existing.organizationId !== user.employee.organizationId) throw new Error("Unauthorized");

    const isExec = this.isExecutive(user);
    if (!isExec && user.roleCode !== "DEPARTMENT_HEAD" && existing.ownerId !== user.employee.id) {
      throw new Error("Forbidden: You do not have permission to delete this opportunity");
    }

    await db.opportunity.delete({ where: { id: oppId } });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_OPPORTUNITY_DELETED",
      entity: "Opportunity",
      entityId: oppId,
      previousValue: { name: existing.name, value: existing.value, clientId: existing.clientId },
      metadata: { source: "opportunity_service" },
    });

    return { success: true, id: oppId };
  }
}
