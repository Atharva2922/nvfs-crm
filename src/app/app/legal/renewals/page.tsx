"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  RefreshCw,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Building2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export default function RenewalsPage() {
  const [horizonData, setHorizonData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeHorizon, setActiveHorizon] = useState<"30" | "60" | "90">("30");

  useEffect(() => {
    fetchRenewals();
  }, []);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/legal/renewals");
      const json = await res.json();
      if (json.success) {
        setHorizonData(json.data);
      }
    } catch (err) {
      console.error("Error fetching renewals:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Indefinite";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (val?: number | null, curr = "INR") => {
    if (val === undefined || val === null) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(val);
  };

  const currentList =
    activeHorizon === "30"
      ? horizonData?.horizon30 || []
      : activeHorizon === "60"
      ? horizonData?.horizon60 || []
      : horizonData?.horizon90 || [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Contract Renewal Horizons"
        description="Monitor automated contract expirations across 30, 60, and 90 day horizons to prevent lapse of coverage or unauthorized auto-renewals."
      />

      <LegalNav />

      {/* Horizon Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveHorizon("30")}
          className={`rounded-xl border p-5 text-left transition-all ${
            activeHorizon === "30"
              ? "border-rose-500/50 bg-rose-500/10 shadow-md"
              : "border-slate-800 bg-[#0d131f] hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">30-Day Critical Horizon</span>
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {horizonData?.counts?.within30Days || 0}
          </div>
          <p className="mt-1 text-xs text-slate-400">Contracts requiring immediate renewal or opt-out notice.</p>
        </button>

        <button
          onClick={() => setActiveHorizon("60")}
          className={`rounded-xl border p-5 text-left transition-all ${
            activeHorizon === "60"
              ? "border-amber-500/50 bg-amber-500/10 shadow-md"
              : "border-slate-800 bg-[#0d131f] hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">60-Day Negotiation Window</span>
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {horizonData?.counts?.within60Days || 0}
          </div>
          <p className="mt-1 text-xs text-slate-400">Upcoming contracts entering active renegotiation terms.</p>
        </button>

        <button
          onClick={() => setActiveHorizon("90")}
          className={`rounded-xl border p-5 text-left transition-all ${
            activeHorizon === "90"
              ? "border-blue-500/50 bg-blue-500/10 shadow-md"
              : "border-slate-800 bg-[#0d131f] hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">90-Day Strategic Horizon</span>
            <Calendar className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {horizonData?.counts?.within90Days || 0}
          </div>
          <p className="mt-1 text-xs text-slate-400">Quarterly horizon for procurement and legal reviews.</p>
        </button>
      </div>

      {/* Horizon Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-amber-400" />
            Contracts in {activeHorizon}-Day Horizon ({currentList.length})
          </h3>
          <span className="text-xs text-slate-400">Sorted by imminent expiration date</span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="text-sm font-semibold">No contracts expiring in this horizon</p>
            <p className="text-xs text-slate-500">All current agreements are secure beyond this window.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Contract</th>
                  <th className="py-3 px-4">Counterparty</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Expiration Date</th>
                  <th className="py-3 px-4">Auto-Renew</th>
                  <th className="py-3 px-4">Notice Required</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentList.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/app/legal/contracts/${c.id}`}
                        className="text-slate-200 font-semibold hover:text-amber-400 transition-colors block"
                      >
                        {c.title}
                      </Link>
                      <span className="font-mono text-[11px] text-amber-400/80">{c.contractNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      {c.client ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-blue-400" />
                          <span>{c.client.name}</span>
                        </div>
                      ) : c.vendor ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-purple-400" />
                          <span>{c.vendor.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Internal</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {formatCurrency(c.value, c.currency)}
                    </td>
                    <td className="py-3 px-4 text-rose-400 font-bold">
                      {formatDate(c.endDate)}
                    </td>
                    <td className="py-3 px-4">
                      {c.autoRenew ? (
                        <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold">
                          Auto-Renews ({c.renewalTermMonths || 12}m)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Expires</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {c.renewalNoticeDays ? `${c.renewalNoticeDays} days prior` : "30 days"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/app/legal/contracts/${c.id}`}
                        className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-600/20 px-2.5 py-1 text-amber-300 hover:bg-amber-600/30 transition-colors font-medium"
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
      </div>

      {/* Renewal History Stream */}
      {horizonData?.renewalHistory && horizonData.renewalHistory.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Executed Renewal History
          </h3>
          <div className="space-y-2">
            {horizonData.renewalHistory.map((ren: any) => (
              <div key={ren.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">
                    {ren.contract?.title} ({ren.contract?.contractNumber})
                  </span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Extended through {formatDate(ren.newEndDate)} {ren.notes ? `• ${ren.notes}` : ""}
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 text-right">
                  <span>{formatDate(ren.renewedAt)}</span>
                  {ren.renewedBy && <div>by {ren.renewedBy.firstName} {ren.renewedBy.lastName}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
