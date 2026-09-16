"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  Scale,
  Building2,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
  Users,
  Plus,
  X,
  ExternalLink,
  History,
  FileText,
  AlertOctagon,
  Gavel,
  ChevronRight,
} from "lucide-react";

export default function CaseWorkspacePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [legalCase, setLegalCase] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "documents" | "deadlines" | "risks" | "history">("overview");

  // Log Event Modal
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("HEARING");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventLocation, setEventLocation] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventOutcome, setEventOutcome] = useState("");
  const [loggingEvent, setLoggingEvent] = useState(false);

  useEffect(() => {
    if (id) fetchCase();
  }, [id]);

  const fetchCase = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/legal/cases/${id}`);
      const json = await res.json();
      if (json.success) {
        setLegalCase(json.data);
      } else {
        setError(json.error?.message || "Failed to load case");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading case");
    } finally {
      setLoading(false);
    }
  };

  const handleLogEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    try {
      setLoggingEvent(true);
      const res = await fetch(`/api/legal/cases/${id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle.trim(),
          eventType,
          eventDate,
          location: eventLocation || undefined,
          description: eventDesc || undefined,
          outcome: eventOutcome || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setEventModalOpen(false);
        setEventTitle("");
        setEventLocation("");
        setEventDesc("");
        setEventOutcome("");
        fetchCase();
      } else {
        alert(json.error?.message || "Failed to log event");
      }
    } catch (err: any) {
      alert(err.message || "Failed to log event");
    } finally {
      setLoggingEvent(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/legal/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        fetchCase();
      } else {
        alert(json.error?.message || "Status update failed");
      }
    } catch (err: any) {
      alert(err.message || "Status update failed");
    }
  };

  const formatCurrency = (val?: number | null, curr = "INR") => {
    if (val === undefined || val === null) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(val);
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !legalCase) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
        <AlertOctagon className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">{error || "Case not found"}</p>
        <Link href="/app/legal/cases" className="mt-4 inline-block text-xs underline text-purple-400">
          Back to Litigation Docket
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
            href="/app/legal/cases"
            className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{legalCase.title}</h1>
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(legalCase.status)}`}>
                {legalCase.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="font-mono text-purple-400 font-semibold">{legalCase.caseNumber}</span>
              <span>•</span>
              <span>Type: <strong className="text-slate-200">{legalCase.caseType}</strong></span>
              <span>•</span>
              <span>Forum: <strong className="text-slate-200">{legalCase.courtName || "Arbitration"}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setEventModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 transition-colors shadow-sm"
          >
            <Gavel className="h-3.5 w-3.5" />
            <span>Log Hearing / Proceeding</span>
          </button>

          <select
            value={legalCase.status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 focus:border-purple-500/50 focus:outline-none"
          >
            <option value="OPEN">Status: Open</option>
            <option value="IN_PROGRESS">Status: In Progress</option>
            <option value="TRIAL">Status: Trial / Hearing</option>
            <option value="APPEAL">Status: In Appeal</option>
            <option value="SETTLED">Status: Settled</option>
            <option value="CLOSED">Status: Closed</option>
            <option value="DISMISSED">Status: Dismissed</option>
          </select>
        </div>
      </div>

      <LegalNav />

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-1 overflow-x-auto scrollbar-none text-xs">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 ${
            activeTab === "overview"
              ? "border-purple-400 text-purple-400 bg-purple-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Docket & Defense Strategy
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "events"
              ? "border-purple-400 text-purple-400 bg-purple-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Proceedings & Hearings</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px]">{legalCase.events?.length || 0}</span>
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "documents"
              ? "border-purple-400 text-purple-400 bg-purple-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Pleadings & Evidence</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px]">{legalCase.documents?.length || 0}</span>
        </button>
        <button
          onClick={() => setActiveTab("deadlines")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "deadlines"
              ? "border-purple-400 text-purple-400 bg-purple-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Litigation Deadlines</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px]">{legalCase.deadlines?.length || 0}</span>
        </button>
        <button
          onClick={() => setActiveTab("risks")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "risks"
              ? "border-purple-400 text-purple-400 bg-purple-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Assessed Risks</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px]">{legalCase.risks?.length || 0}</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-2.5 px-4 font-medium transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "history"
              ? "border-purple-400 text-purple-400 bg-purple-400/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Activity Trail</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px]">{legalCase.activities?.length || 0}</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Scale className="h-4 w-4 text-purple-400" />
                Case Claims & Financial Exposure
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Claim Amount</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    {formatCurrency(legalCase.claimAmount, legalCase.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Est. Financial Exposure</span>
                  <span className="text-base font-bold text-rose-400 mt-0.5 block">
                    {formatCurrency(legalCase.exposureAmount, legalCase.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Settlement Cap</span>
                  <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                    {formatCurrency(legalCase.settlementAmount, legalCase.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Court Docket #</span>
                  <span className="font-mono font-medium text-slate-200 mt-0.5 block">
                    {legalCase.courtCaseNumber || "Not filed"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Presiding Judge</span>
                  <span className="font-medium text-slate-200 mt-0.5 block">
                    {legalCase.judgeName || "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Jurisdiction</span>
                  <span className="font-medium text-slate-200 mt-0.5 block">
                    {legalCase.jurisdiction || "High Court of Bombay"}
                  </span>
                </div>
              </div>

              {legalCase.summary && (
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-400 block mb-1">Executive Case Brief:</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {legalCase.summary}
                  </p>
                </div>
              )}

              {legalCase.strategy && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-400 block mb-1">Defense Strategy & Trial Roadmap:</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {legalCase.strategy}
                  </p>
                </div>
              )}
            </div>

            {/* Counsel & Opposing Counsel */}
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Users className="h-4 w-4 text-blue-400" />
                Legal Representation
              </h3>

              <div className="space-y-3 text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Assigned Internal Counsel</span>
                  <p className="text-xs font-bold text-slate-200">
                    {legalCase.assignedLawyer
                      ? `${legalCase.assignedLawyer.firstName} ${legalCase.assignedLawyer.lastName}`
                      : "Unassigned"}
                  </p>
                  <p className="text-[11px] text-slate-400">{legalCase.assignedLawyer?.email}</p>
                </div>

                <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 space-y-1">
                  <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">External Retained Counsel</span>
                  <p className="text-xs font-bold text-slate-100">
                    {legalCase.externalCounsel ? legalCase.externalCounsel.name : "None retained"}
                  </p>
                  <p className="text-[11px] text-slate-400">{legalCase.externalCounsel?.firmName}</p>
                </div>

                <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 space-y-1">
                  <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Opposing Party & Counsel</span>
                  <p className="text-xs font-bold text-slate-100">{legalCase.opposingParty || "Undisclosed"}</p>
                  <p className="text-[11px] text-slate-400">{legalCase.opposingCounsel || "Opposing counsel not specified"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Proceedings & Hearings */}
      {activeTab === "events" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Gavel className="h-4 w-4 text-purple-400" />
              Court Proceedings, Hearings & Depositions
            </h3>
            <button
              onClick={() => setEventModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Proceeding</span>
            </button>
          </div>

          {!legalCase.events || legalCase.events.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Gavel className="mx-auto h-8 w-8 text-slate-600" />
              <p className="text-sm font-semibold">No hearings or proceedings logged yet</p>
              <p className="text-xs text-slate-500">Log trial dates, discovery hearings, or mediation conferences.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {legalCase.events.map((ev: any) => (
                <div key={ev.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold">
                        {ev.eventType}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-200">{ev.title}</h4>
                    </div>
                    <span className="font-bold text-amber-400">{formatDate(ev.eventDate)}</span>
                  </div>

                  {ev.description && <p className="text-slate-300">{ev.description}</p>}
                  {ev.location && <p className="text-slate-400 text-[11px]">Location / Court: {ev.location}</p>}
                  {ev.outcome && (
                    <div className="mt-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                      <strong className="text-emerald-400">Hearing Outcome / Ruling: </strong>
                      <span className="text-slate-300">{ev.outcome}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Documents */}
      {activeTab === "documents" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileCheck2 className="h-4 w-4 text-blue-400" />
            Court Filings, Pleadings & Motions
          </h3>

          {!legalCase.documents || legalCase.documents.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No pleadings or motions uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {legalCase.documents.map((doc: any) => (
                <div key={doc.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-semibold text-slate-200">{doc.title}</p>
                      <p className="text-[11px] text-slate-400">{doc.latestFileName} (v{doc.currentVersion})</p>
                    </div>
                  </div>
                  <a
                    href={doc.latestFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:underline text-xs"
                  >
                    <span>Download</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Deadlines */}
      {activeTab === "deadlines" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="h-4 w-4 text-rose-400" />
            Discovery & Pleading Deadlines
          </h3>

          {!legalCase.deadlines || legalCase.deadlines.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No deadlines scheduled.</p>
          ) : (
            <div className="space-y-2">
              {legalCase.deadlines.map((dl: any) => (
                <div key={dl.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-200">{dl.title}</p>
                    <p className="text-[11px] text-slate-400">{dl.deadlineType}</p>
                  </div>
                  <span className="font-bold text-amber-400">{formatDate(dl.dueDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Risks */}
      {activeTab === "risks" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            Litigation Risk Register
          </h3>

          {!legalCase.risks || legalCase.risks.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No risk entries anchored to this dispute.</p>
          ) : (
            <div className="space-y-2">
              {legalCase.risks.map((r: any) => (
                <div key={r.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-400 font-bold">{r.riskCode}</span>
                      <span className="font-semibold text-slate-200">{r.title}</span>
                    </div>
                    {r.mitigationPlan && <p className="text-[11px] text-slate-400 mt-1">{r.mitigationPlan}</p>}
                  </div>
                  <span className="rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold">
                    Score: {r.riskScore} ({r.riskLevel})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: History */}
      {activeTab === "history" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <History className="h-4 w-4 text-emerald-400" />
            Case Activity History
          </h3>

          {!legalCase.activities || legalCase.activities.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No activities recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {legalCase.activities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 text-xs border-b border-slate-800/60 pb-3">
                  <div className="mt-0.5 rounded-full bg-slate-800 p-1 text-slate-400">
                    <History className="h-3 w-3" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-300 font-medium">{act.description}</p>
                    <span className="text-[10px] text-slate-500">{formatDate(act.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log Proceeding Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gavel className="h-4 w-4 text-purple-400" />
                Log Court Proceeding / Event
              </h3>
              <button onClick={() => setEventModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLogEvent} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Preliminary Injunction Hearing"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  >
                    <option value="HEARING">Hearing</option>
                    <option value="TRIAL">Trial</option>
                    <option value="DEPOSITION">Deposition</option>
                    <option value="MEDIATION">Mediation</option>
                    <option value="ARBITRATION">Arbitration</option>
                    <option value="FILING">Court Filing</option>
                    <option value="SETTLEMENT_CONFERENCE">Settlement Conference</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Location / Courtroom</label>
                <input
                  type="text"
                  placeholder="Courtroom 4B, Wilmington, DE"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Outcome / Ruling</label>
                <textarea
                  rows={2}
                  placeholder="Judge granted motion for extension..."
                  value={eventOutcome}
                  onChange={(e) => setEventOutcome(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-200 focus:border-purple-500/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingEvent}
                  className="rounded-lg bg-purple-600 px-4 py-1.5 text-white font-medium hover:bg-purple-500 disabled:opacity-50"
                >
                  {loggingEvent ? "Logging..." : "Save Proceeding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
