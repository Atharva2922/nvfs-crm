"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { OperationsNav } from "@/modules/operations/components/operations-nav";
import {
  Users2,
  Package,
  Truck,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  Layers,
} from "lucide-react";

export default function ResourcesPage() {
  const [data, setData] = useState<{ employees: any[]; inventory: any[]; vendors: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<"employees" | "inventory" | "vendors">("employees");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/operations/resources");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = (data?.employees || []).filter((emp) => {
    const matchesSearch =
      search === "" ||
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "ALL" || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const uniqueDepartments = Array.from(new Set((data?.employees || []).map((e) => e.department)));

  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case "OVERALLOCATED":
        return "border-rose-850 bg-rose-950/60 text-rose-300";
      case "OPTIMAL":
        return "border-blue-800 bg-blue-950/60 text-blue-300";
      default:
        return "border-emerald-800 bg-emerald-950/60 text-emerald-300";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Resource Management"
        description="Company-wide personnel workload utilization, materials allocation index, and external subcontractor capacity tracking."
      />

      <OperationsNav />

      {/* Category Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setCategory("employees")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            category === "employees"
              ? "bg-blue-600 text-white shadow-sm"
              : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users2 className="h-4 w-4" />
          Employee Utilization ({data?.employees?.length || 0})
        </button>

        <button
          onClick={() => setCategory("inventory")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            category === "inventory"
              ? "bg-blue-600 text-white shadow-sm"
              : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Package className="h-4 w-4" />
          Inventory Allocation Index
        </button>

        <button
          onClick={() => setCategory("vendors")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            category === "vendors"
              ? "bg-blue-600 text-white shadow-sm"
              : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Truck className="h-4 w-4" />
          Vendor Utilization Matrix
        </button>
      </div>

      {/* 1. EMPLOYEES CATEGORY */}
      {category === "employees" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0c121e] p-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search staff by name, email, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {uniqueDepartments.map((d: any) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0c121e] overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold text-center">Active Ops</th>
                  <th className="px-4 py-3 font-semibold text-center">Assigned Tasks</th>
                  <th className="px-4 py-3 font-semibold">Estimated Hrs</th>
                  <th className="px-4 py-3 font-semibold">Actual Hrs</th>
                  <th className="px-4 py-3 font-semibold">Capacity Index</th>
                  <th className="px-4 py-3 font-semibold">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Loading personnel utilization matrix...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      No employees match filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-900/60 text-[11px] font-bold text-blue-300">
                            {emp.name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{emp.name}</div>
                            <div className="text-[10px] text-slate-400">{emp.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{emp.department}</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-400 font-mono">
                        {emp.activeOperationsCount}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-200">{emp.assignedTasksCount}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{emp.estimatedHours} hrs</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{emp.actualHours} hrs</td>
                      <td className="px-4 py-3 min-w-[130px]">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                emp.utilizationRate >= 90
                                  ? "bg-rose-500"
                                  : emp.utilizationRate >= 50
                                  ? "bg-blue-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${emp.utilizationRate}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">{emp.utilizationRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded border px-2 py-0.5 text-[9px] font-bold ${getAvailabilityBadge(emp.availability)}`}>
                          {emp.availability}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. INVENTORY CATEGORY */}
      {category === "inventory" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.inventory?.map((inv: any) => (
            <div key={inv.status} className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-slate-400 text-xs">
                <span>Status Category</span>
                <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-blue-400 font-mono">
                  {inv.status}
                </span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">{inv._count?.id || 0} items</div>
              <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Required Qty:</span>
                  <span className="font-mono text-white">{inv._sum?.requiredQuantity || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allocated Qty:</span>
                  <span className="font-mono text-cyan-400">{inv._sum?.allocatedQuantity || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Used Qty:</span>
                  <span className="font-mono text-emerald-400">{inv._sum?.usedQuantity || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. VENDORS CATEGORY */}
      {category === "vendors" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.vendors?.map((v: any) => (
            <div key={v.status} className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-slate-400 text-xs">
                <span>Engagement State</span>
                <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-purple-400 font-mono">
                  {v.status}
                </span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">{v._count?.id || 0} contracts</div>
              <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Estimated Total:</span>
                  <span className="font-mono text-white">${v._sum?.estimatedCost?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual Incurred:</span>
                  <span className="font-mono text-emerald-400">${v._sum?.actualCost?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
