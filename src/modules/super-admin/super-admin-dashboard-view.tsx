"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Server,
  Building,
  Users,
  Activity,
  ShieldAlert,
  HardDrive,
  Plus,
  Search,
  ExternalLink,
  Power,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { RolePermissionsPanel } from "./role-permissions-panel";
import { PersonaRoleAssignmentPanel } from "./persona-role-assignment-panel";

interface CompanyItem {
  id: string;
  name: string;
  code: string;
  legalName?: string | null;
  primaryColor: string;
  secondaryColor: string;
  industry?: string | null;
  status: string;
  createdAt: string;
  stats: {
    usersCount: number;
    activeUsersCount: number;
    departmentsCount: number;
    clientsCount: number;
    tasksCount: number;
    invoicesCount: number;
  };
}

interface SuperAdminDashboardProps {
  initialCompanies: CompanyItem[];
  platformMetrics: {
    totalCompanies: number;
    activeCompanies: number;
    totalUsers: number;
    activeUsers: number;
    systemHealth: string;
    apiLatencyMs: number;
    storageUsedGb: number;
    storageTotalGb: number;
    securityAlertsCount: number;
  };
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entity: string;
    createdAt: string;
    actor?: { email: string } | null;
    organization?: { name: string; code: string } | null;
  }>;
}

export function SuperAdminDashboardView({
  initialCompanies,
  platformMetrics,
  recentAuditLogs,
}: SuperAdminDashboardProps) {
  const { switchCompany } = useAuth();
  const [companies, setCompanies] = useState<CompanyItem[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (companyId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      setActionLoadingId(companyId);
      const res = await fetch("/api/super-admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, status: nextStatus }),
      });
      if (res.ok) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === companyId ? { ...c, status: nextStatus } : c))
        );
      }
    } catch (err) {
      console.error("Failed to toggle status", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Server className="h-3.5 w-3.5" />
            <span>Platform Administration Cockpit</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Super Admin Control Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Centralized platform governance, multi-company tenant health, and global audit oversight.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/super-admin/companies"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Provision New Company</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Companies */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Companies</span>
            <Building className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {platformMetrics.totalCompanies}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{platformMetrics.activeCompanies} Active Tenants</span>
          </div>
        </div>

        {/* Total Platform Users */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Users</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {platformMetrics.totalUsers}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {platformMetrics.activeUsers} active sessions recorded
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>System Health</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span>{platformMetrics.systemHealth}</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            API Latency: ~{platformMetrics.apiLatencyMs}ms
          </div>
        </div>

        {/* Storage & Cloud */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Storage Usage</span>
            <HardDrive className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {platformMetrics.storageUsedGb} <span className="text-sm font-normal text-slate-500">/ {platformMetrics.storageTotalGb} GB</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Database pool: 100% operational
          </div>
        </div>
      </div>

      {/* Main Section: Companies Overview Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Registered Companies
            </h2>
            <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400">
              {filteredCompanies.length}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company or code..."
                className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Staff & Users</th>
                <th className="py-3 px-4">Depts</th>
                <th className="py-3 px-4">Clients</th>
                <th className="py-3 px-4">Invoices</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredCompanies.map((c) => {
                const isActive = c.status === "ACTIVE";
                const isLoading = actionLoadingId === c.id;

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs text-white shadow-xs"
                          style={{ backgroundColor: c.primaryColor }}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {c.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {c.industry || "Enterprise"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                      {c.code}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isActive ? "bg-emerald-500" : "bg-rose-500"
                          )}
                        />
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {c.stats.usersCount} users
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {c.stats.departmentsCount}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {c.stats.clientsCount}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {c.stats.invoicesCount}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Switch / View Context */}
                        <button
                          onClick={() => switchCompany(c.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                          title="Switch Platform Context into Company"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Enter</span>
                        </button>

                        {/* Suspend / Activate Toggle */}
                        <button
                          onClick={() => handleToggleStatus(c.id, c.status)}
                          disabled={isLoading}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors border",
                            isActive
                              ? "border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
                              : "border-emerald-300 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                          )}
                        >
                          <Power className="h-3 w-3" />
                          <span>{isActive ? "Suspend" : "Activate"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Persona Role Assignment Panel */}
      <PersonaRoleAssignmentPanel />

      {/* Role Permissions Manager Panel */}
      <RolePermissionsPanel />

      {/* Bottom Section: Recent Audit Events */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Platform Audit Events
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Real-time security log</span>
        </div>

        <div className="space-y-2">
          {recentAuditLogs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  {log.action}
                </span>
                <span className="text-slate-600 dark:text-slate-300 truncate">
                  {log.entity} mutation
                </span>
                {log.organization && (
                  <span className="text-[11px] text-slate-400">
                    in <strong className="text-slate-700 dark:text-slate-200">{log.organization.name}</strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>{log.actor?.email || "System"}</span>
                <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
