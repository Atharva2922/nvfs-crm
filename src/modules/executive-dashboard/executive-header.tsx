"use client";

import React from "react";
import { Sparkles, Calendar, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExecutiveHeaderProps {
  title: string;
  roleBadge: string;
  description: string;
  organizationName: string;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  onRefresh: () => void;
  onExport: (format: "csv" | "json") => void;
  isRefreshing?: boolean;
}

export function ExecutiveHeader({
  title,
  roleBadge,
  description,
  organizationName,
  dateRange,
  onDateRangeChange,
  onRefresh,
  onExport,
  isRefreshing = false,
}: ExecutiveHeaderProps) {
  const dateRanges = [
    { key: "TODAY", label: "Today" },
    { key: "THIS_WEEK", label: "This Week" },
    { key: "THIS_MONTH", label: "This Month" },
    { key: "THIS_QUARTER", label: "This Quarter" },
    { key: "THIS_YEAR", label: "This Year" },
    { key: "LAST_7_DAYS", label: "Last 7 Days" },
    { key: "LAST_30_DAYS", label: "Last 30 Days" },
    { key: "LAST_90_DAYS", label: "Last 90 Days" },
  ];

  return (
    <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
          <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
            {roleBadge}
          </span>
          <span className="hidden sm:inline-flex rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] font-mono text-slate-300">
            {organizationName}
          </span>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl">{description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Date Preset Selector */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5">
          <Calendar className="ml-2 h-3.5 w-3.5 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="bg-transparent px-2.5 py-1 text-xs font-medium text-slate-200 outline-none cursor-pointer"
          >
            {dateRanges.map((r) => (
              <option key={r.key} value={r.key} className="bg-slate-900 text-slate-200">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Refresh Dashboard"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-blue-400")} />
        </button>

        {/* Export Buttons */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5">
          <button
            onClick={() => onExport("csv")}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => onExport("json")}
            className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            JSON
          </button>
        </div>

        {/* Live Telemetry Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Realtime Telemetry</span>
        </div>
      </div>
    </div>
  );
}
