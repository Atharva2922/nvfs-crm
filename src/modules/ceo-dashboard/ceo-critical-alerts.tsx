"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  ArrowRight,
  ExternalLink,
  Layers,
  IndianRupee,
  Package,
  Scale,
} from "lucide-react";

interface CriticalAlert {
  id: string;
  title: string;
  category: "OPERATIONS" | "FINANCE" | "LEGAL" | "INVENTORY" | "APPROVAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  relatedRecord: string;
  owner: string;
  date: Date | string;
  href: string;
}

interface CeoCriticalAlertsProps {
  alerts: CriticalAlert[];
}

export function CeoCriticalAlerts({ alerts }: CeoCriticalAlertsProps) {
  if (!alerts || alerts.length === 0) return null;

  const getCategoryIcon = (category: CriticalAlert["category"]) => {
    switch (category) {
      case "OPERATIONS":
        return <Layers className="h-4 w-4 text-purple-400" />;
      case "FINANCE":
        return <IndianRupee className="h-4 w-4 text-emerald-400" />;
      case "INVENTORY":
        return <Package className="h-4 w-4 text-amber-400" />;
      case "LEGAL":
        return <Scale className="h-4 w-4 text-cyan-400" />;
      case "APPROVAL":
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    }
  };

  const getSeverityBadge = (severity: CriticalAlert["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "HIGH":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    }
  };

  return (
    <div className="rounded-2xl border border-red-900/40 bg-gradient-to-r from-red-950/20 via-slate-900/90 to-red-950/10 p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Critical Executive Alerts
              <span className="rounded-full bg-red-500/20 px-2 py-0.2 text-[10px] text-red-300 border border-red-500/30">
                {alerts.length} Requires Attention
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              High-priority friction points across operations, finance, inventory shortages, and covenants.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 flex flex-col justify-between space-y-2.5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {getCategoryIcon(alert.category)}
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border ${getSeverityBadge(
                    alert.severity
                  )}`}
                >
                  {alert.severity}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(alert.date).toLocaleDateString("en-IN")}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-white line-clamp-1">{alert.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                Record: <span className="text-slate-300">{alert.relatedRecord}</span> • Owner:{" "}
                <span className="text-slate-300">{alert.owner}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
              <Link
                href={alert.href}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Take Action <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
