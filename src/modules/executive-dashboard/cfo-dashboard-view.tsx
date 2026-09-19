"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  AlertTriangle,
  FileText,
  PieChart,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { ExecutiveHeader } from "./executive-header";
import { ExecutiveKpiCard } from "./executive-kpi-card";
import { ExecutiveApprovalQueue } from "./executive-approval-queue";
import { cn } from "@/lib/utils";

export interface CfoDashboardViewProps {
  initialData: any;
  currentUser: any;
}

export function CfoDashboardView({ initialData, currentUser }: CfoDashboardViewProps) {
  const [data, setData] = useState(initialData);
  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUpdatedData = async (range = dateRange) => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/dashboard/cfo?dateRange=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDateRangeChange = (newRange: string) => {
    setDateRange(newRange);
    fetchUpdatedData(newRange);
  };

  const handleExport = (format: "csv" | "json") => {
    window.open(`/api/dashboard/cfo/export?dateRange=${dateRange}&format=${format}`, "_blank");
  };

  const kpis = data?.kpis;
  const agingBuckets = data?.agingBuckets;
  const expenseCategories = data?.expenseCategories || {};
  const topDebtors = data?.topDebtors || [];
  const payrollHistory = data?.payrollHistory || [];
  const payables = data?.payables || [];
  const financialApprovals = data?.financialApprovals || [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <ExecutiveHeader
        title="CFO Financial Treasury & Liquidity"
        roleBadge="CFO"
        description="Comprehensive enterprise treasury health, accounts receivable aging, operating expenses, and cash flow governance"
        organizationName={currentUser?.employee?.organizationName || "Corporate Treasury"}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={() => fetchUpdatedData(dateRange)}
        onExport={handleExport}
        isRefreshing={isRefreshing}
      />

      {/* Primary Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExecutiveKpiCard
          title="Invoiced Revenue"
          value={formatCurrency(kpis?.totalInvoiced)}
          icon={<DollarSign className="h-4 w-4" />}
          iconBgColor="bg-blue-600/20 text-blue-400"
          subtitle="Total invoices generated in window"
          drillDownUrl="/app/finance/invoices"
        />

        <ExecutiveKpiCard
          title="Cash Collections"
          value={formatCurrency(kpis?.totalCollected)}
          icon={<TrendingUp className="h-4 w-4" />}
          iconBgColor="bg-emerald-600/20 text-emerald-400"
          subtitle="Realized liquid collections"
          drillDownUrl="/app/finance/payments"
          statusColor="emerald"
        />

        <ExecutiveKpiCard
          title="Operating Expenses"
          value={formatCurrency(kpis?.totalExpenses)}
          icon={<CreditCard className="h-4 w-4" />}
          iconBgColor="bg-amber-600/20 text-amber-400"
          subtitle="Approved company expenditure"
          drillDownUrl="/app/finance/expenses"
          statusColor="amber"
        />

        <ExecutiveKpiCard
          title="Net Position"
          value={formatCurrency(kpis?.netProfit)}
          icon={<Building className="h-4 w-4" />}
          iconBgColor={kpis?.netProfit >= 0 ? "bg-emerald-600/20 text-emerald-400" : "bg-rose-600/20 text-rose-400"}
          subtitle="Collections less Operating Expenses"
          drillDownUrl="/app/finance"
          statusColor={kpis?.netProfit >= 0 ? "emerald" : "rose"}
        />
      </div>

      {/* Secondary Working Capital Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Accounts Receivable
          </span>
          <div className="mt-1 text-xl font-bold text-amber-400">
            {formatCurrency(kpis?.accountsReceivable)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Unpaid invoice balance across clients</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Accounts Payable
          </span>
          <div className="mt-1 text-xl font-bold text-rose-400">
            {formatCurrency(kpis?.accountsPayable)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Outstanding vendor PO commitments</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Overdue Invoices
          </span>
          <div className="mt-1 text-xl font-bold text-rose-400">
            {kpis?.overdueInvoicesCount || 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{formatCurrency(kpis?.overdueReceivables)} past due</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Pending Financial Approvals
          </span>
          <div className="mt-1 text-xl font-bold text-purple-400">
            {kpis?.pendingApprovalsCount || 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Awaiting CFO authorization</p>
        </div>
      </div>

      {/* Middle Row: AR Aging & Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receivables Aging Buckets */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Accounts Receivable Aging</h3>
              <p className="text-xs text-slate-500">Aging exposure breakdown of customer balances</p>
            </div>
            <Link
              href="/app/finance/invoices?status=UNPAID"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              All Invoices <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { label: "Current (Within Terms)", val: agingBuckets?.current || 0, color: "bg-emerald-500", text: "text-emerald-400" },
              { label: "1-30 Days Overdue", val: agingBuckets?.days1_30 || 0, color: "bg-amber-500", text: "text-amber-400" },
              { label: "31-60 Days Overdue", val: agingBuckets?.days31_60 || 0, color: "bg-orange-500", text: "text-orange-400" },
              { label: "61-90 Days Overdue", val: agingBuckets?.days61_90 || 0, color: "bg-rose-500", text: "text-rose-400" },
              { label: "90+ Days Critical Risk", val: agingBuckets?.days90Plus || 0, color: "bg-red-600", text: "text-red-400" },
            ].map((bucket, i) => {
              const total = kpis?.accountsReceivable || 1;
              const pct = Math.min(100, Math.round((bucket.val / total) * 100));
              return (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-300">{bucket.label}</span>
                    <span className={cn("font-mono font-bold", bucket.text)}>{formatCurrency(bucket.val)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={cn("h-1.5 rounded-full", bucket.color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Expense Distribution</h3>
              <p className="text-xs text-slate-500">Corporate spend categorized by cost center</p>
            </div>
            <Link
              href="/app/finance/expenses"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Expense Ledger <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {Object.keys(expenseCategories).length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No categorized expenses recorded in this period.</p>
            ) : (
              Object.entries(expenseCategories).map(([cat, amt]: [string, any], idx: number) => {
                const total = kpis?.totalExpenses || 1;
                const pct = Math.min(100, Math.round((amt / total) * 100));
                return (
                  <div key={idx} className="flex flex-col gap-1 p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{cat.replace(/_/g, " ")}</span>
                      <span className="font-mono font-bold text-white">{formatCurrency(amt)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Overdue Debtors & Open Payables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Overdue Debtors */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Critical Overdue Debtors</h3>
              <p className="text-xs text-slate-500">Clients with delinquent balances requiring follow-up</p>
            </div>
            <Link
              href="/app/finance/invoices?status=OVERDUE"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Overdue List <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {topDebtors.length === 0 ? (
              <p className="text-xs text-emerald-400 py-8 text-center font-medium">
                ✓ All client accounts are current and within payment terms!
              </p>
            ) : (
              topDebtors.map((debtor: any) => (
                <div
                  key={debtor.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-rose-500/20 bg-rose-500/5"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{debtor.client}</div>
                    <div className="text-[10px] text-rose-400 font-mono mt-0.5">
                      Inv #{debtor.invoiceNumber} • {debtor.daysOverdue} days overdue
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-rose-400">
                      {formatCurrency(debtor.balance)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vendor Payables Committed */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Active Purchase Order Commitments</h3>
              <p className="text-xs text-slate-500">Upcoming accounts payable obligations to vendors</p>
            </div>
            <Link
              href="/app/vendors"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Procurement <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {payables.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No outstanding purchase orders recorded.</p>
            ) : (
              payables.map((po: any) => (
                <div
                  key={po.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/50"
                >
                  <div>
                    <div className="text-xs font-medium text-white">{po.vendor}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      PO #{po.poNumber} • <span className="text-amber-400">{po.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-200">
                      {formatCurrency(po.amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Approval Queue */}
      <ExecutiveApprovalQueue
        title="Pending Financial & Requisition Approvals"
        items={financialApprovals}
        onRefresh={() => fetchUpdatedData(dateRange)}
      />
    </div>
  );
}
