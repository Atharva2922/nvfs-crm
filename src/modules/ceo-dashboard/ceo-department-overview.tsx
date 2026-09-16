"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Layers,
  CheckSquare,
  IndianRupee,
  Activity,
  ArrowRight,
} from "lucide-react";

interface DepartmentOverviewItem {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
  activeTasks: number;
  completedTasks: number;
  activeOperations: number;
  budget: number;
  actualCost: number;
  variance: number;
  status: string;
}

interface CeoDepartmentOverviewProps {
  departments: DepartmentOverviewItem[];
}

export function CeoDepartmentOverview({ departments }: CeoDepartmentOverviewProps) {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-400" />
            Company-Wide Departmental Performance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Headcounts, active project allocation, task throughput, and budget variances across all departments.
          </p>
        </div>

        <Link
          href="/app/hr"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          Department Directory <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Dynamic Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
            No departments configured in this organization.
          </div>
        ) : (
          departments.map((dept) => (
            <div
              key={dept.id}
              className="rounded-xl border border-slate-800/90 bg-slate-900/50 p-4 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {dept.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                    CODE: {dept.code}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    dept.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {dept.status}
                </span>
              </div>

              {/* Department Statistics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Users className="h-3 w-3 text-blue-400" /> Headcount
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {dept.employeeCount} Members
                  </span>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Layers className="h-3 w-3 text-purple-400" /> Operations
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {dept.activeOperations} Active
                  </span>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckSquare className="h-3 w-3 text-amber-400" /> Tasks
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {dept.activeTasks} Open ({dept.completedTasks} Done)
                  </span>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Activity className="h-3 w-3 text-cyan-400" /> Throughput
                  </span>
                  <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                    {dept.activeTasks + dept.completedTasks > 0
                      ? Math.round(
                          (dept.completedTasks / (dept.activeTasks + dept.completedTasks)) * 100
                        )
                      : 100}
                    %
                  </span>
                </div>
              </div>

              {/* Budget vs Actual Cost where available */}
              {dept.budget > 0 && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] flex items-center justify-between text-slate-400">
                  <span>Budget: {formatINR(dept.budget)}</span>
                  <span
                    className={`font-semibold ${
                      dept.variance >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    Variance: {formatINR(dept.variance)}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
