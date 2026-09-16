"use client";

import { useEffect, useState, useTransition } from "react";
import { FinanceNav } from "@/modules/finance/components/finance-nav";
import { 
  CreditCard, 
  Search, 
  Filter, 
  Building2, 
  Calendar, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  FileText,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface PaymentItem {
  id: string;
  paymentReference: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  transactionRef?: string | null;
  notes?: string | null;
  status: string;
  reversalReason?: string | null;
  reversedAt?: string | null;
  invoice: { id: string; invoiceNumber: string; total: number; balance: number; status: string };
  client: { id: string; name: string; code: string };
  recordedBy: { id: string; firstName: string; lastName: string };
}

export default function PaymentsRegisterPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/finance/payments?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setPayments(json.data.payments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleReverse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !reversalReason.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/finance/payments/${selectedPayment.id}/reverse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reversalReason }),
        });

        if (res.ok) {
          setShowReversalModal(false);
          setSelectedPayment(null);
          setReversalReason("");
          fetchPayments();
        } else {
          const json = await res.json();
          setErrorMsg(json.error?.message || "Failed to reverse payment");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Network error");
      }
    });
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.paymentReference.toLowerCase().includes(q) ||
      p.client.name.toLowerCase().includes(q) ||
      p.invoice.invoiceNumber.toLowerCase().includes(q) ||
      (p.transactionRef && p.transactionRef.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Payment Transactions</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Incoming client payment remittances, bank transfer reconciliation, and transaction reversals.
          </p>
        </div>
      </div>

      {/* Sub-Navigation */}
      <FinanceNav />

      {/* Search & Status Filter */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search reference, client, invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {["ALL", "COMPLETED", "REVERSED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-zinc-800 text-white font-semibold border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-950/60 text-xs uppercase font-semibold tracking-wider text-zinc-400">
            <tr>
              <th className="px-6 py-4">Payment Ref</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Invoice</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  Loading payment records...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  No payment transactions found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-white flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-zinc-500" />
                    {p.paymentReference}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{p.client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-indigo-400">
                    <Link href={`/app/finance/invoices/${p.invoice.id}`} className="hover:underline flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {p.invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                      {p.paymentMethod.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                    +₹{p.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.status === "COMPLETED" ? (
                      <button
                        onClick={() => {
                          setSelectedPayment(p);
                          setShowReversalModal(true);
                          setErrorMsg("");
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-zinc-700 transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" /> Reverse
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-500">Reversed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reverse Payment Modal */}
      {showReversalModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-rose-400" /> Reverse Payment
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Reversing payment <span className="font-mono text-white">{selectedPayment.paymentReference}</span> (₹{selectedPayment.amount.toLocaleString()}) will restore the outstanding invoice balance and create an offsetting adjustment in the ledger.
            </p>

            {errorMsg && (
              <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleReverse} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300">Reversal Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Bank chargeback, duplicated wire remittance, client bounced check..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowReversalModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {isPending ? "Reversing..." : "Confirm Reversal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
