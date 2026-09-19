import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { LeadService } from "./lead.service";
import { buildCrmScopeFilter, parseCrmDateRange, CRMDateRangePreset } from "@/lib/crm-query";

export interface CrmDashboardOptions {
  datePreset?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  ownerId?: string;
  departmentId?: string;
  scope?: "all" | "my" | "department";
}

export interface CrmCockpitData {
  summary: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
    leadConversionRate: number;
    totalClients: number;
    activeClients: number;
    activeOpportunities: number;
    pipelineValue: number;
    weightedForecast: number;
    wonOpportunities: number;
    wonRevenue: number;
    lostOpportunities: number;
    lostValue: number;
    winRate: number;
    pendingTasksCount: number;
    overdueTasksCount: number;
    upcomingMeetingsCount: number;
    paidRevenueTotal: number;
    invoicedRevenueTotal: number;
  };
  metrics: {
    totalLeads: number;
    newLeads: number;
    convertedLeads: number;
    totalClients: number;
    activeClients: number;
    activeOpportunities: number;
    pipelineValue: number;
    weightedForecast: number;
    wonOpportunities: number;
    wonRevenue: number;
    lostOpportunities: number;
    winRate: number;
    pendingTasksCount: number;
    overdueTasksCount: number;
    upcomingMeetingsCount: number;
  };
  comparison?: {
    leadsChangePct: number | null;
    pipelineChangePct: number | null;
    wonRevenueChangePct: number | null;
    activeClientsChangePct: number | null;
  };
  leadFunnel: {
    stages: Array<{
      status: string;
      label: string;
      count: number;
      percentageOfTotal: number;
    }>;
    conversionRate: number;
  };
  leadSources: Array<{
    source: string;
    label: string;
    count: number;
    percentage: number;
    estimatedValue: number;
  }>;
  stageBreakdown: Record<string, { count: number; value: number; weightedValue: number }>;
  wonLostAnalysis: {
    wonCount: number;
    wonValue: number;
    lostCount: number;
    lostValue: number;
    winRateCountPct: number;
    winRateValuePct: number;
    lossReasons: Array<{ reason: string; count: number }>;
  };
  topOpportunities: Array<{
    id: string;
    name: string;
    value: number;
    stage: string;
    probability: number;
    expectedCloseDate: Date | null;
    client: { id: string; name: string };
    owner?: { id: string; firstName: string; lastName: string } | null;
  }>;
  staleOpportunities: Array<{
    id: string;
    name: string;
    value: number;
    stage: string;
    daysSinceUpdate: number;
    isOverdueClose: boolean;
    client: { id: string; name: string };
    owner?: { id: string; firstName: string; lastName: string } | null;
  }>;
  topClients: Array<{
    id: string;
    name: string;
    code: string;
    tier: string;
    status: string;
    pipelineValue: number;
    paidRevenue: number;
    dealsCount: number;
  }>;
  salesTrend: Array<{
    period: string;
    invoiced: number;
    paid: number;
    dealsWonValue: number;
  }>;
  upcomingMeetings: Array<{
    id: string;
    title: string;
    date: Date;
    location?: string | null;
    meetUrl?: string | null;
    creator: { firstName: string; lastName: string };
  }>;
  pendingTasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate?: Date | null;
    isOverdue: boolean;
    client?: { id: string; name: string } | null;
    assignee?: { firstName: string; lastName: string } | null;
  }>;
  taskStatistics: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    subject: string;
    description?: string | null;
    performedAt: Date;
    performedBy: { firstName: string; lastName: string; designation?: string | null };
    client?: { id: string; name: string } | null;
    lead?: { id: string; firstName: string; lastName: string; companyName: string } | null;
  }>;
  recentClients: Array<{
    id: string;
    name: string;
    code: string;
    industry?: string | null;
    status: string;
    tier: string;
    owner?: { firstName: string; lastName: string } | null;
  }>;
  recentLeads: Array<{
    id: string;
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
    source: string;
    status: string;
    estimatedValue?: number | null;
    owner?: { firstName: string; lastName: string } | null;
  }>;
}

