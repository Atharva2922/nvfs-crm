"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CrmNav } from "@/modules/crm/components/crm-nav";
import {
  Building,
  TrendingUp,
  UserCheck,
  IndianRupee,
  Briefcase,
  ArrowUpRight,
  Clock,
  Phone,
  Mail,
  Calendar,
  FileText,
  Plus,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PipelineMetrics {
  openCount: number;
  openValue: number;
  weightedForecast: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  winRate: number;
  stageBreakdown: Record<string, { count: number; value: number }>;
}

export default function CrmCockpitPage() {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [clientsCount, setClientsCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCockpitData = async () => {
    try {
      setLoading(true);
      const [metRes, cliRes, leadRes] = await Promise.all([
        fetch("/api/crm/opportunities/metrics"),
        fetch("/api/crm/clients?limit=5"),
        fetch("/api/crm/leads?limit=5"),
      ]);

      const [metData, cliData, leadData] = await Promise.all([
        metRes.json(),
        cliRes.json(),
        leadRes.json(),
      ]);

      if (metData.success) setMetrics(metData.data);
      if (cliData.success) {
        setRecentClients(cliData.data.clients.slice(0, 4));
        setClientsCount(cliData.data.clients.length);
      }
      if (leadData.success) {
        setRecentLeads(leadData.data.leads.slice(0, 4));
        setLeadsCount(leadData.data.leads.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCockpitData();
  }, []);

  return (
    <div className="space-y-6">
      <CrmNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Customer Relationship Management (CRM)"
          description="Enterprise client accounts, multi-channel customer activity, lead conversion pipeline, and revenue forecasting."
        />
        <div className="flex items-center gap-2">
          <Link
            href="/app/crm/leads"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>Capture Lead</span>
          </Link>
          <Link
            href="/app/crm/clients"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Client</span>
          </Link>
        </div>
      </div>

      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Open Pipeline Value</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">
            ₹{metrics ? metrics.openValue.toLocaleString() : "..."}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics ? `${metrics.openCount} active opportunities` : "Loading..."}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Weighted Forecast</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">
            ₹{metrics ? metrics.weightedForecast.toLocaleString() : "..."}
          </h3>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-3 w-3" />
            <span>Probability-weighted close value</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Win Rate</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">
            {metrics ? `${metrics.winRate}%` : "..."}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics ? `${metrics.wonCount} won / ${metrics.wonCount + metrics.lostCount} closed` : "Loading..."}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Corporate Clients</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-400">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">
            {clientsCount}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {leadsCount} inbound leads in pipeline
          </p>
        </div>
      </div>

      {/* Pipeline Stage Distribution Card */}
      {metrics && (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Sales Pipeline Stage Distribution
            </h4>
            <Link
              href="/app/crm/opportunities"
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Open Kanban Pipeline →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: "DISCOVERY", label: "Discovery", color: "bg-blue-500", prob: "25%" },
              { key: "PROPOSAL", label: "Proposal", color: "bg-indigo-500", prob: "50%" },
              { key: "NEGOTIATION", label: "Negotiation", color: "bg-amber-500", prob: "75%" },
              { key: "CLOSED_WON", label: "Closed Won", color: "bg-emerald-500", prob: "100%" },
              { key: "CLOSED_LOST", label: "Closed Lost", color: "bg-slate-600", prob: "0%" },
            ].map((stage) => {
              const item = metrics.stageBreakdown[stage.key] || { count: 0, value: 0 };
              return (
                <div
                  key={stage.key}
                  className="rounded-lg border border-slate-800/80 bg-[#0c1322] p-3 text-left"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold uppercase">{stage.label}</span>
                    <span className="font-mono text-slate-500">{stage.prob}</span>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    ₹{item.value.toLocaleString()}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {item.count} deal(s)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Grid: Top Corporate Clients & Inbound Prospects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Corporate Clients */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Corporate Client Accounts
              </h4>
            </div>
            <Link
              href="/app/crm/clients"
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              View Directory →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {recentClients.map((client) => (
              <Link
                key={client.id}
                href={`/app/crm/clients/${client.id}`}
                className="group flex items-center justify-between py-3 hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {client.name}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                      {client.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{client.industry || "General Industry"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[9px] font-semibold uppercase",
                      client.status === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    )}
                  >
                    {client.status}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Inbound Prospect Leads */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Inbound Sales Leads
              </h4>
            </div>
            <Link
              href="/app/crm/leads"
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Manage Leads →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between py-3 px-2 rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      {lead.firstName} {lead.lastName}
                    </span>
                    <span className="text-[11px] text-slate-400">({lead.companyName})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {lead.jobTitle || "Prospect"} • {lead.source}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-slate-300">
                    ₹{lead.estimatedValue ? lead.estimatedValue.toLocaleString() : "0"}
                  </span>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[9px] font-semibold uppercase",
                      lead.status === "QUALIFIED"
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        : lead.status === "CONVERTED"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    )}
                  >
                    {lead.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
