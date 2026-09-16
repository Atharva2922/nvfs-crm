"use client";

import { useEffect, useState } from "react";
import { FinanceNav } from "@/modules/finance/components/finance-nav";
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Building2, 
  FileText, 
  ArrowRight,
  ShieldAlert,
  Calendar
} from "lucide-react";
import Link from "next/link";

interface ReceivablesData {
  totalReceivable: number;
  totalOverdue: number;
  agingBuckets: {
    current: { count: number; amount: number };
    days1_30: { count: number; amount: number };
    days31_60: { count: number; amount: number };
    days61_90: { count: number; amount: number };
    days90Plus: { count: number; amount: number };
  };
  receivablesList: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    total: number;
    paidAmount: number;
    balance: number;
    currency: string;
    status: string;
    isOverdue: boolean;
    daysOverdue: number;
    bucket: "current" | "days1_30" | "days31_60" | "days61_90" | "days90Plus";
    client: { id: string; name: string; code: string };
  }>;
}

const BUCKET_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  current: { label: "Current", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  days1_30: { label: "1–30 Days", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  days31_60: { label: "31–60 Days", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  days61_90: { label: "61–90 Days", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30" },
  days90Plus: { label: "90+ Days", color: "text-red-500", bg: "bg-red-500/10 border-red-500/30" },
};

export default function ReceivablesAgingPage() {
  const [data, setData] = useState<ReceivablesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBucket, setActiveBucket] = useState<string>("ALL");

  useEffect(() => {
    async function loadReceivables() {
      try {
        setLoading(true);
        const res = await fetch("/api/finance/receivables");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load receivables schedule:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReceivables();
  }, []);

  const buckets = data?.agingBuckets;
  const list = data?.receivablesList || [];

  const filteredList = list.filter((item) => {
    if (activeBucket === "ALL") return true;
    return item.bucket === activeBucket;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Accounts Receivable Aging</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track outstanding customer invoices, overdue delinquency schedules, and collection aging buckets.
          </p>
        </div>
      </div>

      {/* Sub-Navigation */}
      <FinanceNav />

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Outstanding */}
        <div 
          onClick={() => setActiveBucket("ALL")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeBucket === "ALL" ? "border-indigo-500 bg-indigo-500/10 shadow-md" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
          }`}
        >
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Total Outstanding</span>
          <span className="text-xl font-bold text-white block mt-2">
            ₹{(data?.totalReceivable || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-0.5">{list.length} open invoices</span>
        </div>

        {/* Current */}
        <div 
          onClick={() => setActiveBucket("current")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeBucket === "current" ? "border-emerald-500 bg-emerald-500/10 shadow-md" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
          }`}
        >
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Current (Not Due)</span>
          <span className="text-xl font-bold text-white block mt-2">
            ₹{(buckets?.current.amount || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-0.5">{buckets?.current.count || 0} invoices</span>
        </div>

        {/* 1-30 Days */}
        <div 
          onClick={() => setActiveBucket("days1_30")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeBucket === "days1_30" ? "border-amber-500 bg-amber-500/10 shadow-md" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
          }`}
        >
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">1–30 Days Overdue</span>
          <span className="text-xl font-bold text-amber-400 block mt-2">
            ₹{(buckets?.days1_30.amount || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-0.5">{buckets?.days1_30.count || 0} invoices</span>
        </div>

        {/* 31-60 Days */}
        <div 
          onClick={() => setActiveBucket("days31_60")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeBucket === "days31_60" ? "border-orange-500 bg-orange-500/10 shadow-md" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
          }`}
        >
          <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider block">31–60 Days Overdue</span>
          <span className="text-xl font-bold text-orange-400 block mt-2">
            ₹{(buckets?.days31_60.amount || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-0.5">{buckets?.days31_60.count || 0} invoices</span>
        </div>

        {/* 61+ Days */}
        <div 
          onClick={() => setActiveBucket("days61_90")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeBucket === "days61_90" ? "border-rose-500 bg-rose-500/10 shadow-md" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
          }`}
        >
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">61+ Days Delinquent</span>
          <span className="text-xl font-bold text-rose-500 block mt-2">
            ₹{((buckets?.days61_90.amount || 0) + (buckets?.days90Plus.amount || 0)).toLocaleString()}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-0.5">
            {(buckets?.days61_90.count || 0) + (buckets?.days90Plus.count || 0)} invoices
          </span>
        </div>
      </div>

      {/* Receivables Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-950/60 text-xs uppercase font-semibold tracking-wider text-zinc-400">
            <tr>
              <th className="px-6 py-4">Customer Account</th>
              <th className="px-6 py-4">Invoice #</th>
              <th className="px-6 py-4">Invoice Date</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Delinquency</th>
              <th className="px-6 py-4">Original Total</th>
              <th className="px-6 py-4">Paid</th>
              <th className="px-6 py-4">Outstanding Balance</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-zinc-500">
                  Loading receivables ledger...
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-zinc-500">
                  No outstanding receivables in this category.
                </td>
              </tr>
            ) : (
              filteredList.map((row) => {
                const bCfg = BUCKET_LABELS[row.bucket] || { label: row.bucket, color: "text-zinc-400", bg: "bg-zinc-800" };
                return (
                  <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-zinc-500" />
                        <span className="font-semibold text-white">{row.client.name}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500">{row.client.code}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-white">
                      <Link href={`/app/finance/invoices/${row.id}`} className="hover:text-indigo-400 flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-zinc-500" />
                        {row.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {new Date(row.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className={row.isOverdue ? "text-rose-400 font-semibold" : "text-zinc-300"}>
                        {new Date(row.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${bCfg.bg} ${bCfg.color}`}>
                        {row.isOverdue ? `${row.daysOverdue}d Overdue` : "Current"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                      ₹{row.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-emerald-400">
                      ₹{row.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-400">
                      ₹{row.balance.toLocaleString()} {row.currency}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/finance/invoices/${row.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        Details <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
