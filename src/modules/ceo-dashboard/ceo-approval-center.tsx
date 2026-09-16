"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";

interface ApprovalItem {
  id: string;
  title: string;
  entityType: string;
  entityId: string;
  description?: string | null;
  requestedByName: string;
  requestedByDesignation: string;
  amount?: number | null;
  priority: string;
  createdAt: Date | string;
  status: string;
  operationId?: string | null;
  contractId?: string | null;
}

interface CeoApprovalCenterProps {
  items: ApprovalItem[];
  onApprovalDecided?: () => void;
}

export function CeoApprovalCenter({ items: initialItems, onApprovalDecided }: CeoApprovalCenterProps) {
  const [items, setItems] = useState<ApprovalItem[]>(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleDecision = async (id: string, decision: "APPROVED" | "REJECTED") => {
    try {
      setLoadingId(id);
      setFeedbackMessage(null);

      const res = await fetch(`/api/approvals/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          comment: `Executive decision recorded by CEO dashboard on ${new Date().toLocaleDateString("en-IN")}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to process decision");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      setFeedbackMessage(`Request successfully ${decision.toLowerCase()}!`);
      if (onApprovalDecided) onApprovalDecided();
    } catch (err: any) {
      alert(err.message || "Failed to submit decision");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div id="approvals" className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            CEO Executive Approval Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            High-value contract signatures, procurement releases, and operational overrides awaiting CEO sanction.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 font-bold">
            {items.length} Pending Actions
          </span>
        </div>
      </div>

      {feedbackMessage && (
        <div className="rounded-lg bg-emerald-950/40 border border-emerald-800 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Approvals Table */}
      {items.length === 0 ? (
        <div className="py-12 text-center text-xs text-emerald-400 bg-emerald-950/15 border border-emerald-900/30 rounded-xl">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
          <h4 className="font-bold text-white text-sm">Clear Executive Deck</h4>
          <p className="text-slate-400 mt-1 max-w-sm mx-auto">
            There are currently zero pending approvals requiring CEO intervention.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase font-semibold text-slate-400">
                  <th className="py-3 px-4">Request & Subject</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Requested By</th>
                  <th className="py-3 px-3 text-right">Commitment</th>
                  <th className="py-3 px-3 text-center">Priority</th>
                  <th className="py-3 px-3">Submitted</th>
                  <th className="py-3 px-4 text-right">Executive Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((app) => {
                  const isLoading = loadingId === app.id;
                  const drillHref = app.operationId
                    ? `/app/operations/${app.operationId}`
                    : app.contractId
                    ? `/app/legal/contracts/${app.contractId}`
                    : `/app/operations`;

                  return (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block max-w-[220px] truncate">
                          {app.title}
                        </span>
                        {app.description && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-[220px]">
                            {app.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-300">
                          {app.entityType}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-200 block">{app.requestedByName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {app.requestedByDesignation}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        {app.amount ? formatINR(app.amount) : "—"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            app.priority === "CRITICAL"
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {app.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">
                        {new Date(app.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={drillHref}
                            className="rounded bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-300 hover:text-white"
                            title="Inspect context"
                          >
                            View
                          </Link>
                          <button
                            disabled={isLoading}
                            onClick={() => handleDecision(app.id, "APPROVED")}
                            className="rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 text-[10px] transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </button>
                          <button
                            disabled={isLoading}
                            onClick={() => handleDecision(app.id, "REJECTED")}
                            className="rounded bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white font-semibold px-2.5 py-1 text-[10px] transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
