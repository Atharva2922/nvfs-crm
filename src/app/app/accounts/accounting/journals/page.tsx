"use client";

import React, { useState, useEffect } from "react";
import { BookOpenCheck, Plus, Search, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { AccountsQuickCreateModal } from "@/modules/accounts/components/accounts-quick-create-modal";
import { cn } from "@/lib/utils";

export default function AccountsJournalsPage() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts/journals");
      const json = await res.json();
      if (json.success) setJournals(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const list = Array.isArray(journals) ? journals : [];
  const filtered = list.filter(
    (j) =>
      j.entryNumber?.toLowerCase().includes(search.toLowerCase()) ||
      (j.reference && j.reference.toLowerCase().includes(search.toLowerCase())) ||
      (j.notes && j.notes.toLowerCase().includes(search.toLowerCase()))
  );

  const formatCurrency = (val: number) => `₹${Math.round(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
              <BookOpenCheck className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Journal Entries (Double-Entry Vouchers)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audited financial journal ledger vouchers where Total Debits strictly balance Total Credits.
          </p>
        </div>
        <button
          onClick={() => setQuickCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Journal Entry</span>
        </button>
      </div>

      <div className="max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search journal #, voucher, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
            <span>Loading journal vouchers...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c]">
            No journal entries recorded yet. Click &quot;New Journal Entry&quot; to create a double-entry voucher.
          </div>
        ) : (
          filtered.map((j) => {
            const isExpanded = expandedId === j.id;
            return (
              <div
                key={j.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] overflow-hidden shadow-xs"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : j.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-emerald-500">{j.entryNumber}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(j.date).toLocaleDateString("en-IN")}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 uppercase">
                      {j.sourceType}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-400">
                      Ref: <span className="font-semibold text-slate-200">{j.reference || "Manual"}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(j.totalAmount)}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3">
                    {j.notes && <p className="text-xs text-slate-400 italic">Notes: {j.notes}</p>}
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] font-semibold uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                        <tr>
                          <th className="py-1.5">Account Code & Name</th>
                          <th className="py-1.5">Description</th>
                          <th className="py-1.5 text-right">Debit (Dr)</th>
                          <th className="py-1.5 text-right">Credit (Cr)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                        {j.lines?.map((line: any) => (
                          <tr key={line.id}>
                            <td className="py-2 font-mono">
                              <span className="text-emerald-500 font-bold">{line.account?.code}</span> •{" "}
                              <span className="text-slate-200">{line.account?.name}</span>
                            </td>
                            <td className="py-2 text-slate-400">{line.description || "—"}</td>
                            <td className="py-2 text-right font-mono font-semibold text-slate-200">
                              {line.type === "DEBIT" ? formatCurrency(line.amount) : "—"}
                            </td>
                            <td className="py-2 text-right font-mono font-semibold text-slate-200">
                              {line.type === "CREDIT" ? formatCurrency(line.amount) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-bold font-mono">
                          <td colSpan={2} className="py-2 text-slate-400 uppercase text-[10px]">
                            Total Balanced Voucher
                          </td>
                          <td className="py-2 text-right text-emerald-400">{formatCurrency(j.totalAmount)}</td>
                          <td className="py-2 text-right text-emerald-400">{formatCurrency(j.totalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <AccountsQuickCreateModal
        open={quickCreateOpen}
        type="JOURNAL"
        onClose={() => setQuickCreateOpen(false)}
        onSuccess={fetchJournals}
      />
    </div>
  );
}
