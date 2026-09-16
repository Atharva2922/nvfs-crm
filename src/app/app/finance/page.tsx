"use client";

import { useEffect, useState } from "react";
import { FinanceNav } from "@/modules/finance/components/finance-nav";
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRight,
  FileText,
  CreditCard,
  Building2,
  Calendar
} from "lucide-react";
import Link from "next/link";

interface OverviewData {
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    accountsReceivable: number;
    accountsPayable: number;
    outstandingInvoicesCount: number;
    outstandingInvoicesAmount: number;
    overdueInvoicesCount: number;
    overdueInvoicesAmount: number;
    payrollCost: number;
  };
  revenueTrend: Array<{ month: string; invoiced: number; collected: number }>;
  expenseTrend: Array<{ month: string; expenses: number; payroll: number }>;
  cashFlow: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
    recentTransactions: any[];
  };
  receivablesAging: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    days90Plus: number;
    total: number;
  };
  payablesAging: {
    approvedExpenses: number;
    pendingPayroll: number;
    total: number;
  };
}

export default function FinanceOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/finance/overview");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load finance overview:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <FinanceNav />
        <div className="p-12 text-center text-zinc-400">Loading financial dashboard...</div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const cashFlow = data?.cashFlow;
  const aging = data?.receivablesAging;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Finance & Corporate Ledger</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Centralized financial transactions, customer invoicing, accounts receivable & payable aging, and cash flow governance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/finance/invoices"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <FileText className="h-4 w-4" />
            New Invoice
          </Link>
          <Link
            href="/app/finance/expenses"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Submit Expense
          </Link>
        </div>
      </div>

      {/* Sub-Navigation */}
      <FinanceNav />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected Revenue */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Collected Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{(kpis?.totalRevenue || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">Cash remittances from paid invoices</span>
          </div>
        </div>

        {/* Total Operational Expenses */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Operational Cost</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{(kpis?.totalExpenses || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">
              Includes ₹{((kpis?.payrollCost || 0)).toLocaleString()} payroll
            </span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Net Operating Profit</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold tracking-tight ${
              (kpis?.netProfit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}>
              ₹{(kpis?.netProfit || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">Operating inflow minus outflows</span>
          </div>
        </div>

        {/* Accounts Receivable */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Accounts Receivable</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">
              ${(kpis?.accountsReceivable || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">
              {kpis?.outstandingInvoicesCount || 0} open invoices ({kpis?.overdueInvoicesCount || 0} overdue)
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Row: Cash Flow & Receivables Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receivables Aging Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Accounts Receivable Aging</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Unpaid customer invoices bucketed by due date.</p>
            </div>
            <Link href="/app/finance/receivables" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Current (Not Due)</span>
              <span className="font-semibold text-white">₹{(aging?.current || 0).toLocaleString()}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${aging?.total ? Math.min(100, (aging.current / aging.total) * 100) : 0}%` }} 
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-400 font-medium">1–30 Days Overdue</span>
              <span className="font-semibold text-amber-400">₹{(aging?.days1_30 || 0).toLocaleString()}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full" 
                style={{ width: `${aging?.total ? Math.min(100, (aging.days1_30 / aging.total) * 100) : 0}%` }} 
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-400 font-medium">31–60 Days Overdue</span>
              <span className="font-semibold text-rose-400">₹{(aging?.days31_60 || 0).toLocaleString()}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full" 
                style={{ width: `${aging?.total ? Math.min(100, (aging.days31_60 / aging.total) * 100) : 0}%` }} 
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-400 font-medium">61–90+ Days Overdue</span>
              <span className="font-semibold text-red-500">
                ₹{((aging?.days61_90 || 0) + (aging?.days90Plus || 0)).toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div 
                className="h-full bg-red-600 rounded-full" 
                style={{ width: `${aging?.total ? Math.min(100, (((aging.days61_90 || 0) + (aging.days90Plus || 0)) / aging.total) * 100) : 0}%` }} 
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-300">Total Outstanding Balance</span>
            <span className="text-white">₹{(aging?.total || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Cash Flow Summary */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Cash Flow Overview</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Real-time ledger inflows vs outflows.</p>
            </div>
            <Link href="/app/finance/transactions" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
              Ledger <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-zinc-800/40 p-4 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ArrowUpRight className="h-4 w-4" /> Total Inflows
              </div>
              <span className="text-xl font-bold text-white block mt-2">
                ₹{(cashFlow?.totalInflow || 0).toLocaleString()}
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">Client remittances</span>
            </div>

            <div className="rounded-lg bg-zinc-800/40 p-4 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                <ArrowDownLeft className="h-4 w-4" /> Total Outflows
              </div>
              <span className="text-xl font-bold text-white block mt-2">
                ₹{(cashFlow?.totalOutflow || 0).toLocaleString()}
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">Expenses & Payroll</span>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-indigo-300">Net Operational Cash Flow</span>
              <span className="text-xs text-zinc-400 block mt-0.5">Treasury liquidity delta</span>
            </div>
            <span className={`text-lg font-bold ${
              (cashFlow?.netCashFlow || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}>
              ₹{(cashFlow?.netCashFlow || 0).toLocaleString()}
            </span>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Accounts Payable Obligations</span>
              <span className="font-semibold text-rose-400">₹{(kpis?.accountsPayable || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Recent Financial Ledger Activity */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Ledger Transactions</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Latest posted transactions.</p>
            </div>
            <Link href="/app/finance/transactions" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-3 overflow-y-auto max-h-[300px]">
            {(!cashFlow?.recentTransactions || cashFlow.recentTransactions.length === 0) ? (
              <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                No financial transactions recorded yet.
              </div>
            ) : (
              cashFlow.recentTransactions.slice(0, 5).map((t: any) => (
                <div key={t.id} className="rounded-lg bg-zinc-800/30 border border-zinc-800/60 p-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        t.direction === "INFLOW" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {t.direction}
                      </span>
                      <span className="text-xs font-medium text-white">{t.transactionNumber}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{t.description}</p>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      {new Date(t.date).toLocaleDateString()} • {t.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${
                    t.direction === "INFLOW" ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {t.direction === "INFLOW" ? "+" : "-"}${t.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
