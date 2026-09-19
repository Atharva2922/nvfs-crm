"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkflowExecutionHistory() {
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/workflows/executions?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setExecutions(json.data.executions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Success
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            <AlertCircle className="h-3 w-3" /> Partial
          </span>
        );
      case "SKIPPED":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {["ALL", "SUCCESS", "FAILED", "SKIPPED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition",
                statusFilter === st
                  ? "bg-slate-800 text-white font-semibold border border-slate-700"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={fetchExecutions}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh Log
        </button>
      </div>

      {/* Execution Logs List */}
      {loading && executions.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading execution audit telemetry...</div>
      ) : executions.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
          <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-400">No workflow execution logs recorded yet</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Logs appear here when events trigger active workflows.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {executions.map((exec) => {
            const isExpanded = expandedId === exec.id;
            const actions = typeof exec.actionsExecuted === "string"
              ? JSON.parse(exec.actionsExecuted || "[]")
              : exec.actionsExecuted || [];

            return (
              <div
                key={exec.id}
                className="rounded-xl border border-slate-800 bg-[#0f172a] text-xs transition hover:border-slate-700 overflow-hidden"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                  className="flex items-center justify-between p-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    {getStatusBadge(exec.status)}
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{exec.workflow?.name || "Automated Workflow"}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {exec.workflow?.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Trigger: <code className="text-blue-400">{exec.triggerEvent}</code></span>
                        <span>•</span>
                        <span>Domain: {exec.entityType}</span>
                        <span>•</span>
                        <span>{actions.length} action(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="font-mono text-[11px] text-slate-300">
                        {new Date(exec.executedAt).toLocaleTimeString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {exec.durationMs}ms
                      </div>
                    </div>
                    <ChevronDown
                      className={cn("h-4 w-4 text-slate-400 transition-transform", isExpanded && "rotate-180")}
                    />
                  </div>
                </div>

                {/* Expanded Action Execution Details */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/50 p-4 space-y-3">
                    {exec.error && (
                      <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs">
                        <span className="font-semibold">Execution Error: </span>
                        {exec.error}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Action Output Trail
                      </div>
                      {actions.length === 0 ? (
                        <div className="text-slate-500 text-xs">No actions executed for this event.</div>
                      ) : (
                        actions.map((act: any, aIdx: number) => (
                          <div
                            key={aIdx}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              {act.success ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                              )}
                              <span className="font-mono font-medium text-slate-300">{act.action}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {act.details ? JSON.stringify(act.details) : act.error || "Completed"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
