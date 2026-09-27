"use client";

import React, { useState, useEffect } from "react";
import { FileBarChart, Printer, Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TrialBalanceReportPage() {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts/reports?type=TRIAL_BALANCE")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setReport(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val: number) => `₹${Math.round(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/app/accounts/reports"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Reports Hub</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
              <FileBarChart className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Trial Balance Statement
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            General ledger audit report verifying arithmetic equality of Total Debits and Total Credits.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Statement</span>
        </button>
      </div>

      {loading || !report ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-500 mb-2" />
          <span>Verifying Trial Balance Ledger...</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] p-6 shadow-xs max-w-4xl mx-auto space-y-4">
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Trial Balance</h2>
            <p className="text-xs text-slate-400 font-mono">Double-Entry Ledger Closing Verification</p>
            <div className="mt-2">
              {report.totals.isBalanced ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ledger Perfectly Balanced (Total Dr = Total Cr)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Unbalanced by {formatCurrency(report.totals.difference)}</span>
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Account Code</th>
                  <th className="py-2.5 px-3">Account Name</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                  <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {report.rows.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-500">{row.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{row.name}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{row.type}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {row.debit > 0 ? formatCurrency(row.debit) : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 font-bold font-mono">
                  <td colSpan={3} className="py-3 px-3 uppercase text-xs text-slate-900 dark:text-white">
                    Grand Total
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                    {formatCurrency(report.totals.debit)}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                    {formatCurrency(report.totals.credit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
