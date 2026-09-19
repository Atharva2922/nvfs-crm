"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Award,
  Globe,
  ShieldAlert,
  Building,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { ExecutiveHeader } from "./executive-header";
import { ExecutiveKpiCard } from "./executive-kpi-card";
import { ExecutiveApprovalQueue } from "./executive-approval-queue";
import { cn } from "@/lib/utils";

export interface ChairpersonDashboardViewProps {
  initialData: any;
  currentUser: any;
}

export function ChairpersonDashboardView({
  initialData,
  currentUser,
}: ChairpersonDashboardViewProps) {
  const [data, setData] = useState(initialData);
  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUpdatedData = async (range = dateRange) => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/dashboard/chairperson?dateRange=${range}`);
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
    window.open(`/api/dashboard/chairperson/export?dateRange=${dateRange}&format=${format}`, "_blank");
  };

  const kpis = data?.kpis;

  return (
    <div className="space-y-6">
      <ExecutiveHeader
        title="Chairperson Executive Oversight"
        roleBadge="Board & Strategic Command"
        description="High-level corporate governance, long-term capital allocation, strategic partnerships, enterprise commitments, and risk management."
        organizationName={data?.organizationName || "Enterprise Group"}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={() => fetchUpdatedData(dateRange)}
        onExport={handleExport}
        isRefreshing={isRefreshing}
      />

      {/* Top Strategic KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExecutiveKpiCard
          title="Consolidated Revenue"
          value={kpis?.revenue?.current || 0}
          prefix="₹"
          changePercent={kpis?.revenue?.growthPercent}
          changeLabel="vs prior period"
          icon={<TrendingUp className="h-4 w-4" />}
          iconBgColor="bg-emerald-600/20 text-emerald-400"
          drillDownUrl="/app/finance/invoices"
        />

        <ExecutiveKpiCard
          title="Net Operating Profit"
          value={kpis?.profit?.current || 0}
          prefix="₹"
          changePercent={kpis?.profit?.growthPercent}
          changeLabel="growth"
          icon={<Award className="h-4 w-4" />}
          iconBgColor="bg-blue-600/20 text-blue-400"
          drillDownUrl="/app/finance"
        />

        <ExecutiveKpiCard
          title="Operating Expenses"
          value={kpis?.expenses?.current || 0}
          prefix="₹"
          changePercent={kpis?.expenses?.changePercent}
          changeLabel="change"
          icon={<DollarSign className="h-4 w-4" />}
          iconBgColor="bg-rose-600/20 text-rose-400"
          drillDownUrl="/app/finance/expenses"
        />

        <ExecutiveKpiCard
          title="Capital Commitments"
          value={kpis?.strategicCommitments || 0}
          prefix="₹"
          subtitle={`${kpis?.activeProjectsCount || 0} active strategic initiatives`}
          icon={<Briefcase className="h-4 w-4" />}
          iconBgColor="bg-indigo-600/20 text-indigo-400"
          drillDownUrl="/app/operations"
        />
      </div>

      {/* Strategic Initiatives & Projects */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Major Strategic Initiatives & Capital Projects
            </h4>
          </div>
          <Link href="/app/operations" className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors">
            All Operations ({data?.strategicProjects?.length || 0}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(!data?.strategicProjects || data.strategicProjects.length === 0) ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-500">
              No strategic operations currently logged.
            </div>
          ) : (
            data.strategicProjects.map((proj: any) => (
              <div key={proj.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{proj.code}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                      proj.isDelayed
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : proj.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    )}
                  >
                    {proj.isDelayed ? "Delayed" : proj.status}
                  </span>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-white truncate">{proj.name}</h5>
                  <p className="text-[11px] text-slate-400 truncate">{proj.client}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Progress</span>
                    <span className="font-mono text-white">{proj.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${proj.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500">Budget: ₹{proj.budget.toLocaleString()}</span>
                  <Link href={`/app/operations/${proj.id}`} className="text-blue-400 hover:underline">
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Two Column Section: Global Clients & Major Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Major Enterprise Accounts */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Major Enterprise & Global Clients
              </h4>
            </div>
            <Link href="/app/crm/clients" className="text-[11px] text-blue-400 hover:text-blue-300">
              Corporate Accounts →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.majorClients || data.majorClients.length === 0) ? (
              <p className="py-6 text-center text-xs text-slate-500">No client accounts recorded.</p>
            ) : (
              data.majorClients.map((client: any) => (
                <div key={client.id} className="py-2.5 px-1 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{client.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">({client.country || "Global"})</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{client.industry || "Enterprise Partner"}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-emerald-400 block">
                      ₹{client.annualRevenue ? client.annualRevenue.toLocaleString() : "0"}
                    </span>
                    <span className="text-[10px] text-slate-500">{client.tier}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Major Contracts */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Active High-Value Contracts
              </h4>
            </div>
            <Link href="/app/legal/contracts" className="text-[11px] text-blue-400 hover:text-blue-300">
              Contract Directory →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.majorContracts || data.majorContracts.length === 0) ? (
              <p className="py-6 text-center text-xs text-slate-500">No active contracts available.</p>
            ) : (
              data.majorContracts.map((c: any) => (
                <div key={c.id} className="py-2.5 px-1 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block truncate max-w-xs">{c.title}</span>
                    <span className="text-[11px] text-slate-400">{c.clientName} • {c.contractNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-white block">
                      ₹{c.value.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Exp: {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "Perpetual"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two Column Section: Strategic Risks & Board Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategic Risks */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Strategic Risk & Compliance Watchlist
              </h4>
            </div>
            <Link href="/app/legal/risks" className="text-[11px] text-blue-400 hover:text-blue-300">
              Risk Center →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.strategicRisks || data.strategicRisks.length === 0) ? (
              <p className="py-6 text-center text-xs text-slate-500">No high-severity risks identified.</p>
            ) : (
              data.strategicRisks.map((risk: any) => (
                <div key={risk.id} className="py-2.5 px-1 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{risk.title}</span>
                      <span className="rounded bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-bold text-rose-400">
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{risk.mitigationPlan || "Mitigation underway"}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">Owner: {risk.owner}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Board Approvals */}
        <ExecutiveApprovalQueue
          items={data?.boardApprovals || []}
          title="Board & Strategic Approvals Queue"
          onRefresh={() => fetchUpdatedData(dateRange)}
        />
      </div>
    </div>
  );
}
