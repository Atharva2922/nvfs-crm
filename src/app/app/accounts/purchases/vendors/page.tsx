"use client";

import React, { useState, useEffect } from "react";
import { Briefcase, Plus, Search, Loader2 } from "lucide-react";
import { AccountsQuickCreateModal } from "@/modules/accounts/components/accounts-quick-create-modal";

export default function AccountsVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts/vendors");
      const json = await res.json();
      if (json.success) setVendors(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const list = Array.isArray(vendors) ? vendors : [];
  const filtered = list.filter(
    (v) =>
      v.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      v.vendorCode?.toLowerCase().includes(search.toLowerCase()) ||
      (v.email && v.email.toLowerCase().includes(search.toLowerCase()))
  );

  const formatCurrency = (val: number) => `₹${Math.round(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Briefcase className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Vendor Financial Accounts
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Accounts payable ledgers, lifetime vendor purchases, disbursements, credit terms, and outstanding liabilities.
          </p>
        </div>
        <button
          onClick={() => setQuickCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Vendor</span>
        </button>
      </div>

      <div className="max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendors by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">GSTIN / Tax ID</th>
                <th className="py-3 px-3">Terms</th>
                <th className="py-3 px-3 text-right">Lifetime Purchases</th>
                <th className="py-3 px-3 text-right">Total Paid</th>
                <th className="py-3 px-3 text-right">Outstanding</th>
                <th className="py-3 px-3 text-right">Overdue</th>
                <th className="py-3 px-4 text-center">Bills</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    <span>Loading vendor profiles...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No vendors found. Click &quot;New Vendor&quot; to onboard your first supplier.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{v.displayName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{v.vendorCode}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-700 dark:text-slate-300">{v.email || "—"}</div>
                      <div className="text-[10px] text-slate-400">{v.phone || "—"}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {v.taxId || "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {v.paymentTerms.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(v.totalPurchases)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-500 font-semibold">
                      {formatCurrency(v.totalPaid)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(v.outstanding)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-500">
                      {formatCurrency(v.overdue)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {v.billsCount}
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
        type="VENDOR"
        onClose={() => setQuickCreateOpen(false)}
        onSuccess={fetchVendors}
      />
    </div>
  );
}
