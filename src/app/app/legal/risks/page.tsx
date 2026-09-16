"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Plus,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  X,
  FileText,
  Scale,
  ShieldCheck,
} from "lucide-react";

export default function RiskRegisterPage() {
  const [risks, setRisks] = useState<any[]>([]);
  const [matrixData, setMatrixData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  // New Risk Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [probability, setProbability] = useState(3);
  const [impact, setImpact] = useState(3);
  const [mitigationPlan, setMitigationPlan] = useState("");
  const [status, setStatus] = useState("IDENTIFIED");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRisks();
  }, [search, levelFilter, statusFilter]);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (levelFilter !== "ALL") params.set("riskLevel", levelFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/legal/risks?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRisks(json.data.risks);
        setMatrixData(json.data.matrix);
      }
    } catch (err) {
      console.error("Error fetching risks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/legal/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          probability,
          impact,
          mitigationPlan: mitigationPlan || undefined,
          status,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setTitle("");
        setMitigationPlan("");
        fetchRisks();
      } else {
        alert(json.error?.message || "Failed to create risk");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create risk");
    } finally {
      setCreating(false);
    }
  };

  const getCellColor = (p: number, i: number) => {
    const score = p * i;
    if (score >= 20) return "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30";
    if (score >= 15) return "bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30";
    if (score >= 7) return "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30";
  };

  const probLabels = ["", "1 - Rare", "2 - Unlikely", "3 - Moderate", "4 - Likely", "5 - Very Likely"];
  const impactLabels = ["", "1 - Minor", "2 - Low", "3 - Moderate", "4 - Major", "5 - Critical"];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Legal Risk Register & 5×5 Matrix"
          description="Identify, assess, and mitigate contractual, litigation, and regulatory compliance risks across enterprise operations."
        />
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Register Risk</span>
        </button>
      </div>

      <LegalNav />

      {/* 5x5 Heatmap Matrix and Severity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive 5x5 Matrix */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              5×5 Probability × Impact Heatmap
            </h3>
            <span className="text-xs text-slate-400">Click a cell to filter active items</span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Matrix Grid Header */}
              <div className="grid grid-cols-6 gap-1.5 text-center text-[11px] font-semibold text-slate-400 mb-1.5">
                <div className="py-1 text-left text-slate-500">Prob \ Impact</div>
                <div className="py-1 bg-slate-900/60 rounded">1 - Minor</div>
                <div className="py-1 bg-slate-900/60 rounded">2 - Low</div>
                <div className="py-1 bg-slate-900/60 rounded">3 - Mod</div>
                <div className="py-1 bg-slate-900/60 rounded">4 - Major</div>
                <div className="py-1 bg-slate-900/60 rounded">5 - Critical</div>
              </div>

              {/* Rows 5 down to 1 */}
              {[5, 4, 3, 2, 1].map((p) => (
                <div key={p} className="grid grid-cols-6 gap-1.5 mb-1.5">
                  <div className="flex items-center text-xs font-semibold text-slate-400 bg-slate-900/40 rounded px-2">
                    {probLabels[p]}
                  </div>
                  {[1, 2, 3, 4, 5].map((imp) => {
                    const key = `${p}_${imp}`;
                    const count = matrixData?.grid?.[key]?.count || 0;
                    const isSelected = selectedCell === key;

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedCell(isSelected ? null : key)}
                        className={`h-11 rounded border flex flex-col items-center justify-center transition-all ${getCellColor(
                          p,
                          imp
                        )} ${isSelected ? "ring-2 ring-white scale-105" : ""}`}
                      >
                        <span className="text-xs font-extrabold">{count}</span>
                        <span className="text-[9px] opacity-70 font-mono">Score {p * imp}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Severity Breakdown Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Distribution by Severity
          </h3>

          <div className="space-y-3">
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Critical (20–25)</span>
                <span className="text-[11px] text-slate-400">Immediate board mitigation required</span>
              </div>
              <span className="text-xl font-extrabold text-white">
                {matrixData?.distribution?.CRITICAL || 0}
              </span>
            </div>

            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">High (15–19)</span>
                <span className="text-[11px] text-slate-400">Escalated to General Counsel</span>
              </div>
              <span className="text-xl font-extrabold text-white">
                {matrixData?.distribution?.HIGH || 0}
              </span>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Medium (7–14)</span>
                <span className="text-[11px] text-slate-400">Managed within departmental controls</span>
              </div>
              <span className="text-xl font-extrabold text-white">
                {matrixData?.distribution?.MEDIUM || 0}
              </span>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Low (1–6)</span>
                <span className="text-[11px] text-slate-400">Routine risk monitoring</span>
              </div>
              <span className="text-xl font-extrabold text-white">
                {matrixData?.distribution?.LOW || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search risk register by code, title, mitigation plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none"
          />
        </div>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-rose-500/50 focus:outline-none w-full sm:w-auto"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-rose-500/50 focus:outline-none w-full sm:w-auto"
        >
          <option value="ALL">All Statuses</option>
          <option value="IDENTIFIED">Identified</option>
          <option value="ASSESSED">Assessed</option>
          <option value="MITIGATING">Mitigating</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Risk Register Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-rose-500" />
          </div>
        ) : risks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="text-sm font-semibold">No risk entries found</p>
            <p className="text-xs text-slate-500">Register new risks to monitor exposures.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Risk Code & Title</th>
                  <th className="py-3 px-4">Anchored Entity</th>
                  <th className="py-3 px-4">Prob</th>
                  <th className="py-3 px-4">Impact</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Mitigation Plan</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {risks.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200 block">{r.title}</span>
                      <span className="font-mono text-[11px] text-rose-400/80">{r.riskCode}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {r.contract && (
                        <Link href={`/app/legal/contracts/${r.contractId}`} className="text-amber-400 hover:underline flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{r.contract.contractNumber}</span>
                        </Link>
                      )}
                      {r.case && (
                        <Link href={`/app/legal/cases/${r.caseId}`} className="text-purple-400 hover:underline flex items-center gap-1">
                          <Scale className="h-3 w-3" />
                          <span>{r.case.caseNumber}</span>
                        </Link>
                      )}
                      {r.compliance && (
                        <Link href={`/app/legal/compliance/${r.complianceId}`} className="text-emerald-400 hover:underline flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          <span>{r.compliance.code}</span>
                        </Link>
                      )}
                      {!r.contract && !r.case && !r.compliance && <span className="italic text-slate-500">Enterprise</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-bold">{r.probability}/5</td>
                    <td className="py-3 px-4 text-slate-200 font-bold">{r.impact}/5</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-white text-sm">{r.riskScore}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          r.riskLevel === "CRITICAL"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : r.riskLevel === "HIGH"
                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                            : r.riskLevel === "MEDIUM"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {r.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {r.mitigationPlan || "No mitigation defined"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-semibold">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Risk Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                Register Legal / Compliance Risk
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRisk} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Risk Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counterparty Default Exposure under MSA"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-rose-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Probability (1 to 5)</label>
                  <select
                    value={probability}
                    onChange={(e) => setProbability(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-rose-500/50 focus:outline-none"
                  >
                    <option value={1}>1 - Rare (10%)</option>
                    <option value={2}>2 - Unlikely (25%)</option>
                    <option value={3}>3 - Moderate (50%)</option>
                    <option value={4}>4 - Likely (75%)</option>
                    <option value={5}>5 - Very Likely (90%+)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Impact (1 to 5)</label>
                  <select
                    value={impact}
                    onChange={(e) => setImpact(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-rose-500/50 focus:outline-none"
                  >
                    <option value={1}>1 - Minor (&lt;$10k)</option>
                    <option value={2}>2 - Low ($10k-$50k)</option>
                    <option value={3}>3 - Moderate ($50k-$250k)</option>
                    <option value={4}>4 - Major ($250k-$1M)</option>
                    <option value={5}>5 - Critical (&gt;$1M / Injunction)</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Calculated Score:</span>
                <span className="font-extrabold text-white text-sm">
                  {probability * impact} / 25
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Mitigation Plan</label>
                <textarea
                  rows={2}
                  placeholder="Escrow provisions, insurance policy..."
                  value={mitigationPlan}
                  onChange={(e) => setMitigationPlan(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-200 focus:border-rose-500/50 focus:outline-none"
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
                  className="rounded-lg bg-rose-600 px-4 py-1.5 text-white font-medium hover:bg-rose-500 disabled:opacity-50"
                >
                  {creating ? "Registering..." : "Record Risk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
