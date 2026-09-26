import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { FinanceService } from "./finance.service";
import { InventoryService } from "./inventory.service";
import { LegalDashboardService } from "./legal-dashboard.service";

export interface CeoDashboardFilters {
  dateRange?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "CUSTOM";
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  forceRefresh?: boolean;
}

interface CachedExecutiveDashboard {
  data: any;
  cachedAt: number;
}
const executiveDashboardCache = new Map<string, CachedExecutiveDashboard>();
const inFlightDashboardPromises = new Map<string, Promise<any>>();
const CEO_DASHBOARD_CACHE_TTL_MS = 60 * 1000; // 60 seconds fresh TTL

export function invalidateCeoDashboardCache(organizationId?: string) {
  inFlightDashboardPromises.clear();
  if (organizationId) {
    for (const key of executiveDashboardCache.keys()) {
      if (key.startsWith(`${organizationId}:`)) {
        executiveDashboardCache.delete(key);
      }
    }
  } else {
    executiveDashboardCache.clear();
  }
}

export class CeoDashboardService {
  /**
   * Evaluates if user possesses executive CEO dashboard view authorization.
   */
  static isAuthorized(user: AuthenticatedUser): boolean {
    if (user.roleLevel >= 90) return true;
    if (["SUPER_ADMIN", "CHAIRPERSON", "CEO"].includes(user.roleCode)) return true;
    return user.permissions?.includes("dashboard.ceo.view") || false;
  }

