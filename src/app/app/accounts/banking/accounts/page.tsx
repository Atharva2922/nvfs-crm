"use client";

import React, { useState, useEffect } from "react";
import { Landmark, Plus, ArrowRightLeft, RefreshCw, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { AccountsQuickCreateModal } from "@/modules/accounts/components/accounts-quick-create-modal";
import { cn } from "@/lib/utils";

export default function AccountsBankingPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<string>("TRANSFER");

  const fetchBanking = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts/banking");
      const json = await res.json();
      if (json.success) {
        setBankAccounts(json.data || []);
        if (json.data && json.data.length > 0 && !selectedAccountId) {
          setSelectedAccountId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanking();
  }, []);

  const selectedAccount = bankAccounts.find((b) => b.id === selectedAccountId) || bankAccounts[0];

  const formatCurrency = (val: number) => `₹${Math.round(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Landmark className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Bank & Cash Accounts
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Corporate treasury balances, inter-account transfers, automated bank feeds, and reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setQuickCreateType("TRANSFER");
              setQuickCreateOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Fund Transfer</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bankAccounts.map((b) => {
          const isSelected = selectedAccountId === b.id;
          return (
            <div
              key={b.id}
              onClick={() => setSelectedAccountId(b.id)}
              className={cn(
                "p-4.5 rounded-2xl border cursor-pointer transition-all shadow-xs",
                isSelected
                  ? "border-emerald-500 bg-emerald-950/20 shadow-md"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{b.accountName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 uppercase">
                  {b.accountType}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-3">
                {b.bankName} • {b.accountNumber}
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mb-2">
                {formatCurrency(b.currentBalance)}
              </div>
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-400">
                <span>Available: {formatCurrency(b.availableBalance)}</span>
                <span className="text-emerald-400 font-medium">Reconciled</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Account Transactions Feed */}
      {selectedAccount && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedAccount.accountName} — Activity Stream
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {selectedAccount.bankName} | IFSC: {selectedAccount.ifscOrSwift || "HDFC0000123"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Payee / Description</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {!selectedAccount.transactions || selectedAccount.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No recent transactions recorded for this account.
                    </td>
                  </tr>
                ) : (
                  selectedAccount.transactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(t.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{t.type}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900 dark:text-white">{t.payeeOrPayer || "—"}</div>
                        <div className="text-[10px] text-slate-400">{t.description}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{t.reference || "—"}</td>
                      <td
                        className={cn(
                          "py-2.5 px-3 text-right font-bold font-mono",
                          t.type === "DEPOSIT" ? "text-emerald-500" : "text-slate-200"
                        )}
                      >
                        {t.type === "DEPOSIT" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AccountsQuickCreateModal
        open={quickCreateOpen}
        type={quickCreateType}
        onClose={() => setQuickCreateOpen(false)}
        onSuccess={fetchBanking}
      />
    </div>
  );
}
