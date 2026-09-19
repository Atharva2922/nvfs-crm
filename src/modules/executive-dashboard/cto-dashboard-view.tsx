"use client";

import React, { useState } from "react";
import {
  Server,
  Cpu,
  AlertTriangle,
  CheckSquare,
  Layers,
  Users,
  DollarSign,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { ExecutiveHeader } from "./executive-header";
import { ExecutiveKpiCard } from "./executive-kpi-card";
import { ExecutiveApprovalQueue } from "./executive-approval-queue";
import { cn } from "@/lib/utils";

export interface CtoDashboardViewProps {
  initialData: any;
  currentUser: any;
}

export function CtoDashboardView({ initialData, currentUser }: CtoDashboardViewProps) {
  const [data, setData] = useState(initialData);
  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUpdatedData = async (range = dateRange) => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/dashboard/cto?dateRange=${range}`);
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
    window.open(`/api/dashboard/cto/export?dateRange=${dateRange}&format=${format}`, "_blank");
  };

  const kpis = data?.kpis;
  const taskStatus = data?.taskStatus;

  return (
    <div className="space-y-6">
      <ExecutiveHeader
        title="CTO Engineering & Technology Command"
        roleBadge="Technology & Infrastructure"
        description="Engineering sprint velocity, systems reliability, operational incidents, technological capital spend, and technical decision queues."
        organizationName={data?.organizationName || "Enterprise Group"}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={() => fetchUpdatedData(dateRange)}
        onExport={handleExport}
        isRefreshing={isRefreshing}
      />

      {/* Top Engineering KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExecutiveKpiCard
          title="Active Tech Projects"
          value={kpis?.activeProjectsCount || 0}
          subtitle={`${kpis?.delayedProjectsCount || 0} currently delayed`}
          icon={<Cpu className="h-4 w-4" />}
          iconBgColor="bg-blue-600/20 text-blue-400"
          drillDownUrl="/app/operations"
        />

        <ExecutiveKpiCard
          title="Operational Incidents"
          value={kpis?.openIncidentsCount || 0}
          subtitle={`${kpis?.criticalIncidentsCount || 0} critical severity`}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconBgColor="bg-rose-600/20 text-rose-400"
          drillDownUrl="/app/operations/issues"
        />

        <ExecutiveKpiCard
          title="Sprint Task Completion"
          value={kpis?.taskCompletionRate || 0}
          suffix="%"
          subtitle={`${taskStatus?.completed || 0} of ${taskStatus?.total || 0} tasks resolved`}
          icon={<CheckSquare className="h-4 w-4" />}
          iconBgColor="bg-emerald-600/20 text-emerald-400"
          drillDownUrl="/app/tasks"
        />

        <ExecutiveKpiCard
          title="Technology Spend"
          value={kpis?.techExpenditure || 0}
          prefix="₹"
          subtitle="Cloud, software & hardware"
          icon={<DollarSign className="h-4 w-4" />}
          iconBgColor="bg-purple-600/20 text-purple-400"
          drillDownUrl="/app/finance/expenses"
        />
      </div>

      {/* Engineering Deliverables & Delays */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Engineering Projects & Operations Status
            </h4>
          </div>
          <Link href="/app/operations" className="text-[11px] font-medium text-blue-400 hover:text-blue-300">
            Operations Center →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(!data?.projects || data.projects.length === 0) ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-500">
              No engineering operations currently recorded.
            </div>
          ) : (
            data.projects.map((p: any) => (
              <div key={p.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{p.code}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                      p.isDelayed
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : p.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    )}
                  >
                    {p.isDelayed ? "Delayed" : p.status}
                  </span>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-white truncate">{p.name}</h5>
                  <p className="text-[11px] text-slate-400 truncate">Lead: {p.manager}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Delivery Progress</span>
                    <span className="font-mono text-white">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <span>{p.tasksCount} Tasks • {p.issuesCount} Issues</span>
                  <Link href={`/app/operations/${p.id}`} className="text-blue-400 hover:underline">
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Two Column Grid: Operational Incidents & Technology Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational Incidents */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Operational Incidents & Bug Tracker
              </h4>
            </div>
            <Link href="/app/operations/issues" className="text-[11px] text-blue-400 hover:text-blue-300">
              View All Issues →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.incidents || data.incidents.length === 0) ? (
              <p className="py-8 text-center text-xs text-slate-500">No active incidents reported.</p>
            ) : (
              data.incidents.map((i: any) => (
                <div key={i.id} className="py-2.5 px-1 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{i.title}</span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          i.severity === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : i.severity === "HIGH"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-400"
                        )}
                      >
                        {i.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {i.operation} • Assigned to: <strong className="text-slate-300">{i.assignedTo}</strong>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                    {new Date(i.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tech Approvals */}
        <ExecutiveApprovalQueue
          items={data?.approvals || []}
          title="Technical Decision & Resource Approvals"
          onRefresh={() => fetchUpdatedData(dateRange)}
        />
      </div>

      {/* Technology Vendors & Infrastructure Partners */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Technology & Infrastructure Vendors
            </h4>
          </div>
          <Link href="/app/inventory/vendors" className="text-[11px] text-blue-400 hover:text-blue-300">
            Vendor Directory →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(!data?.vendors || data.vendors.length === 0) ? (
            <p className="col-span-full py-6 text-center text-xs text-slate-500">No vendors registered.</p>
          ) : (
            data.vendors.map((v: any) => (
              <div key={v.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 truncate">{v.name}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400 font-mono">
                    {v.code}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                  <span>{v.category || "IT Services"}</span>
                  <span>{v.ordersCount} Orders</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
