"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Download,
  Calendar,
  Search,
  Bell,
  Sparkles,
  ChevronDown,
  Building2,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CeoDashboardFilters } from "@/services/ceo-dashboard.service";

interface CeoHeaderProps {
  organizationName: string;
  asOf: string;
  filters: CeoDashboardFilters;
  onFilterChange: (filters: CeoDashboardFilters) => void;
  onRefresh: () => void;
  loading: boolean;
  currentUser?: any;
}

export function CeoHeader({
  organizationName,
  asOf,
  filters,
  onFilterChange,
  onRefresh,
  loading,
  currentUser,
}: CeoHeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const dateRangeLabels: Record<string, string> = {
    TODAY: "Today",
    THIS_WEEK: "This Week",
    THIS_MONTH: "This Month",
    THIS_QUARTER: "This Quarter",
    THIS_YEAR: "This Year",
    CUSTOM: "Custom Range",
  };

  const handleRangeSelect = (range: CeoDashboardFilters["dateRange"]) => {
    if (range === "CUSTOM") {
      setCustomOpen(true);
    } else {
      setCustomOpen(false);
      onFilterChange({ ...filters, dateRange: range, startDate: undefined, endDate: undefined });
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      onFilterChange({
        ...filters,
        dateRange: "CUSTOM",
        startDate: customStart,
        endDate: customEnd,
      });
      setCustomOpen(false);
    }
  };

  const handleDownload = (format: "json" | "csv") => {
    setExportOpen(false);
    const params = new URLSearchParams();
    if (filters.dateRange) params.set("dateRange", filters.dateRange);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    params.set("format", format);

    window.open(`/api/dashboard/ceo/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0c121e] via-[#0f172a] to-[#0c121e] p-6 shadow-xl space-y-5">
      {/* Top Bar: Company Identity, Title, Search, User */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="gold" size="sm" className="gap-1.5 font-bold tracking-wider">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>EXECUTIVE OFFICE</span>
            </Badge>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Building2 className="h-3.5 w-3.5 text-blue-400" />
              {organizationName}
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            CEO Executive Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry across revenue, operations, workforce, CRM, procurement, and legal governance.
          </p>
        </div>

        {/* Action Controls: Refresh, Export, Notifications, Date Range */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700/60 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh dashboard telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700/60 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export Report</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-[#0d1527] p-1.5 shadow-2xl z-50 space-y-1">
                <button
                  onClick={() => handleDownload("csv")}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white text-left transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  <span>Executive CSV Report</span>
                </button>
                <button
                  onClick={() => handleDownload("json")}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white text-left transition-colors"
                >
                  <FileCode className="h-4 w-4 text-blue-400" />
                  <span>Consolidated JSON Dump</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications shortcut */}
          <Link
            href="/app/notifications"
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-700/80 bg-slate-800/60 text-slate-300 hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Link>

          {/* User Profile Pill */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300 font-medium">
              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[10px] text-white">
                {currentUser.employee?.firstName?.[0] || "C"}
              </div>
              <span>
                {currentUser.employee ? `${currentUser.employee.firstName} ${currentUser.employee.lastName}` : "CEO"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar: Live Timestamp & Date Range Selector */}
      <div className="pt-4 border-t border-slate-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Telemetry</span>
          <span className="text-slate-600">•</span>
          <span>Last sync: {asOf ? new Date(asOf).toLocaleTimeString("en-IN") : "Just now"}</span>
        </div>

        {/* Date range filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          {(["TODAY", "THIS_WEEK", "THIS_MONTH", "THIS_QUARTER", "THIS_YEAR"] as const).map((r) => {
            const isSelected = (filters.dateRange || "THIS_MONTH") === r;
            return (
              <button
                key={r}
                onClick={() => handleRangeSelect(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                {dateRangeLabels[r]}
              </button>
            );
          })}
          <button
            onClick={() => handleRangeSelect("CUSTOM")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              filters.dateRange === "CUSTOM"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>Custom</span>
          </button>
        </div>
      </div>

      {/* Custom Range Popover Modal */}
      {customOpen && (
        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl mt-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleApplyCustom} className="flex flex-col sm:flex-row items-end gap-3 text-xs">
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-slate-300 font-medium">Start Date</label>
              <input
                type="date"
                required
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-slate-300 font-medium">End Date</label>
              <input
                type="date"
                required
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                Apply Range
              </button>
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-medium text-slate-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
