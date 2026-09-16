"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  FileText,
  Building2,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Scale,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
  Users,
  Send,
  Check,
  X,
  FileUp,
  ExternalLink,
  ChevronRight,
  AlertOctagon,
  History,
  Briefcase,
  Layers,
  Receipt,
  Plus,
} from "lucide-react";

export default function ContractDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [contract, setContract] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "workflow" | "documents" | "renewals" | "deadlines" | "linked" | "history"
  >("overview");

  // State machine transition modal / action
  const [transitioning, setTransitioning] = useState(false);
  const [transitionNotes, setTransitionNotes] = useState("");

  // Renewal Modal
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [newEndDate, setNewEndDate] = useState("");
  const [renewalMonths, setRenewalMonths] = useState("12");
  const [renewNotes, setRenewNotes] = useState("");
  const [renewing, setRenewing] = useState(false);

  // Upload Document Modal
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docFileUrl, setDocFileUrl] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [docChangeDesc, setDocChangeDesc] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (id) fetchContract();
  }, [id]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/legal/contracts/${id}`);
      const json = await res.json();
      if (json.success) {
        setContract(json.data);
      } else {
        setError(json.error?.message || "Failed to load contract");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading contract");
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = async (targetState: string) => {
    try {
      setTransitioning(true);
      const res = await fetch(`/api/legal/contracts/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetState, notes: transitionNotes || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        setTransitionNotes("");
        fetchContract();
      } else {
        alert(json.error?.message || "Transition failed");
      }
    } catch (err: any) {
      alert(err.message || "Transition failed");
    } finally {
      setTransitioning(false);
    }
  };

  const handleRenewContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndDate) {
      alert("Please select a new expiration date");
      return;
    }

    try {
      setRenewing(true);
      const res = await fetch(`/api/legal/contracts/${id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEndDate,
          renewalTermMonths: parseInt(renewalMonths, 10),
          notes: renewNotes || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRenewModalOpen(false);
        setRenewNotes("");
        fetchContract();
      } else {
        alert(json.error?.message || "Renewal failed");
      }
    } catch (err: any) {
      alert(err.message || "Renewal failed");
    } finally {
      setRenewing(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileUrl || !docFileName) {
      alert("Please provide file details");
      return;
    }

    try {
      setUploadingDoc(true);
      const res = await fetch("/api/legal/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: id,
          title: docTitle || docFileName,
          fileUrl: docFileUrl,
          fileName: docFileName,
          documentType: "CONTRACT",
          changeDescription: docChangeDesc || "Initial revision",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDocModalOpen(false);
        setDocTitle("");
        setDocFileUrl("");
        setDocFileName("");
        setDocChangeDesc("");
        fetchContract();
      } else {
        alert(json.error?.message || "Document upload failed");
      }
    } catch (err: any) {
      alert(err.message || "Document upload failed");
    } finally {
      setUploadingDoc(false);
    }
  };

  const formatCurrency = (val?: number | null, curr = "INR") => {
    if (val === undefined || val === null) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Indefinite";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "PENDING_APPROVAL":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "UNDER_REVIEW":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "EXPIRING_SOON":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "EXPIRED":
      case "TERMINATED":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-700/50 text-slate-400 border-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
        <AlertOctagon className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">{error || "Contract not found"}</p>
        <Link href="/app/legal/contracts" className="mt-4 inline-block text-xs underline text-amber-400">
          Back to Contracts Directory
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
            href="/app/legal/contracts"
            className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{contract.title}</h1>
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(contract.status)}`}>
                {contract.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="font-mono text-amber-400 font-semibold">{contract.contractNumber}</span>
              <span>•</span>
              <span>Type: <strong className="text-slate-200">{contract.contractType}</strong></span>
              <span>•</span>
              <span>Effective: <strong className="text-slate-200">{formatDate(contract.startDate)}</strong> to <strong className="text-slate-200">{formatDate(contract.endDate)}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {contract.status === "ACTIVE" && (
            <button
              onClick={() => {
                const currentEnd = contract.endDate ? new Date(contract.endDate) : new Date();
                const nextYear = new Date(currentEnd.getTime() + 365 * 24 * 60 * 60 * 1000);
                setNewEndDate(nextYear.toISOString().split("T")[0]);
                setRenewModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Renew Contract</span>
            </button>
          )}

          <button
            onClick={() => setDocModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <FileUp className="h-3.5 w-3.5 text-blue-400" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      <LegalNav />

      {/* 7 Workspace Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-1 overflow-x-auto scrollbar-none text-xs">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 ${
            activeTab === "overview"
              ? "border-amber-400 text-amber-400 bg-amber-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          1. Overview & Covenants
        </button>
        <button
          onClick={() => setActiveTab("workflow")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 ${
            activeTab === "workflow"
              ? "border-amber-400 text-amber-400 bg-amber-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          2. Lifecycle & Approvals
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "documents"
              ? "border-amber-400 text-amber-400 bg-amber-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>3. Documents & Vault</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px]">{contract.documents?.length || 0}</span>
        </button>
        <button
          onClick={() => setActiveTab("renewals")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "renewals"
              ? "border-amber-400 text-amber-400 bg-amber-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>4. Renewals & Terms</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px]">{contract.renewals?.length || 0}</span>
        </button>
        <button
          onClick={() => setActiveTab("deadlines")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "deadlines"
              ? "border-amber-400 text-amber-400 bg-amber-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>5. Deadlines</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px]">{contract.deadlines?.length || 0}</span>
        </button>
        <button
          onClick={() => setActiveTab("linked")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 ${
            activeTab === "linked"
              ? "border-amber-400 text-amber-400 bg-amber-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          6. Enterprise Links
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "history"
              ? "border-amber-400 text-amber-400 bg-amber-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>7. Audit Log</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px]">{contract.activities?.length || 0}</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Details */}
            <div className="md:col-span-2 rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileText className="h-4 w-4 text-amber-400" />
                Contract Scope & Clauses
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Total Contract Value</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    {formatCurrency(contract.value, contract.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Terms</span>
                  <span className="font-medium text-slate-200 mt-0.5 block">
                    {contract.paymentTerms || "Standard Net 30"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Liability Cap</span>
                  <span className="font-medium text-slate-200 mt-0.5 block">
                    {formatCurrency(contract.liabilityCap, contract.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Governing Law</span>
                  <span className="font-medium text-slate-200 mt-0.5 block">
                    {contract.governingLaw || "Maharashtra, India"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Jurisdiction</span>
                  <span className="font-medium text-slate-200 mt-0.5 block">
                    {contract.jurisdiction || "Exclusive State/Federal Courts"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Termination Notice</span>
                  <span className="font-medium text-slate-200 mt-0.5 block">
                    {contract.terminationNoticeDays ? `${contract.terminationNoticeDays} days prior notice` : "30 days"}
                  </span>
                </div>
              </div>

              {contract.notes && (
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-400 block mb-1">Executive Notes & Stipulations:</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {contract.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Counterparty & Ownership Card */}
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Building2 className="h-4 w-4 text-blue-400" />
                Parties & Signatories
              </h3>

              <div className="space-y-3 text-xs">
                {contract.client && (
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                    <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Client Counterparty</span>
                    <p className="text-sm font-bold text-slate-100 mt-0.5">{contract.client.name}</p>
                    <p className="text-slate-400 mt-1">{contract.client.industry || "Enterprise Client"}</p>
                  </div>
                )}

                {contract.vendor && (
                  <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                    <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Vendor Counterparty</span>
                    <p className="text-sm font-bold text-slate-100 mt-0.5">{contract.vendor.name}</p>
                    <p className="text-slate-400 mt-1">{contract.vendor.category || "Supplier"}</p>
                  </div>
                )}

                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Internal Legal Owner</span>
                  <p className="text-xs font-semibold text-slate-200">
                    {contract.owner?.firstName} {contract.owner?.lastName}
                  </p>
                  <p className="text-[11px] text-slate-400">{contract.owner?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Workflow & State Machine */}
      {activeTab === "workflow" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
                State Machine Lifecycle & Multi-Tier Approvals
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage bilateral execution stages from draft negotiation to binding execution.
              </p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(contract.status)}`}>
              Current Status: {contract.status.replace("_", " ")}
            </span>
          </div>

          {/* Workflow Stage Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Action: Send to Review */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-400" />
                1. Legal Review
              </div>
              <p className="text-[11px] text-slate-400">Mark draft as under formal legal and commercial review.</p>
              <button
                onClick={() => handleTransition("UNDER_REVIEW")}
                disabled={transitioning || contract.status === "UNDER_REVIEW"}
                className="w-full rounded-lg border border-blue-500/30 bg-blue-600/20 py-2 text-xs font-medium text-blue-300 hover:bg-blue-600/30 disabled:opacity-40 transition-colors"
              >
                Mark Under Review
              </button>
            </div>

            {/* Action: Request Approval */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Send className="h-4 w-4 text-amber-400" />
                2. Request Approval
              </div>
              <p className="text-[11px] text-slate-400">Submit contract to executive leadership for sign-off.</p>
              <button
                onClick={() => handleTransition("PENDING_APPROVAL")}
                disabled={transitioning || contract.status === "PENDING_APPROVAL"}
                className="w-full rounded-lg border border-amber-500/30 bg-amber-600/20 py-2 text-xs font-medium text-amber-300 hover:bg-amber-600/30 disabled:opacity-40 transition-colors"
              >
                Submit for Approval
              </button>
            </div>

            {/* Action: Approve */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                3. Executive Approval
              </div>
              <p className="text-[11px] text-slate-400">Formal governance sign-off by Authorized Officer / CEO.</p>
              <button
                onClick={() => handleTransition("APPROVED")}
                disabled={transitioning || contract.status === "APPROVED"}
                className="w-full rounded-lg border border-emerald-500/30 bg-emerald-600/20 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-600/30 disabled:opacity-40 transition-colors"
              >
                Approve Contract
              </button>
            </div>

            {/* Action: Execute / Activate */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-purple-400" />
                4. Sign & Activate
              </div>
              <p className="text-[11px] text-slate-400">Parties have executed; contract is active and legally binding.</p>
              <button
                onClick={() => handleTransition("ACTIVE")}
                disabled={transitioning || contract.status === "ACTIVE"}
                className="w-full rounded-lg bg-purple-600 py-2 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-40 transition-colors shadow-sm"
              >
                Activate Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Documents & Vault */}
      {activeTab === "documents" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-blue-400" />
              Versioned Legal Document Vault
            </h3>
            <button
              onClick={() => setDocModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Document Version</span>
            </button>
          </div>

          {!contract.documents || contract.documents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="mx-auto h-8 w-8 text-slate-600" />
              <p className="text-sm font-semibold">No documents uploaded yet</p>
              <p className="text-xs text-slate-500">Upload agreements, redlines, or executed PDF counterparts.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contract.documents.map((doc: any) => (
                <div key={doc.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{doc.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>Latest File: <strong className="text-slate-300">{doc.latestFileName}</strong></span>
                          <span>•</span>
                          <span className="rounded bg-blue-500/15 text-blue-400 px-1.5 py-0.2 font-mono font-semibold">
                            v{doc.currentVersion}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={doc.latestFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Download Latest (v{doc.currentVersion})</span>
                    </a>
                  </div>

                  {/* Versions Table */}
                  {doc.versions && doc.versions.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-2">Version History:</span>
                      <div className="space-y-1.5">
                        {doc.versions.map((ver: any) => (
                          <div key={ver.id} className="flex items-center justify-between text-xs bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/80">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                                v{ver.version}
                              </span>
                              <span className="text-slate-300">{ver.fileName}</span>
                              {ver.changeDescription && (
                                <span className="text-slate-500 italic">— {ver.changeDescription}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                              <span>{formatDate(ver.createdAt)}</span>
                              <a href={ver.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                View
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Renewals */}
      {activeTab === "renewals" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-emerald-400" />
                Renewal Horizons & History
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Auto-renewal policies, notice period countdowns, and renewal log.
              </p>
            </div>
            {contract.status === "ACTIVE" && (
              <button
                onClick={() => setRenewModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Execute Renewal</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-slate-400 block">Auto-Renew Policy</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {contract.autoRenew ? `Enabled (${contract.renewalTermMonths || 12} Months)` : "Disabled"}
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-slate-400 block">Notice Deadline Required</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {contract.renewalNoticeDays ? `${contract.renewalNoticeDays} Days prior to expiration` : "30 Days"}
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-slate-400 block">Expiration Horizon</span>
              <span className="text-sm font-bold text-amber-400 mt-1 block">
                {formatDate(contract.endDate)}
              </span>
            </div>
          </div>

          {/* Renewal Logs */}
          <div className="pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Executed Renewals</h4>
            {!contract.renewals || contract.renewals.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No previous renewal terms recorded.</p>
            ) : (
              <div className="space-y-2">
                {contract.renewals.map((ren: any) => (
                  <div key={ren.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-200">
                        Renewed from {formatDate(ren.previousEndDate)} to {formatDate(ren.newEndDate)}
                      </span>
                      {ren.notes && <p className="text-slate-400 text-[11px] mt-0.5">{ren.notes}</p>}
                    </div>
                    <div className="text-[11px] text-slate-400 text-right">
                      <span>Renewed on {formatDate(ren.renewedAt)}</span>
                      {ren.renewedBy && <div>by {ren.renewedBy.firstName} {ren.renewedBy.lastName}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Deadlines */}
      {activeTab === "deadlines" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="h-4 w-4 text-rose-400" />
            Contractual & Statutory Deadlines
          </h3>

          {!contract.deadlines || contract.deadlines.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No explicit deadlines anchored to this contract.</p>
          ) : (
            <div className="space-y-2">
              {contract.deadlines.map((dl: any) => (
                <div key={dl.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-200">{dl.title}</p>
                    <p className="text-[11px] text-slate-400">Type: {dl.deadlineType} • Priority: {dl.priority}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-400">{formatDate(dl.dueDate)}</span>
                    <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{dl.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Linked Entities */}
      {activeTab === "linked" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Briefcase className="h-4 w-4 text-purple-400" />
            Bilateral Enterprise Linkages
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {contract.client && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">CRM Client</span>
                <p className="text-sm font-bold text-slate-200 mt-1">{contract.client.name}</p>
                <Link href={`/app/crm/clients/${contract.client.id}`} className="text-[11px] text-blue-400 hover:underline mt-2 inline-block">
                  View Client Profile →
                </Link>
              </div>
            )}

            {contract.vendor && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Procurement Vendor</span>
                <p className="text-sm font-bold text-slate-200 mt-1">{contract.vendor.name}</p>
                <Link href={`/app/vendors/${contract.vendor.id}`} className="text-[11px] text-purple-400 hover:underline mt-2 inline-block">
                  View Vendor Details →
                </Link>
              </div>
            )}

            {contract.operation && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Linked Operation</span>
                <p className="text-sm font-bold text-slate-200 mt-1">{contract.operation.name}</p>
                <Link href={`/app/operations/${contract.operation.id}`} className="text-[11px] text-amber-400 hover:underline mt-2 inline-block">
                  View Operation Workspace →
                </Link>
              </div>
            )}

            {contract.invoices && contract.invoices.length > 0 && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Finance Invoices ({contract.invoices.length})</span>
                <p className="text-xs text-slate-300 mt-1">Invoices linked to this contractual engagement.</p>
                <Link href="/app/finance" className="text-[11px] text-emerald-400 hover:underline mt-2 inline-block">
                  Open Finance Ledger →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: History & Activity Log */}
      {activeTab === "history" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <History className="h-4 w-4 text-emerald-400" />
            Immutable Contract Audit Trail
          </h3>

          {!contract.activities || contract.activities.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No activity entries recorded.</p>
          ) : (
            <div className="space-y-3">
              {contract.activities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 text-xs border-b border-slate-800/60 pb-3">
                  <div className="mt-0.5 rounded-full bg-slate-800 p-1 text-slate-400">
                    <History className="h-3 w-3" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-300 font-medium">{act.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{formatDate(act.createdAt)}</span>
                      {act.performedBy && (
                        <span>by {act.performedBy.firstName} {act.performedBy.lastName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Renewal Modal */}
      {renewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-emerald-400" />
                Execute Contract Renewal
              </h3>
              <button
                onClick={() => setRenewModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRenewContract} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">New Expiration Date *</label>
                <input
                  type="date"
                  required
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Renewal Term (Months)</label>
                <input
                  type="number"
                  min="1"
                  value={renewalMonths}
                  onChange={(e) => setRenewalMonths(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Renewal Notes & Modifications</label>
                <textarea
                  rows={2}
                  placeholder="Terms extended by mutual consent..."
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRenewModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renewing}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-white font-medium hover:bg-emerald-500 disabled:opacity-50"
                >
                  {renewing ? "Renewing..." : "Confirm Renewal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileUp className="h-4 w-4 text-blue-400" />
                Upload Legal Document
              </h3>
              <button
                onClick={() => setDocModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Executed Master Service Agreement"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">File Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MSA_Final_Signed.pdf"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">File Storage URL *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /vault/contracts/MSA_Final.pdf"
                  value={docFileUrl}
                  onChange={(e) => setDocFileUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Revision / Change Description</label>
                <input
                  type="text"
                  placeholder="e.g. Incorporated liability cap revisions"
                  value={docChangeDesc}
                  onChange={(e) => setDocChangeDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-white font-medium hover:bg-blue-500 disabled:opacity-50"
                >
                  {uploadingDoc ? "Saving..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
