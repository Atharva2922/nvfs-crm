"use client";

import React, { useState } from "react";
import {
  IndianRupee,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface RevenueTrendItem {
  month: string;
  invoiced: number;
  collected: number;
}

interface ExpenseTrendItem {
  month: string;
  expenses: number;
  payroll: number;
}

interface ReceivablesAging {
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
  total: number;
}

interface CeoFinancialChartsProps {
  revenueTrend: RevenueTrendItem[];
  expenseTrend: ExpenseTrendItem[];
  aging: ReceivablesAging;
}

export function CeoFinancialCharts({
  revenueTrend,
  expenseTrend,
  aging,
}: CeoFinancialChartsProps) {
  const [viewMode, setViewMode] = useState<"MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
  const [activeTab, setActiveTab] = useState<"REVENUE_PROFIT" | "EXPENSES" | "AGING">("REVENUE_PROFIT");

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Combine monthly trends into unified profit matrix
  const combinedTrend = revenueTrend.map((rev) => {
    const exp = expenseTrend.find((e) => e.month === rev.month) || { expenses: 0, payroll: 0 };
    const totalExp = exp.expenses + exp.payroll;
    const net = rev.collected - totalExp;
    return {
      period: rev.month,
      revenue: rev.collected || rev.invoiced,
      invoiced: rev.invoiced,
      expenses: totalExp,
      netProfit: net,
    };
  });

  // Calculate highest value for bar chart height scaling
  const maxVal = Math.max(
    ...combinedTrend.map((t) => Math.max(t.revenue, t.expenses, Math.abs(t.netProfit))),
    1000
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Revenue, Expense & Profit Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real ledger inflows, operating outflows, and receivables aging from corporate accounts.
          </p>
        </div>

        {/* Tab Selection & Period Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("REVENUE_PROFIT")}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeTab === "REVENUE_PROFIT" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Revenue vs Profit
            </button>
            <button
              onClick={() => setActiveTab("EXPENSES")}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeTab === "EXPENSES" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Expense Matrix
            </button>
            <button
              onClick={() => setActiveTab("AGING")}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeTab === "AGING" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Receivables Aging
            </button>
          </div>

          <Link
            href="/app/finance"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1"
          >
            Ledger <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Main Chart Area */}
      {activeTab === "REVENUE_PROFIT" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-3 w-3 rounded bg-emerald-500 inline-block" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-3 w-3 rounded bg-rose-500 inline-block" /> Expenses
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-3 w-3 rounded bg-indigo-500 inline-block" /> Net Profit
              </span>
            </div>
            <span className="text-slate-500 text-[11px]">Values in INR (₹)</span>
          </div>

          {combinedTrend.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
              No financial trend data available for this period.
            </div>
          ) : (
            <div className="pt-6 pb-2">
              <div className="grid grid-cols-6 lg:grid-cols-12 gap-3 items-end h-64 border-b border-slate-800 pb-4">
                {combinedTrend.map((item, idx) => {
                  const revHeight = Math.min(100, Math.max(8, (item.revenue / maxVal) * 100));
                  const expHeight = Math.min(100, Math.max(8, (item.expenses / maxVal) * 100));
                  const netHeight = Math.min(100, Math.max(6, (Math.abs(item.netProfit) / maxVal) * 100));

                  return (
                    <div key={idx} className="flex flex-col items-center justify-end h-full gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-20 z-30 hidden group-hover:flex flex-col bg-slate-950 border border-slate-700 p-2 rounded-lg text-[10px] text-slate-200 shadow-xl pointer-events-none whitespace-nowrap">
                        <span className="font-bold text-white">{item.period}</span>
                        <span className="text-emerald-400">Rev: {formatINR(item.revenue)}</span>
                        <span className="text-rose-400">Exp: {formatINR(item.expenses)}</span>
                        <span className="text-indigo-400">Net: {formatINR(item.netProfit)}</span>
                      </div>

                      {/* Side-by-side comparative bars */}
                      <div className="w-full flex items-end justify-center gap-1 h-52">
                        {/* Revenue Bar */}
                        <div
                          className="w-1/3 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                          style={{ height: `${revHeight}%` }}
                        />
                        {/* Expense Bar */}
                        <div
                          className="w-1/3 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                          style={{ height: `${expHeight}%` }}
                        />
                        {/* Net Profit Bar */}
                        <div
                          className={`w-1/3 rounded-t-sm transition-all duration-300 group-hover:brightness-110 ${
                            item.netProfit >= 0
                              ? "bg-gradient-to-t from-indigo-600 to-indigo-400"
                              : "bg-gradient-to-t from-amber-600 to-amber-400"
                          }`}
                          style={{ height: `${netHeight}%` }}
                        />
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 truncate w-full text-center mt-1">
                        {item.period}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expenses Breakdown Tab */}
      {activeTab === "EXPENSES" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Monthly Expense Trend
              </h3>
              <div className="space-y-3">
                {expenseTrend.map((exp, i) => {
                  const total = exp.expenses + exp.payroll;
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">{exp.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400">Payroll: {formatINR(exp.payroll)}</span>
                        <span className="font-bold text-white">{formatINR(total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Operating Cost Structure
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aggregated live from verified business reimbursements, vendor bills, and statutory payroll entries.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Reimbursement Inflows:</span>
                <span className="font-bold text-emerald-400">Controlled</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aging Analysis Tab */}
      {activeTab === "AGING" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
              <span className="text-slate-300 font-semibold">Total Accounts Receivable:</span>
              <span className="text-amber-400 font-bold text-sm">{formatINR(aging.total)}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Current (Not Yet Due)</span>
                  <span className="font-semibold text-white">{formatINR(aging.current)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${aging.total > 0 ? (aging.current / aging.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>1–30 Days Overdue</span>
                  <span className="font-semibold text-amber-400">{formatINR(aging.days1_30)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${aging.total > 0 ? (aging.days1_30 / aging.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>31–60 Days Overdue</span>
                  <span className="font-semibold text-rose-400">{formatINR(aging.days31_60)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${aging.total > 0 ? (aging.days31_60 / aging.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>61+ Days Overdue (Critical Exposure)</span>
                  <span className="font-semibold text-red-500">{formatINR(aging.days61_90 + aging.days90Plus)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full"
                    style={{
                      width: `${aging.total > 0 ? ((aging.days61_90 + aging.days90Plus) / aging.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
