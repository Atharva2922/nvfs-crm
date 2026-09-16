"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";

export default function NewContractPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reference lookups
  const [clients, setClients] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [contractType, setContractType] = useState("MSA");
  const [counterpartyType, setCounterpartyType] = useState<"CLIENT" | "VENDOR" | "INTERNAL">("CLIENT");
  const [clientId, setClientId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [autoRenew, setAutoRenew] = useState(true);
  const [renewalTermMonths, setRenewalTermMonths] = useState("12");
  const [renewalNoticeDays, setRenewalNoticeDays] = useState("30");
  const [governingLaw, setGoverningLaw] = useState("State of Maharashtra, India");
  const [jurisdiction, setJurisdiction] = useState("High Court of Bombay");
  const [terminationNoticeDays, setTerminationNoticeDays] = useState("30");
  const [liabilityCap, setLiabilityCap] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // Fetch clients and vendors for dropdowns
    fetch("/api/crm/clients")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setClients(data.data?.clients || data.data || []);
      })
      .catch(() => {});

    fetch("/api/vendors")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setVendors(data.data?.vendors || data.data || []);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a contract title");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: any = {
        title: title.trim(),
        contractType,
        clientId: counterpartyType === "CLIENT" && clientId ? clientId : undefined,
        vendorId: counterpartyType === "VENDOR" && vendorId ? vendorId : undefined,
        value: value ? parseFloat(value) : undefined,
        currency,
        startDate,
        endDate: endDate || undefined,
        autoRenew,
        renewalTermMonths: autoRenew ? parseInt(renewalTermMonths, 10) : undefined,
        renewalNoticeDays: autoRenew ? parseInt(renewalNoticeDays, 10) : undefined,
        governingLaw: governingLaw || undefined,
        jurisdiction: jurisdiction || undefined,
        terminationNoticeDays: terminationNoticeDays ? parseInt(terminationNoticeDays, 10) : undefined,
        liabilityCap: liabilityCap ? parseFloat(liabilityCap) : undefined,
        notes: notes || undefined,
      };

      const res = await fetch("/api/legal/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        router.push(`/app/legal/contracts/${json.data.id}`);
      } else {
        setError(json.error?.message || "Failed to create contract");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create contract");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/app/legal/contracts"
          className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Create New Contract</h1>
          <p className="text-xs text-slate-400">
            Draft a legal agreement, configure counterparties, liabilities, and automated renewal horizons.
          </p>
        </div>
      </div>

      <LegalNav />

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Core Details */}
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="h-4 w-4 text-amber-400" />
            Contract Classification & Title
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-300">Contract Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Master Services Agreement with Global Enterprises Inc."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Contract Type</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
              >
                <option value="MSA">Master Services Agreement (MSA)</option>
                <option value="NDA">Non-Disclosure Agreement (NDA)</option>
                <option value="SLA">Service Level Agreement (SLA)</option>
                <option value="VENDOR_AGREEMENT">Vendor Supply Agreement</option>
                <option value="EMPLOYMENT">Employment Contract</option>
                <option value="LEASE">Commercial Lease Agreement</option>
                <option value="LICENSING">Software / IP License</option>
                <option value="PARTNERSHIP">Strategic Partnership</option>
                <option value="OTHER">Other Commercial Contract</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Counterparty Category</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCounterpartyType("CLIENT")}
                  className={`rounded-lg py-2 text-xs font-medium transition-all ${
                    counterpartyType === "CLIENT"
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                      : "bg-slate-900/80 text-slate-400 border border-slate-800"
                  }`}
                >
                  Client
                </button>
                <button
                  type="button"
                  onClick={() => setCounterpartyType("VENDOR")}
                  className={`rounded-lg py-2 text-xs font-medium transition-all ${
                    counterpartyType === "VENDOR"
                      ? "bg-purple-600/20 text-purple-400 border border-purple-500/40"
                      : "bg-slate-900/80 text-slate-400 border border-slate-800"
                  }`}
                >
                  Vendor
                </button>
                <button
                  type="button"
                  onClick={() => setCounterpartyType("INTERNAL")}
                  className={`rounded-lg py-2 text-xs font-medium transition-all ${
                    counterpartyType === "INTERNAL"
                      ? "bg-amber-600/20 text-amber-400 border border-amber-500/40"
                      : "bg-slate-900/80 text-slate-400 border border-slate-800"
                  }`}
                >
                  Internal
                </button>
              </div>
            </div>

            {counterpartyType === "CLIENT" && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-slate-300">Select Client</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
                >
                  <option value="">-- Choose Client Organization --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.industry || "Client"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {counterpartyType === "VENDOR" && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-slate-300">Select Vendor</label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
                >
                  <option value="">-- Choose Vendor / Supplier --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.category || "Supplier"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Financial Terms & Duration */}
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <IndianRupee className="h-4 w-4 text-emerald-400" />
            Financial Terms & Term Duration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Total Contract Value</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Effective Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Expiration Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Renewal Clause */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="autoRenew" className="text-xs font-medium text-slate-300 select-none">
                Enable Automatic Renewal (Continuous Term)
              </label>
            </div>

            {autoRenew && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Renewal Term (Months)</label>
                  <input
                    type="number"
                    min="1"
                    value={renewalTermMonths}
                    onChange={(e) => setRenewalTermMonths(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Notice Period Prior to Expiry (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={renewalNoticeDays}
                    onChange={(e) => setRenewalNoticeDays(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Legal Governance & Jurisdiction */}
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Scale className="h-4 w-4 text-purple-400" />
            Jurisdiction, Governing Law & Covenants
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Governing Law</label>
              <input
                type="text"
                value={governingLaw}
                onChange={(e) => setGoverningLaw(e.target.value)}
                placeholder="e.g. Laws of India / Maharashtra"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Exclusive Jurisdiction</label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="e.g. Courts of Wilmington, DE"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Termination Notice Period (Days)</label>
              <input
                type="number"
                min="0"
                value={terminationNoticeDays}
                onChange={(e) => setTerminationNoticeDays(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Liability Cap ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 1,000,000"
                value={liabilityCap}
                onChange={(e) => setLiabilityCap(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-300">Executive Notes & Special Stipulations</label>
              <textarea
                rows={3}
                placeholder="Special payment schedules, confidentiality covenants, carve-outs..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Form Submission Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/app/legal/contracts"
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{submitting ? "Drafting Contract..." : "Register Contract"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
