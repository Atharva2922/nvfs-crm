"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExecutiveKpiCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  changePercent?: number | null;
  changeLabel?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  drillDownUrl?: string;
  subtitle?: string;
  statusColor?: "blue" | "emerald" | "amber" | "rose" | "teal" | "purple";
}

export function ExecutiveKpiCard({
  title,
  value,
  prefix = "",
  suffix = "",
  changePercent,
  changeLabel = "vs prior window",
  icon,
  iconBgColor = "bg-blue-600/20 text-blue-400",
  drillDownUrl,
  subtitle,
  statusColor = "blue",
}: ExecutiveKpiCardProps) {
  const content = (
    <div
      className={cn(
        "group relative rounded-xl border border-slate-800 bg-[#0f172a] p-4.5 shadow-sm transition-all hover:border-slate-700",
        drillDownUrl && "hover:border-blue-500/40 hover:bg-[#101b33]/80 cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110", iconBgColor)}>
          {icon}
        </div>
      </div>

      <div className="mt-2.5">
        <h3 className="text-2xl font-bold tracking-tight text-white">
          {prefix}
          {typeof value === "number" ? value.toLocaleString() : value}
          {suffix}
        </h3>

        <div className="mt-1 flex items-center justify-between text-[11px]">
          {changePercent !== null && changePercent !== undefined ? (
            <div
              className={cn(
                "flex items-center gap-0.5 font-medium",
                changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {changePercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>{Math.abs(changePercent)}%</span>
              <span className="text-slate-500 ml-1">{changeLabel}</span>
            </div>
          ) : subtitle ? (
            <span className="text-slate-400">{subtitle}</span>
          ) : (
            <span className="text-slate-500 font-mono">Recorded in ledger</span>
          )}

          {drillDownUrl && (
            <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
          )}
        </div>
      </div>
    </div>
  );

  if (drillDownUrl) {
    return <Link href={drillDownUrl}>{content}</Link>;
  }

  return content;
}
