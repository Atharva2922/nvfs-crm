import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";

export class LegalDashboardService {
  /**
   * Aggregates enterprise legal health metrics, telemetry, and live KPIs
   */
  static async getExecutiveDashboard(user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      activeContracts,
      allContracts,
      expiringContracts30d,
      pendingApprovalContracts,
      activeCases,
      allCases,
      allCompliance,
      overdueCompliance,
      allDeadlines,
      upcomingDeadlines7d,
      overdueDeadlines,
      risks,
      recentActivities,
    ] = await Promise.all([
      db.legalContract.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        select: { id: true, contractValue: true, currency: true },
      }),
      db.legalContract.groupBy({
        by: ["status"],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
      db.legalContract.count({
        where: {
          organizationId: orgId,
          status: { in: ["ACTIVE", "EXPIRING_SOON"] },
          expiryDate: { gte: now, lte: in30Days },
        },
      }),
      db.legalContract.count({
        where: { organizationId: orgId, status: "PENDING_APPROVAL" },
      }),
      db.legalCase.findMany({
        where: { organizationId: orgId, status: { in: ["OPEN", "INVESTIGATING", "IN_PROGRESS", "AWAITING_ACTION"] } },
        select: { id: true, estimatedFinancialExposure: true, actualFinancialExposure: true },
      }),
      db.legalCase.groupBy({
        by: ["status"],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
      db.legalCompliance.findMany({
        where: { organizationId: orgId },
        select: { id: true, status: true, nextDueDate: true },
      }),
      db.legalCompliance.count({
        where: {
          organizationId: orgId,
          OR: [
            { status: "OVERDUE" },
            { nextDueDate: { lt: now }, status: { notIn: ["COMPLIANT", "NOT_APPLICABLE"] } },
          ],
        },
      }),
      db.legalDeadline.findMany({
        where: { organizationId: orgId, status: { not: "COMPLETED" } },
        select: { id: true, dueDate: true, priority: true, status: true },
      }),
      db.legalDeadline.findMany({
        where: {
          organizationId: orgId,
          status: { not: "COMPLETED" },
          dueDate: { gte: now, lte: in7Days },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
        include: {
          owner: { select: { firstName: true, lastName: true } },
          contract: { select: { contractNumber: true, title: true } },
          case: { select: { caseNumber: true, title: true } },
          compliance: { select: { code: true, title: true } },
        },
      }),
      db.legalDeadline.count({
        where: {
          organizationId: orgId,
          status: { not: "COMPLETED" },
          dueDate: { lt: now },
        },
      }),
      db.legalRisk.groupBy({
        by: ["riskLevel"],
        where: { organizationId: orgId, status: { notIn: ["RESOLVED", "CLOSED"] } },
        _count: { _all: true },
      }),
      db.legalActivity.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          performedBy: { select: { firstName: true, lastName: true } },
          contract: { select: { id: true, contractNumber: true, title: true } },
          case: { select: { id: true, caseNumber: true, title: true } },
          compliance: { select: { id: true, code: true, title: true } },
        },
      }),
    ]);

    // Financial Computations
    const totalActiveContractValue = activeContracts.reduce((acc, c) => acc + (c.contractValue || 0), 0);
    const totalCaseExposure = activeCases.reduce((acc, c) => acc + (c.estimatedFinancialExposure || c.actualFinancialExposure || 0), 0);

    // Compliance Health Score
    const totalComplianceItems = allCompliance.length;
    const compliantCount = allCompliance.filter((c) => c.status === "COMPLIANT" || c.status === "NOT_APPLICABLE").length;
    const complianceHealthScore = totalComplianceItems > 0 ? Math.round((compliantCount / totalComplianceItems) * 100) : 100;

    // Contract Status Dictionary
    const contractStatusBreakdown: Record<string, number> = {
      DRAFT: 0,
      UNDER_REVIEW: 0,
      PENDING_APPROVAL: 0,
      APPROVED: 0,
      ACTIVE: 0,
      EXPIRING_SOON: 0,
      EXPIRED: 0,
      TERMINATED: 0,
      ARCHIVED: 0,
    };
    allContracts.forEach((item) => {
      contractStatusBreakdown[item.status] = item._count._all;
    });

    // Case Status Dictionary
    const caseStatusBreakdown: Record<string, number> = {
      OPEN: 0,
      INVESTIGATING: 0,
      IN_PROGRESS: 0,
      AWAITING_ACTION: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    allCases.forEach((item) => {
      caseStatusBreakdown[item.status] = item._count._all;
    });

    // Risk Breakdown
    const riskBreakdown: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    risks.forEach((item) => {
      riskBreakdown[item.riskLevel] = item._count._all;
    });

    return {
      kpis: {
        activeContractsCount: activeContracts.length,
        totalActiveContractValue,
        expiringContracts30d,
        pendingApprovalContracts,
        activeCasesCount: activeCases.length,
        totalCaseExposure,
        complianceHealthScore,
        overdueComplianceCount: overdueCompliance,
        pendingDeadlinesCount: allDeadlines.length,
        deadlinesDueThisWeek: upcomingDeadlines7d.length,
        overdueDeadlinesCount: overdueDeadlines,
        criticalRisksCount: riskBreakdown.CRITICAL,
        highRisksCount: riskBreakdown.HIGH,
      },
      charts: {
        contractsByStatus: contractStatusBreakdown,
        casesByStatus: caseStatusBreakdown,
        risksByLevel: riskBreakdown,
      },
      upcomingDeadlines: upcomingDeadlines7d,
      recentActivities,
    };
  }

  /**
   * Generates comprehensive report data suitable for on-screen analytics and CSV/JSON export
   */
  static async getExecutiveReportData(
    user: AuthenticatedUser,
    options?: {
      category?: "CONTRACTS" | "CASES" | "COMPLIANCE" | "RISKS" | "ALL";
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const cat = options?.category || "ALL";

    const [contracts, cases, compliances, risks] = await Promise.all([
      cat === "ALL" || cat === "CONTRACTS"
        ? db.legalContract.findMany({
            where: { organizationId: orgId },
            include: {
              legalOwner: { select: { firstName: true, lastName: true } },
              client: { select: { name: true } },
              vendor: { select: { displayName: true } },
            },
            orderBy: { createdAt: "desc" },
          })
        : [],
      cat === "ALL" || cat === "CASES"
        ? db.legalCase.findMany({
            where: { organizationId: orgId },
            include: {
              internalOwner: { select: { firstName: true, lastName: true } },
              externalCounsel: { select: { name: true, firmName: true } },
            },
            orderBy: { createdAt: "desc" },
          })
        : [],
      cat === "ALL" || cat === "COMPLIANCE"
        ? db.legalCompliance.findMany({
            where: { organizationId: orgId },
            include: {
              owner: { select: { firstName: true, lastName: true } },
              department: { select: { name: true } },
            },
            orderBy: { nextDueDate: "asc" },
          })
        : [],
      cat === "ALL" || cat === "RISKS"
        ? db.legalRisk.findMany({
            where: { organizationId: orgId },
            include: {
              owner: { select: { firstName: true, lastName: true } },
            },
            orderBy: [{ riskScore: "desc" }, { createdAt: "desc" }],
          })
        : [],
    ]);

    return {
      generatedAt: new Date().toISOString(),
      contracts,
      cases,
      compliances,
      risks,
    };
  }
}
