"use client";

import React, { useState, useEffect } from "react";
import { Landmark, Printer, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CashFlowReportPage() {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts/reports?type=CASH_FLOW")
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Landmark className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Statement of Cash Flows
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cash generated and utilized across Operating, Investing, and Financing activities.
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-2" />
          <span>Calculating Cash Flow...</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cash Flow Statement</h2>
            <p className="text-xs text-slate-400 font-mono">Currency: INR (₹)</p>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 border-b border-emerald-500/20 pb-1">
              1. Cash Flow from Operating Activities
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
              <span>Receipts from Customers</span>
              <span className="font-mono font-semibold text-emerald-400">
                +{formatCurrency(report.operatingActivities.receiptsFromCustomers)}
              </span>
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
              <span>Payments to Vendors</span>
              <span className="font-mono text-red-400">
                -{formatCurrency(report.operatingActivities.paymentsToVendors)}
              </span>
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
              <span>Operating Expenses Paid</span>
              <span className="font-mono text-red-400">
                -{formatCurrency(report.operatingActivities.paymentsForOperatingExpenses)}
              </span>
            </div>
            <div className="flex justify-between text-xs py-1.5 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
              <span>Net Cash from Operating Activities</span>
              <span className="font-mono text-emerald-400">
                {formatCurrency(report.operatingActivities.netCashFromOperations)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-blue-500/20 pb-1">
              2. Cash Flow from Investing Activities
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
              <span>Capital Expenditures & Equipment</span>
              <span className="font-mono">₹0</span>
            </div>
            <div className="flex justify-between text-xs py-1.5 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
              <span>Net Cash from Investing Activities</span>
              <span className="font-mono">₹0</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-500 border-b border-purple-500/20 pb-1">
              3. Cash Flow from Financing Activities
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-700 dark:text-slate-300">
              <span>Equity / Loan Disbursed</span>
              <span className="font-mono">₹0</span>
            </div>
            <div className="flex justify-between text-xs py-1.5 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
              <span>Net Cash from Financing Activities</span>
              <span className="font-mono">₹0</span>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 text-base font-bold text-white">
            <span>Net Increase in Cash & Cash Equivalents</span>
            <span className="text-xl font-mono text-emerald-400">{formatCurrency(report.netCashFlow)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
