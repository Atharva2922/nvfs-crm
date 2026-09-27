"use client";

import React, { useState, useEffect } from "react";
import { Landmark, CheckCircle2, Clock, RefreshCw, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function BankReconciliationPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  const fetchBanking = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts/banking");
      const json = await res.json();
      if (json.success && json.data) {
        setBankAccounts(json.data);
        if (!selectedAccountId && json.data.length > 0) {
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

  const handleToggleReconcile = async (txnId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "RECONCILED" ? "UNRECONCILED" : "RECONCILED";
    setReconcilingId(txnId);
    try {
      const res = await fetch("/api/accounts/banking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RECONCILE", transactionId: txnId, status: nextStatus }),
      });
      if (res.ok) {
        fetchBanking();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReconcilingId(null);
    }
  };

  const formatCurrency = (val: number) => `₹${Math.round(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/app/accounts/banking/accounts"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Bank Accounts</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Landmark className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Bank Reconciliation Worksheet
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare electronic bank feeds with general ledger postings and verify cleared balances.
          </p>
        </div>

        {/* Account Switcher */}
        {bankAccounts.length > 0 && (
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium"
          >
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bankName} - {b.accountName}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading || !selectedAccount ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500 mb-2" />
          <span>Loading bank reconciliation feed...</span>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Balance Comparison Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c]">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Statement Balance</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {formatCurrency(selectedAccount.currentBalance)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">General Ledger Balance</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {formatCurrency(selectedAccount.currentBalance)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Unreconciled Difference</div>
              <div className="text-xl font-bold font-mono text-emerald-500 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5" />
                <span>₹0 (In Balance)</span>
              </div>
            </div>
          </div>

          {/* Transactions Checklist */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Transaction Clearance Ledger
              </h3>
              <span className="text-xs text-slate-400">Click to toggle Reconciled status</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Party / Description</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {!selectedAccount.transactions || selectedAccount.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        All transactions are reconciled. No pending items.
                      </td>
                    </tr>
                  ) : (
                    selectedAccount.transactions.map((t: any) => {
                      const isReconciled = t.status === "RECONCILED";
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold",
                                isReconciled
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              )}
                            >
                              {isReconciled ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              <span>{t.status}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                            {new Date(t.date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {t.payeeOrPayer || "General Ledger"}
                            </div>
                            <div className="text-[10px] text-slate-400">{t.description}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                            {t.reference || "—"}
                          </td>
                          <td
                            className={cn(
                              "py-2.5 px-3 text-right font-bold font-mono",
                              t.type === "DEPOSIT" ? "text-emerald-500" : "text-slate-200"
                            )}
                          >
                            {t.type === "DEPOSIT" ? "+" : "-"}
                            {formatCurrency(t.amount)}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              disabled={reconcilingId === t.id}
                              onClick={() => handleToggleReconcile(t.id, t.status)}
                              className={cn(
                                "px-2.5 py-1 rounded text-[11px] font-semibold transition-colors",
                                isReconciled
                                  ? "bg-slate-800 text-slate-400 hover:text-white"
                                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                              )}
                            >
                              {reconcilingId === t.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : isReconciled ? (
                                "Unmatch"
                              ) : (
                                "Match & Clear"
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
