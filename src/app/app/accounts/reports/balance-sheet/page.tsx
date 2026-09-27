"use client";

import React, { useState, useEffect } from "react";
import { Scale, Printer, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function BalanceSheetPage() {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts/reports?type=BALANCE_SHEET")
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Scale className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Balance Sheet Statement
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete financial condition verifying standard accounting equation: Assets = Liabilities + Equity.
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-2" />
          <span>Calculating Balance Sheet...</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Balance Sheet</h2>
            <p className="text-xs text-slate-400 font-mono">
              As of: {report.asOf} • Currency: INR (₹)
            </p>
            {report.isBalanced && (
              <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Accounting Balance Verified (Assets = Liabilities + Equity)</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ASSETS */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-blue-500/20 pb-1">
                Assets
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Current Assets</div>
                {report.assets.currentAssets.map((a: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
                    <span>
                      {a.name} ({a.code})
                    </span>
                    <span className="font-mono font-semibold">{formatCurrency(a.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Fixed Assets</div>
                {report.assets.fixedAssets.map((a: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
                    <span>
                      {a.name} ({a.code})
                    </span>
                    <span className="font-mono font-semibold">{formatCurrency(a.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-xs py-2 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                <span>Total Assets</span>
                <span className="font-mono text-blue-400 text-sm">{formatCurrency(report.assets.totalAssets)}</span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-amber-500/20 pb-1">
                Liabilities & Equity
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Current Liabilities</div>
                {report.liabilities.currentLiabilities.map((a: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
                    <span>
                      {a.name} ({a.code})
                    </span>
                    <span className="font-mono font-semibold">{formatCurrency(a.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs py-1 text-slate-500 font-bold border-t border-slate-100 dark:border-slate-800">
                  <span>Total Liabilities</span>
                  <span className="font-mono">{formatCurrency(report.liabilities.totalLiabilities)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Owner&apos;s Equity</div>
                {report.equity.items.map((a: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
                    <span>
                      {a.name} ({a.code})
                    </span>
                    <span className="font-mono font-semibold">{formatCurrency(a.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
                  <span>Retained Earnings & Reserves</span>
                  <span className="font-mono font-semibold">{formatCurrency(report.equity.retainedEarnings)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 text-slate-500 font-bold border-t border-slate-100 dark:border-slate-800">
                  <span>Total Equity</span>
                  <span className="font-mono">{formatCurrency(report.equity.totalEquity)}</span>
                </div>
              </div>

              <div className="flex justify-between text-xs py-2 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                <span>Total Liabilities & Equity</span>
                <span className="font-mono text-emerald-400 text-sm">
                  {formatCurrency(report.totalLiabilitiesAndEquity)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
