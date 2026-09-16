"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IndianRupee, Plus, ArrowRight } from "lucide-react";

interface ExpenseSummary {
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
}

export function ExpenseWidget() {
  const [summary, setSummary] = useState<ExpenseSummary>({
    pendingCount: 0,
    pendingAmount: 0,
    approvedCount: 0,
    approvedAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        setLoading(true);
        const res = await fetch("/api/expenses/my-summary");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setSummary(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch expense summary:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchExpenses();
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">My Expenses</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Claims & reimbursements</p>
          </div>
        </div>
        <Link
          href="/app/expenses"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-amber-400 hover:underline"
        >
          Submit <Plus className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-amber-50/70 dark:bg-amber-950/40 p-3 border border-amber-200/50 dark:border-amber-800/50">
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Pending Claims
          </span>
          <p className="text-base font-bold text-amber-900 dark:text-amber-200 mt-0.5">
            {loading ? "-" : `₹${summary.pendingAmount.toLocaleString()}`}
          </p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">{summary.pendingCount} submitted</span>
        </div>
        <div className="rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 p-3 border border-emerald-200/50 dark:border-emerald-800/50">
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Approved / Paid
          </span>
          <p className="text-base font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
            {loading ? "-" : `₹${summary.approvedAmount.toLocaleString()}`}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{summary.approvedCount} claims</span>
        </div>
      </div>
    </div>
  );
}
