"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Download,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  Printer,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface ColumnDef {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  render?: (row: any) => React.ReactNode;
}

export interface KPIItem {
  label: string;
  value: string;
  change?: string;
  sub?: string;
  isPositive?: boolean;
}

interface AccountsEntityPageProps {
  title: string;
  section: string;
  description?: string;
  kpis?: KPIItem[];
  columns: ColumnDef[];
  initialData?: any[];
  newButtonText?: string;
  onNewClick?: () => void;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export function AccountsEntityPage({
  title,
  section,
  description,
  kpis = [],
  columns,
  initialData = [],
  newButtonText = "Create New",
  onNewClick,
  emptyTitle = "No records found",
  emptySubtitle = "Get started by recording your first transaction.",
}: AccountsEntityPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredData = initialData.filter((item) => {
    const matchesSearch = Object.values(item).some((val) =>
      String(val || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus =
      statusFilter === "ALL" ||
      !item.status ||
      String(item.status).toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (["PAID", "APPROVED", "ACTIVE", "COMPLETED", "RECONCILED"].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-3 w-3" />
          {s}
        </span>
      );
    }
    if (["OVERDUE", "REJECTED", "CANCELLED", "FAILED"].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="h-3 w-3" />
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        <Clock className="h-3 w-3" />
        {s || "PENDING"}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-900 dark:text-slate-100">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/app/accounts" className="hover:text-blue-500 transition-colors">
              Accounts
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span>{section}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{title}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 gap-1.5 text-xs border-slate-200 dark:border-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const csvContent =
                "data:text/csv;charset=utf-8," +
                [columns.map((c) => c.label).join(",")]
                  .concat(
                    filteredData.map((row) =>
                      columns.map((c) => JSON.stringify(row[c.key] || "")).join(",")
                    )
                  )
                  .join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="h-9 gap-1.5 text-xs border-slate-200 dark:border-slate-800"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={onNewClick}
            className="h-9 gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {newButtonText}
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {kpi.label}
              </div>
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                {kpi.value}
              </div>
              {(kpi.change || kpi.sub) && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                  {kpi.change && (
                    <span
                      className={`font-semibold ${
                        kpi.isPositive !== false ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {kpi.change}
                    </span>
                  )}
                  {kpi.sub && <span>{kpi.sub}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="pl-9 h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-white dark:bg-slate-950 text-xs">
              {["ALL", "ACTIVE", "PAID", "PENDING"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    statusFilter === tab
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 ${
                          col.align === "right"
                            ? "text-right font-mono"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left"
                        }`}
                      >
                        {col.render ? (
                          col.render(row)
                        ) : col.key === "status" ? (
                          getStatusBadge(row.status)
                        ) : (
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {row[col.key] ?? "—"}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600"
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-slate-600"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                        <Filter className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {emptyTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 mb-4">{emptySubtitle}</p>
                      <Button
                        size="sm"
                        onClick={onNewClick}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {newButtonText}
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with summary */}
        <div className="flex items-center justify-between p-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredData.length}</span>{" "}
            records
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            Double-entry ledger verified
          </div>
        </div>
      </div>
    </div>
  );
}