  /**
   * Helper to calculate start, end and previous period intervals
   */
  private static calculateDateWindows(filters: CeoDashboardFilters) {
    const now = new Date();
    let currentStart = new Date();
    let currentEnd = new Date(now);

    const range = filters.dateRange || "THIS_MONTH";

    if (range === "TODAY") {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (range === "THIS_WEEK") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      currentStart = new Date(now.setDate(diff));
      currentStart.setHours(0, 0, 0, 0);
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

  /**
   * Main aggregator for CEO Executive Dashboard
   */
  static async getExecutiveDashboardData(user: AuthenticatedUser, filters: CeoDashboardFilters = {}) {
    if (!this.isAuthorized(user)) {
      throw new Error("UNAUTHORIZED: Access restricted to executive leadership (CEO/Chairperson/Super Admin)");
    }

    const orgId = user.activeCompany?.id || user.employee?.organizationId;
    if (!orgId) {
      throw new Error("User has no associated enterprise organization profile");
    }
    const now = new Date();
    const { currentStart, currentEnd, prevStart, prevEnd } = this.calculateDateWindows(filters);

    // Fast in-memory telemetry cache check
    const cacheKey = `${orgId}:${filters.dateRange || "THIS_MONTH"}:${filters.startDate || ""}:${filters.endDate || ""}:${filters.departmentId || ""}`;
    if (!filters.forceRefresh) {
      const cached = executiveDashboardCache.get(cacheKey);
      if (cached && now.getTime() - cached.cachedAt < CEO_DASHBOARD_CACHE_TTL_MS) {
        return cached.data;
      }
      const existingPromise = inFlightDashboardPromises.get(cacheKey);
      if (existingPromise) {
        return existingPromise;
      }
    }

    const loadPromise = (async () => {
      try {

    // =========================================================================
    // HIGH CONCURRENCY EXECUTION: ALL DATASETS LOADED IN PARALLEL
    // =========================================================================
    const [
      // 1. Finance
      financeOverview,
      currInvoices,
      prevInvoices,
      currExpenses,
      prevExpenses,
      openReceivables,
      // 2. CRM & Sales
      allDeals,
      allClients,
      allLeads,
      // 3. Operations & Projects
      operations,
      opIssues,
      // 4. Department Performance
      departments,
      // 5. Workforce & HR
      employees,
      // 6. Inventory & Procurement
      inventoryKpis,
      purchaseOrders,
      vendors,
      // 7. Legal & Compliance
      legalDashboard,
      expiringContractsList,
      activeCasesList,
      criticalComplianceList,
      // 8. CEO Approvals
      pendingApprovals,
      // 9. Activity Timeline
      recentAuditLogs,
      // 10. Upcoming Corporate Events
      upcomingCalendarEvents,
      upcomingContractDeadlines,
      upcomingComplianceDeadlines,
    ] = await Promise.all([
      // 1. Finance
      FinanceService.getOverview(user, filters.forceRefresh).catch((err) => {
        console.error("[CEO Dashboard] Finance overview aggregation error:", err);
        return null;
      }),
      db.invoice.findMany({
        where: {
          organizationId: orgId,
          invoiceDate: { gte: currentStart, lte: currentEnd },
          status: { not: "CANCELLED" },
        },
        select: { total: true, balance: true, paidAmount: true },
      }),
      db.invoice.findMany({
        where: {
          organizationId: orgId,
          invoiceDate: { gte: prevStart, lte: prevEnd },
          status: { not: "CANCELLED" },
        },
        select: { total: true, balance: true, paidAmount: true },
      }),
      db.expense.findMany({
        where: {
          organizationId: orgId,
          date: { gte: currentStart, lte: currentEnd },
          status: { in: ["APPROVED", "PAID"] },
        },
        select: { amount: true },
      }),
      db.expense.findMany({
        where: {
          organizationId: orgId,
          date: { gte: prevStart, lte: prevEnd },
          status: { in: ["APPROVED", "PAID"] },
        },
        select: { amount: true },
      }),
      db.invoice.findMany({
        where: {
          organizationId: orgId,
          balance: { gt: 0 },
          status: { not: "CANCELLED" },
        },
        select: { id: true, invoiceNumber: true, balance: true, dueDate: true, client: { select: { id: true, name: true } } },
      }),
      // 2. CRM & Sales
      db.opportunity.findMany({
        where: { organizationId: orgId },
        include: { client: { select: { id: true, name: true } } },
      }),
      db.client.findMany({
        where: { organizationId: orgId },
        include: {
          opportunities: { select: { id: true, value: true, stage: true } },
          operations: { select: { id: true, status: true, progress: true } },
          operationIssues: { where: { status: { notIn: ["RESOLVED", "CLOSED"] } }, select: { id: true, severity: true } },
          invoices: { where: { status: { not: "CANCELLED" } }, select: { total: true, balance: true } },
          legalContracts: { where: { status: "ACTIVE" }, select: { id: true, status: true, expiryDate: true } },
        },
      }),
      db.lead.findMany({
        where: { organizationId: orgId },
        select: { id: true, status: true, estimatedValue: true, createdAt: true },
      }),
      // 3. Operations & Projects
      db.operation.findMany({
        where: { organizationId: orgId },
        include: {
          client: { select: { id: true, name: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true } },
          tasks: { select: { id: true, status: true } },
        },
      }),
      db.operationIssue.findMany({
        where: { organizationId: orgId, status: { notIn: ["RESOLVED", "CLOSED"] } },
        include: {
          operation: { select: { id: true, name: true, operationCode: true } },
          reportedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      // 4. Department Performance
      db.department.findMany({
        where: { organizationId: orgId },
        include: {
          employees: { select: { id: true, employmentStatus: true } },
          tasks: { select: { id: true, status: true } },
          operations: { select: { id: true, status: true, approvedBudget: true, actualCost: true } },
        },
      }),
      // 5. Workforce & HR
      db.employee.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          employmentStatus: true,
          hireDate: true,
          departmentId: true,
          department: { select: { name: true } },
          operationAssignments: { select: { id: true } },
          assignedTasks: { where: { status: { not: "COMPLETED" } }, select: { id: true } },
        },
      }),
      // 6. Inventory & Procurement
      InventoryService.getOverviewKpis(user, filters.forceRefresh).catch((err) => {
        console.error("[CEO Dashboard] Inventory KPIs aggregation error:", err);
        return null;
      }),
      db.purchaseOrder.findMany({
        where: { organizationId: orgId },
        include: {
          vendor: { select: { id: true, displayName: true } },
        },
      }),
      db.vendor.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        select: { id: true, displayName: true },
      }),
      // 7. Legal & Compliance
      LegalDashboardService.getExecutiveDashboard(user, filters.forceRefresh).catch((err) => {
        console.error("[CEO Dashboard] Legal dashboard aggregation error:", err);
        return null;
      }),
      db.legalContract.findMany({
        where: {
          organizationId: orgId,
          status: { in: ["ACTIVE", "EXPIRING_SOON"] },
          expiryDate: { gte: now, lte: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true, contractNumber: true, title: true, contractValue: true, expiryDate: true, status: true, legalOwner: { select: { firstName: true, lastName: true } } },
        take: 5,
        orderBy: { expiryDate: "asc" },
      }),
      db.legalCase.findMany({
        where: {
          organizationId: orgId,
          status: { in: ["OPEN", "IN_PROGRESS", "TRIAL", "APPEAL"] },
        },
        select: { id: true, caseNumber: true, title: true, estimatedFinancialExposure: true, priority: true, status: true },
        take: 5,
        orderBy: { estimatedFinancialExposure: "desc" },
      }),
      db.legalCompliance.findMany({
        where: {
          organizationId: orgId,
          OR: [{ status: "NON_COMPLIANT" }, { nextDueDate: { lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) } }],
        },
        select: { id: true, title: true, regulation: true, riskLevel: true, status: true, nextDueDate: true },
        take: 5,
        orderBy: { nextDueDate: "asc" },
      }),
      // 8. CEO Approvals
      db.approvalRequest.findMany({
        where: {
          organizationId: orgId,
          status: "PENDING",
        },
        include: {
          requestedBy: { select: { id: true, firstName: true, lastName: true, designation: true } },
          operation: { select: { id: true, name: true, operationCode: true } },
          contract: { select: { id: true, title: true, contractNumber: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      // 9. Activity Timeline
      db.auditLog.findMany({
        where: {
          actor: {
            employee: {
              organizationId: orgId,
            },
          },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: {
              email: true,
              role: { select: { name: true } },
              employee: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      // 10. Upcoming Corporate Events & Deadlines
      db.calendarEvent.findMany({
        where: {
          organizationId: orgId,
          startDate: { gte: now, lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) },
        },
        take: 5,
        orderBy: { startDate: "asc" },
      }),
      db.legalContract.findMany({
        where: {
          organizationId: orgId,
          expiryDate: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true, title: true, expiryDate: true },
        take: 5,
        orderBy: { expiryDate: "asc" },
      }),
      db.legalCompliance.findMany({
        where: {
          organizationId: orgId,
          nextDueDate: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true, title: true, nextDueDate: true },
        take: 5,
        orderBy: { nextDueDate: "asc" },
      }),
    ]);

    // ==========================================
    // 1. FINANCIAL PERFORMANCE & REVENUE METRICS
    // ==========================================
    const currentRevenue = currInvoices.reduce((acc, inv) => acc + (inv.paidAmount || inv.total), 0);
    const previousRevenue = prevInvoices.reduce((acc, inv) => acc + (inv.paidAmount || inv.total), 0);
    const revenueChange = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0;

    const currentExpenses = currExpenses.reduce((acc, e) => acc + e.amount, 0);
    const previousExpenses = prevExpenses.reduce((acc, e) => acc + e.amount, 0);
    const expensesChange = previousExpenses > 0 ? Math.round(((currentExpenses - previousExpenses) / previousExpenses) * 100) : 0;

    const currentNetProfit = currentRevenue - currentExpenses;
    const previousNetProfit = previousRevenue - previousExpenses;
    const netProfitChange = previousNetProfit !== 0 ? Math.round(((currentNetProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100) : 0;

    const totalReceivables = openReceivables.reduce((acc, inv) => acc + inv.balance, 0);
    const overdueInvoices = openReceivables.filter((inv) => new Date(inv.dueDate) < now);
    const overdueReceivables = overdueInvoices.reduce((acc, inv) => acc + inv.balance, 0);

    const cashPosition = financeOverview?.cashFlow?.netCashFlow ?? (currentRevenue - currentExpenses);

    // ==========================================
    // 2. CRM & SALES PIPELINE METRICS
    // ==========================================
    const newLeadsCount = allLeads.filter((l) => new Date(l.createdAt) >= currentStart && new Date(l.createdAt) <= currentEnd).length;
    let wonDealsCount = 0;
    let wonDealsValue = 0;
    let lostDealsCount = 0;
    let openDealsCount = 0;
    let pipelineValue = 0;

    const funnelStages = {
      LEAD: { count: allLeads.length, value: allLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0) },
      DISCOVERY: { count: 0, value: 0 },
      PROPOSAL: { count: 0, value: 0 },
      NEGOTIATION: { count: 0, value: 0 },
      CLOSED_WON: { count: 0, value: 0 },
      CLOSED_LOST: { count: 0, value: 0 },
    };

    for (const d of allDeals) {
      if (d.stage === "CLOSED_WON") {
        wonDealsCount++;
        wonDealsValue += d.value;
        funnelStages.CLOSED_WON.count++;
        funnelStages.CLOSED_WON.value += d.value;
      } else if (d.stage === "CLOSED_LOST") {
        lostDealsCount++;
        funnelStages.CLOSED_LOST.count++;
        funnelStages.CLOSED_LOST.value += d.value;
      } else {
        openDealsCount++;
        pipelineValue += d.value;
        if (d.stage === "DISCOVERY") {
          funnelStages.DISCOVERY.count++;
          funnelStages.DISCOVERY.value += d.value;
        } else if (d.stage === "PROPOSAL") {
          funnelStages.PROPOSAL.count++;
          funnelStages.PROPOSAL.value += d.value;
        } else if (d.stage === "NEGOTIATION") {
          funnelStages.NEGOTIATION.count++;
          funnelStages.NEGOTIATION.value += d.value;
        }
      }
    }

    const closedCount = wonDealsCount + lostDealsCount;
    const conversionRate = closedCount > 0 ? Math.round((wonDealsCount / closedCount) * 100) : 0;

    // Top Customers by Invoiced Revenue
    const topCustomers = allClients
      .map((c) => {
        const totalRev = c.invoices.reduce((acc, i) => acc + (i.total - i.balance), 0);
        const activeDeals = c.opportunities.filter((o) => !["CLOSED_WON", "CLOSED_LOST"].includes(o.stage)).length;
        return {
          id: c.id,
          name: c.name,
          tier: c.tier,
          revenue: totalRev,
          activeDeals,
          activeOperations: c.operations.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status)).length,
          openIssues: c.operationIssues.length,
          outstandingBalance: c.invoices.reduce((acc, i) => acc + i.balance, 0),
          activeContracts: c.legalContracts.length,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ==========================================
    // 3. CUSTOMER HEALTH MATRIX
    // ==========================================
    const totalCustomers = allClients.length;
    const newCustomers = allClients.filter((c) => new Date(c.createdAt) >= currentStart).length;
    const activeCustomers = allClients.filter((c) => c.status === "ACTIVE").length;
    const inactiveCustomers = allClients.filter((c) => ["INACTIVE", "CHURNED"].includes(c.status)).length;
    const customersWithOpenIssues = allClients.filter((c) => c.operationIssues.length > 0).length;
    const customersWithOverduePayments = allClients.filter((c) => c.invoices.some((i) => i.balance > 0)).length;
    const customersWithUpcomingRenewals = allClients.filter((c) =>
      c.legalContracts.some((lc) => lc.expiryDate && new Date(lc.expiryDate) > now && new Date(lc.expiryDate) <= new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000))
    ).length;

    // ==========================================
    // 4. OPERATIONS & PROJECTS OVERVIEW
    // ==========================================
    const activeOperations = operations.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status));
    const completedOperations = operations.filter((o) => o.status === "COMPLETED");
    const delayedOperationsList = operations
      .filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status) && new Date(o.expectedCompletionDate) < now)
      .map((o) => {
        const diffMs = now.getTime() - new Date(o.expectedCompletionDate).getTime();
        const daysDelayed = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        return {
          id: o.id,
          name: o.name,
          operationCode: o.operationCode,
          clientName: o.client?.name || "Internal Enterprise",
          clientId: o.client?.id,
          ownerName: o.owner ? `${o.owner.firstName} ${o.owner.lastName}` : "Unassigned",
          progress: o.progress || 0,
          expectedCompletionDate: o.expectedCompletionDate,
          daysDelayed,
          priority: o.priority,
          riskLevel: o.riskLevel,
          status: o.status,
        };
      })
      .sort((a, b) => b.daysDelayed - a.daysDelayed);

    const operationsStatusCounts = {
      PLANNING: operations.filter((o) => o.status === "PLANNING").length,
      SCHEDULED: operations.filter((o) => o.status === "SCHEDULED").length,
      IN_PROGRESS: operations.filter((o) => o.status === "IN_PROGRESS").length,
      ON_HOLD: operations.filter((o) => o.status === "ON_HOLD").length,
      COMPLETED: completedOperations.length,
      DELAYED: delayedOperationsList.length,
    };

    // ==========================================
    // 5. DEPARTMENT PERFORMANCE BREAKDOWN
    // ==========================================
    const departmentOverview = departments.map((d) => {
      const activeEmps = d.employees.filter((e) => e.employmentStatus === "ACTIVE").length;
      const activeTasks = d.tasks.filter((t) => t.status !== "COMPLETED").length;
      const completedTasks = d.tasks.filter((t) => t.status === "COMPLETED").length;
      const activeOps = d.operations.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status)).length;
      const totalBudget = d.operations.reduce((acc, o) => acc + (o.approvedBudget || 0), 0);
      const totalActualCost = d.operations.reduce((acc, o) => acc + (o.actualCost || 0), 0);

      return {
        id: d.id,
        name: d.name,
        code: d.code,
        employeeCount: activeEmps,
        activeTasks,
        completedTasks,
        activeOperations: activeOps,
        budget: totalBudget,
        actualCost: totalActualCost,
        variance: totalBudget - totalActualCost,
        status: activeOps > 0 ? "ACTIVE" : "STANDBY",
      };
    });

    // ==========================================
    // 6. WORKFORCE & HR HIGH-LEVEL OVERVIEW
    // ==========================================
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.employmentStatus === "ACTIVE").length;
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const newJoiners = employees.filter((e) => new Date(e.hireDate) >= ninetyDaysAgo).length;
    const assignedToOperations = employees.filter((e) => e.operationAssignments.length > 0).length;
    const openTasksCount = employees.reduce((acc, e) => acc + e.assignedTasks.length, 0);

    // ==========================================
    // 7. INVENTORY & PROCUREMENT OVERVIEW
    // ==========================================
    const pendingPOs = purchaseOrders.filter((po) => ["PENDING_APPROVAL", "APPROVED", "SENT"].includes(po.status));
    const delayedPOs = purchaseOrders.filter(
      (po) => !["RECEIVED", "CLOSED", "CANCELLED"].includes(po.status) && new Date(po.expectedDeliveryDate) < now
    );
    const totalPOValue = pendingPOs.reduce((acc, po) => acc + po.total, 0);

    const procurementOverview = {
      activeVendorsCount: vendors.length,
      pendingPOCount: pendingPOs.length,
      delayedPOCount: delayedPOs.length,
      totalPOValue,
      delayedDeliveries: delayedPOs.map((po) => {
        const diffDays = Math.max(1, Math.floor((now.getTime() - new Date(po.expectedDeliveryDate).getTime()) / (1000 * 60 * 60 * 24)));
        return {
          id: po.id,
          poNumber: po.poNumber,
          vendorName: po.vendor?.displayName || "Vendor",
          total: po.total,
          status: po.status,
          expectedDeliveryDate: po.expectedDeliveryDate,
          daysDelayed: diffDays,
        };
      }),
    };

    // ==========================================
    // 8. LEGAL & COMPLIANCE ATTENTION
    // ==========================================
    // (Aggregated in parallel master fetch)

    // ==========================================
    // 9. CEO APPROVAL CENTER
    // ==========================================
    const approvalItems = pendingApprovals.map((app) => {
      let parsedMeta: any = {};
      try {
        if (app.metadata) parsedMeta = JSON.parse(app.metadata);
      } catch {}

      return {
        id: app.id,
        title: app.title,
        entityType: app.entityType,
        entityId: app.entityId,
        description: app.description,
        requestedByName: `${app.requestedBy.firstName} ${app.requestedBy.lastName}`,
        requestedByDesignation: app.requestedBy.designation || "Enterprise Staff",
        amount: parsedMeta.amount || parsedMeta.value || parsedMeta.estimatedCost || null,
        priority: parsedMeta.priority || "HIGH",
        createdAt: app.createdAt,
        status: app.status,
        operationId: app.operationId,
        contractId: app.contractId,
      };
    });

    // ==========================================
    // 10. CRITICAL ATTENTION ALERTS
    // ==========================================
    const criticalAlerts: Array<{
      id: string;
      title: string;
      category: "OPERATIONS" | "FINANCE" | "LEGAL" | "INVENTORY" | "APPROVAL";
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      relatedRecord: string;
      owner: string;
      date: Date | string;
      href: string;
    }> = [];

    // Critical Operational Issues
    opIssues
      .filter((i) => i.severity === "CRITICAL")
      .slice(0, 3)
      .forEach((i) => {
        criticalAlerts.push({
          id: `alert-op-${i.id}`,
          title: `Critical Operational Issue: ${i.title}`,
          category: "OPERATIONS",
          severity: "CRITICAL",
          relatedRecord: i.operation.name,
          owner: i.reportedBy ? `${i.reportedBy.firstName} ${i.reportedBy.lastName}` : "Operations Team",
          date: i.createdAt,
          href: `/app/operations/${i.operation.id}`,
        });
      });

    // Major Overdue Invoices
    overdueInvoices
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 3)
      .forEach((inv) => {
        criticalAlerts.push({
          id: `alert-fin-${inv.id}`,
          title: `Overdue Invoice: ${inv.invoiceNumber} (₹${inv.balance.toLocaleString()})`,
          category: "FINANCE",
          severity: inv.balance > 100000 ? "CRITICAL" : "HIGH",
          relatedRecord: inv.client?.name || "Client Ledger",
          owner: "Finance Team",
          date: inv.dueDate,
          href: `/app/finance/invoices/${inv.id}`,
        });
      });

    // Pending Approvals
    if (pendingApprovals.length > 0) {
      criticalAlerts.push({
        id: `alert-app-all`,
        title: `${pendingApprovals.length} Approval Request${pendingApprovals.length > 1 ? "s" : ""} Waiting for CEO Review`,
        category: "APPROVAL",
        severity: pendingApprovals.length > 3 ? "CRITICAL" : "HIGH",
        relatedRecord: "Executive Approval Center",
        owner: "Executive Office",
        date: pendingApprovals[0].createdAt,
        href: "#approvals",
      });
    }

    // Critical Inventory Shortages
    if (inventoryKpis && inventoryKpis.outOfStockCount > 0) {
      criticalAlerts.push({
        id: `alert-inv-stockout`,
        title: `${inventoryKpis.outOfStockCount} Product${inventoryKpis.outOfStockCount > 1 ? "s" : ""} Out of Stock`,
        category: "INVENTORY",
        severity: "HIGH",
        relatedRecord: "Central Warehouse",
        owner: "Inventory Team",
        date: now,
        href: `/app/inventory/stock`,
      });
    }

    // Contracts Expiring Soon
    expiringContractsList.slice(0, 2).forEach((c) => {
      criticalAlerts.push({
        id: `alert-leg-${c.id}`,
        title: `Contract Expiring Soon: ${c.title}`,
        category: "LEGAL",
        severity: "HIGH",
        relatedRecord: c.contractNumber,
        owner: c.legalOwner ? `${c.legalOwner.firstName} ${c.legalOwner.lastName}` : "Legal Counsel",
        date: c.expiryDate,
        href: `/app/legal/contracts/${c.id}`,
      });
    });

    // ==========================================
    // 11. COMPANY ACTIVITY TIMELINE
    // ==========================================
    const activityTimeline = recentAuditLogs.map((log) => {
      const actorName = log.actor?.employee
        ? `${log.actor.employee.firstName} ${log.actor.employee.lastName}`
        : log.actor?.email.split("@")[0] || "System";

      return {
        id: log.id,
        action: log.action.replace(/_/g, " "),
        entity: log.entity,
        entityId: log.entityId,
        actorName,
        actorRole: log.actor?.role.name || "Staff",
        createdAt: log.createdAt,
      };
    });

    // ==========================================
    // 12. UPCOMING CORPORATE EVENTS & DEADLINES
    // ==========================================
    const upcomingEvents: Array<{
      id: string;
      title: string;
      date: Date | string;
      type: "MEETING" | "CONTRACT_EXPIRY" | "COMPLIANCE_DEADLINE" | "OPERATION_DUE";
      href: string;
    }> = [];

    upcomingCalendarEvents.forEach((ev) => {
      upcomingEvents.push({
        id: `cal-${ev.id}`,
        title: ev.title,
        date: ev.startDate,
        type: "MEETING",
        href: `/app/calendar`,
      });
    });

    upcomingContractDeadlines.forEach((c) => {
      upcomingEvents.push({
        id: `contract-${c.id}`,
        title: `Contract Expiry: ${c.title}`,
        date: c.expiryDate,
        type: "CONTRACT_EXPIRY",
        href: `/app/legal/contracts/${c.id}`,
      });
    });

    upcomingComplianceDeadlines.forEach((comp) => {
      if (comp.nextDueDate) {
        upcomingEvents.push({
          id: `compliance-${comp.id}`,
          title: `Compliance Due: ${comp.title}`,
          date: comp.nextDueDate,
          type: "COMPLIANCE_DEADLINE",
          href: `/app/legal/compliance/${comp.id}`,
        });
      }
    });

    upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const result = {
      organizationName: user.activeCompany?.name || user.employee?.organizationName || "Enterprise Group",
      asOf: now.toISOString(),
      filters: {
        dateRange: filters.dateRange || "THIS_MONTH",
        startDate: currentStart.toISOString(),
        endDate: currentEnd.toISOString(),
      },
      kpis: {
        revenue: { current: currentRevenue, previous: previousRevenue, changePercent: revenueChange },
        expenses: { current: currentExpenses, previous: previousExpenses, changePercent: expensesChange },
        netProfit: { current: currentNetProfit, previous: previousNetProfit, changePercent: netProfitChange },
        customers: { total: totalCustomers, newCount: newCustomers, active: activeCustomers, inactive: inactiveCustomers },
        operations: { active: activeOperations.length, completed: completedOperations.length, delayed: delayedOperationsList.length },
        employees: { total: totalEmployees, active: activeEmployees, departmentCount: departments.length },
        receivables: { total: totalReceivables, overdue: overdueReceivables },
        cashPosition: { amount: cashPosition, label: "Net Operational Cash Flow" },
      },
      financialTrends: {
        revenueTrend: financeOverview?.revenueTrend || [],
        expenseTrend: financeOverview?.expenseTrend || [],
        aging: financeOverview?.receivablesAging || { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90Plus: 0, total: 0 },
      },
      crm: {
        metrics: {
          newLeads: newLeadsCount,
          activeOpportunities: openDealsCount,
          wonDeals: wonDealsCount,
          lostDeals: lostDealsCount,
          pipelineValue,
          closedRevenue: wonDealsValue,
          conversionRate,
        },
        funnel: funnelStages,
        topCustomers,
      },
      customerHealth: {
        totalCustomers,
        newCustomers,
        activeCustomers,
        inactiveCustomers,
        customersWithOpenIssues,
        customersWithOverduePayments,
        customersWithUpcomingRenewals,
        matrix: topCustomers,
      },
      operationsOverview: {
        statusCounts: operationsStatusCounts,
        delayedOperations: delayedOperationsList,
        criticalIssuesCount: opIssues.filter((i) => i.severity === "CRITICAL").length,
      },
      departmentOverview,
      workforceOverview: {
        totalEmployees,
        activeEmployees,
        newJoiners,
        assignedToOperations,
        openTasksCount,
        departments: departmentOverview.map((d) => ({ name: d.name, code: d.code, count: d.employeeCount })),
      },
      inventoryOverview: {
        totalValuation: inventoryKpis?.totalValuation || 0,
        lowStockCount: inventoryKpis?.lowStockCount || 0,
        outOfStockCount: inventoryKpis?.outOfStockCount || 0,
        lowStockAlerts: inventoryKpis?.lowStockAlerts?.slice(0, 5) || [],
      },
      procurementOverview,
      legalOverview: {
        activeContractsCount: legalDashboard?.kpis?.activeContractsCount || 0,
        expiringSoonCount: legalDashboard?.kpis?.expiringContracts30d || 0,
        openCasesCount: legalDashboard?.kpis?.activeCasesCount || 0,
        criticalRisksCount: legalDashboard?.kpis?.highRisksCount || 0,
        complianceOverdueCount: legalDashboard?.kpis?.overdueComplianceCount || 0,
        attentionItems: [
          ...expiringContractsList.map((c) => ({
            id: c.id,
            item: c.title,
            type: "CONTRACT",
            owner: c.legalOwner ? `${c.legalOwner.firstName} ${c.legalOwner.lastName}` : "Legal",
            dueDate: c.expiryDate,
            risk: "EXPIRING",
            status: c.status,
            href: `/app/legal/contracts/${c.id}`,
          })),
          ...activeCasesList.map((cs) => ({
            id: cs.id,
            item: cs.title,
            type: "LITIGATION",
            owner: "Counsel",
            dueDate: null,
            risk: cs.priority,
            status: cs.status,
            href: `/app/legal/cases/${cs.id}`,
          })),
        ],
      },
      approvalCenter: {
        pendingCount: pendingApprovals.length,
        items: approvalItems,
      },
      criticalAlerts,
      activityTimeline,
      upcomingEvents,
    };

        executiveDashboardCache.set(cacheKey, { data: result, cachedAt: Date.now() });
        return result;
      } finally {
        inFlightDashboardPromises.delete(cacheKey);
      }
    })();

    if (!filters.forceRefresh) {
      inFlightDashboardPromises.set(cacheKey, loadPromise);
    }
    return loadPromise;
  }
}
