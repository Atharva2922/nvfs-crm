"use client";

import React from "react";
import Link from "next/link";
import {
  Scale,
  FileCheck,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface AttentionItem {
  id: string;
  item: string;
  type: string;
  owner: string;
  dueDate: Date | string | null;
  risk: string;
  status: string;
  href: string;
}

interface CeoLegalComplianceProps {
  overview: {
    activeContractsCount: number;
    expiringSoonCount: number;
    openCasesCount: number;
    criticalRisksCount: number;
    complianceOverdueCount: number;
    attentionItems: AttentionItem[];
  };
}

export function CeoLegalCompliance({ overview }: CeoLegalComplianceProps) {
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
      case "EXPIRING":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-400" />
            Legal, Regulatory & Corporate Governance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active commercial covenants, pending litigation exposures, and regulatory audit compliance.
          </p>
        </div>

        <Link
          href="/app/legal"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          Legal Hub <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Active Contracts</span>
          <span className="text-lg font-bold text-white block mt-1">{overview.activeContractsCount}</span>
        </div>
        <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-3">
          <span className="text-[10px] uppercase font-semibold text-purple-400">Expiring Soon (30d)</span>
          <span className="text-lg font-bold text-purple-300 block mt-1">{overview.expiringSoonCount}</span>
        </div>
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
          <span className="text-[10px] uppercase font-semibold text-amber-400">Open Litigation</span>
          <span className="text-lg font-bold text-amber-300 block mt-1">{overview.openCasesCount}</span>
        </div>
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3">
          <span className="text-[10px] uppercase font-semibold text-rose-400">Critical Risks</span>
          <span className="text-lg font-bold text-rose-300 block mt-1">{overview.criticalRisksCount}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Compliance Overdue</span>
          <span className="text-lg font-bold text-rose-400 block mt-1">{overview.complianceOverdueCount}</span>
        </div>
      </div>

      {/* Legal Attention Required Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          Legal & Governance Attention Required
        </h3>

        {overview.attentionItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
            ✓ No immediate legal or regulatory attention items pending.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase font-semibold text-slate-400">
                    <th className="py-3 px-4">Item & Obligation</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Owner / Counsel</th>
                    <th className="py-3 px-3">Due / Expiry Date</th>
                    <th className="py-3 px-3 text-center">Risk Factor</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {overview.attentionItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white truncate max-w-[200px]">
                        <Link href={item.href} className="hover:text-blue-400 hover:underline">
                          {item.item}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-300">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{item.owner}</td>
                      <td className="py-3 px-3 text-slate-300 font-mono">
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString("en-IN") : "Indefinite"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border ${getRiskBadge(
                            item.risk
                          )}`}
                        >
                          {item.risk}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          Inspect <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
