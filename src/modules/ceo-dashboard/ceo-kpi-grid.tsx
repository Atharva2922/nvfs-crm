"use client";

import React from "react";
import Link from "next/link";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Layers,
  Clock,
  Wallet,
  AlertCircle,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

interface KpiItem {
  current: number;
  previous?: number;
  changePercent?: number;
}

interface CeoKpiGridProps {
  kpis: {
    revenue: KpiItem;
    expenses: KpiItem;
    netProfit: KpiItem;
    customers: { total: number; newCount: number; active: number; inactive: number };
    operations: { active: number; completed: number; delayed: number };
    employees: { total: number; active: number; departmentCount: number };
    receivables: { total: number; overdue: number };
    cashPosition: { amount: number; label: string };
  };
}

export function CeoKpiGrid({ kpis }: CeoKpiGridProps) {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const renderPercentBadge = (changePercent?: number, inverse = false) => {
    if (changePercent === undefined || changePercent === null) return null;
    const isPositive = changePercent >= 0;
    const isGood = inverse ? !isPositive : isPositive;

    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
          isGood
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
        }`}
      >
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? `+${changePercent}%` : `${changePercent}%`}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Revenue */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IndianRupee className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-white tracking-tight">
            {formatINR(kpis.revenue.current)}
          </span>
          {renderPercentBadge(kpis.revenue.changePercent)}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>Prev: {formatINR(kpis.revenue.previous || 0)}</span>
          <Link href="/app/finance" className="text-blue-400 hover:underline flex items-center gap-0.5">
            Finance <ArrowUpRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      </div>

      {/* 2. Expenses */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Operating Expenses</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <IndianRupee className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-white tracking-tight">
            {formatINR(kpis.expenses.current)}
          </span>
          {renderPercentBadge(kpis.expenses.changePercent, true)}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>Prev: {formatINR(kpis.expenses.previous || 0)}</span>
          <Link href="/app/finance/expenses" className="text-blue-400 hover:underline flex items-center gap-0.5">
            Expenses <ArrowUpRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      </div>

      {/* 3. Net Operating Profit */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Operating Profit</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span
            className={`text-2xl font-black tracking-tight ${
              kpis.netProfit.current >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatINR(kpis.netProfit.current)}
          </span>
          {renderPercentBadge(kpis.netProfit.changePercent)}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>Margin: {kpis.revenue.current > 0 ? Math.round((kpis.netProfit.current / kpis.revenue.current) * 100) : 0}%</span>
          <span className="text-slate-500">Inflow minus outflow</span>
        </div>
      </div>

      {/* 4. Cash Position */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cash Flow Position</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span
            className={`text-2xl font-black tracking-tight ${
              kpis.cashPosition.amount >= 0 ? "text-teal-400" : "text-rose-400"
            }`}
          >
            {formatINR(kpis.cashPosition.amount)}
          </span>
          <span className="text-[10px] font-mono text-slate-400">Operational</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span className="truncate">{kpis.cashPosition.label}</span>
          <Link href="/app/finance/transactions" className="text-blue-400 hover:underline flex items-center gap-0.5">
            Ledger <ArrowUpRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      </div>

      {/* 5. Customer Accounts */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer Portfolio</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Briefcase className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-white tracking-tight">{kpis.customers.total}</span>
          <span className="text-xs font-semibold text-emerald-400">+{kpis.customers.newCount} New</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>{kpis.customers.active} Active accounts</span>
          <Link href="/app/crm/clients" className="text-blue-400 hover:underline flex items-center gap-0.5">
            CRM <ArrowUpRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      </div>

      {/* 6. Active Operations */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Operations & Projects</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-white tracking-tight">{kpis.operations.active}</span>
          {kpis.operations.delayed > 0 ? (
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {kpis.operations.delayed} Delayed
            </span>
          ) : (
            <span className="text-xs font-semibold text-emerald-400">On Track</span>
          )}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>{kpis.operations.completed} Delivered</span>
          <Link href="/app/operations" className="text-blue-400 hover:underline flex items-center gap-0.5">
            Operations <ArrowUpRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      </div>

      {/* 7. Workforce & Employees */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Enterprise Workforce</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-white tracking-tight">{kpis.employees.active}</span>
          <span className="text-xs font-mono text-slate-400">{kpis.employees.departmentCount} Depts</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>Total Headcount: {kpis.employees.total}</span>
          <Link href="/app/people" className="text-blue-400 hover:underline flex items-center gap-0.5">
            People <ArrowUpRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      </div>

      {/* 8. Outstanding Receivables */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding Receivables</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-amber-400 tracking-tight">
            {formatINR(kpis.receivables.total)}
          </span>
          {kpis.receivables.overdue > 0 && (
            <span className="text-[10px] font-bold text-rose-400 flex items-center gap-0.5">
              <ShieldAlert className="h-3 w-3" />
              {formatINR(kpis.receivables.overdue)} Overdue
            </span>
          )}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>Invoices awaiting settlement</span>
          <Link href="/app/finance/receivables" className="text-blue-400 hover:underline flex items-center gap-0.5">
            Aging <ArrowUpRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
