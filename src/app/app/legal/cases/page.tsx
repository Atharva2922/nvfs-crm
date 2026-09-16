"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  Scale,
  Search,
  RefreshCw,
  Plus,
  ChevronRight,
  IndianRupee,
  AlertTriangle,
  Building2,
  Calendar,
  X,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";

export default function CasesListPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // New Case Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [caseType, setCaseType] = useState("LITIGATION");
  const [courtName, setCourtName] = useState("");
  const [courtCaseNumber, setCourtCaseNumber] = useState("");
  const [opposingParty, setOpposingParty] = useState("");
  const [opposingCounsel, setOpposingCounsel] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [exposureAmount, setExposureAmount] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    fetchCases();
  }, [search, statusFilter, typeFilter, page]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("caseType", typeFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/legal/cases?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCases(json.data.cases);
        setTotalPages(json.data.pagination.totalPages || 1);
        setTotalCount(json.data.pagination.total || 0);
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/legal/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          caseType,
          courtName: courtName || undefined,
          courtCaseNumber: courtCaseNumber || undefined,
          opposingParty: opposingParty || undefined,
          opposingCounsel: opposingCounsel || undefined,
          claimAmount: claimAmount ? parseFloat(claimAmount) : undefined,
          exposureAmount: exposureAmount ? parseFloat(exposureAmount) : undefined,
          priority,
          summary: summary || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setTitle("");
        setCourtName("");
        setCourtCaseNumber("");
        setOpposingParty("");
        setOpposingCounsel("");
        setClaimAmount("");
        setExposureAmount("");
        setSummary("");
        fetchCases();
      } else {
        alert(json.error?.message || "Failed to create case");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create case");
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (val?: number | null, curr = "INR") => {
    if (val === undefined || val === null) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
      case "IN_PROGRESS":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "TRIAL":
      case "APPEAL":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "SETTLED":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "CLOSED":
      case "DISMISSED":
        return "bg-slate-700/50 text-slate-400 border-slate-700";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Litigation & Legal Cases"
          description="Litigation docket, arbitration proceedings, financial exposure tracking, court hearings, and defense strategy."
        />
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Open Legal Case</span>
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
              placeholder="Search cases by title, case number, opposing party, court..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-purple-500/50 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="TRIAL">Trial / Hearing</option>
              <option value="APPEAL">Appeal</option>
              <option value="SETTLED">Settled</option>
              <option value="CLOSED">Closed</option>
              <option value="DISMISSED">Dismissed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-purple-500/50 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="LITIGATION">Litigation</option>
              <option value="ARBITRATION">Arbitration</option>
              <option value="REGULATORY_INVESTIGATION">Regulatory Investigation</option>
              <option value="IP_DISPUTE">Intellectual Property</option>
              <option value="EMPLOYMENT_DISPUTE">Employment Dispute</option>
              <option value="CONTRACT_DISPUTE">Contract Dispute</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-purple-500" />
          </div>
        ) : cases.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Scale className="mx-auto h-8 w-8 text-slate-600" />
            <p className="text-sm font-semibold">No legal cases found</p>
            <p className="text-xs text-slate-500">Register active disputes or court litigation items.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Case Code & Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Opposing Party</th>
                  <th className="py-3 px-4">Court / Forum</th>
                  <th className="py-3 px-4">Est. Exposure</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/app/legal/cases/${c.id}`}
                        className="text-slate-200 font-semibold hover:text-purple-400 transition-colors block"
                      >
                        {c.title}
                      </Link>
                      <span className="font-mono text-[11px] text-purple-400/80">{c.caseNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 font-medium">
                        {c.caseType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {c.opposingParty || "Undisclosed"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {c.courtName ? `${c.courtName} (${c.courtCaseNumber || "Pending Docket"})` : "Arbitration / Pre-Trial"}
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-400">
                      {formatCurrency(c.exposureAmount || c.claimAmount, c.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          c.priority === "CRITICAL"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : c.priority === "HIGH"
                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(c.status)}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/app/legal/cases/${c.id}`}
                        className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <span>Workspace</span>
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
            Showing <span className="font-semibold text-slate-200">{cases.length}</span> of{" "}
            <span className="font-semibold text-slate-200">{totalCount}</span> cases
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

      {/* New Case Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-purple-400" />
                Register New Legal Case
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Case Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp v. NFVS Corp Patent Dispute"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Case Type</label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  >
                    <option value="LITIGATION">Litigation</option>
                    <option value="ARBITRATION">Arbitration</option>
                    <option value="REGULATORY_INVESTIGATION">Regulatory</option>
                    <option value="IP_DISPUTE">IP Dispute</option>
                    <option value="EMPLOYMENT_DISPUTE">Employment</option>
                    <option value="CONTRACT_DISPUTE">Contract Dispute</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Opposing Party</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corporation"
                    value={opposingParty}
                    onChange={(e) => setOpposingParty(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Opposing Counsel</label>
                  <input
                    type="text"
                    placeholder="e.g. Morgan & Morgan LLP"
                    value={opposingCounsel}
                    onChange={(e) => setOpposingCounsel(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Court / Forum</label>
                  <input
                    type="text"
                    placeholder="e.g. US District Court, SDNY"
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Court Docket #</label>
                  <input
                    type="text"
                    placeholder="e.g. 1:26-cv-04321"
                    value={courtCaseNumber}
                    onChange={(e) => setCourtCaseNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Claim Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Estimated Exposure ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={exposureAmount}
                    onChange={(e) => setExposureAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Executive Case Summary</label>
                <textarea
                  rows={2}
                  placeholder="Overview of claims, factual background..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 text-slate-200 focus:border-purple-500/50 focus:outline-none"
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
                  className="rounded-lg bg-purple-600 px-4 py-1.5 text-white font-medium hover:bg-purple-500 disabled:opacity-50"
                >
                  {creating ? "Opening Case..." : "Register Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
