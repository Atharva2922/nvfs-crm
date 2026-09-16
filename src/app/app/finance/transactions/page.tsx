"use client";

import { useEffect, useState } from "react";
import { FinanceNav } from "@/modules/finance/components/finance-nav";
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  CreditCard, 
  Receipt, 
  IndianRupee, 
  Building2,
  Calendar
} from "lucide-react";
import Link from "next/link";

interface FinancialTransactionItem {
  id: string;
  transactionNumber: string;
  type: string;
  direction: "INFLOW" | "OUTFLOW";
  sourceType: string;
  sourceId: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  reference?: string | null;
  department?: { id: string; name: string; code: string } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  invoice?: { id: string; invoiceNumber: string } | null;
  payment?: { id: string; paymentReference: string } | null;
  expense?: { id: string; expenseNumber: string } | null;
  payrollPeriod?: { id: string; code: string; name: string } | null;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  INVOICE_PAYMENT: { label: "Client Payment", icon: CreditCard },
  EXPENSE: { label: "Expense Disbursement", icon: Receipt },
  PAYROLL_DISBURSEMENT: { label: "Payroll Outflow", icon: IndianRupee },
  ADJUSTMENT: { label: "Ledger Adjustment", icon: ArrowLeftRight },
};

export default function FinancialTransactionsPage() {
  const [transactions, setTransactions] = useState<FinancialTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [directionFilter, setDirectionFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (directionFilter !== "ALL") params.set("direction", directionFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/finance/transactions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [directionFilter, typeFilter, searchTerm]);

  // Compute ledger subtotals
  const totalInflow = transactions
    .filter((t) => t.direction === "INFLOW")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = transactions
    .filter((t) => t.direction === "OUTFLOW")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Financial Transactions Ledger</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Centralized immutable double-entry transaction record across payments, expenses, and payroll disbursements.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-emerald-400 font-semibold">
            Inflows: +₹{totalInflow.toLocaleString()}
          </div>
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-rose-400 font-semibold">
            Outflows: -₹{totalOutflow.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Sub-Navigation */}
      <FinanceNav />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search transaction #, description, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Direction filters */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-xs">
            {["ALL", "INFLOW", "OUTFLOW"].map((dir) => (
              <button
                key={dir}
                onClick={() => setDirectionFilter(dir)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  directionFilter === dir
                    ? "bg-zinc-800 text-white font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {dir === "ALL" ? "All Flows" : dir === "INFLOW" ? "Inflow (+)" : "Outflow (-)"}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Transaction Types</option>
            <option value="INVOICE_PAYMENT">Client Payments</option>
            <option value="EXPENSE">Expense Disbursements</option>
            <option value="PAYROLL_DISBURSEMENT">Payroll Disbursements</option>
            <option value="ADJUSTMENT">Ledger Adjustments</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-950/60 text-xs uppercase font-semibold tracking-wider text-zinc-400">
            <tr>
              <th className="px-6 py-4">Transaction #</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Flow</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4 text-right">Recorded By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  Loading ledger transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  No financial transactions recorded matching criteria.
                </td>
              </tr>
            ) : (
              transactions.map((t) => {
                const typeCfg = TYPE_CONFIG[t.type] || { label: t.type, icon: ArrowLeftRight };
                const Icon = typeCfg.icon;

                return (
                  <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-white">{t.transactionNumber}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        t.direction === "INFLOW"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}>
                        {t.direction === "INFLOW" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <Icon className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{typeCfg.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-300 max-w-sm truncate">{t.description}</td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                      {t.reference || "—"}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">
                      <span className={t.direction === "INFLOW" ? "text-emerald-400" : "text-rose-400"}>
                        {t.direction === "INFLOW" ? "+" : "-"}₹{t.amount.toLocaleString()} {t.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-zinc-400">
                      {t.createdBy.firstName} {t.createdBy.lastName}
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
