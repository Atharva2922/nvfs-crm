"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Info, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExecutiveAlertItem {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  sourceModule?: string;
  actionUrl?: string;
  timestamp?: string;
}

export interface ExecutiveAlertCardProps {
  alerts: ExecutiveAlertItem[];
  title?: string;
}

export function ExecutiveAlertCard({
  alerts,
  title = "Executive Action Items & Critical Alerts",
}: ExecutiveAlertCardProps) {
  const getSeverityIcon = (severity: ExecutiveAlertItem["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-400 shrink-0" />;
    }
  };

  const getSeverityBadge = (severity: ExecutiveAlertItem["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="rounded border border-rose-500/30 bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-400">
            Critical
          </span>
        );
      case "WARNING":
        return (
          <span className="rounded border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-400">
            Warning
          </span>
        );
      default:
        return (
          <span className="rounded border border-blue-500/30 bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-400">
            Info
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {title}
          </h4>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
          {alerts.length} Active
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          No critical system alerts or risk breaches at this time. All operating thresholds nominal.
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {alerts.map((alert) => {
            const rowContent = (
              <div
                key={alert.id}
                className={cn(
                  "group flex items-start justify-between gap-3 py-3 px-2 rounded-lg transition-colors",
                  alert.actionUrl && "hover:bg-slate-800/40 cursor-pointer"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {alert.title}
                      </span>
                      {getSeverityBadge(alert.severity)}
                      {alert.sourceModule && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          • {alert.sourceModule}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                </div>

                {alert.actionUrl && (
                  <ExternalLink className="h-3.5 w-3.5 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
                )}
              </div>
            );

            if (alert.actionUrl) {
              return (
                <Link key={alert.id} href={alert.actionUrl}>
                  {rowContent}
                </Link>
              );
            }
            return rowContent;
          })}
        </div>
      )}
    </div>
  );
}
