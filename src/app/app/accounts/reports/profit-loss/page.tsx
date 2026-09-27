"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Printer, Download, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfitAndLossReportPage() {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts/reports?type=PROFIT_LOSS")
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Profit & Loss Statement (Income Statement)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Revenue, cost of sales, operating overheads, and net operating profit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {loading || !report ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500 mb-2" />
          <span>Generating Profit & Loss Statement...</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Statement of Profit & Loss</h2>
            <p className="text-xs text-slate-400 font-mono">
              Period: {report.period.start} to {report.period.end} • Currency: INR (₹)
            </p>
          </div>

          {/* Section 1: Revenue */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 border-b border-emerald-500/20 pb-1">
              1. Operating Revenue & Income
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
              <span>Operating Sales & Client Revenue</span>
              <span className="font-mono font-semibold">{formatCurrency(report.revenue.operatingRevenue)}</span>
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
              <span>Other Income & Interest</span>
              <span className="font-mono font-semibold">{formatCurrency(report.revenue.otherIncome)}</span>
            </div>
            <div className="flex justify-between text-xs py-1.5 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
              <span>Total Revenue (A)</span>
              <span className="font-mono text-emerald-400">{formatCurrency(report.revenue.totalRevenue)}</span>
            </div>
          </div>

          {/* Section 2: COGS */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-amber-500/20 pb-1">
              2. Cost of Goods Sold (COGS)
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
              <span>Direct Subcontracting & Fulfillment Costs</span>
              <span className="font-mono font-semibold">{formatCurrency(report.costOfGoodsSold.directCosts)}</span>
            </div>
            <div className="flex justify-between text-xs py-1.5 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
              <span>Total Cost of Goods Sold (B)</span>
              <span className="font-mono">{formatCurrency(report.costOfGoodsSold.totalCogs)}</span>
            </div>
          </div>

          {/* Gross Profit Callout */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="text-slate-900 dark:text-white">Gross Profit (A - B)</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                (Gross Margin: {report.grossMargin}%)
              </span>
            </div>
            <span className="font-mono text-emerald-400 text-base">{formatCurrency(report.grossProfit)}</span>
          </div>

          {/* Section 3: Operating Expenses */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-500 border-b border-purple-500/20 pb-1">
              3. Operating Expenses & Overheads
            </div>
            {report.operatingExpenses.breakdown.map((exp: any, i: number) => (
              <div key={i} className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
                <span>{exp.category}</span>
                <span className="font-mono">{formatCurrency(exp.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs py-1.5 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
              <span>Total Operating Expenses (C)</span>
              <span className="font-mono text-purple-400">
                {formatCurrency(report.operatingExpenses.totalOperatingExpenses)}
              </span>
            </div>
          </div>

          {/* Net Profit Final Row */}
          <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 text-base font-bold text-white">
            <div>
              <div>Net Operating Profit (Gross Profit - C)</div>
              <div className="text-xs font-normal text-emerald-400">
                Net Profit Margin: {report.netMargin}%
              </div>
            </div>
            <div className="text-xl font-mono text-emerald-400">{formatCurrency(report.netProfit)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
