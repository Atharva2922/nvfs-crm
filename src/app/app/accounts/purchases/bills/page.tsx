"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CreditCard,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AccountsQuickCreateModal } from "@/modules/accounts/components/accounts-quick-create-modal";
import { cn } from "@/lib/utils";

export default function AccountsBillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<any | null>(null);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "ALL" ? "/api/accounts/bills" : `/api/accounts/bills?status=${statusFilter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setBills(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  const filteredBills = bills.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.invoiceNumber.toLowerCase().includes(q) ||
      b.vendor?.displayName?.toLowerCase().includes(q) ||
      b.vendor?.vendorCode?.toLowerCase().includes(q)
    );
  });

  const formatCurrency = (val: number) => `₹${Math.round(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Receipt className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Vendor Bills
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track procurement bills, vendor payables, due dates, input tax credits, and disbursements.
          </p>
        </div>
        <button
          onClick={() => setQuickCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Bill</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c]">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bill # or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "APPROVED", "PAID", "OVERDUE", "DRAFT"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors",
                statusFilter === st
                  ? "bg-amber-600 text-white"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Bill #</th>
                <th className="py-3 px-3">Vendor</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Balance</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Loading vendor bills...</span>
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No vendor bills found. Click &quot;New Bill&quot; to record your first vendor purchase.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {b.invoiceNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {b.vendor?.displayName || "Vendor"}
                      </div>
                      <div className="text-[10px] text-slate-400">{b.vendor?.vendorCode}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {new Date(b.invoiceDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {new Date(b.dueDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(b.total)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-500 font-mono font-medium">
                      {formatCurrency(b.paidAmount)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(b.balance)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
                          b.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : b.status === "OVERDUE"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        )}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {b.balance > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedBillForPayment(b);
                            setQuickCreateOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-semibold transition-colors"
                        >
                          Disburse
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Settled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AccountsQuickCreateModal
        open={quickCreateOpen}
        type={selectedBillForPayment ? "PAYMENT" : "BILL"}
        onClose={() => {
          setQuickCreateOpen(false);
          setSelectedBillForPayment(null);
        }}
        onSuccess={fetchBills}
      />
    </div>
  );
}
