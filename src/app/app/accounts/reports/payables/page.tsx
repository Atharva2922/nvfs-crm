"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Printer, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AccountsDashboardData } from "@/services/accounts.service";

export default function PayablesReportPage() {
  const [data, setData] = useState<AccountsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Receipt className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Accounts Payable Aging Report
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Vendor liabilities and procurement obligations categorized by payment due aging.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Schedule</span>
        </button>
      </div>

      {loading || !data ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500 mb-2" />
          <span>Compiling Payables Aging Schedule...</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          {/* Aging Summary Buckets */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Current", val: data.charts.payablesAging.current, color: "text-emerald-400" },
              { label: "1 - 30 Days", val: data.charts.payablesAging.days1_30, color: "text-blue-400" },
              { label: "31 - 60 Days", val: data.charts.payablesAging.days31_60, color: "text-amber-400" },
              { label: "61 - 90 Days", val: data.charts.payablesAging.days61_90, color: "text-orange-400" },
              { label: "90+ Days", val: data.charts.payablesAging.days90Plus, color: "text-red-400" },
            ].map((b, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">{b.label}</div>
                <div className={`text-sm font-bold font-mono mt-1 ${b.color}`}>
                  {formatCurrency(b.val)}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Payables List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Vendor / Beneficiary</th>
                  <th className="py-2.5 px-3">Bill #</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Bill Total</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-center">Overdue Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.payables.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No pending vendor payables.
                    </td>
                  </tr>
                ) : (
                  data.payables.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {bill.vendorName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{bill.billNumber}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{bill.dueDate}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(bill.total)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(bill.balance)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-mono font-bold text-xs ${
                            bill.daysOverdue > 0 ? "text-red-400" : "text-emerald-400"
                          }`}
                        >
                          {bill.daysOverdue > 0 ? `${bill.daysOverdue}d` : "Current"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 dark:border-slate-700 font-bold font-mono">
                  <td colSpan={4} className="py-3 px-3 uppercase text-slate-400">
                    Total Payables
                  </td>
                  <td className="py-3 px-3 text-right text-amber-400 text-sm">
                    {formatCurrency(data.kpis.payables.total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
