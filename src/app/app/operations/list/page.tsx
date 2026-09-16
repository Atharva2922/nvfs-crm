"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { OperationsNav } from "@/modules/operations/components/operations-nav";
import {
  Layers,
  Search,
  SlidersHorizontal,
  Download,
  Trash2,
  Users,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  ArrowUpDown,
  Filter,
} from "lucide-react";

export default function OperationsListPage() {
  const [operations, setOperations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkTargetVal, setBulkTargetVal] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchOperations();
  }, [page, statusFilter, priorityFilter, deptFilter, ownerFilter, clientFilter, riskFilter, startDateFilter, endDateFilter, search]);

  const fetchAuxiliaryData = async () => {
    try {
      const [empRes, clientRes] = await Promise.all([
        fetch("/api/employees?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
        fetch("/api/crm/clients?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
      ]);

      const emps = empRes.data?.items || [];
      if (emps.length > 0) {
        setEmployees(emps);
        const deptMap: Record<string, { id: string; name: string }> = {};
        for (const e of emps) {
          if (e.departmentId && e.department) {
            deptMap[e.departmentId] = { id: e.departmentId, name: e.department.name };
          }
        }
        setDepartments(Object.values(deptMap));
      }
      if (clientRes.data?.items) setClients(clientRes.data.items);
    } catch {}
  };

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (deptFilter) params.append("departmentId", deptFilter);
      if (ownerFilter) params.append("ownerId", ownerFilter);
      if (clientFilter) params.append("clientId", clientFilter);
      if (riskFilter) params.append("riskLevel", riskFilter);
      if (startDateFilter) params.append("startDate", startDateFilter);
      if (endDateFilter) params.append("endDate", endDateFilter);

      const res = await fetch(`/api/operations?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOperations(json.data.items);
        setTotalPages(json.data.pagination.totalPages || 1);
        setTotalCount(json.data.pagination.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(operations.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const applyBulkAction = async () => {
    if (selectedIds.length === 0 || !bulkAction) return;
    setBulkProcessing(true);

    try {
      for (const id of selectedIds) {
        if (bulkAction === "status" && bulkTargetVal) {
          await fetch(`/api/operations/${id}/transition`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: bulkTargetVal, force: true }),
          });
        } else if (bulkAction === "priority" && bulkTargetVal) {
          await fetch(`/api/operations/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priority: bulkTargetVal }),
          });
        } else if (bulkAction === "owner" && bulkTargetVal) {
          await fetch(`/api/operations/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: bulkTargetVal }),
          });
        } else if (bulkAction === "department" && bulkTargetVal) {
          await fetch(`/api/operations/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ departmentId: bulkTargetVal }),
          });
        } else if (bulkAction === "archive") {
          await fetch(`/api/operations/${id}/transition`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CANCELLED", force: true, reason: "Archived via bulk operations" }),
          });
        } else if (bulkAction === "delete") {
          await fetch(`/api/operations/${id}`, { method: "DELETE" });
        }
      }

      setSelectedIds([]);
      setBulkAction("");
      setBulkTargetVal("");
      fetchOperations();
    } catch (err) {
      console.error("Bulk action failed:", err);
    } finally {
      setBulkProcessing(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Operation Code", "Name", "Department", "Owner", "Client", "Priority", "Status", "Progress", "Due Date", "Risk"];
    const rows = operations.map((op) => [
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
    link.setAttribute("download", `operations-directory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Management Directory"
        description="Comprehensive operational registry with multi-criteria filtering, bulk lifecycle state mutation, and organizational dispatching."
      />

      <OperationsNav />

      {/* Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-900/60 bg-blue-950/30 p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-blue-300">
            <span className="font-semibold">{selectedIds.length}</span> operation(s) selected
          </div>

          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => {
                setBulkAction(e.target.value);
                setBulkTargetVal("");
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Choose Bulk Action...</option>
              <option value="status">Change Status</option>
              <option value="priority">Change Priority</option>
              <option value="owner">Assign Owner</option>
              <option value="department">Change Department</option>
              <option value="archive">Archive / Cancel</option>
              <option value="delete">Delete Permanently</option>
            </select>

            {bulkAction === "status" && (
              <select
                value={bulkTargetVal}
                onChange={(e) => setBulkTargetVal(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Status...</option>
                <option value="PLANNING">Planning</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="QUALITY_REVIEW">Quality Review</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            )}

            {bulkAction === "priority" && (
              <select
                value={bulkTargetVal}
                onChange={(e) => setBulkTargetVal(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Priority...</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            )}

            {bulkAction === "owner" && (
              <select
                value={bulkTargetVal}
                onChange={(e) => setBulkTargetVal(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Owner...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.designation})
                  </option>
                ))}
              </select>
            )}

            {bulkAction === "department" && (
              <select
                value={bulkTargetVal}
                onChange={(e) => setBulkTargetVal(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={applyBulkAction}
              disabled={bulkProcessing || (!bulkTargetVal && !["delete", "archive"].includes(bulkAction))}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              {bulkProcessing ? "Applying..." : "Execute"}
            </button>
          </div>
        </div>
      )}

      {/* Master Data Filter Panel */}
      <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search code, title, project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
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
            <option value="">All Priorities</option>
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
            <option value="">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Secondary Filter Row: Client, Owner, Date Range, Export */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-800/60">
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Owners / Leads</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0c121e] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="w-8 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === operations.length && operations.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-700 bg-slate-900"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Code / Title</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Progress</th>
                <th className="px-4 py-3 font-semibold">Target Date</th>
                <th className="px-4 py-3 font-semibold">Risk</th>
                <th className="px-4 py-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                    Loading operations directory...
                  </td>
                </tr>
              ) : operations.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                    <Layers className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    No operations found matching current criteria.
                  </td>
                </tr>
              ) : (
                operations.map((op) => {
                  const isSelected = selectedIds.includes(op.id);
                  return (
                    <tr
                      key={op.id}
                      className={`hover:bg-slate-900/50 transition-colors ${isSelected ? "bg-blue-950/20" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(op.id)}
                          className="rounded border-slate-700 bg-slate-900"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/app/operations/${op.id}`}
                          className="font-mono text-[11px] text-blue-400 hover:underline block"
                        >
                          {op.operationCode}
                        </Link>
                        <span className="text-white text-xs block font-sans truncate max-w-[220px]">
                          {op.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {op.department?.name || "General"}
                      </td>
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
                      <td className="px-4 py-3 text-slate-300">{op.client?.name || "Internal Corporate"}</td>
                      <td className="px-4 py-3 font-medium text-[11px]">
                        <span
                          className={
                            op.priority === "CRITICAL"
                              ? "text-rose-400"
                              : op.priority === "HIGH"
                              ? "text-amber-400"
                              : "text-blue-400"
                          }
                        >
                          {op.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px]">
                          {op.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${op.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{op.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(op.expectedCompletionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded border border-slate-700 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">
                          {op.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/app/operations/${op.id}`}
                          className="rounded bg-slate-800/80 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          Workspace
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-medium">{operations.length}</span> of{" "}
            <span className="text-white font-medium">{totalCount}</span> operations
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-slate-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="text-xs">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-slate-800"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
