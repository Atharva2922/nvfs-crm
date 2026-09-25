"use client";

import React, { useState, useMemo } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  ChevronDown,
  User,
  Building,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export interface CompanyEmployeeOption {
  id: string;
  name: string;
  designation: string;
  department: string;
  employeeNumber: string;
  isFree?: boolean;
  busyReason?: string | null;
  activeTasksCount?: number;
}

export interface HrJobItem {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  estimatedHours: number | null;
  assignee: {
    id: string;
    name: string;
    designation: string;
    department: string;
  } | null;
}

interface HrJobAssignmentCenterProps {
  initialJobs: HrJobItem[];
  companyEmployees: CompanyEmployeeOption[];
  companyName: string;
  primaryColor?: string;
}

export function HrJobAssignmentCenter({
  initialJobs,
  companyEmployees,
  companyName,
  primaryColor = "#2563eb",
}: HrJobAssignmentCenterProps) {
  const [jobs, setJobs] = useState<HrJobItem[]>(initialJobs);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Status Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // New Job Form State
  const [formData, setFormData] = useState({
    employeeId: companyEmployees[0]?.id || "",
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    estimatedHours: 8,
  });

  // Re-fetch jobs from API
  const refreshJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr/jobs");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setJobs(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to refresh jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Submit Job Assignment
  const handleAssignJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.title.trim()) {
      setError("Please select an employee and provide a job title");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/hr/jobs/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          dueDate: formData.dueDate,
          estimatedHours: formData.estimatedHours,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to assign job");
      }

      // Success
      const targetEmp = companyEmployees.find((e) => e.id === formData.employeeId);
      setSuccessMsg(`Job successfully assigned to ${targetEmp?.name || "employee"}!`);
      setShowModal(false);
      setFormData({
        employeeId: companyEmployees[0]?.id || "",
        title: "",
        description: "",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        estimatedHours: 8,
      });

      await refreshJobs();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to assign job");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Job Status
  const handleUpdateStatus = async (jobId: string, status: "TODO" | "IN_PROGRESS" | "COMPLETED") => {
    try {
      const res = await fetch(`/api/hr/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status } : j))
        );
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // Delete Job Assignment
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to revoke/delete this job assignment?")) return;
    try {
      const res = await fetch(`/api/hr/jobs/${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } catch (err) {
      console.error("Delete job error:", err);
    }
  };

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.assignee?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.assignee?.designation || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.description || "").toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter !== "ALL" && j.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [jobs, searchQuery, statusFilter]);

  const todoCount = useMemo(() => jobs.filter((j) => j.status === "TODO").length, [jobs]);
  const inProgressCount = useMemo(() => jobs.filter((j) => j.status === "IN_PROGRESS").length, [jobs]);
  const completedCount = useMemo(() => jobs.filter((j) => j.status === "COMPLETED").length, [jobs]);

  return (
    <div className="space-y-5">
      {/* Alert / Success Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="h-4 w-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Main Section Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                <Briefcase className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Employee Job & Work Task Assignment Center
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <ShieldCheck className="h-3 w-3 text-amber-600" /> HR Role Protected
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only authenticated HR leadership can assign jobs, set priorities, and track execution across {companyName}.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition-all hover:opacity-90 self-start sm:self-auto"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="h-4 w-4" /> Assign New Job
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
            <span className="text-[11px] text-slate-500 font-medium">Total Delegated</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {jobs.length}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">To-Do / Assigned</span>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
              {todoCount}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">In Progress</span>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
              {inProgressCount}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Completed</span>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {completedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by job title or employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {["ALL", "TODO", "IN_PROGRESS", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? `All (${jobs.length})` : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Assigned Jobs */}
      {filteredJobs.length === 0 ? (
        <div className="py-14 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-8 space-y-3">
          <Briefcase className="h-10 w-10 text-slate-400 mx-auto" />
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No Job Assignments Found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the &ldquo;Assign New Job&rdquo; button above to allocate tasks to corporate personnel.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            Assign First Job
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="px-4 py-3">Job / Task Title</th>
                <th className="px-4 py-3">Assigned Employee</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">HR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {job.title}
                    </span>
                    {job.description && (
                      <span className="text-[11px] text-slate-500 block truncate">
                        {job.description}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {job.assignee ? (
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {job.assignee.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {job.assignee.designation} • {job.assignee.department}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        job.priority === "URGENT"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : job.priority === "HIGH"
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                          : job.priority === "LOW"
                          ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {job.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                    {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : "No deadline"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        job.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : job.status === "IN_PROGRESS"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {job.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {job.status === "TODO" && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, "IN_PROGRESS")}
                          className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-semibold text-[10px] transition-colors"
                        >
                          Start Job
                        </button>
                      )}
                      {job.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, "COMPLETED")}
                          className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] transition-colors"
                        >
                          Mark Done
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete / Revoke Job"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN JOB TO EMPLOYEE */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Assign Job / Work Mandate to Employee
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAssignJob} className="space-y-3.5 text-xs">
              {/* Employee Picker */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Target Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white font-medium"
                >
                  {companyEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.isFree !== undefined ? (emp.isFree ? "🟢" : "🟡") : ""} {emp.name} — {emp.designation} ({emp.department})
                      {emp.isFree === false && emp.busyReason ? ` · ${emp.busyReason}` : ""}
                    </option>
                  ))}
                </select>
                {/* Live availability card */}
                {formData.employeeId && (() => {
                  const sel = companyEmployees.find((e) => e.id === formData.employeeId);
                  if (!sel || sel.isFree === undefined) return null;
                  return (
                    <div className={`mt-1.5 rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-medium border ${
                      sel.isFree
                        ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300"
                    }`}>
                      <span>{sel.isFree ? "🟢" : "🟡"}</span>
                      <span>
                        <strong>{sel.name}</strong> is currently{" "}
                        {sel.isFree ? "FREE — will start this job immediately" : `BUSY — ${sel.busyReason || "has active workload"}. Job will be queued.`}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Job Title */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job / Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Sprint 42 API Migration & Architecture Review"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              {/* Description & Deliverables */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Scope & Required Deliverables
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide precise instructions, milestones, and success criteria for the employee..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              {/* Priority, Due Date, Estimated Hours */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={formData.estimatedHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedHours: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? "Assigning..." : "Confirm & Assign Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
