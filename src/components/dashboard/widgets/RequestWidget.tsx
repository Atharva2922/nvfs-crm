"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Plus, ArrowRight } from "lucide-react";

interface RequestSummary {
  pendingCount: number;
  approvedCount: number;
  recentRequests: Array<{
    id: string;
    requestNumber: string;
    category: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
}

export function RequestWidget() {
  const [data, setData] = useState<RequestSummary>({
    pendingCount: 0,
    approvedCount: 0,
    recentRequests: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        const res = await fetch("/api/requests/my-summary");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch requests summary:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Request Center</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Leave, HR, IT & tickets</p>
          </div>
        </div>
        <Link
          href="/app/requests"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-amber-400 hover:underline"
        >
          New Request <Plus className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading requests...</div>
      ) : data.recentRequests.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          No active requests
        </div>
      ) : (
        <div className="space-y-2">
          {(data.recentRequests || []).slice(0, 3).map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
            >
              <div className="truncate pr-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {req.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{req.requestNumber}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                  req.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : req.status === "REJECTED"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {req.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
