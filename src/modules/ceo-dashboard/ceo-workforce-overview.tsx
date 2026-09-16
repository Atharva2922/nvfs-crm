"use client";

import React from "react";
import Link from "next/link";
import { Users, UserPlus, Briefcase, CheckSquare, ArrowRight, Building } from "lucide-react";

interface CeoWorkforceOverviewProps {
  totalEmployees: number;
  activeEmployees: number;
  newJoiners: number;
  assignedToOperations: number;
  openTasksCount: number;
  departments: Array<{ name: string; code: string; count: number }>;
}

export function CeoWorkforceOverview({
  totalEmployees,
  activeEmployees,
  newJoiners,
  assignedToOperations,
  openTasksCount,
  departments,
}: CeoWorkforceOverviewProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-400" />
            Executive Workforce & Capacity Overview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Macro-level organizational headcount, talent allocation, and team deployment (privacy-compliant).
          </p>
        </div>

        <Link
          href="/app/hr/employees"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          Workforce Directory <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Top Level Workforce Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Users className="h-3 w-3 text-blue-400" /> Total Headcount
          </span>
          <span className="text-lg font-bold text-white block mt-1">{totalEmployees}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Users className="h-3 w-3 text-emerald-400" /> Active Staff
          </span>
          <span className="text-lg font-bold text-emerald-400 block mt-1">{activeEmployees}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <UserPlus className="h-3 w-3 text-cyan-400" /> New Hires (90d)
          </span>
          <span className="text-lg font-bold text-cyan-400 block mt-1">{newJoiners}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Briefcase className="h-3 w-3 text-purple-400" /> Field / Ops Active
          </span>
          <span className="text-lg font-bold text-purple-300 block mt-1">{assignedToOperations}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <CheckSquare className="h-3 w-3 text-amber-400" /> Open Tasks
          </span>
          <span className="text-lg font-bold text-amber-400 block mt-1">{openTasksCount}</span>
        </div>
      </div>

      {/* Headcount Distribution by Department */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Building className="h-4 w-4 text-slate-400" />
          Headcount Distribution by Functional Area
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {departments.map((dept, i) => (
            <div key={i} className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80 text-xs">
              <span className="text-slate-400 truncate block text-[11px] font-medium">{dept.name}</span>
              <span className="text-sm font-bold text-white block mt-0.5">{dept.count} Members</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
