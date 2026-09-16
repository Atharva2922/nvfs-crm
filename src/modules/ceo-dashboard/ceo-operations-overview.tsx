"use client";

import React from "react";
import Link from "next/link";
import {
  Layers,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface DelayedOperation {
  id: string;
  name: string;
  operationCode: string;
  clientName: string;
  clientId?: string;
  ownerName: string;
  progress: number;
  expectedCompletionDate: Date | string;
  daysDelayed: number;
  priority?: string;
  riskLevel?: string;
  status: string;
}

interface CeoOperationsOverviewProps {
  statusCounts: {
    PLANNING: number;
    SCHEDULED: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    COMPLETED: number;
    DELAYED: number;
  };
  delayedOperations: DelayedOperation[];
  criticalIssuesCount: number;
}

export function CeoOperationsOverview({
  statusCounts,
  delayedOperations,
  criticalIssuesCount,
}: CeoOperationsOverviewProps) {
  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case "CRITICAL":
        return "bg-red-500/15 text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "MEDIUM":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-400" />
            Operations & Service Delivery Execution
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational bottlenecks, delay telemetry, and critical risk exposure across client engagements.
          </p>
        </div>

        <Link
          href="/app/operations"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          Operations Hub <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Operational Status Pill Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400">1. Planning</span>
          <span className="text-lg font-bold text-white block mt-1">{statusCounts.PLANNING}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400">2. Scheduled</span>
          <span className="text-lg font-bold text-cyan-400 block mt-1">{statusCounts.SCHEDULED}</span>
        </div>
        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3">
          <span className="text-[10px] uppercase font-semibold text-blue-400">3. In Progress</span>
          <span className="text-lg font-bold text-blue-300 block mt-1">{statusCounts.IN_PROGRESS}</span>
        </div>
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
          <span className="text-[10px] uppercase font-semibold text-amber-400">4. On Hold</span>
          <span className="text-lg font-bold text-amber-300 block mt-1">{statusCounts.ON_HOLD}</span>
        </div>
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3">
          <span className="text-[10px] uppercase font-semibold text-rose-400 flex items-center gap-1">
            <Clock className="h-3 w-3 text-rose-400" /> 5. Delayed
          </span>
          <span className="text-lg font-bold text-rose-300 block mt-1">{statusCounts.DELAYED}</span>
        </div>
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3">
          <span className="text-[10px] uppercase font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> 6. Delivered
          </span>
          <span className="text-lg font-bold text-emerald-300 block mt-1">{statusCounts.COMPLETED}</span>
        </div>
      </div>

      {/* Delayed Operations Attention Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Operations Requiring Executive Intervention ({delayedOperations.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Sorted by duration delayed</span>
        </div>

        {delayedOperations.length === 0 ? (
          <div className="py-8 text-center text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
            ✓ All active operations and projects are currently proceeding on schedule.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase font-semibold text-slate-400">
                    <th className="py-3 px-4">Operation & Code</th>
                    <th className="py-3 px-3">Client / Engagement</th>
                    <th className="py-3 px-3">Owner</th>
                    <th className="py-3 px-3 text-center">Progress</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3 text-center">Delay</th>
                    <th className="py-3 px-3 text-center">Risk Level</th>
                    <th className="py-3 px-4 text-right">Drill-down</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {delayedOperations.slice(0, 6).map((op) => (
                    <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/app/operations/${op.id}`}
                          className="font-semibold text-white hover:text-blue-400 hover:underline block truncate max-w-[180px]"
                        >
                          {op.name}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-mono">{op.operationCode}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 truncate max-w-[140px]">{op.clientName}</td>
                      <td className="py-3 px-3 text-slate-300">{op.ownerName}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${op.progress}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">{op.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono">
                        {new Date(op.expectedCompletionDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 font-bold text-[10px]">
                          +{op.daysDelayed}d
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border ${getRiskBadge(
                            op.riskLevel
                          )}`}
                        >
                          {op.riskLevel || "NORMAL"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/app/operations/${op.id}`}
                          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          Review <ExternalLink className="h-2.5 w-2.5" />
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
