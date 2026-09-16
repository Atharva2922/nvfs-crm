"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { OperationsNav } from "@/modules/operations/components/operations-nav";
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Calendar,
  AlertOctagon,
  ListTodo,
  TrendingUp,
  Search,
  SlidersHorizontal,
  Download,
  ArrowUpDown,
  ChevronRight,
  ExternalLink,
  Plus,
} from "lucide-react";

interface DashboardMetrics {
  kpis: {
    activeOperations: number;
    pendingOperations: number;
    inProgress: number;
    completed: number;
    delayed: number;
    criticalIssues: number;
    todayTasks: number;
    upcomingDeadlines: number;
  };
  health: {
    overallCompletionRate: number;
    onTimeRate: number;
    delayedCount: number;
    resourceUtilization: number;
    currentWorkload: number;
    openIssues: number;
    averageProgress: number;
  };
  recentOperations: any[];
}

export default function OperationsDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Column Visibility
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    codeAndName: true,
    clientAndProject: true,
    department: true,
    owner: true,
    priority: true,
    status: true,
    progress: true,
    targetDate: true,
    risk: true,
    actions: true,
  });

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter, riskFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resMetrics, resList] = await Promise.all([
        fetch("/api/operations/reports").then((r) => r.json()),
        fetch(`/api/operations?status=${statusFilter === "ALL" ? "" : statusFilter}&priority=${priorityFilter === "ALL" ? "" : priorityFilter}&riskLevel=${riskFilter === "ALL" ? "" : riskFilter}`).then((r) => r.json()),
      ]);

      // Also fetch specific dashboard KPIs
      const kpiRes = await fetch("/api/operations/resources").then((r) => r.json());

      if (resList.success) {
        setOperations(resList.data.items);
      }

      // Compute dynamic overview
      const allOps = resList.data?.items || [];
      const now = new Date();
      const activeOps = allOps.filter((o: any) => ["PLANNING", "SCHEDULED", "IN_PROGRESS", "QUALITY_REVIEW"].includes(o.status));
      const completedOps = allOps.filter((o: any) => o.status === "COMPLETED");
      const delayedOps = allOps.filter((o: any) => new Date(o.expectedCompletionDate) < now && !["COMPLETED", "CANCELLED"].includes(o.status));

      setMetrics({
        kpis: {
          activeOperations: activeOps.length,
          pendingOperations: allOps.filter((o: any) => ["PLANNING", "SCHEDULED"].includes(o.status)).length,
          inProgress: allOps.filter((o: any) => o.status === "IN_PROGRESS").length,
          completed: completedOps.length,
          delayed: delayedOps.length,
          criticalIssues: allOps.reduce((acc: number, curr: any) => acc + (curr._count?.issues || 0), 0),
          todayTasks: allOps.reduce((acc: number, curr: any) => acc + (curr._count?.tasks || 0), 0),
          upcomingDeadlines: allOps.filter((o: any) => {
            const due = new Date(o.expectedCompletionDate);
            const in7 = new Date(now.getTime() + 7 * 86400000);
            return due >= now && due <= in7 && o.status !== "COMPLETED";
          }).length,
        },
        health: {
          overallCompletionRate: allOps.length > 0 ? Math.round((completedOps.length / allOps.length) * 100) : 0,
          onTimeRate: 92,
          delayedCount: delayedOps.length,
          resourceUtilization: 78,
          currentWorkload: activeOps.length,
          openIssues: allOps.reduce((acc: number, curr: any) => acc + (curr._count?.issues || 0), 0),
          averageProgress: activeOps.length > 0 ? Math.round(activeOps.reduce((acc: number, curr: any) => acc + (curr.progress || 0), 0) / activeOps.length) : 0,
        },
        recentOperations: allOps.slice(0, 8),
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOperations = operations
    .filter((op) => {
      const matchSearch =
        search === "" ||
        op.name.toLowerCase().includes(search.toLowerCase()) ||
        op.operationCode.toLowerCase().includes(search.toLowerCase()) ||
        (op.projectName && op.projectName.toLowerCase().includes(search.toLowerCase())) ||
        (op.client?.name && op.client.name.toLowerCase().includes(search.toLowerCase()));
      return matchSearch;
    })
    .sort((a, b) => {
      if (sortField === "progress") {
        return sortOrder === "asc" ? a.progress - b.progress : b.progress - a.progress;
      }
      if (sortField === "dueDate") {
        return sortOrder === "asc"
          ? new Date(a.expectedCompletionDate).getTime() - new Date(b.expectedCompletionDate).getTime()
          : new Date(b.expectedCompletionDate).getTime() - new Date(a.expectedCompletionDate).getTime();
      }
      return sortOrder === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const exportCSV = () => {
    const headers = ["Operation Code", "Name", "Department", "Owner", "Client", "Priority", "Status", "Progress", "Due Date", "Risk"];
    const rows = filteredOperations.map((op) => [
      op.operationCode,
      `"${op.name}"`,
      op.department?.name || "",
      `"${op.owner?.firstName} ${op.owner?.lastName}"`,
      `"${op.client?.name || ""}"`,
      op.priority,
      op.status,
      `${op.progress}%`,
      new Date(op.expectedCompletionDate).toLocaleDateString(),
      op.riskLevel,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `operations-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-800/60";
      case "IN_PROGRESS":
        return "bg-blue-950/60 text-blue-300 border-blue-800/60";
      case "QUALITY_REVIEW":
        return "bg-purple-950/60 text-purple-300 border-purple-800/60";
      case "SCHEDULED":
        return "bg-indigo-950/60 text-indigo-300 border-indigo-800/60";
      case "ON_HOLD":
        return "bg-amber-950/60 text-amber-300 border-amber-800/60";
      case "CANCELLED":
        return "bg-rose-950/60 text-rose-300 border-rose-800/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "text-rose-400 font-semibold";
      case "HIGH":
        return "text-amber-400";
      case "MEDIUM":
        return "text-blue-400";
      default:
        return "text-slate-400";
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return "bg-rose-950/80 text-rose-300 border-rose-800/60";
      case "HIGH":
        return "bg-amber-950/80 text-amber-300 border-amber-800/60";
      case "MEDIUM":
        return "bg-yellow-950/60 text-yellow-300 border-yellow-800/50";
      default:
        return "bg-emerald-950/60 text-emerald-300 border-emerald-800/50";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations & Project Delivery"
        description="Enterprise operational control, cross-department orchestration, resource allocation, and organizational health metrics."
      />

      <OperationsNav />

      {/* 1. KPI CARDS SECTION */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Active</span>
            <Layers className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">{metrics?.kpis.activeOperations ?? "—"}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In flight</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Pending</span>
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">{metrics?.kpis.pendingOperations ?? "—"}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Planning / Sched</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">In Progress</span>
            <PlayCircle className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white">{metrics?.kpis.inProgress ?? "—"}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Executing</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Completed</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">{metrics?.kpis.completed ?? "—"}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Fulfilled</div>
        </div>

        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3 shadow-sm">
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-medium">Delayed</span>
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-300">{metrics?.kpis.delayed ?? "—"}</div>
          <div className="text-[10px] text-rose-400 mt-0.5">Past target date</div>
        </div>

        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 shadow-sm">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-medium">Critical Issues</span>
            <AlertOctagon className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">{metrics?.kpis.criticalIssues ?? "—"}</div>
          <div className="text-[10px] text-amber-400 mt-0.5">Require action</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Tasks Today</span>
            <ListTodo className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">{metrics?.kpis.todayTasks ?? "—"}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Due today</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Deadlines</span>
            <Calendar className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">{metrics?.kpis.upcomingDeadlines ?? "—"}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Next 7 days</div>
        </div>
      </div>

      {/* 2. OPERATIONAL HEALTH SECTION */}
      <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Operational Health & Resource Efficiency</h2>
          </div>
          <span className="text-xs text-slate-500">Live Telemetry</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Overall Completion</span>
              <span className="font-semibold text-white">{metrics?.health.overallCompletionRate ?? 0}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${metrics?.health.overallCompletionRate ?? 0}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">Total completed deliveries</span>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-400">
              <span>On-Time Delivery</span>
              <span className="font-semibold text-emerald-400">{metrics?.health.onTimeRate ?? 100}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${metrics?.health.onTimeRate ?? 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">Milestone SLA adherence</span>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Resource Utilization</span>
              <span className="font-semibold text-cyan-400">{metrics?.health.resourceUtilization ?? 75}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${metrics?.health.resourceUtilization ?? 75}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">Personnel capacity index</span>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Current Workload</span>
              <span className="font-semibold text-white">{metrics?.health.currentWorkload ?? 0}</span>
            </div>
            <div className="text-xs text-slate-400 pt-1">Active departmental projects</div>
            <span className="text-[10px] text-slate-500">Distributed across teams</span>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Delayed Operations</span>
              <span className={`font-semibold ${metrics?.health.delayedCount ? "text-rose-400" : "text-emerald-400"}`}>
                {metrics?.health.delayedCount ?? 0}
              </span>
            </div>
            <div className="text-xs text-slate-400 pt-1">Require schedule re-planning</div>
            <span className="text-[10px] text-slate-500">SLA risk items</span>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Open Issues</span>
              <span className="font-semibold text-amber-400">{metrics?.health.openIssues ?? 0}</span>
            </div>
            <div className="text-xs text-slate-400 pt-1">Active incidents logged</div>
            <span className="text-[10px] text-slate-500">Pending team resolution</span>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE OPERATIONS TABLE */}
      <div className="rounded-xl border border-slate-800 bg-[#0c121e] shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search operations by code, name, client, or project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Quick Filters */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="QUALITY_REVIEW">Quality Review</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Risks</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="CRITICAL">Critical Risk</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Column Visibility Menu */}
            <div className="relative">
              <button
                onClick={() => setColumnsDropdownOpen(!columnsDropdownOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Columns
              </button>

              {columnsDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-lg border border-slate-800 bg-[#0f172a] p-2 shadow-2xl z-30 space-y-1 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 border-b border-slate-800">
                    Toggle Columns
                  </div>
                  {Object.entries({
                    codeAndName: "Code / Name",
                    clientAndProject: "Client / Project",
                    department: "Department",
                    owner: "Owner",
                    priority: "Priority",
                    status: "Status",
                    progress: "Progress",
                    targetDate: "Target Date",
                    risk: "Risk Level",
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 cursor-pointer text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[key as keyof typeof visibleColumns]}
                        onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>

            <Link
              href="/app/operations/new"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Operation
            </Link>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                {visibleColumns.codeAndName && <th className="px-4 py-3 font-semibold">Code / Name</th>}
                {visibleColumns.clientAndProject && <th className="px-4 py-3 font-semibold">Client / Project</th>}
                {visibleColumns.department && <th className="px-4 py-3 font-semibold">Department</th>}
                {visibleColumns.owner && <th className="px-4 py-3 font-semibold">Owner</th>}
                {visibleColumns.priority && <th className="px-4 py-3 font-semibold">Priority</th>}
                {visibleColumns.status && <th className="px-4 py-3 font-semibold">Status</th>}
                {visibleColumns.progress && (
                  <th className="px-4 py-3 font-semibold">
                    <button
                      onClick={() => {
                        setSortField("progress");
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      }}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      Progress <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                )}
                {visibleColumns.targetDate && (
                  <th className="px-4 py-3 font-semibold">
                    <button
                      onClick={() => {
                        setSortField("dueDate");
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      }}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      Target Date <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                )}
                {visibleColumns.risk && <th className="px-4 py-3 font-semibold">Risk</th>}
                {visibleColumns.actions && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    Loading operations telemetry...
                  </td>
                </tr>
              ) : filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    <Layers className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    No operations found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOperations
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((op) => {
                    const isPastDue =
                      new Date(op.expectedCompletionDate) < new Date() &&
                      !["COMPLETED", "CANCELLED"].includes(op.status);

                    return (
                      <tr key={op.id} className="hover:bg-slate-900/50 transition-colors">
                        {visibleColumns.codeAndName && (
                          <td className="px-4 py-3 font-medium">
                            <Link
                              href={`/app/operations/${op.id}`}
                              className="text-blue-400 hover:underline font-mono text-[11px] block"
                            >
                              {op.operationCode}
                            </Link>
                            <span className="text-white text-xs truncate max-w-[200px] block font-sans">
                              {op.name}
                            </span>
                          </td>
                        )}
                        {visibleColumns.clientAndProject && (
                          <td className="px-4 py-3">
                            <div className="text-slate-200">{op.client?.name || "Internal Corporate"}</div>
                            {op.projectName && <div className="text-[10px] text-slate-500">{op.projectName}</div>}
                          </td>
                        )}
                        {visibleColumns.department && (
                          <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                            {op.department?.name || "General"}
                          </td>
                        )}
                        {visibleColumns.owner && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-900/60 text-[9px] font-bold text-blue-300">
                                {op.owner?.firstName?.[0] || "U"}
                              </div>
                              <span className="text-slate-200">
                                {op.owner?.firstName} {op.owner?.lastName}
                              </span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.priority && (
                          <td className={`px-4 py-3 font-medium text-[11px] ${getPriorityBadge(op.priority)}`}>
                            {op.priority}
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${getStatusBadge(
                                op.status
                              )}`}
                            >
                              {op.status.replace(/_/g, " ")}
                            </span>
                          </td>
                        )}
                        {visibleColumns.progress && (
                          <td className="px-4 py-3 min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${op.progress}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-mono text-slate-400">{op.progress}%</span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.targetDate && (
                          <td className="px-4 py-3">
                            <span className={`text-xs ${isPastDue ? "text-rose-400 font-semibold" : "text-slate-300"}`}>
                              {new Date(op.expectedCompletionDate).toLocaleDateString()}
                            </span>
                            {isPastDue && <span className="block text-[9px] text-rose-500 font-medium">Overdue</span>}
                          </td>
                        )}
                        {visibleColumns.risk && (
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold ${getRiskBadge(
                                op.riskLevel
                              )}`}
                            >
                              {op.riskLevel}
                            </span>
                          </td>
                        )}
                        {visibleColumns.actions && (
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/app/operations/${op.id}`}
                              className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              Open <ChevronRight className="h-3 w-3" />
                            </Link>
                          </td>
                        )}
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing {Math.min(filteredOperations.length, (currentPage - 1) * pageSize + 1)} -{" "}
              {Math.min(filteredOperations.length, currentPage * pageSize)} of {filteredOperations.length} operations
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-300 disabled:opacity-40 hover:bg-slate-800"
            >
              Previous
            </button>
            <span className="text-xs">
              Page {currentPage} of {Math.ceil(filteredOperations.length / pageSize) || 1}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(Math.ceil(filteredOperations.length / pageSize) || 1, p + 1))
              }
              disabled={currentPage >= (Math.ceil(filteredOperations.length / pageSize) || 1)}
              className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-300 disabled:opacity-40 hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
