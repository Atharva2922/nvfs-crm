"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
  Plus,
  X,
  ExternalLink,
  History,
  AlertOctagon,
  Check,
  FileText,
} from "lucide-react";

export default function ComplianceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [compliance, setCompliance] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evidence Submission Modal
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceType, setEvidenceType] = useState("CERTIFICATE");
  const [fileUrl, setFileUrl] = useState("");
  const [evidenceDesc, setEvidenceDesc] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  useEffect(() => {
    if (id) fetchCompliance();
  }, [id]);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/legal/compliance/${id}`);
      const json = await res.json();
      if (json.success) {
        setCompliance(json.data);
      } else {
        setError(json.error?.message || "Failed to load compliance requirement");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading compliance requirement");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTitle.trim()) return;

    try {
      setSubmittingEvidence(true);
      const res = await fetch(`/api/legal/compliance/${id}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: evidenceTitle.trim(),
          evidenceType,
          fileUrl: fileUrl || undefined,
          description: evidenceDesc || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setEvidenceModalOpen(false);
        setEvidenceTitle("");
        setFileUrl("");
        setEvidenceDesc("");
        fetchCompliance();
      } else {
        alert(json.error?.message || "Failed to submit evidence");
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit evidence");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleVerifyEvidence = async (evidenceId: string, status: "VERIFIED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/legal/compliance/${id}/evidence`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceId, status }),
      });
      const json = await res.json();
      if (json.success) {
        fetchCompliance();
      } else {
        alert(json.error?.message || "Failed to update evidence status");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update evidence status");
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !compliance) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
        <AlertOctagon className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">{error || "Compliance obligation not found"}</p>
        <Link href="/app/legal/compliance" className="mt-4 inline-block text-xs underline text-emerald-400">
          Back to Compliance Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app/legal/compliance"
            className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{compliance.title}</h1>
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(compliance.status)}`}>
                {compliance.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="font-mono text-emerald-400 font-semibold">{compliance.code}</span>
              <span>•</span>
              <span>Framework: <strong className="text-slate-200">{compliance.regulation}</strong></span>
              <span>•</span>
              <span>Frequency: <strong className="text-slate-200">{compliance.frequency}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEvidenceModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Submit Evidence Proof</span>
          </button>
        </div>
      </div>

      <LegalNav />

      {/* Primary Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Obligation Scope & Timeline
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Next Due Date</span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {formatDate(compliance.nextDueDate)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Last Completed</span>
              <span className="font-medium text-slate-200 mt-0.5 block">
                {formatDate(compliance.lastCompletedDate)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Risk Severity</span>
              <span
                className={`inline-block mt-0.5 rounded px-2 py-0.5 text-[10px] font-bold ${
                  compliance.riskLevel === "CRITICAL"
                    ? "bg-rose-500/15 text-rose-400"
                    : compliance.riskLevel === "HIGH"
                    ? "bg-orange-500/15 text-orange-400"
                    : "bg-blue-500/15 text-blue-400"
                }`}
              >
                {compliance.riskLevel}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Jurisdiction</span>
              <span className="font-medium text-slate-200 mt-0.5 block">
                {compliance.jurisdiction || "Global / Federal"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Department</span>
              <span className="font-medium text-slate-200 mt-0.5 block">
                {compliance.department?.name || "Corporate Wide"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Internal Owner</span>
              <span className="font-medium text-slate-200 mt-0.5 block">
                {compliance.owner ? `${compliance.owner.firstName} ${compliance.owner.lastName}` : "Assigned Officer"}
              </span>
            </div>
          </div>

          {compliance.description && (
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Requirement Description:</span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {compliance.description}
              </p>
            </div>
          )}
        </div>

        {/* Verification Summary Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileCheck2 className="h-4 w-4 text-blue-400" />
            Evidence & Attestation Status
          </h3>

          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 flex items-center justify-between">
              <span className="text-slate-400">Total Proofs Submitted:</span>
              <span className="font-bold text-slate-200">{compliance.evidences?.length || 0}</span>
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center justify-between">
              <span className="text-emerald-400">Verified Evidence:</span>
              <span className="font-bold text-emerald-300">
                {compliance.evidences?.filter((e: any) => e.status === "VERIFIED").length || 0}
              </span>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between">
              <span className="text-amber-400">Pending Verification:</span>
              <span className="font-bold text-amber-300">
                {compliance.evidences?.filter((e: any) => e.status === "SUBMITTED").length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Evidentiary Proof Records Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-emerald-400" />
            Submitted Evidentiary Records & Certificates
          </h3>
          <button
            onClick={() => setEvidenceModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Submit Evidence</span>
          </button>
        </div>

        {!compliance.evidences || compliance.evidences.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FileCheck2 className="mx-auto h-8 w-8 text-slate-600" />
            <p className="text-sm font-semibold">No evidence submitted yet</p>
            <p className="text-xs text-slate-500">Attach audit logs, security attestations, or certificates of conformity.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Evidence Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {compliance.evidences.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200 block">{ev.title}</span>
                      {ev.fileUrl && (
                        <a
                          href={ev.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>View Proof File</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 font-medium">
                        {ev.evidenceType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {ev.submittedBy ? `${ev.submittedBy.firstName} ${ev.submittedBy.lastName}` : "User"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(ev.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          ev.status === "VERIFIED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : ev.status === "REJECTED"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ev.status === "SUBMITTED" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerifyEvidence(ev.id, "VERIFIED")}
                            className="rounded bg-emerald-600/20 border border-emerald-500/30 px-2 py-1 text-emerald-400 hover:bg-emerald-600/30 text-[11px] font-medium"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleVerifyEvidence(ev.id, "REJECTED")}
                            className="rounded bg-rose-600/20 border border-rose-500/30 px-2 py-1 text-rose-400 hover:bg-rose-600/30 text-[11px] font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          {ev.verifiedBy ? `By ${ev.verifiedBy.firstName}` : "Completed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Evidence Modal */}
      {evidenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-400" />
                Submit Compliance Evidence
              </h3>
              <button onClick={() => setEvidenceModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Evidence Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 SOC 2 Type II Final Report"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Evidence Type</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="CERTIFICATE">Certificate of Compliance</option>
                  <option value="AUDIT_REPORT">Independent Audit Report</option>
                  <option value="POLICY_ATTESTATION">Policy Attestation</option>
                  <option value="LOG_EXPORT">Log / Telemetry Export</option>
                  <option value="OTHER">Other Proof</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Storage File URL</label>
                <input
                  type="text"
                  placeholder="e.g. /vault/compliance/soc2_2026.pdf"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Auditor notes, coverage dates..."
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEvidenceModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEvidence}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-white font-medium hover:bg-emerald-500 disabled:opacity-50"
                >
                  {submittingEvidence ? "Submitting..." : "Submit Proof"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
