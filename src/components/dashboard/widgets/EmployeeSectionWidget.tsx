"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  ArrowRight,
  ArrowUpRight,
  Building,
  Briefcase,
  Network,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface EmployeeRosterItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  departmentName: string | null;
  roleCode: string | null;
  avatarUrl?: string | null;
  employmentStatus: string;
}

export interface EmployeeSectionWidgetProps {
  companyName: string;
  companyCode?: string;
  summary?: {
    totalCount: number;
    activeCount: number;
    departmentsCount: number;
    recentEmployees: EmployeeRosterItem[];
  };
  canAddEmployee?: boolean;
}

export function EmployeeSectionWidget({
  companyName,
  companyCode,
  summary,
  canAddEmployee = true,
}: EmployeeSectionWidgetProps) {
  const employees = summary?.recentEmployees || [];
  const totalCount = summary?.totalCount || employees.length;
  const activeCount = summary?.activeCount || employees.length;
  const departmentsCount = summary?.departmentsCount || 0;

  const isVenture = companyCode === "NFVS" || companyName.toLowerCase().includes("venture");

  const getRoleBadgeColor = (role?: string | null) => {
    switch (role) {
      case "SUPER_ADMIN":
      case "CHAIRPERSON":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "CEO":
      case "CTO":
      case "COO":
      case "CFO":
      case "CMO":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "HR":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "ADMIN":
        return "bg-teal-500/10 text-teal-400 border-teal-500/30";
      case "DEPARTMENT_HEAD":
      case "MANAGER":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      default:
        return "bg-slate-800/80 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 p-6 shadow-sm hover:shadow-md transition-all space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-sm ${
              isVenture
                ? "bg-blue-500/10 border-blue-500/30 text-blue-500 dark:text-blue-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400"
            }`}
          >
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Corporate Employees & Staff Directory
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase font-mono ${
                  isVenture
                    ? "bg-blue-500/15 border-blue-400/40 text-blue-400"
                    : "bg-emerald-500/15 border-emerald-400/40 text-emerald-400"
                }`}
              >
                {companyName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live corporate roster, designations, and departmental assignments scoped to this company.
            </p>
          </div>
        </div>

        {/* Action Buttons for Easy Access */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/app/hr/hierarchy"
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <Network className="h-3.5 w-3.5 text-slate-400" />
            <span>Org Tree</span>
          </Link>

          {canAddEmployee && (
            <Link
              href="/app/hr/employees"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shadow-xs ${
                isVenture
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ Add Employee</span>
            </Link>
          )}

          <Link
            href="/app/hr/employees"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
          >
            <span>View Full Directory</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 p-3">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Staff
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {totalCount}
            </span>
            <span className="text-[10px] text-slate-400">Personnel</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 p-3">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Active Status
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {activeCount}
            </span>
            <span className="text-[10px] text-emerald-500/80">Active</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 p-3">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Operating Units
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {departmentsCount || 1}
            </span>
            <span className="text-[10px] text-slate-400">Departments</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 p-3">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            HR Oversight
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-blue-600 dark:text-amber-400 font-mono">
              100%
            </span>
            <span className="text-[10px] text-slate-400">RBAC Compliant</span>
          </div>
        </div>
      </div>

      {/* Employee Cards Grid */}
      {employees.length === 0 ? (
        <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
          <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No employee records in {companyName}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Onboard new team members using the Add Employee button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {employees.map((emp) => {
            const role = emp.roleCode || "EMPLOYEE";
            const badgeStyle = getRoleBadgeColor(role);

            return (
              <Link
                key={emp.id}
                href="/app/hr/employees"
                className="group relative rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 hover:border-blue-500/50 dark:hover:border-amber-500/40 hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-md block"
              >
                <div className="flex items-start justify-between gap-2">
                  <Avatar
                    name={`${emp.firstName} ${emp.lastName}`}
                    size="md"
                    className="ring-2 ring-slate-200 dark:ring-slate-800 group-hover:ring-blue-500/50 dark:group-hover:ring-amber-500/50 transition-all"
                  />
                  <div className="flex items-center gap-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-wider ${badgeStyle}`}
                    >
                      {role}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="mt-2.5 space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors truncate">
                    {emp.firstName} {emp.lastName}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    {emp.designation}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="truncate flex items-center gap-1">
                    <Building className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                    <span className="truncate">{emp.departmentName || "General"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Active</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer link to directory */}
      <div className="pt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          Showing personnel in <strong className="text-slate-700 dark:text-slate-200">{companyName}</strong>
        </span>
        <Link
          href="/app/hr/employees"
          className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-amber-400 hover:underline"
        >
          <span>Open Full HR Directory ({totalCount} Staff)</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
