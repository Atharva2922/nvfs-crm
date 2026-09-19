"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  UserCheck,
  Award,
  IndianRupee,
  BarChart3,
  Globe,
  PieChart,
  Users,
  Building,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { ExecutiveHeader } from "./executive-header";
import { ExecutiveKpiCard } from "./executive-kpi-card";
import { cn } from "@/lib/utils";

export interface CmoDashboardViewProps {
  initialData: any;
  currentUser: any;
}

export function CmoDashboardView({ initialData, currentUser }: CmoDashboardViewProps) {
  const [data, setData] = useState(initialData);
  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUpdatedData = async (range = dateRange) => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/dashboard/cmo?dateRange=${range}`);
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
    window.open(`/api/dashboard/cmo/export?dateRange=${dateRange}&format=${format}`, "_blank");
  };

  const kpis = data?.kpis;
  const sourceBreakdown = data?.sourceBreakdown || {};
  const dealsByStage = data?.dealsByStage || {};
  const tierCounts = data?.tierCounts || {};

  return (
    <div className="space-y-6">
      <ExecutiveHeader
        title="CMO Commercial & Customer Growth Command"
        roleBadge="Commercial & Marketing"
        description="Lead acquisition velocity, funnel conversion metrics, sales pipeline forecasting, client tier distributions, and enterprise campaign health."
        organizationName={data?.organizationName || "Enterprise Group"}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={() => fetchUpdatedData(dateRange)}
        onExport={handleExport}
        isRefreshing={isRefreshing}
      />

      {/* Top Commercial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExecutiveKpiCard
          title="Total Inbound Leads"
          value={kpis?.totalLeads || 0}
          subtitle={`${kpis?.newLeads || 0} captured this window`}
          icon={<UserCheck className="h-4 w-4" />}
          iconBgColor="bg-indigo-600/20 text-indigo-400"
          drillDownUrl="/app/crm/leads"
        />

        <ExecutiveKpiCard
          title="Lead Conversion Rate"
          value={kpis?.conversionRate || 0}
          suffix="%"
          subtitle={`${kpis?.convertedLeads || 0} converted accounts`}
          icon={<TrendingUp className="h-4 w-4" />}
          iconBgColor="bg-blue-600/20 text-blue-400"
          drillDownUrl="/app/crm/leads"
        />

        <ExecutiveKpiCard
          title="Open Pipeline Forecast"
          value={kpis?.openPipelineValue || 0}
          prefix="₹"
          subtitle={`₹${(kpis?.weightedForecast || 0).toLocaleString()} weighted`}
          icon={<IndianRupee className="h-4 w-4" />}
          iconBgColor="bg-emerald-600/20 text-emerald-400"
          drillDownUrl="/app/crm/opportunities"
        />

        <ExecutiveKpiCard
          title="Won Deal Bookings"
          value={kpis?.wonRevenue || 0}
          prefix="₹"
          subtitle={`${kpis?.winRate || 0}% overall win rate`}
          icon={<Award className="h-4 w-4" />}
          iconBgColor="bg-teal-600/20 text-teal-400"
          drillDownUrl="/app/crm/opportunities?stage=CLOSED_WON"
        />
      </div>

      {/* Two Column Grid: Pipeline Stages & Marketing Acquisition Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Stages Distribution */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Sales Pipeline by Stage
              </h4>
            </div>
            <Link href="/app/crm/opportunities" className="text-[11px] text-blue-400 hover:text-blue-300">
              Pipeline →
            </Link>
          </div>

          <div className="space-y-3">
            {Object.entries(dealsByStage).map(([stage, details]: [string, any]) => (
              <div key={stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">{stage.replace(/_/g, " ")}</span>
                  <span className="font-mono text-slate-400">
                    {details.count} deals • ₹{details.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      stage === "CLOSED_WON"
                        ? "bg-emerald-500"
                        : stage === "NEGOTIATION"
                        ? "bg-teal-500"
                        : stage === "PROPOSAL"
                        ? "bg-blue-500"
                        : stage === "DISCOVERY"
                        ? "bg-indigo-500"
                        : "bg-rose-500"
                    )}
                    style={{
                      width: `${Math.min(100, Math.max(5, (details.value / (kpis?.openPipelineValue || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marketing Lead Source Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-blue-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Lead Acquisition by Marketing Channel
              </h4>
            </div>
            <Link href="/app/crm/leads" className="text-[11px] text-blue-400 hover:text-blue-300">
              Leads Center →
            </Link>
          </div>

          <div className="space-y-3">
            {Object.entries(sourceBreakdown).length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No lead sources recorded yet.</p>
            ) : (
              Object.entries(sourceBreakdown).map(([source, count]: [string, any]) => {
                const pct = Math.round((count / (kpis?.totalLeads || 1)) * 100);
                return (
                  <div key={source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{source.replace(/_/g, " ")}</span>
                      <span className="font-mono text-slate-400">
                        {count} leads ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Top Revenue Generating Accounts & Customer Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Accounts */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Top Client Accounts by Paid Revenue
              </h4>
            </div>
            <Link href="/app/crm/clients" className="text-[11px] text-blue-400 hover:text-blue-300">
              Directory →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.topClients || data.topClients.length === 0) ? (
              <p className="py-6 text-center text-xs text-slate-500">No customer accounts available.</p>
            ) : (
              data.topClients.map((c: any) => (
                <div key={c.id} className="py-2.5 px-1 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block truncate">{c.name}</span>
                    <span className="text-[11px] text-slate-400">
                      Tier: {c.tier} • Open Pipeline: ₹{c.pipeline.toLocaleString()}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-emerald-400">
                    ₹{c.paidRevenue.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Customer Tier Distribution */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Customer Portfolio Segmentation
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {kpis?.activeClients || 0} Total Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 text-center">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Enterprise</span>
              <h3 className="text-xl font-bold text-white mt-1">{tierCounts.ENTERPRISE || 0}</h3>
              <span className="text-[10px] text-blue-400 font-mono">Tier 1</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Mid-Market</span>
              <h3 className="text-xl font-bold text-white mt-1">{tierCounts.MID_MARKET || 0}</h3>
              <span className="text-[10px] text-indigo-400 font-mono">Growth Tier</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">SMB Accounts</span>
              <h3 className="text-xl font-bold text-white mt-1">{tierCounts.SMB || 0}</h3>
              <span className="text-[10px] text-slate-400 font-mono">Standard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
