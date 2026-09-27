"use client";

import React from "react";
import Link from "next/link";
import {
  FileBarChart,
  Scale,
  TrendingUp,
  Receipt,
  FileText,
  Percent,
  Package,
  Landmark,
  ArrowRight,
} from "lucide-react";

export default function AccountsReportsHubPage() {
  const reports = [
    {
      title: "Profit & Loss Statement",
      desc: "Income, cost of goods sold, gross profit, operating overheads, and net margin.",
      href: "/app/accounts/reports/profit-loss",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      title: "Balance Sheet",
      desc: "Complete financial position: Assets, Liabilities, and Equity (Assets = Liabilities + Equity).",
      href: "/app/accounts/reports/balance-sheet",
      icon: Scale,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "Trial Balance",
      desc: "Mathematical double-entry validation ensuring total debits strictly equal total credits.",
      href: "/app/accounts/reports/trial-balance",
      icon: FileBarChart,
      color: "text-cyan-500 bg-cyan-500/10",
    },
    {
      title: "Cash Flow Statement",
      desc: "Liquidity breakdown across Operating activities, Investing activities, and Financing cash flows.",
      href: "/app/accounts/reports/cash-flow",
      icon: Landmark,
      color: "text-indigo-500 bg-indigo-500/10",
    },
    {
      title: "Accounts Receivable Aging",
      desc: "Customer aging report across Current, 1-30d, 31-60d, 61-90d, and 90+ days overdue buckets.",
      href: "/app/accounts/reports/receivables",
      icon: FileText,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      title: "Accounts Payable Aging",
      desc: "Vendor liabilities schedule across Current, 1-30d, 31-60d, 61-90d, and 90+ days overdue.",
      href: "/app/accounts/reports/payables",
      icon: Receipt,
      color: "text-orange-500 bg-orange-500/10",
    },
    {
      title: "GST / Tax Compliance Reports",
      desc: "Indian GST summary: GSTR-1 Outward supplies, GSTR-2 Input Tax Credit, and GSTR-3B liability.",
      href: "/app/accounts/reports/tax",
      icon: Percent,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      title: "Inventory Valuation Schedule",
      desc: "Stock on hand, unit cost, total valuation, and stock movement analysis.",
      href: "/app/accounts/inventory/valuation",
      icon: Package,
      color: "text-purple-500 bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <FileBarChart className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Reports Hub
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Executive financial statements, tax filings, double-entry audit trials, and aging schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((rep) => {
          const Icon = rep.icon;
          return (
            <Link
              key={rep.href}
              href={rep.href}
              className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${rep.color} mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                  {rep.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rep.desc}</p>
              </div>

              <div className="flex items-center text-xs font-semibold text-emerald-500 group-hover:text-emerald-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span>View Statement</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