export class CrmDashboardService {
  /**
   * Aggregates real DB data for the CRM Dashboard & Analytics Command Center
   */
  static async getCockpitMetrics(
    user: AuthenticatedUser,
    options: CrmDashboardOptions = {}
  ): Promise<CrmCockpitData> {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const orgId = user.employee.organizationId;
    const now = new Date();

    // 1. Build secure scope filters using centralized query utility
    const leadScope = await buildCrmScopeFilter(user, {
      entityOwnerField: "ownerId",
      requestedScope: options.scope,
      requestedOwnerId: options.ownerId,
    });
    const clientScope = await buildCrmScopeFilter(user, {
      entityOwnerField: "ownerId",
      requestedScope: options.scope,
      requestedOwnerId: options.ownerId,
    });
    const oppScope = await buildCrmScopeFilter(user, {
      entityOwnerField: "ownerId",
      requestedScope: options.scope,
      requestedOwnerId: options.ownerId,
    });
    const taskScope = await buildCrmScopeFilter(user, {
      entityOwnerField: "assigneeId",
      requestedScope: options.scope,
      requestedOwnerId: options.ownerId,
    });

    // 2. Date filtering
    const dateRange = parseCrmDateRange(
      options.datePreset,
      options.startDate,
      options.endDate
    );

    // Lead where clause
    const leadWhere: any = { ...leadScope };
    if (dateRange) {
      leadWhere.createdAt = dateRange;
    }

    // Client where clause
    const clientWhere: any = { ...clientScope };
    if (dateRange) {
      clientWhere.createdAt = dateRange;
    }

    // Opportunity where clause
    const oppWhere: any = { ...oppScope };
    if (dateRange) {
      oppWhere.OR = [
        { createdAt: dateRange },
        { expectedCloseDate: dateRange },
        { actualCloseDate: dateRange },
      ];
    }

    // Activity where clause
    const activityWhere: any = { organizationId: orgId };
    if (options.ownerId) {
      activityWhere.performedById = options.ownerId;
    } else if (!LeadService.isExecutive(user) && user.roleCode !== "DEPARTMENT_HEAD") {
      activityWhere.performedById = user.employee.id;
    }
    if (dateRange) {
      activityWhere.performedAt = dateRange;
    }

    // Task where clause
    const taskWhere: any = { ...taskScope };
    if (dateRange) {
      taskWhere.OR = [
        { createdAt: dateRange },
        { dueDate: dateRange },
      ];
    }

    // Previous period for historical comparison (if date preset provided and not ALL)
    let prevLeadCount: number | null = null;
    let prevWonRevenue: number | null = null;
    let prevPipelineValue: number | null = null;
    let prevActiveClientsCount: number | null = null;

    if (dateRange?.gte && dateRange?.lte) {
      const duration = dateRange.lte.getTime() - dateRange.gte.getTime();
      const prevLte = new Date(dateRange.gte.getTime() - 1);
      const prevGte = new Date(prevLte.getTime() - duration);
      const prevDateRange = { gte: prevGte, lte: prevLte };

      const [prevLeads, prevDeals, prevClients] = await Promise.all([
        db.lead.count({ where: { ...leadScope, createdAt: prevDateRange } }),
        db.opportunity.findMany({
          where: { ...oppScope, actualCloseDate: prevDateRange, stage: "CLOSED_WON" },
          select: { value: true },
        }),
        db.client.count({ where: { ...clientScope, createdAt: prevDateRange, status: "ACTIVE" } }),
      ]);

      prevLeadCount = prevLeads;
      prevWonRevenue = prevDeals.reduce((sum, d) => sum + d.value, 0);
      prevActiveClientsCount = prevClients;
    }

    // 3. Parallel Database Queries across CRM, Finance, Tasks, and Meetings
    const [
      leads,
      clients,
      deals,
      tasks,
      meetings,
      activities,
      invoices,
    ] = await Promise.all([
      db.lead.findMany({
        where: leadWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          source: true,
          status: true,
          estimatedValue: true,
          createdAt: true,
          owner: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.client.findMany({
        where: clientWhere,
        select: {
          id: true,
          name: true,
          code: true,
          industry: true,
          status: true,
          tier: true,
          createdAt: true,
          updatedAt: true,
          owner: { select: { firstName: true, lastName: true } },
          opportunities: { select: { id: true, value: true, stage: true } },
          invoices: {
            where: { status: { not: "CANCELLED" } },
            select: { total: true, paidAmount: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      db.opportunity.findMany({
        where: oppWhere,
        select: {
          id: true,
          name: true,
          value: true,
          stage: true,
          probability: true,
          expectedCloseDate: true,
          actualCloseDate: true,
          lossReason: true,
          createdAt: true,
          updatedAt: true,
          client: { select: { id: true, name: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { value: "desc" },
      }),
      db.task.findMany({
        where: taskWhere,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          dueDate: true,
          client: { select: { id: true, name: true } },
          assignee: { select: { firstName: true, lastName: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
      db.calendarEvent.findMany({
        where: {
          organizationId: orgId,
          endDate: { gte: now },
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          location: true,
          meetUrl: true,
          creator: { select: { firstName: true, lastName: true } },
        },
        orderBy: { startDate: "asc" },
        take: 5,
      }),
      db.crmActivity.findMany({
        where: activityWhere,
        select: {
          id: true,
          type: true,
          subject: true,
          description: true,
          performedAt: true,
          performedBy: { select: { firstName: true, lastName: true, designation: true } },
          client: { select: { id: true, name: true } },
          lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        },
        orderBy: { performedAt: "desc" },
        take: 8,
      }),
      db.invoice.findMany({
        where: {
          organizationId: orgId,
          status: { not: "CANCELLED" },
          ...(dateRange ? { invoiceDate: dateRange } : {}),
        },
        select: {
          id: true,
          total: true,
          paidAmount: true,
          status: true,
          invoiceDate: true,
        },
      }),
    ]);

    // 4. Aggregate Lead Analytics & Funnel
    let newLeads = 0;
    let qualifiedLeads = 0;
    let convertedLeads = 0;
    let contactedLeads = 0;
    let unqualifiedLeads = 0;
    let lostLeads = 0;

    const sourceMap: Record<string, { count: number; value: number }> = {};

    for (const l of leads) {
      if (l.status === "NEW") newLeads++;
      else if (l.status === "CONTACTED") contactedLeads++;
      else if (l.status === "QUALIFIED") qualifiedLeads++;
      else if (l.status === "CONVERTED") convertedLeads++;
      else if (l.status === "UNQUALIFIED") unqualifiedLeads++;
      else if (l.status === "LOST") lostLeads++;

      const src = l.source || "OTHER";
      if (!sourceMap[src]) sourceMap[src] = { count: 0, value: 0 };
      sourceMap[src].count++;
      sourceMap[src].value += l.estimatedValue || 0;
    }

    const totalLeads = leads.length;
    const eligibleForConversion = totalLeads - unqualifiedLeads;
    const leadConversionRate = eligibleForConversion > 0 
      ? Math.round((convertedLeads / eligibleForConversion) * 100) 
      : 0;

    const leadFunnelStages = [
      { status: "NEW", label: "New Inbound", count: newLeads, percentageOfTotal: totalLeads > 0 ? Math.round((newLeads / totalLeads) * 100) : 0 },
      { status: "CONTACTED", label: "Contacted", count: contactedLeads, percentageOfTotal: totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0 },
      { status: "QUALIFIED", label: "Qualified", count: qualifiedLeads, percentageOfTotal: totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0 },
      { status: "CONVERTED", label: "Converted", count: convertedLeads, percentageOfTotal: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0 },
      { status: "LOST", label: "Lost / Dropped", count: lostLeads, percentageOfTotal: totalLeads > 0 ? Math.round((lostLeads / totalLeads) * 100) : 0 },
    ];

    const leadSources = Object.entries(sourceMap).map(([source, val]) => ({
      source,
      label: source.replace(/_/g, " "),
      count: val.count,
      percentage: totalLeads > 0 ? Math.round((val.count / totalLeads) * 100) : 0,
      estimatedValue: val.value,
    })).sort((a, b) => b.count - a.count);

    // 5. Aggregate Client Metrics
    let activeClients = 0;
    for (const c of clients) {
      if (c.status === "ACTIVE") activeClients++;
    }

    // 6. Aggregate Opportunity & Pipeline Metrics
    let activeOpportunities = 0;
    let pipelineValue = 0;
    let weightedForecast = 0;
    let wonOpportunities = 0;
    let wonRevenue = 0;
    let lostOpportunities = 0;
    let lostValue = 0;

    const stageBreakdown: Record<string, { count: number; value: number; weightedValue: number }> = {
      DISCOVERY: { count: 0, value: 0, weightedValue: 0 },
      PROPOSAL: { count: 0, value: 0, weightedValue: 0 },
      NEGOTIATION: { count: 0, value: 0, weightedValue: 0 },
      CLOSED_WON: { count: 0, value: 0, weightedValue: 0 },
      CLOSED_LOST: { count: 0, value: 0, weightedValue: 0 },
    };

    const lossReasonsMap: Record<string, number> = {};
    const staleOpportunities: CrmCockpitData["staleOpportunities"] = [];

    for (const d of deals) {
      const stage = d.stage;
      const weightedVal = (d.value * (d.probability || 0)) / 100;

      if (stageBreakdown[stage]) {
        stageBreakdown[stage].count++;
        stageBreakdown[stage].value += d.value;
        stageBreakdown[stage].weightedValue += weightedVal;
      }

      if (stage === "CLOSED_WON") {
        wonOpportunities++;
        wonRevenue += d.value;
      } else if (stage === "CLOSED_LOST") {
        lostOpportunities++;
        lostValue += d.value;
        const reason = d.lossReason?.trim() || "Unspecified";
        lossReasonsMap[reason] = (lossReasonsMap[reason] || 0) + 1;
      } else {
        // Open deal
        activeOpportunities++;
        pipelineValue += d.value;
        weightedForecast += weightedVal;

        // Check for stale or overdue deals
        const daysSinceUpdate = Math.floor((now.getTime() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        const isOverdueClose = d.expectedCloseDate ? new Date(d.expectedCloseDate) < now : false;

        if (daysSinceUpdate >= 30 || isOverdueClose) {
          staleOpportunities.push({
            id: d.id,
            name: d.name,
            value: d.value,
            stage: d.stage,
            daysSinceUpdate,
            isOverdueClose,
            client: d.client,
            owner: d.owner,
          });
        }
      }
    }

    const totalClosed = wonOpportunities + lostOpportunities;
    const winRate = totalClosed > 0 ? Math.round((wonOpportunities / totalClosed) * 100) : 0;
    const totalClosedValue = wonRevenue + lostValue;
    const winRateValuePct = totalClosedValue > 0 ? Math.round((wonRevenue / totalClosedValue) * 100) : 0;

    const lossReasons = Object.entries(lossReasonsMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // 7. Top Opportunities (top 5 open deals)
    const topOpportunities = deals
      .filter((d) => d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST")
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        name: d.name,
        value: d.value,
        stage: d.stage,
        probability: d.probability,
        expectedCloseDate: d.expectedCloseDate,
        client: d.client,
        owner: d.owner,
      }));

    // 8. Top Clients by Pipeline & Paid Revenue
    const topClients = clients.map((c) => {
      const openDeals = c.opportunities?.filter((o) => o.stage !== "CLOSED_WON" && o.stage !== "CLOSED_LOST") || [];
      const pVal = openDeals.reduce((sum, o) => sum + o.value, 0);
      const paid = c.invoices?.reduce((sum, i) => sum + (i.paidAmount || 0), 0) || 0;

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        tier: c.tier,
        status: c.status,
        pipelineValue: pVal,
        paidRevenue: paid,
        dealsCount: c.opportunities?.length || 0,
      };
    })
    .sort((a, b) => (b.paidRevenue + b.pipelineValue) - (a.paidRevenue + a.pipelineValue))
    .slice(0, 5);

    // 9. Finance Invoiced & Paid Revenue Integration
    let invoicedRevenueTotal = 0;
    let paidRevenueTotal = 0;
    for (const inv of invoices) {
      invoicedRevenueTotal += inv.total || 0;
      paidRevenueTotal += inv.paidAmount || 0;
    }

    // 10. 6-Month Sales & Revenue Trend
    const salesTrendMap: Record<string, { invoiced: number; paid: number; dealsWonValue: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short", year: "numeric" });
      salesTrendMap[key] = { invoiced: 0, paid: 0, dealsWonValue: 0 };
    }

    for (const inv of invoices) {
      const d = new Date(inv.invoiceDate);
      const key = d.toLocaleString("default", { month: "short", year: "numeric" });
      if (salesTrendMap[key]) {
        salesTrendMap[key].invoiced += inv.total || 0;
        salesTrendMap[key].paid += inv.paidAmount || 0;
      }
    }

    for (const deal of deals) {
      if (deal.stage === "CLOSED_WON" && deal.actualCloseDate) {
        const d = new Date(deal.actualCloseDate);
        const key = d.toLocaleString("default", { month: "short", year: "numeric" });
        if (salesTrendMap[key]) {
          salesTrendMap[key].dealsWonValue += deal.value;
        }
      }
    }

    const salesTrend = Object.entries(salesTrendMap).map(([period, values]) => ({
      period,
      invoiced: Math.round(values.invoiced),
      paid: Math.round(values.paid),
      dealsWonValue: Math.round(values.dealsWonValue),
    }));

    // 11. Task Statistics & Overdue Work
    let pendingTasksCount = 0;
    let inProgressTasksCount = 0;
    let completedTasksCount = 0;
    let overdueTasksCount = 0;
    const pendingTasksList = [];

    for (const t of tasks) {
      const isCompleted = t.status === "COMPLETED";
      const isCancelled = t.status === "CANCELLED";
      const isOverdue = t.dueDate ? new Date(t.dueDate) < now && !isCompleted && !isCancelled : false;

      if (t.status === "TODO" || t.status === "BLOCKED") pendingTasksCount++;
      if (t.status === "IN_PROGRESS") inProgressTasksCount++;
      if (isCompleted) completedTasksCount++;
      if (isOverdue) overdueTasksCount++;

      if (!isCompleted && !isCancelled && pendingTasksList.length < 5) {
        pendingTasksList.push({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate,
          isOverdue,
          client: t.client,
          assignee: t.assignee,
        });
      }
    }

    // 12. Period-over-Period Changes
    let leadsChangePct: number | null = null;
    let pipelineChangePct: number | null = null;
    let wonRevenueChangePct: number | null = null;
    let activeClientsChangePct: number | null = null;

    if (prevLeadCount !== null && prevLeadCount > 0) {
      leadsChangePct = Math.round(((totalLeads - prevLeadCount) / prevLeadCount) * 100);
    } else if (prevLeadCount === 0 && totalLeads > 0) {
      leadsChangePct = 100;
    }

    if (prevWonRevenue !== null && prevWonRevenue > 0) {
      wonRevenueChangePct = Math.round(((wonRevenue - prevWonRevenue) / prevWonRevenue) * 100);
    } else if (prevWonRevenue === 0 && wonRevenue > 0) {
      wonRevenueChangePct = 100;
    }

    if (prevActiveClientsCount !== null && prevActiveClientsCount > 0) {
      activeClientsChangePct = Math.round(((activeClients - prevActiveClientsCount) / prevActiveClientsCount) * 100);
    }

    const summaryData = {
      totalLeads,
      newLeads,
      qualifiedLeads,
      convertedLeads,
      leadConversionRate,
      totalClients: clients.length,
      activeClients,
      activeOpportunities,
      pipelineValue,
      weightedForecast: Math.round(weightedForecast),
      wonOpportunities,
      wonRevenue,
      lostOpportunities,
      lostValue,
      winRate,
      pendingTasksCount,
      overdueTasksCount,
      upcomingMeetingsCount: meetings.length,
      paidRevenueTotal,
      invoicedRevenueTotal,
    };

    return {
      summary: summaryData,
      metrics: {
        totalLeads,
        newLeads,
        convertedLeads,
        totalClients: clients.length,
        activeClients,
        activeOpportunities,
        pipelineValue,
        weightedForecast: Math.round(weightedForecast),
        wonOpportunities,
        wonRevenue,
        lostOpportunities,
        winRate,
        pendingTasksCount,
        overdueTasksCount,
        upcomingMeetingsCount: meetings.length,
      },
      comparison: {
        leadsChangePct,
        pipelineChangePct,
        wonRevenueChangePct,
        activeClientsChangePct,
      },
      leadFunnel: {
        stages: leadFunnelStages,
        conversionRate: leadConversionRate,
      },
      leadSources,
      stageBreakdown,
      wonLostAnalysis: {
        wonCount: wonOpportunities,
        wonValue: wonRevenue,
        lostCount: lostOpportunities,
        lostValue,
        winRateCountPct: winRate,
        winRateValuePct,
        lossReasons,
      },
      topOpportunities,
      staleOpportunities: staleOpportunities.slice(0, 5),
      topClients,
      salesTrend,
      upcomingMeetings: meetings.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.startDate,
        location: m.location,
        meetUrl: m.meetUrl,
        creator: m.creator,
      })),
      pendingTasks: pendingTasksList,
      taskStatistics: {
        total: tasks.length,
        pending: pendingTasksCount,
        inProgress: inProgressTasksCount,
        completed: completedTasksCount,
        overdue: overdueTasksCount,
      },
      recentActivities: activities.map((a) => ({
        id: a.id,
        type: a.type,
        subject: a.subject,
        description: a.description,
        performedAt: a.performedAt,
        performedBy: a.performedBy,
        client: a.client,
        lead: a.lead,
      })),
      recentClients: clients.slice(0, 5).map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        industry: c.industry,
        status: c.status,
        tier: c.tier,
        owner: c.owner,
      })),
      recentLeads: leads.slice(0, 5).map((l) => ({
        id: l.id,
        firstName: l.firstName,
        lastName: l.lastName,
        companyName: l.companyName,
        email: l.email,
        source: l.source,
        status: l.status,
        estimatedValue: l.estimatedValue,
        owner: l.owner,
      })),
    };
  }
}
