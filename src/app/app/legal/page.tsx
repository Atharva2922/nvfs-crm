"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  FileText,
  Scale,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  Calendar,
  ChevronRight,
  ExternalLink,
  Plus,
  RefreshCw,
  FolderOpen,
  Users,
  Activity,
  ArrowUpRight,
  AlertOctagon,
} from "lucide-react";

interface DashboardData {
  kpis: {
    activeContractsCount: number;
    totalActiveContractValue: number;
    expiringContracts30d: number;
    pendingApprovalContracts: number;
    activeCasesCount: number;
    totalCaseExposure: number;
    complianceHealthScore: number;
    overdueComplianceCount: number;
    pendingDeadlinesCount: number;
    deadlinesDueThisWeek: number;
    overdueDeadlinesCount: number;
    criticalRisksCount: number;
    highRisksCount: number;
  };
  charts: {
    contractsByStatus: Record<string, number>;
    casesByStatus: Record<string, number>;
    risksByLevel: Record<string, number>;
  };
  upcomingDeadlines: any[];
  recentActivities: any[];
}

export default function LegalDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/legal/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || "Failed to load dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Legal, Contracts & Compliance"
        description="Comprehensive enterprise legal repository, contract lifecycles, litigation tracking, statutory compliance, and risk governance."
      />

      <LegalNav />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
            <span className="text-sm font-medium">Synthesizing legal intelligence...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
          <AlertOctagon className="mx-auto h-8 w-8 mb-2" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : data ? (
        <>
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Contracts */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#0d131f] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Contracts</span>
                <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <FileText className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {data.kpis.activeContractsCount}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span>{formatCurrency(data.kpis.totalActiveContractValue)} total active value</span>
                </div>
              </div>
            </div>

            {/* Expiring Soon (30d) & Approvals */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#0d131f] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Renewal Horizon (30d)</span>
                <span className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                  <RefreshCw className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {data.kpis.expiringContracts30d}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-amber-400 font-medium">{data.kpis.pendingApprovalContracts} awaiting approval</span>
                </div>
              </div>
            </div>

            {/* Active Cases & Financial Exposure */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#0d131f] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Litigation Exposure</span>
                <span className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                  <Scale className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {data.kpis.activeCasesCount} <span className="text-sm font-normal text-slate-400">Active Cases</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-400 font-medium">
                  <span>{formatCurrency(data.kpis.totalCaseExposure)} estimated exposure</span>
                </div>
              </div>
            </div>

            {/* Statutory Compliance Health */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#0d131f] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Compliance Health</span>
                <span className={`rounded-lg p-2 ${data.kpis.complianceHealthScore >= 80 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  <ShieldCheck className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {data.kpis.complianceHealthScore}%
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium">
                  {data.kpis.overdueComplianceCount > 0 ? (
                    <span className="text-rose-400">{data.kpis.overdueComplianceCount} overdue requirements</span>
                  ) : (
                    <span className="text-emerald-400">All statutory filings on schedule</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: Critical Risks & Upcoming Deadlines Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Breakdown Panel */}
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-400" />
                  Contract Lifecycles
                </h3>
                <Link href="/app/legal/contracts" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                  View All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {Object.entries(data.charts.contractsByStatus).map(([status, count]) => {
                  const total = Object.values(data.charts.contractsByStatus).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  let colorClass = "bg-slate-600";
                  if (status === "ACTIVE") colorClass = "bg-emerald-500";
                  if (status === "PENDING_APPROVAL") colorClass = "bg-amber-500";
                  if (status === "UNDER_REVIEW") colorClass = "bg-blue-500";
                  if (status === "EXPIRING_SOON") colorClass = "bg-orange-500";
                  if (status === "EXPIRED" || status === "TERMINATED") colorClass = "bg-rose-500";

                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">{status.replace("_", " ")}</span>
                        <span className="text-slate-200 font-bold">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Risk Level Gauge */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                    Risk Register Severity
                  </span>
                  <Link href="/app/legal/risks" className="text-xs text-rose-400 hover:text-rose-300">
                    Matrix
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2">
                    <div className="text-lg font-bold text-rose-400">{data.charts.risksByLevel.CRITICAL || 0}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Critical</div>
                  </div>
                  <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-2">
                    <div className="text-lg font-bold text-orange-400">{data.charts.risksByLevel.HIGH || 0}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">High</div>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
                    <div className="text-lg font-bold text-amber-400">{data.charts.risksByLevel.MEDIUM || 0}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Medium</div>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                    <div className="text-lg font-bold text-emerald-400">{data.charts.risksByLevel.LOW || 0}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Low</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines (Next 7 Days) */}
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Statutory & Legal Deadlines
                </h3>
                <Link href="/app/legal/deadlines" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  View All ({data.kpis.pendingDeadlinesCount}) <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {data.upcomingDeadlines.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400 mb-1" />
                  No urgent deadlines in the next 7 days.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.upcomingDeadlines.map((dl) => (
                    <div
                      key={dl.id}
                      className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-200 line-clamp-1">{dl.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>Due: {formatDate(dl.dueDate)}</span>
                            {dl.owner && <span>• {dl.owner.firstName} {dl.owner.lastName}</span>}
                          </div>
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            dl.priority === "CRITICAL"
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : dl.priority === "HIGH"
                              ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                              : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {dl.priority}
                        </span>
                      </div>
                      {dl.contract && (
                        <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <Link href={`/app/legal/contracts/${dl.contractId}`} className="hover:underline">
                            {dl.contract.contractNumber} - {dl.contract.title}
                          </Link>
                        </div>
                      )}
                      {dl.case && (
                        <div className="mt-2 text-[10px] text-purple-400 flex items-center gap-1">
                          <Scale className="h-3 w-3" />
                          <Link href={`/app/legal/cases/${dl.caseId}`} className="hover:underline">
                            {dl.case.caseNumber} - {dl.case.title}
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Real-time Activity Stream */}
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Legal Audit Trail
                </h3>
                <span className="text-[11px] text-slate-400">Recent events</span>
              </div>

              {data.recentActivities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No activity recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentActivities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <div className="mt-0.5 rounded-full bg-slate-800 p-1 text-slate-400">
                        <Activity className="h-3 w-3" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-slate-300 font-medium leading-relaxed">{act.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>{formatDate(act.createdAt)}</span>
                          {act.performedBy && (
                            <span>by {act.performedBy.firstName} {act.performedBy.lastName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Footer Bar */}
          <div className="rounded-xl border border-slate-800 bg-[#0a0f1d] p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Legal Governance Actions:</span> Execute workflows with full tenant auditability.
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/app/legal/contracts/new"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-amber-400" />
                Draft Contract
              </Link>
              <Link
                href="/app/legal/cases"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <Scale className="h-3.5 w-3.5 text-purple-400" />
                Open Litigation Case
              </Link>
              <Link
                href="/app/legal/compliance"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Record Compliance
              </Link>
              <Link
                href="/app/legal/risks"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                Add Risk Item
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
