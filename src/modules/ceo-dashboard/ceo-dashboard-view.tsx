"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CeoHeader } from "./ceo-header";
import { CeoKpiGrid } from "./ceo-kpi-grid";
import { CeoFinancialCharts } from "./ceo-financial-charts";
import { CeoSalesFunnel } from "./ceo-sales-funnel";
import { CeoCustomerHealth } from "./ceo-customer-health";
import { CeoOperationsOverview } from "./ceo-operations-overview";
import { CeoDepartmentOverview } from "./ceo-department-overview";
import { CeoWorkforceOverview } from "./ceo-workforce-overview";
import { CeoInventoryProcurement } from "./ceo-inventory-procurement";
import { CeoLegalCompliance } from "./ceo-legal-compliance";
import { CeoApprovalCenter } from "./ceo-approval-center";
import { CeoCriticalAlerts } from "./ceo-critical-alerts";
import { CeoActivityTimeline } from "./ceo-activity-timeline";
import { CeoUpcomingEvents } from "./ceo-upcoming-events";
import { CeoQuickActions } from "./ceo-quick-actions";
import { CeoDashboardFilters } from "@/services/ceo-dashboard.service";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface CeoDashboardViewProps {
  currentUser?: any;
}

export function CeoDashboardView({ currentUser }: CeoDashboardViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CeoDashboardFilters>({
    dateRange: "THIS_MONTH",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.dateRange) params.set("dateRange", filters.dateRange);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.departmentId) params.set("departmentId", filters.departmentId);

      const res = await fetch(`/api/dashboard/ceo?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load CEO executive dashboard telemetry");
      }

      setData(json.data);
    } catch (err: any) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to aggregate executive dashboard data");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">Executive Dashboard Access Error</h3>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={fetchData}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors flex items-center gap-1.5 mx-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-slate-400">Aggregating cross-enterprise executive telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-16">
      {/* 1. Executive Header with Date Range & Export */}
      <CeoHeader
        organizationName={data?.organizationName || "Enterprise Group"}
        asOf={data?.asOf || new Date().toISOString()}
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={fetchData}
        loading={loading}
        currentUser={currentUser}
      />

      {/* 2. Executive Quick Action Shortcuts */}
      <CeoQuickActions />

      {/* 3. Critical Attention Alerts (Operational, Financial, Legal, Stock) */}
      <CeoCriticalAlerts alerts={data?.criticalAlerts || []} />

      {/* 4. Top-Level Company Performance KPI Cards */}
      {data?.kpis && <CeoKpiGrid kpis={data.kpis} />}

      {/* 5. Revenue, Operating Expenses & Profit Trend Analytics */}
      {data?.financialTrends && (
        <CeoFinancialCharts
          revenueTrend={data.financialTrends.revenueTrend}
          expenseTrend={data.financialTrends.expenseTrend}
          aging={data.financialTrends.aging}
        />
      )}

      {/* 6. CEO Executive Approval Center */}
      {data?.approvalCenter && (
        <CeoApprovalCenter
          items={data.approvalCenter.items}
          onApprovalDecided={fetchData}
        />
      )}

      {/* 7. CRM & Sales Funnel Analytics */}
      {data?.crm && (
        <CeoSalesFunnel
          metrics={data.crm.metrics}
          funnel={data.crm.funnel}
          topCustomers={data.crm.topCustomers}
        />
      )}

      {/* 8. Customer Health & Cross-Department Risk Matrix */}
      {data?.customerHealth && (
        <CeoCustomerHealth
          totalCustomers={data.customerHealth.totalCustomers}
          newCustomers={data.customerHealth.newCustomers}
          activeCustomers={data.customerHealth.activeCustomers}
          inactiveCustomers={data.customerHealth.inactiveCustomers}
          customersWithOpenIssues={data.customerHealth.customersWithOpenIssues}
          customersWithOverduePayments={data.customerHealth.customersWithOverduePayments}
          customersWithUpcomingRenewals={data.customerHealth.customersWithUpcomingRenewals}
          matrix={data.customerHealth.matrix}
        />
      )}

      {/* 9. Operations, Service Execution & Delayed Projects */}
      {data?.operationsOverview && (
        <CeoOperationsOverview
          statusCounts={data.operationsOverview.statusCounts}
          delayedOperations={data.operationsOverview.delayedOperations}
          criticalIssuesCount={data.operationsOverview.criticalIssuesCount}
        />
      )}

      {/* 10. Department Performance Matrix */}
      {data?.departmentOverview && (
        <CeoDepartmentOverview departments={data.departmentOverview} />
      )}

      {/* 11. Workforce & Headcount Distribution */}
      {data?.workforceOverview && (
        <CeoWorkforceOverview
          totalEmployees={data.workforceOverview.totalEmployees}
          activeEmployees={data.workforceOverview.activeEmployees}
          newJoiners={data.workforceOverview.newJoiners}
          assignedToOperations={data.workforceOverview.assignedToOperations}
          openTasksCount={data.workforceOverview.openTasksCount}
          departments={data.workforceOverview.departments}
        />
      )}

      {/* 12. Inventory Shortages & Vendor Procurement */}
      {data?.inventoryOverview && data?.procurementOverview && (
        <CeoInventoryProcurement
          inventory={data.inventoryOverview}
          procurement={data.procurementOverview}
        />
      )}

      {/* 13. Legal, Litigation & Compliance Attention */}
      {data?.legalOverview && (
        <CeoLegalCompliance overview={data.legalOverview} />
      )}

      {/* 14. Activity Timeline & Upcoming Milestones (Grid Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CeoActivityTimeline timeline={data?.activityTimeline || []} />
        <CeoUpcomingEvents events={data?.upcomingEvents || []} />
      </div>
    </div>
  );
}
