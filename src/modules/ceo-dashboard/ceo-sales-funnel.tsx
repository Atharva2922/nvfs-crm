"use client";

import React from "react";
import Link from "next/link";
import {
  Briefcase,
  IndianRupee,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
} from "lucide-react";

interface SalesMetrics {
  newLeads: number;
  activeOpportunities: number;
  wonDeals: number;
  lostDeals: number;
  pipelineValue: number;
  closedRevenue: number;
  conversionRate: number;
}

interface FunnelStage {
  count: number;
  value: number;
}

interface TopCustomer {
  id: string;
  name: string;
  tier: string;
  revenue: number;
  activeDeals: number;
  activeOperations: number;
  openIssues: number;
  outstandingBalance: number;
}

interface CeoSalesFunnelProps {
  metrics: SalesMetrics;
  funnel: Record<string, FunnelStage>;
  topCustomers: TopCustomer[];
}

export function CeoSalesFunnel({ metrics, funnel, topCustomers }: CeoSalesFunnelProps) {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const stages = [
    { key: "LEAD", label: "Leads", count: funnel.LEAD?.count || 0, value: funnel.LEAD?.value || 0, color: "bg-blue-500", text: "text-blue-400" },
    { key: "DISCOVERY", label: "Discovery / Qualified", count: funnel.DISCOVERY?.count || 0, value: funnel.DISCOVERY?.value || 0, color: "bg-cyan-500", text: "text-cyan-400" },
    { key: "PROPOSAL", label: "Proposal Submitted", count: funnel.PROPOSAL?.count || 0, value: funnel.PROPOSAL?.value || 0, color: "bg-purple-500", text: "text-purple-400" },
    { key: "NEGOTIATION", label: "Contract Negotiation", count: funnel.NEGOTIATION?.count || 0, value: funnel.NEGOTIATION?.value || 0, color: "bg-amber-500", text: "text-amber-400" },
    { key: "CLOSED_WON", label: "Closed Won", count: funnel.CLOSED_WON?.count || 0, value: funnel.CLOSED_WON?.value || 0, color: "bg-emerald-500", text: "text-emerald-400" },
    { key: "CLOSED_LOST", label: "Closed Lost", count: funnel.CLOSED_LOST?.count || 0, value: funnel.CLOSED_LOST?.value || 0, color: "bg-rose-500", text: "text-rose-400" },
  ];

  const maxFunnelCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-400" />
            CRM Pipeline & Enterprise Sales Funnel
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Stage-by-stage deal conversion, weighted enterprise pipeline value, and key account portfolio.
          </p>
        </div>

        <Link
          href="/app/crm"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          View Full CRM Hub <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Sales KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400">New Leads</span>
          <span className="text-lg font-bold text-white block mt-1">{metrics.newLeads}</span>
        </div>
        <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Active Deals</span>
          <span className="text-lg font-bold text-blue-400 block mt-1">{metrics.activeOpportunities}</span>
        </div>
        <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Pipeline Value</span>
          <span className="text-lg font-bold text-amber-400 block mt-1">{formatINR(metrics.pipelineValue)}</span>
        </div>
        <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Won Deals</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1">{metrics.wonDeals}</span>
        </div>
        <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Closed Revenue</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1">{formatINR(metrics.closedRevenue)}</span>
        </div>
        <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Lost Deals</span>
          <span className="text-lg font-bold text-rose-400 block mt-1">{metrics.lostDeals}</span>
        </div>
        <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Win Rate</span>
          <span className="text-lg font-bold text-indigo-400 block mt-1">{metrics.conversionRate}%</span>
        </div>
      </div>

      {/* Funnel Visualization & Top Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Sales Funnel Bars (5 columns) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-blue-400" />
            Conversion Funnel Stages
          </h3>

          <div className="space-y-3">
            {stages.map((stage) => {
              const widthPct = Math.min(100, Math.max(12, (stage.count / maxFunnelCount) * 100));
              return (
                <div key={stage.key} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">{stage.label}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {stage.count} deals • {formatINR(stage.value)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stage.color} transition-all duration-300`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Accounts Portfolio Table (7 columns) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Top Customer Accounts by Revenue
            </h3>
            <span className="text-[10px] text-slate-500">Business visibility</span>
          </div>

          {topCustomers.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No client records available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-semibold text-slate-400">
                    <th className="pb-2">Customer Account</th>
                    <th className="pb-2">Tier</th>
                    <th className="pb-2 text-right">Revenue</th>
                    <th className="pb-2 text-center">Active Deals</th>
                    <th className="pb-2 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {topCustomers.slice(0, 5).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-medium text-white truncate max-w-[140px]">
                        <Link href={`/app/crm/clients/${c.id}`} className="hover:text-blue-400 hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-2.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-300">
                          {c.tier}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-emerald-400">{formatINR(c.revenue)}</td>
                      <td className="py-2.5 text-center text-slate-300">{c.activeDeals}</td>
                      <td className="py-2.5 text-right font-mono text-amber-400">
                        {c.outstandingBalance > 0 ? formatINR(c.outstandingBalance) : "Settled"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
