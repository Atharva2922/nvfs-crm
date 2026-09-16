"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { OperationsNav } from "@/modules/operations/components/operations-nav";
import {
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  XCircle,
  X,
  Send,
  Calendar,
  AlertOctagon,
} from "lucide-react";

export default function OperationalIssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [opFilter, setOpFilter] = useState("");

  // Modals & Active View
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [commentText, setCommentText] = useState("");
  const [resolutionText, setResolutionText] = useState("");

  // New Issue Form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newOpId, setNewOpId] = useState("");
  const [newSeverity, setNewSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [newAssignee, setNewAssignee] = useState("");

  useEffect(() => {
    fetchIssues();
    fetchAuxiliary();
  }, [severityFilter, statusFilter, opFilter, search]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (severityFilter) params.append("severity", severityFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (opFilter) params.append("operationId", opFilter);

      const res = await fetch(`/api/operations/issues?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setIssues(json.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliary = async () => {
    try {
      const [opRes, empRes] = await Promise.all([
        fetch("/api/operations?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
        fetch("/api/employees?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
      ]);

      const ops = opRes.data?.items || [];
      setOperations(ops);
      if (ops.length > 0) setNewOpId(ops[0].id);

      const emps = empRes.data?.items || [];
      setEmployees(emps);
    } catch {}
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/operations/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          operationId: newOpId,
          severity: newSeverity,
          assignedToId: newAssignee || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReportModalOpen(false);
        setNewTitle("");
        setNewDesc("");
        fetchIssues();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDetail = async (issueId: string) => {
    try {
      const res = await fetch(`/api/operations/issues/${issueId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedIssue(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedIssue) return;
    try {
      const res = await fetch(`/api/operations/issues/${selectedIssue.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      const json = await res.json();
      if (json.success) {
        setCommentText("");
        handleViewDetail(selectedIssue.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedIssue) return;
    try {
      await fetch(`/api/operations/issues/${selectedIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          resolutionNotes: resolutionText || undefined,
        }),
      });
      handleViewDetail(selectedIssue.id);
      fetchIssues();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Issues & Incidents"
        description="Centralized incident management, severity grading, resolution workflow, and escalation alerts."
      />

      <OperationsNav />

      {/* Filter & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0c121e] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search code, title, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={opFilter}
            onChange={(e) => setOpFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none max-w-[200px]"
          >
            <option value="">All Operations</option>
            {operations.map((op) => (
              <option key={op.id} value={op.id}>
                {op.operationCode} — {op.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setReportModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Log Incident
        </button>
      </div>

      {/* Issues Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0c121e] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Code / Title</th>
              <th className="px-4 py-3 font-semibold">Operation</th>
              <th className="px-4 py-3 font-semibold">Severity</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Reported By</th>
              <th className="px-4 py-3 font-semibold">Assigned To</th>
              <th className="px-4 py-3 font-semibold">Created Date</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Loading incident records...
                </td>
              </tr>
            ) : issues.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500/80" />
                  No open issues or defects reported.
                </td>
              </tr>
            ) : (
              issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <span className="font-mono text-[11px] text-blue-400 block">{issue.issueCode}</span>
                    <span className="text-white text-xs block font-sans">{issue.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/operations/${issue.operation?.id}`}
                      className="text-slate-300 hover:text-white hover:underline flex items-center gap-1"
                    >
                      <span className="font-mono text-[10px] text-slate-500">{issue.operation?.operationCode}</span>
                      <span className="truncate max-w-[160px]">{issue.operation?.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-bold ${
                        issue.severity === "CRITICAL"
                          ? "border-rose-800 bg-rose-950/80 text-rose-300"
                          : issue.severity === "HIGH"
                          ? "border-amber-800 bg-amber-950/80 text-amber-300"
                          : "border-blue-800 bg-blue-950/60 text-blue-300"
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200">
                      {issue.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {issue.reportedBy?.firstName} {issue.reportedBy?.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {issue.assignedTo ? `${issue.assignedTo.firstName} ${issue.assignedTo.lastName}` : "Unassigned"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleViewDetail(issue.id)}
                      className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] text-slate-200"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-blue-400 font-bold">{selectedIssue.issueCode}</span>
                  <span className="rounded border border-rose-800 bg-rose-950/60 text-rose-300 px-1.5 py-0.5 text-[9px] font-bold">
                    {selectedIssue.severity}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-1">{selectedIssue.title}</h2>
                <p className="text-xs text-slate-400">
                  On Operation: {selectedIssue.operation?.operationCode} ({selectedIssue.operation?.name})
                </p>
              </div>

              <button onClick={() => setSelectedIssue(null)}>
                <X className="h-5 w-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            {/* Description */}
            <div className="rounded-lg bg-slate-900/80 p-3 text-xs text-slate-200 border border-slate-800 whitespace-pre-wrap">
              {selectedIssue.description}
            </div>

            {/* Status Management */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <div className="text-xs text-slate-400">
                Current Status:{" "}
                <span className="font-semibold text-white">{selectedIssue.status.replace(/_/g, " ")}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {selectedIssue.status !== "IN_PROGRESS" && (
                  <button
                    onClick={() => handleUpdateStatus("IN_PROGRESS")}
                    className="rounded bg-blue-600 hover:bg-blue-500 px-2.5 py-1 text-xs text-white"
                  >
                    Start Investigation
                  </button>
                )}
                {selectedIssue.status !== "RESOLVED" && (
                  <button
                    onClick={() => handleUpdateStatus("RESOLVED")}
                    className="rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs text-white"
                  >
                    Mark Resolved
                  </button>
                )}
                {selectedIssue.status !== "CLOSED" && (
                  <button
                    onClick={() => handleUpdateStatus("CLOSED")}
                    className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-slate-300"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Discussion Thread ({selectedIssue.comments?.length || 0})
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedIssue.comments?.map((c: any) => (
                  <div key={c.id} className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800/80 text-xs">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-medium text-slate-300">
                        {c.author?.firstName} {c.author?.lastName}
                      </span>
                      <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-200">{c.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add note or update on resolution..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1"
                >
                  <Send className="h-3 w-3" /> Post
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* REPORT ISSUE MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleReportIssue} className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-white">
              <span>Report Operational Incident</span>
              <button type="button" onClick={() => setReportModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Operation *</label>
                <select
                  value={newOpId}
                  onChange={(e) => setNewOpId(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                >
                  {operations.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.operationCode} — {op.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Issue Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Critical database latency anomaly"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Assigned Resolver</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail symptoms, affected subsystems, and immediate impact..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
                Log Incident
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
