"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CrmNav } from "@/modules/crm/components/crm-nav";
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Building,
  Mail,
  Phone,
  IndianRupee,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LeadItem {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  source: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED" | "LOST";
  estimatedValue?: number | null;
  notes?: string | null;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  convertedClient?: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdAt: string;
}

interface ClientOption {
  id: string;
  name: string;
  code: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Capture Lead Modal
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [source, setSource] = useState<any>("WEBSITE");
  const [estValue, setEstValue] = useState<number>(50000);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState("");

  // Convert Lead Modal
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<LeadItem | null>(null);
  const [createOpp, setCreateOpp] = useState(true);
  const [dealVal, setDealVal] = useState(50000);
  const [matchedExistingClientId, setMatchedExistingClientId] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState("");

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/crm/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data.leads);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/crm/clients?limit=100");
      const data = await res.json();
      if (data.success) {
        setClients(data.data.clients);
      }
    } catch {}
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCaptureLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCaptureError("");
    if (!first.trim() || !company.trim() || !email.trim()) {
      setCaptureError("First name, company, and email are required");
      return;
    }

    try {
      setIsCapturing(true);
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: first.trim(),
          lastName: last.trim() || "",
          companyName: company.trim(),
          email: email.trim(),
          phone: phone || undefined,
          jobTitle: jobTitle || undefined,
          source,
          estimatedValue: Number(estValue) || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCaptureError(data.error?.message || "Failed to capture lead");
        return;
      }

      setCaptureModalOpen(false);
      setFirst("");
      setLast("");
      setCompany("");
      setEmail("");
      setPhone("");
      setJobTitle("");
      fetchLeads();
    } catch (err: any) {
      setCaptureError(err.message || "An error occurred");
    } finally {
      setIsCapturing(false);
    }
  };

  const openConvertModal = (lead: LeadItem) => {
    setConvertingLead(lead);
    setDealVal(lead.estimatedValue || 50000);
    setCreateOpp(true);
    setConvertError("");

    // Check if a client with similar name already exists
    const match = clients.find(
      (c) => c.name.toLowerCase().trim() === lead.companyName.toLowerCase().trim()
    );
    setMatchedExistingClientId(match ? match.id : "");
    setConvertModalOpen(true);
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;
    setConvertError("");

    try {
      setIsConverting(true);
      const res = await fetch(`/api/crm/leads/${convertingLead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createOpportunity: createOpp,
          dealValue: Number(dealVal),
          existingClientId: matchedExistingClientId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setConvertError(data.error?.message || "Conversion failed");
        return;
      }

      setConvertModalOpen(false);
      setConvertingLead(null);
      fetchLeads();
      fetchClients();
    } catch (err: any) {
      setConvertError(err.message || "An error occurred");
    } finally {
      setIsConverting(false);
    }
  };

  const getStatusBadge = (status: LeadItem["status"]) => {
    switch (status) {
      case "NEW":
        return <span className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400">NEW</span>;
      case "CONTACTED":
        return <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">CONTACTED</span>;
      case "QUALIFIED":
        return <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400">QUALIFIED</span>;
      case "CONVERTED":
        return <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">CONVERTED</span>;
      case "LOST":
      case "UNQUALIFIED":
        return <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">{status}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <CrmNav />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Inbound Sales Leads & Prospects"
          description="Prospect capture, multi-stage lead qualification, and duplicate-resistant account conversion."
        />
        <button
          onClick={() => setCaptureModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Capture Lead</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-lg border border-slate-800 bg-[#0f172a]/90 p-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Lead Stages</option>
            <option value="NEW">New Leads</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted Accounts</option>
            <option value="LOST">Lost / Unqualified</option>
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search contact, company, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-full rounded-md border border-slate-800 bg-slate-900 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0c1322] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">Loading sales prospects...</div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500">No leads found matching criteria.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-[#0f172a] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Prospect Contact</th>
                <th className="px-4 py-3">Company Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Est. Deal Value</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Sales Owner</th>
                <th className="px-4 py-3 text-right">Convert / Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200">{lead.firstName} {lead.lastName}</span>
                      <span className="text-[10px] text-slate-400">{lead.jobTitle || "Stakeholder"} • {lead.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-300">{lead.companyName}</td>
                  <td className="px-4 py-3">{getStatusBadge(lead.status)}</td>
                  <td className="px-4 py-3 font-bold text-slate-200">
                    ₹{lead.estimatedValue ? lead.estimatedValue.toLocaleString() : "0"}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{lead.source}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {lead.owner ? `${lead.owner.firstName} ${lead.owner.lastName}` : "Unassigned"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {lead.status === "CONVERTED" && lead.convertedClient ? (
                      <Link
                        href={`/app/crm/clients/${lead.convertedClient.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline"
                      >
                        <span>View {lead.convertedClient.code}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => openConvertModal(lead)}
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-500 transition-colors"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Convert</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Capture Lead Modal */}
      {captureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Capture Inbound Prospect Lead</h3>
              </div>
              <button
                onClick={() => setCaptureModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {captureError && (
              <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
                {captureError}
              </div>
            )}

            <form onSubmit={handleCaptureLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={first}
                    onChange={(e) => setFirst(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyberdyne Systems"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="Director of Procurement"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="WEBSITE">Website Inbound</option>
                    <option value="CONFERENCE">Industry Conference</option>
                    <option value="REFERRAL">Executive Referral</option>
                    <option value="COLD_OUTREACH">Cold Outreach</option>
                    <option value="PARTNER">Channel Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Estimated Contract Value (₹)</label>
                  <input
                    type="number"
                    value={estValue}
                    onChange={(e) => setEstValue(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCaptureModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCapturing}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isCapturing ? "Saving..." : "Save Prospect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead Modal with Duplicate Detection */}
      {convertModalOpen && convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Convert Lead to Account</h3>
              </div>
              <button
                onClick={() => setConvertModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {convertError && (
              <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
                {convertError}
              </div>
            )}

            <form onSubmit={handleConvertLead} className="space-y-4 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Converting Prospect</span>
                <p className="text-sm font-bold text-white mt-0.5">{convertingLead.firstName} {convertingLead.lastName}</p>
                <p className="text-xs text-slate-300">{convertingLead.companyName} • {convertingLead.email}</p>
              </div>

              {/* Duplicate Handling Alert / Selector */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Target Client Account (Duplicate Protection)
                </label>
                <select
                  value={matchedExistingClientId}
                  onChange={(e) => setMatchedExistingClientId(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">✨ Auto-create new Client: "{convertingLead.companyName}"</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      Attach to existing: {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                {matchedExistingClientId ? (
                  <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Existing account selected: will attach contact & deal without duplicating company.</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1">
                    System will automatically verify and create an official account profile.
                  </p>
                )}
              </div>

              {/* Opportunity Toggle */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createOpp"
                    checked={createOpp}
                    onChange={(e) => setCreateOpp(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="createOpp" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Initialize Deal Opportunity in Pipeline
                  </label>
                </div>

                {createOpp && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Deal Contract Value (₹)</label>
                    <input
                      type="number"
                      required
                      value={dealVal}
                      onChange={(e) => setDealVal(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConvertModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConverting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isConverting ? "Converting..." : "Complete Conversion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
