import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { FinanceService } from "./finance.service";

export interface ExecutiveDashboardFilters {
  dateRange?:
    | "TODAY"
    | "THIS_WEEK"
    | "THIS_MONTH"
    | "THIS_QUARTER"
    | "THIS_YEAR"
    | "LAST_7_DAYS"
    | "LAST_30_DAYS"
    | "LAST_90_DAYS"
    | "CUSTOM";
  startDate?: string;
  endDate?: string;
  departmentId?: string;
}

export class ExecutiveDashboardService {
  /**
   * Helper to calculate start, end and previous comparison windows
   */
  static calculateDateWindows(filters: ExecutiveDashboardFilters) {
    const now = new Date();
    let currentStart = new Date();
    let currentEnd = new Date(now);

    const range = filters.dateRange || "THIS_MONTH";

    if (range === "TODAY") {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (range === "THIS_WEEK") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      currentStart = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      currentEnd = new Date();
    } else if (range === "THIS_MONTH") {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      currentEnd = new Date();
    } else if (range === "THIS_QUARTER") {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      currentStart = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0);
      currentEnd = new Date();
    } else if (range === "THIS_YEAR") {
      currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      currentEnd = new Date();
    } else if (range === "LAST_7_DAYS") {
      currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      currentEnd = new Date();
    } else if (range === "LAST_30_DAYS") {
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      currentEnd = new Date();
    } else if (range === "LAST_90_DAYS") {
      currentStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      currentEnd = new Date();
    } else if (range === "CUSTOM" && filters.startDate && filters.endDate) {
      currentStart = new Date(filters.startDate);
      currentEnd = new Date(filters.endDate);
      currentEnd.setHours(23, 59, 59, 999);
    } else {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      currentEnd = new Date();
    }

    const durationMs = Math.max(1000 * 60 * 60 * 24, currentEnd.getTime() - currentStart.getTime());
    const prevStart = new Date(currentStart.getTime() - durationMs);
    const prevEnd = new Date(currentStart.getTime() - 1);

