import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";

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
   * Scoped deals list retrieval
   */
  static async getOpportunities(user: AuthenticatedUser, filters: {
    stage?: string;
    clientId?: string;
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

    if (filters.stage && filters.stage !== "ALL") {
      where.stage = filters.stage;
    }
    if (filters.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }
    if (filters.search) {
      where.AND = [
        {
          OR: [
            { name: { contains: filters.search } },
            { client: { name: { contains: filters.search } } },
          ],
        },
      ];
    }

    return db.opportunity.findMany({
      where,
      orderBy: [{ expectedCloseDate: "asc" }, { value: "desc" }],
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
    });
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

    return updated;
  }
}
