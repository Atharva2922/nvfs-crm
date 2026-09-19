"use client";

import React, { useState } from "react";
import { CheckCheck, XCircle, CheckCircle2, Clock, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ApprovalQueueItem {
  id: string;
  title: string;
  entityType: string;
  requester: string;
  amount?: number;
  priority?: string;
  createdAt: string;
}

export interface ExecutiveApprovalQueueProps {
  items: ApprovalQueueItem[];
  title?: string;
  onRefresh?: () => void;
}

export function ExecutiveApprovalQueue({
  items,
  title = "Executive Approval & Decision Queue",
  onRefresh,
}: ExecutiveApprovalQueueProps) {
  const [actingId, setActingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; message: string; isError?: boolean } | null>(null);

  const handleDecision = async (id: string, decision: "APPROVED" | "REJECTED") => {
    try {
      setActingId(id);
      setFeedback(null);

      const res = await fetch(`/api/approvals/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          comment: `Decided via Executive Dashboard as ${decision}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || `Failed to record ${decision.toLowerCase()} decision`);
      }

      setFeedback({ id, message: `Request successfully ${decision.toLowerCase()}` });
      if (onRefresh) {
        setTimeout(onRefresh, 1000);
      }
    } catch (err: any) {
      setFeedback({ id, message: err.message, isError: true });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {title}
          </h4>
        </div>
        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
          {items.length} Pending
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          No pending executive approvals requiring immediate board or management sign-off.
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {items.map((item) => (
            <div key={item.id} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{item.title}</span>
                  <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                    {item.entityType}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                  <span>Requester: <strong className="text-slate-300 font-medium">{item.requester}</strong></span>
                  {item.amount && item.amount > 0 && (
                    <span>• Amount: <strong className="text-emerald-400 font-mono">₹{item.amount.toLocaleString()}</strong></span>
                  )}
                  <span>• {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </div>

                {feedback && feedback.id === item.id && (
                  <p className={cn("text-[11px] mt-1.5 font-medium", feedback.isError ? "text-rose-400" : "text-emerald-400")}>
                    {feedback.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  disabled={actingId === item.id}
                  onClick={() => handleDecision(item.id, "APPROVED")}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  {actingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Approve</span>
                </button>
                <button
                  disabled={actingId === item.id}
                  onClick={() => handleDecision(item.id, "REJECTED")}
                  className="flex items-center gap-1 rounded-lg bg-rose-600/20 border border-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
