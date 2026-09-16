"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  Clock,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Scale,
  ShieldCheck,
  X,
  Check,
  AlertOctagon,
  Calendar,
} from "lucide-react";

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // New Deadline Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [deadlineType, setDeadlineType] = useState("FILING_DEADLINE");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [priority, setPriority] = useState("HIGH");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDeadlines();
  }, [statusFilter, priorityFilter]);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);

      const res = await fetch(`/api/legal/deadlines?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDeadlines(json.data);
      }
    } catch (err) {
      console.error("Error fetching deadlines:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/legal/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          deadlineType,
          dueDate,
          priority,
          notes: notes || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setTitle("");
        setNotes("");
        fetchDeadlines();
      } else {
        alert(json.error?.message || "Failed to create deadline");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create deadline");
    } finally {
      setCreating(false);
    }
  };

  const handleMarkComplete = async (id: string) => {
    try {
      const res = await fetch("/api/legal/deadlines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "COMPLETED" }),
      });
      const json = await res.json();
      if (json.success) {
        fetchDeadlines();
      }
    } catch (err) {
      console.error("Failed to complete deadline:", err);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Pending";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const now = new Date();
  const overdueCount = deadlines.filter(
    (d) => d.status !== "COMPLETED" && new Date(d.dueDate) < now
  ).length;
  const upcomingCount = deadlines.filter((d) => d.status !== "COMPLETED").length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Legal & Statutory Deadlines"
          description="Centralized register of court hearings, regulatory filing cutoff dates, contract expiry horizons, and compliance due dates."
        />
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Deadline</span>
        </button>
      </div>

      <LegalNav />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Overdue Cutoffs</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{overdueCount}</div>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Pending Cutoffs</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{upcomingCount}</div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Completed Deadlines</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {deadlines.filter((d) => d.status === "COMPLETED").length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-blue-500/50 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="OVERDUE">Overdue</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-blue-500/50 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">Total: {deadlines.length} scheduled</span>
      </div>

      {/* Deadlines Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        ) : deadlines.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="text-sm font-semibold">No deadlines found</p>
            <p className="text-xs text-slate-500">All legal actions are up to date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Title & Context</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deadlines.map((dl) => {
                  const isOverdue = dl.status !== "COMPLETED" && new Date(dl.dueDate) < now;
                  return (
                    <tr key={dl.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-200 block">{dl.title}</span>
                        {dl.contract && (
                          <Link
                            href={`/app/legal/contracts/${dl.contractId}`}
                            className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <FileText className="h-3 w-3" />
                            <span>{dl.contract.contractNumber} - {dl.contract.title}</span>
                          </Link>
                        )}
                        {dl.case && (
                          <Link
                            href={`/app/legal/cases/${dl.caseId}`}
                            className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Scale className="h-3 w-3" />
                            <span>{dl.case.caseNumber} - {dl.case.title}</span>
                          </Link>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 font-medium">
                          {dl.deadlineType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${isOverdue ? "text-rose-400" : "text-slate-200"}`}>
                          {formatDate(dl.dueDate)}
                        </span>
                        {isOverdue && <span className="text-[10px] text-rose-500 block uppercase font-bold">Overdue</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {dl.owner ? `${dl.owner.firstName} ${dl.owner.lastName}` : "Unassigned"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            dl.priority === "CRITICAL"
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : dl.priority === "HIGH"
                              ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                              : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {dl.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            dl.status === "COMPLETED"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : isOverdue
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {dl.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {dl.status !== "COMPLETED" && (
                          <button
                            onClick={() => handleMarkComplete(dl.id)}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-emerald-300 hover:bg-emerald-600/30 transition-colors font-medium text-[11px]"
                          >
                            <Check className="h-3 w-3" />
                            <span>Complete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Deadline Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Schedule Statutory Deadline
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeadline} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Deadline Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. File Motion for Summary Judgment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Type</label>
                  <select
                    value={deadlineType}
                    onChange={(e) => setDeadlineType(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                  >
                    <option value="FILING_DEADLINE">Court Filing</option>
                    <option value="CASE_HEARING">Case Hearing</option>
                    <option value="CONTRACT_EXPIRY">Contract Expiry</option>
                    <option value="RENEWAL_NOTICE">Renewal Notice</option>
                    <option value="COMPLIANCE_DEADLINE">Compliance Cutoff</option>
                    <option value="RESPONSE_DEADLINE">Response Cutoff</option>
                    <option value="INTERNAL_REVIEW">Internal Review</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Notes & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Jurisdictional rules, mandatory attachments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-200 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-white font-medium hover:bg-blue-500 disabled:opacity-50"
                >
                  {creating ? "Scheduling..." : "Save Deadline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