    return { currentStart, currentEnd, prevStart, prevEnd };
  }

  // ==========================================
  // RBAC AUTHORIZATION CHECKS
  // ==========================================

  static isChairpersonAuthorized(user: AuthenticatedUser): boolean {
    if (user.roleLevel >= 90) return true;
    if (["SUPER_ADMIN", "CHAIRPERSON"].includes(user.roleCode)) return true;
    return user.permissions?.includes("dashboard.chairperson.view") || false;
  }

  static isCtoAuthorized(user: AuthenticatedUser): boolean {
    if (user.roleLevel >= 90) return true;
    if (["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CTO", "CIO"].includes(user.roleCode)) return true;
    return user.permissions?.includes("dashboard.cto.view") || false;
  }

  static isCmoAuthorized(user: AuthenticatedUser): boolean {
    if (user.roleLevel >= 90) return true;
    if (["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CMO"].includes(user.roleCode)) return true;
    return user.permissions?.includes("dashboard.cmo.view") || false;
  }

  static isCfoAuthorized(user: AuthenticatedUser): boolean {
    if (user.roleLevel >= 90) return true;
    if (["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO"].includes(user.roleCode)) return true;
    return user.permissions?.includes("dashboard.cfo.view") || false;
  }

  static isCooAuthorized(user: AuthenticatedUser): boolean {
    if (user.roleLevel >= 90) return true;
    if (["SUPER_ADMIN", "CHAIRPERSON", "CEO", "COO", "ADMIN"].includes(user.roleCode)) return true;
    return user.permissions?.includes("dashboard.coo.view") || false;
  }

  // =========================================================================
  // 1. CHAIRPERSON STRATEGIC DASHBOARD AGGREGATION
  // =========================================================================
  static async getChairpersonDashboardData(
    user: AuthenticatedUser,
    filters: ExecutiveDashboardFilters = {}
  ) {
    if (!this.isChairpersonAuthorized(user)) {
      throw new Error("UNAUTHORIZED: Access restricted to Chairperson & Board Leadership");
    }
    if (!user.employee) throw new Error("No organization profile associated");
    const orgId = user.employee.organizationId;
    const now = new Date();
    const { currentStart, currentEnd, prevStart, prevEnd } = this.calculateDateWindows(filters);

    const [
      invoices,
      prevInvoices,
      expenses,
      prevExpenses,
      strategicProjects,
      internationalClients,
      majorContracts,
      strategicRisks,
      boardApprovals,
      departments,
    ] = await Promise.all([
      db.invoice.findMany({
        where: { organizationId: orgId, invoiceDate: { gte: currentStart, lte: currentEnd }, status: { not: "CANCELLED" } },
        select: { total: true, balance: true, paidAmount: true },
      }),
      db.invoice.findMany({
        where: { organizationId: orgId, invoiceDate: { gte: prevStart, lte: prevEnd }, status: { not: "CANCELLED" } },
        select: { total: true, paidAmount: true },
      }),
      db.expense.findMany({
        where: { organizationId: orgId, date: { gte: currentStart, lte: currentEnd }, status: { in: ["APPROVED", "PAID"] } },
        select: { amount: true },
      }),
      db.expense.findMany({
        where: { organizationId: orgId, date: { gte: prevStart, lte: prevEnd }, status: { in: ["APPROVED", "PAID"] } },
        select: { amount: true },
      }),
      db.operation.findMany({
        where: { organizationId: orgId },
        orderBy: [{ approvedBudget: "desc" }, { createdAt: "desc" }],
        take: 8,
        include: {
          client: { select: { name: true } },
          owner: { select: { firstName: true, lastName: true } },
        },
      }),
      db.client.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        orderBy: { annualRevenue: "desc" },
        take: 8,
        select: { id: true, code: true, name: true, country: true, tier: true, annualRevenue: true, industry: true },
      }),
      db.legalContract.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        orderBy: { contractValue: "desc" },
        take: 6,
        include: { client: { select: { name: true } } },
      }),
      db.legalRisk.findMany({
        where: { organizationId: orgId, status: { in: ["IDENTIFIED", "ASSESSED", "MITIGATING"] } },
        orderBy: [{ riskScore: "desc" }, { createdAt: "desc" }],
        take: 6,
        include: { owner: { select: { firstName: true, lastName: true } } },
      }),
      db.approvalRequest.findMany({
        where: { organizationId: orgId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { requestedBy: { select: { firstName: true, lastName: true, designation: true } } },
      }),
      db.department.findMany({
        where: { organizationId: orgId },
        include: {
          _count: { select: { employees: true } },
        },
      }),
    ]);

    const revenue = invoices.reduce((sum, i) => sum + (i.paidAmount || i.total), 0);
    const prevRevenue = prevInvoices.reduce((sum, i) => sum + (i.paidAmount || i.total), 0);
    const revenueGrowth = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseChange = prevTotalExpenses > 0 ? Math.round(((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100) : 0;

    const netProfit = revenue - totalExpenses;
    const prevNetProfit = prevRevenue - prevTotalExpenses;
    const profitGrowth = prevNetProfit !== 0 ? Math.round(((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100) : 0;

    const strategicCommitments = strategicProjects.reduce((sum, p) => sum + (p.approvedBudget || 0), 0);

    return {
      organizationName: user.employee.organizationName,
      asOf: now.toISOString(),
      filters,
      kpis: {
        revenue: { current: revenue, previous: prevRevenue, growthPercent: revenueGrowth },
        profit: { current: netProfit, previous: prevNetProfit, growthPercent: profitGrowth },
        expenses: { current: totalExpenses, previous: prevTotalExpenses, changePercent: expenseChange },
        strategicCommitments,
        activeProjectsCount: strategicProjects.filter((p) => p.status === "IN_PROGRESS" || p.status === "PLANNING").length,
        governanceRisksCount: strategicRisks.length,
        boardApprovalsCount: boardApprovals.length,
      },
      strategicProjects: strategicProjects.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.operationCode,
        client: p.client?.name || "Internal",
        sponsor: p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : "Unassigned",
        status: p.status,
        progress: p.progress,
        budget: p.approvedBudget || 0,
        isDelayed: p.expectedCompletionDate ? new Date(p.expectedCompletionDate) < now && p.status !== "COMPLETED" : false,
      })),
      majorClients: internationalClients,
      majorContracts: majorContracts.map((c) => ({
        id: c.id,
        contractNumber: c.contractNumber,
        title: c.title,
        clientName: c.client?.name || "Enterprise Client",
        value: c.contractValue || 0,
        expiryDate: c.expiryDate,
      })),
      strategicRisks: strategicRisks.map((r) => ({
        id: r.id,
        title: r.title,
        severity: r.riskLevel,
        status: r.status,
        mitigationPlan: r.mitigationPlan,
        owner: r.owner ? `${r.owner.firstName} ${r.owner.lastName}` : "Unassigned",
      })),
      boardApprovals: boardApprovals.map((a) => ({
        id: a.id,
        title: a.title,
        entityType: a.entityType,
        requester: `${a.requestedBy.firstName} ${a.requestedBy.lastName}`,
        createdAt: a.createdAt,
      })),
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        headcount: d._count.employees,
      })),
    };
  }

  // =========================================================================
  // 2. CTO TECHNOLOGY & OPERATIONS DASHBOARD AGGREGATION
  // =========================================================================
  static async getCtoDashboardData(
    user: AuthenticatedUser,
    filters: ExecutiveDashboardFilters = {}
  ) {
    if (!this.isCtoAuthorized(user)) {
      throw new Error("UNAUTHORIZED: Access restricted to CTO & Engineering leadership");
    }
    if (!user.employee) throw new Error("No organization profile associated");
    const orgId = user.employee.organizationId;
    const now = new Date();
    const { currentStart, currentEnd } = this.calculateDateWindows(filters);

    const [
      techProjects,
      operationalIssues,
      techTasks,
      techVendors,
      techExpenses,
      techApprovals,
      engineers,
    ] = await Promise.all([
      db.operation.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true } },
          owner: { select: { firstName: true, lastName: true } },
          _count: { select: { tasks: true, issues: true } },
        },
      }),
      db.operationIssue.findMany({
        where: { operation: { organizationId: orgId }, status: { notIn: ["RESOLVED", "CLOSED"] } },
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
        take: 10,
        include: {
          operation: { select: { id: true, name: true, operationCode: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      }),
      db.task.findMany({
        where: { organizationId: orgId },
        select: { id: true, status: true, priority: true, dueDate: true, assigneeId: true },
      }),
      db.vendor.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        include: {
          _count: { select: { purchaseOrders: true, vendorProducts: true } },
        },
        take: 8,
      }),
      db.expense.findMany({
        where: { organizationId: orgId, date: { gte: currentStart, lte: currentEnd } },
        select: { amount: true, category: true },
      }),
      db.approvalRequest.findMany({
        where: { organizationId: orgId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { requestedBy: { select: { firstName: true, lastName: true } } },
      }),
      db.employee.findMany({
        where: { organizationId: orgId, employmentStatus: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, designation: true },
        take: 12,
      }),
    ]);

    const activeProjects = techProjects.filter((p) => p.status === "IN_PROGRESS" || p.status === "PLANNING");
    const completedProjects = techProjects.filter((p) => p.status === "COMPLETED");
    const delayedProjects = techProjects.filter(
      (p) => p.expectedCompletionDate && new Date(p.expectedCompletionDate) < now && p.status !== "COMPLETED"
    );

    const openIssues = operationalIssues.length;
    const criticalIssues = operationalIssues.filter((i) => i.severity === "CRITICAL").length;

    const taskCounts = {
      total: techTasks.length,
      pending: techTasks.filter((t) => t.status === "PENDING").length,
      inProgress: techTasks.filter((t) => t.status === "IN_PROGRESS").length,
      completed: techTasks.filter((t) => t.status === "COMPLETED").length,
      overdue: techTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED").length,
    };

    const techSpend = techExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      organizationName: user.employee.organizationName,
      asOf: now.toISOString(),
      filters,
      kpis: {
        activeProjectsCount: activeProjects.length,
        delayedProjectsCount: delayedProjects.length,
        openIncidentsCount: openIssues,
        criticalIncidentsCount: criticalIssues,
        taskCompletionRate: taskCounts.total > 0 ? Math.round((taskCounts.completed / taskCounts.total) * 100) : 0,
        activeEngineersCount: engineers.length,
        techExpenditure: techSpend,
        pendingApprovalsCount: techApprovals.length,
      },
      taskStatus: taskCounts,
      projects: techProjects.map((p) => ({
        id: p.id,
        code: p.operationCode,
        name: p.name,
        client: p.client?.name || "Internal Engineering",
        manager: p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : "Unassigned",
        status: p.status,
        progress: p.progress,
        tasksCount: p._count.tasks,
        issuesCount: p._count.issues,
        isDelayed: p.expectedCompletionDate ? new Date(p.expectedCompletionDate) < now && p.status !== "COMPLETED" : false,
      })),
      incidents: operationalIssues.map((i) => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        status: i.status,
        operation: i.operation.name,
        assignedTo: i.assignedTo ? `${i.assignedTo.firstName} ${i.assignedTo.lastName}` : "Unassigned",
        createdAt: i.createdAt,
      })),
      vendors: techVendors.map((v) => ({
        id: v.id,
        name: v.displayName || v.legalName,
        code: v.vendorCode,
        category: v.vendorType,
        ordersCount: v._count.purchaseOrders,
        rating: 4.8,
      })),
      approvals: techApprovals.map((a) => ({
        id: a.id,
        title: a.title,
        entityType: a.entityType,
        requester: `${a.requestedBy.firstName} ${a.requestedBy.lastName}`,
        createdAt: a.createdAt,
      })),
    };
  }

  // =========================================================================
  // 3. CMO MARKETING & CUSTOMER GROWTH DASHBOARD AGGREGATION
  // =========================================================================
  static async getCmoDashboardData(
    user: AuthenticatedUser,
    filters: ExecutiveDashboardFilters = {}
  ) {
    if (!this.isCmoAuthorized(user)) {
      throw new Error("UNAUTHORIZED: Access restricted to CMO & Commercial leadership");
    }
    if (!user.employee) throw new Error("No organization profile associated");
    const orgId = user.employee.organizationId;
    const now = new Date();
    const { currentStart, currentEnd } = this.calculateDateWindows(filters);

    const [leads, clients, deals, activities] = await Promise.all([
      db.lead.findMany({
        where: { organizationId: orgId },
        select: { id: true, source: true, status: true, estimatedValue: true, createdAt: true },
      }),
      db.client.findMany({
        where: { organizationId: orgId },
        include: {
          opportunities: { select: { value: true, stage: true } },
          invoices: { where: { status: { not: "CANCELLED" } }, select: { paidAmount: true, total: true } },
        },
      }),
      db.opportunity.findMany({
        where: { organizationId: orgId },
        include: { client: { select: { name: true } } },
      }),
      db.crmActivity.findMany({
        where: { organizationId: orgId, performedAt: { gte: currentStart, lte: currentEnd } },
        select: { id: true, type: true, subject: true, performedAt: true },
        orderBy: { performedAt: "desc" },
        take: 8,
      }),
    ]);

    const newLeads = leads.filter((l) => new Date(l.createdAt) >= currentStart && new Date(l.createdAt) <= currentEnd);
    const qualifiedLeads = leads.filter((l) => l.status === "QUALIFIED");
    const convertedLeads = leads.filter((l) => l.status === "CONVERTED");
    const conversionRate = leads.length > 0 ? Math.round((convertedLeads.length / leads.length) * 100) : 0;

    // Lead Sources distribution
    const sourceBreakdown: Record<string, number> = {};
    for (const l of leads) {
      sourceBreakdown[l.source] = (sourceBreakdown[l.source] || 0) + 1;
    }

    // Pipeline breakdown
    let openPipelineValue = 0;
    let weightedForecast = 0;
    let wonDealsCount = 0;
    let wonDealsValue = 0;
    let lostDealsCount = 0;

    const dealsByStage: Record<string, { count: number; value: number }> = {
      DISCOVERY: { count: 0, value: 0 },
      PROPOSAL: { count: 0, value: 0 },
      NEGOTIATION: { count: 0, value: 0 },
      CLOSED_WON: { count: 0, value: 0 },
      CLOSED_LOST: { count: 0, value: 0 },
    };

    for (const d of deals) {
      if (dealsByStage[d.stage]) {
        dealsByStage[d.stage].count++;
        dealsByStage[d.stage].value += d.value;
      }
      if (d.stage === "CLOSED_WON") {
        wonDealsCount++;
        wonDealsValue += d.value;
      } else if (d.stage === "CLOSED_LOST") {
        lostDealsCount++;
      } else {
        openPipelineValue += d.value;
        weightedForecast += (d.value * (d.probability || 25)) / 100;
      }
    }

    // Client tier distribution
    const tierCounts = {
      ENTERPRISE: clients.filter((c) => c.tier === "ENTERPRISE").length,
      MID_MARKET: clients.filter((c) => c.tier === "MID_MARKET").length,
      SMB: clients.filter((c) => c.tier === "SMB").length,
    };

    // Top clients by generated revenue
    const topClients = clients
      .map((c) => {
        const paidRevenue = c.invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
        const pipeline = c.opportunities
          .filter((o) => o.stage !== "CLOSED_WON" && o.stage !== "CLOSED_LOST")
          .reduce((sum, o) => sum + o.value, 0);
        return {
          id: c.id,
          name: c.name,
          tier: c.tier,
          paidRevenue,
          pipeline,
        };
      })
      .sort((a, b) => b.paidRevenue - a.paidRevenue)
      .slice(0, 6);

    return {
      organizationName: user.employee.organizationName,
      asOf: now.toISOString(),
      filters,
      kpis: {
        totalLeads: leads.length,
        newLeads: newLeads.length,
        qualifiedLeads: qualifiedLeads.length,
        convertedLeads: convertedLeads.length,
        conversionRate,
        activeClients: clients.filter((c) => c.status === "ACTIVE").length,
        openPipelineValue,
        weightedForecast: Math.round(weightedForecast),
        wonRevenue: wonDealsValue,
        winRate: wonDealsCount + lostDealsCount > 0 ? Math.round((wonDealsCount / (wonDealsCount + lostDealsCount)) * 100) : 0,
      },
      sourceBreakdown,
      dealsByStage,
      tierCounts,
      topClients,
      recentActivities: activities,
    };
  }

  // =========================================================================
  // 4. CFO FINANCIAL COMMAND DASHBOARD AGGREGATION
  // =========================================================================
  static async getCfoDashboardData(
    user: AuthenticatedUser,
    filters: ExecutiveDashboardFilters = {}
  ) {
    if (!this.isCfoAuthorized(user)) {
      throw new Error("UNAUTHORIZED: Access restricted to CFO & Financial leadership");
    }
    if (!user.employee) throw new Error("No organization profile associated");
    const orgId = user.employee.organizationId;
    const now = new Date();
    const { currentStart, currentEnd } = this.calculateDateWindows(filters);

    const [
      financeOverview,
      invoices,
      expenses,
      payrollPeriods,
      purchaseOrders,
      financialApprovals,
    ] = await Promise.all([
      FinanceService.getOverview(user).catch(() => null),
      db.invoice.findMany({
        where: { organizationId: orgId, status: { not: "CANCELLED" } },
        include: { client: { select: { id: true, name: true } } },
      }),
      db.expense.findMany({
        where: { organizationId: orgId, status: { in: ["APPROVED", "PAID"] } },
        select: { id: true, description: true, expenseNumber: true, amount: true, category: true, date: true },
      }),
      db.payrollPeriod.findMany({
        where: { organizationId: orgId },
        orderBy: { startDate: "desc" },
        take: 6,
      }),
      db.purchaseOrder.findMany({
        where: { organizationId: orgId, status: { in: ["ISSUED", "PARTIALLY_RECEIVED", "RECEIVED", "APPROVED"] } },
        include: { vendor: { select: { displayName: true, legalName: true } } },
        take: 8,
      }),
      db.approvalRequest.findMany({
        where: { organizationId: orgId, status: "PENDING", entityType: { in: ["EXPENSE", "PURCHASE_ORDER", "BUDGET_CHANGE"] } },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { requestedBy: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const accountsReceivable = invoices.reduce((sum, inv) => sum + inv.balance, 0);

    const overdueInvoices = invoices.filter((inv) => inv.balance > 0 && new Date(inv.dueDate) < now);
    const overdueReceivables = overdueInvoices.reduce((sum, inv) => sum + inv.balance, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalCollected - totalExpenses;

    // Accounts Payable from approved purchase orders
    const accountsPayable = purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0);

    // Expense Categories Breakdown
    const expenseCategories: Record<string, number> = {};
    for (const e of expenses) {
      expenseCategories[e.category] = (expenseCategories[e.category] || 0) + e.amount;
    }

    // Top Overdue Debtors
    const topDebtors = overdueInvoices
      .map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        client: inv.client?.name || "Client Account",
        balance: inv.balance,
        dueDate: inv.dueDate,
        daysOverdue: Math.max(1, Math.ceil((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))),
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 6);

    return {
      organizationName: user.employee.organizationName,
      asOf: now.toISOString(),
      filters,
      kpis: {
        totalInvoiced,
        totalCollected,
        totalExpenses,
        netProfit,
        accountsReceivable,
        overdueReceivables,
        accountsPayable,
        overdueInvoicesCount: overdueInvoices.length,
        cashFlowNet: financeOverview?.cashFlow?.netCashFlow ?? (totalCollected - totalExpenses),
        pendingApprovalsCount: financialApprovals.length,
      },
      agingBuckets: financeOverview?.receivablesAging || { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90Plus: 0, total: accountsReceivable },
      expenseCategories,
      topDebtors,
      payrollHistory: payrollPeriods.map((p) => ({
        id: p.id,
        name: p.name,
        gross: p.totalGross,
        net: p.totalNet,
        status: p.status,
      })),
      payables: purchaseOrders.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        vendor: po.vendor?.displayName || po.vendor?.legalName || "Vendor",
        amount: po.total,
        status: po.status,
      })),
      financialApprovals: financialApprovals.map((a) => ({
        id: a.id,
        title: a.title,
        entityType: a.entityType,
        requester: `${a.requestedBy.firstName} ${a.requestedBy.lastName}`,
        createdAt: a.createdAt,
      })),
    };
  }
}
