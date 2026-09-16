"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Plus,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  FileCheck2,
  X,
  AlertOctagon,
} from "lucide-react";

export default function ComplianceListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // New Compliance Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [regulation, setRegulation] = useState("SOC2");
  const [jurisdiction, setJurisdiction] = useState("Federal / Global");
  const [frequency, setFrequency] = useState("YEARLY");
  const [nextDueDate, setNextDueDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [riskLevel, setRiskLevel] = useState("MEDIUM");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchCompliance();
  }, [search, statusFilter, frequencyFilter, page]);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (frequencyFilter !== "ALL") params.set("frequency", frequencyFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/legal/compliance?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setTotalPages(json.data.pagination.totalPages || 1);
        setTotalCount(json.data.pagination.total || 0);
      }
    } catch (err) {
      console.error("Error fetching compliance:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/legal/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          regulation,
          jurisdiction: jurisdiction || undefined,
          frequency,
          nextDueDate,
          riskLevel,
          description: description || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setTitle("");
        setDescription("");
        fetchCompliance();
      } else {
        alert(json.error?.message || "Failed to create requirement");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create requirement");
    } finally {
      setCreating(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "DUE_SOON":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "OVERDUE":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "AT_RISK":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Statutory & Regulatory Compliance"
          description="Track mandatory compliance obligations, frequency schedules, audit certifications, and verified evidentiary proof."
        />
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Obligation</span>
        </button>
      </div>

      <LegalNav />

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search compliance by code, title, regulation (e.g. GDPR, SOC2)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLIANT">Compliant</option>
              <option value="DUE_SOON">Due Soon</option>
              <option value="OVERDUE">Overdue</option>
              <option value="AT_RISK">At Risk</option>
              <option value="NOT_APPLICABLE">Not Applicable</option>
            </select>

            <select
              value={frequencyFilter}
              onChange={(e) => {
                setFrequencyFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="ALL">All Frequencies</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="HALF_YEARLY">Half Yearly</option>
              <option value="YEARLY">Yearly</option>
              <option value="ONE_TIME">One Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <ShieldCheck className="mx-auto h-8 w-8 text-slate-600" />
            <p className="text-sm font-semibold">No compliance obligations found</p>
            <p className="text-xs text-slate-500">Record regulatory obligations to prevent fines or non-compliance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Code & Obligation</th>
                  <th className="py-3 px-4">Framework / Reg</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Next Due Date</th>
                  <th className="py-3 px-4">Evidences</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/app/legal/compliance/${it.id}`}
                        className="text-slate-200 font-semibold hover:text-emerald-400 transition-colors block"
                      >
                        {it.title}
                      </Link>
                      <span className="font-mono text-[11px] text-emerald-400/80">{it.code}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 font-medium">
                        {it.regulation}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {it.frequency.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-medium">
                      {formatDate(it.nextDueDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-slate-300 text-[11px]">
                        <FileCheck2 className="h-3.5 w-3.5 text-blue-400" />
                        {it._count?.evidences || 0} proofs
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          it.riskLevel === "CRITICAL"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : it.riskLevel === "HIGH"
                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {it.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(it.status)}`}>
                        {it.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/app/legal/compliance/${it.id}`}
                        className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <span>Manage</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{items.length}</span> of{" "}
            <span className="font-semibold text-slate-200">{totalCount}</span> obligations
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border border-slate-800 px-2.5 py-1 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              Previous
            </button>
            <span className="text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded border border-slate-800 px-2.5 py-1 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* New Compliance Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Register Compliance Obligation
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompliance} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Obligation Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual SOC 2 Type II External Audit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Framework / Reg *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOC2, GDPR, HIPAA"
                    value={regulation}
                    onChange={(e) => setRegulation(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="HALF_YEARLY">Half Yearly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="ONE_TIME">One Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Next Due Date *</label>
                  <input
                    type="date"
                    required
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Risk Level</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Statutory scope, certifying agency..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
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
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-white font-medium hover:bg-emerald-500 disabled:opacity-50"
                >
                  {creating ? "Registering..." : "Save Obligation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
