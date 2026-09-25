"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building,
  Plus,
  Search,
  CheckCircle2,
  Power,
  ExternalLink,
  Settings,
  ArrowLeft,
  Users,
  Layers,
  Calendar,
  MoreVertical,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanyWizardModal } from "./company-wizard-modal";
import { useAuth } from "@/components/providers/auth-provider";

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

interface CompanyManagementViewProps {
  initialCompanies: CompanyItem[];
}

export function CompanyManagementView({ initialCompanies }: CompanyManagementViewProps) {
  const { switchCompany } = useAuth();
  const [companies, setCompanies] = useState<CompanyItem[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const refreshCompanies = async () => {
    try {
      const res = await fetch("/api/super-admin/companies");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.companies) {
          setCompanies(json.data.companies);
        }
      }
    } catch (err) {
      console.error("Failed to refresh companies list:", err);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/app/super-admin"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Building className="h-3 w-3" />
              <span>Platform Tenant Directory</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Company Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Provision, monitor, activate, and configure enterprise company tenants.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Launch Company Creation Wizard</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              All Companies ({filteredCompanies.length})
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company or code..."
                className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

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
                <th className="py-3 px-4">Users</th>
                <th className="py-3 px-4">Departments</th>
                <th className="py-3 px-4">Active Staff</th>
                <th className="py-3 px-4">Created</th>
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
                            {c.legalName || c.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">
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

                    <td className="py-3.5 px-4 font-mono text-slate-800 dark:text-slate-200">
                      {c.stats.usersCount}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {c.stats.departmentsCount}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {c.stats.activeUsersCount}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => switchCompany(c.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                          title="Switch Platform Context into Company"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Enter</span>
                        </button>

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

      {/* Creation Wizard Modal */}
      <CompanyWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCompanyCreated={refreshCompanies}
      />
    </div>
  );
}
