"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { FinanceNav } from "@/modules/finance/components/finance-nav";
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  IndianRupee, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Send, 
  FileText, 
  User, 
  Plus, 
  Printer 
} from "lucide-react";
import Link from "next/link";

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  balance: number;
  status: string;
  rejectionReason?: string | null;
  invoiceDate: string;
  dueDate: string;
  notes?: string | null;
  terms?: string | null;
  client: { id: string; name: string; code: string; email?: string | null; phone?: string | null; address?: string | null };
  contact?: { firstName: string; lastName: string; email: string } | null;
  createdBy: { firstName: string; lastName: string; designation: string };
  approvedBy?: { firstName: string; lastName: string; designation: string } | null;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    amount: number;
  }>;
  payments: Array<{
    id: string;
    paymentReference: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    transactionRef?: string | null;
    status: string;
    recordedBy: { firstName: string; lastName: string };
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-zinc-800 text-zinc-300 border-zinc-700" },
  PENDING_APPROVAL: { label: "Pending Approval", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  APPROVED: { label: "Approved", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
  SENT: { label: "Sent", color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  PARTIALLY_PAID: { label: "Partially Paid", color: "bg-violet-500/10 text-violet-400 border-violet-500/30" },
  PAID: { label: "Paid", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  OVERDUE: { label: "Overdue", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  CANCELLED: { label: "Cancelled", color: "bg-zinc-900 text-zinc-500 border-zinc-800" },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionError, setActionError] = useState("");

  // Payment Form
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/invoices/${id}`);
      if (res.ok) {
        const json = await res.json();
        setInvoice(json.data);
        if (json.data) setPayAmount(String(json.data.balance));
      } else {
        router.push("/app/finance/invoices");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const handleTransition = async (action: string, reason?: string) => {
    setActionError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/finance/invoices/${id}/transition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason }),
        });

        if (res.ok) {
          fetchInvoice();
        } else {
          const json = await res.json();
          setActionError(json.error?.message || `Failed to execute ${action}`);
        }
      } catch (err: any) {
        setActionError(err.message || "Network error");
      }
    });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/finance/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: id,
            amount: parseFloat(payAmount),
            paymentDate: payDate,
            paymentMethod: payMethod,
            transactionRef: payRef,
            notes: payNotes,
          }),
        });

        if (res.ok) {
          setShowPaymentModal(false);
          fetchInvoice();
        } else {
          const json = await res.json();
          setActionError(json.error?.message || "Failed to record payment");
        }
      } catch (err: any) {
        setActionError(err.message || "Network error");
      }
    });
  };

  if (loading || !invoice) {
    return (
      <div className="space-y-6">
        <FinanceNav />
        <div className="p-12 text-center text-zinc-500">Loading invoice details...</div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[invoice.status] || { label: invoice.status, color: "bg-zinc-800 text-zinc-400" };
  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.balance > 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/finance/invoices"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white font-mono">{invoice.invoiceNumber}</h1>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              {isOverdue && (
                <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
                  Overdue
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Client: <span className="text-white font-medium">{invoice.client.name}</span> • Created {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === "DRAFT" && (
            <button
              onClick={() => handleTransition("SUBMIT")}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
              Submit for Approval
            </button>
          )}

          {invoice.status === "PENDING_APPROVAL" && (
            <>
              <button
                onClick={() => handleTransition("APPROVE")}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve Invoice
              </button>
              <button
                onClick={() => {
                  const reason = prompt("Enter rejection reason:");
                  if (reason) handleTransition("REJECT", reason);
                }}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </>
          )}

          {invoice.status === "APPROVED" && (
            <button
              onClick={() => handleTransition("SEND")}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send to Client
            </button>
          )}

          {["SENT", "PARTIALLY_PAID"].includes(invoice.status) && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Record Payment
            </button>
          )}

          {invoice.balance === invoice.total && invoice.status !== "CANCELLED" && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to cancel this invoice?")) handleTransition("CANCEL");
              }}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-rose-400 transition-colors disabled:opacity-50"
            >
              Cancel Invoice
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Invoice Document Layout */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 space-y-8 backdrop-blur-sm">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-zinc-800">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Commercial Invoice</span>
            <h2 className="text-2xl font-bold text-white font-mono mt-1">{invoice.invoiceNumber}</h2>
            <p className="text-xs text-zinc-400 mt-1">Status: {statusCfg.label}</p>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <span className="text-zinc-400">Total Amount Due:</span>
            <span className="text-2xl font-bold text-white block">
              ${invoice.balance.toLocaleString()} {invoice.currency}
            </span>
            <span className="text-zinc-500 block">
              Original Invoiced Total: ${invoice.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Bill From & Bill To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div>
            <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px]">Billed To:</span>
            <h3 className="text-sm font-bold text-white mt-1.5">{invoice.client.name}</h3>
            <p className="text-zinc-400 mt-0.5">Account Code: {invoice.client.code}</p>
            {invoice.client.address && <p className="text-zinc-400 mt-0.5">{invoice.client.address}</p>}
            {invoice.contact && (
              <p className="text-zinc-400 mt-0.5">
                Attention: {invoice.contact.firstName} {invoice.contact.lastName} ({invoice.contact.email})
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:text-right">
            <div>
              <span className="text-zinc-400">Invoice Date:</span>{" "}
              <span className="font-medium text-white">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-zinc-400">Payment Due Date:</span>{" "}
              <span className={`font-semibold ${isOverdue ? "text-rose-400" : "text-white"}`}>
                {new Date(invoice.dueDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Prepared By:</span>{" "}
              <span className="text-zinc-300">
                {invoice.createdBy.firstName} {invoice.createdBy.lastName} ({invoice.createdBy.designation})
              </span>
            </div>
            {invoice.approvedBy && (
              <div>
                <span className="text-zinc-400">Approved By:</span>{" "}
                <span className="text-emerald-400">
                  {invoice.approvedBy.firstName} {invoice.approvedBy.lastName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800 text-left text-xs">
            <thead className="bg-zinc-950/60 uppercase font-semibold text-zinc-400">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {invoice.items.map((it) => (
                <tr key={it.id}>
                  <td className="px-4 py-3 font-medium text-white">{it.description}</td>
                  <td className="px-4 py-3 text-center">{it.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{it.unitPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-400">
                    {it.discount > 0 ? `-₹${it.discount.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                    ₹{it.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Breakdown */}
        <div className="flex flex-col sm:flex-row sm:justify-end">
          <div className="w-full sm:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="font-medium text-white">₹{invoice.subtotal.toLocaleString()}</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Tax ({invoice.taxRate}%)</span>
                <span className="font-medium text-white">+₹{invoice.taxAmount.toLocaleString()}</span>
              </div>
            )}
            {invoice.discountRate > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Discount ({invoice.discountRate}%)</span>
                <span className="font-medium text-emerald-400">-₹{invoice.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-bold text-white">
              <span>Total Invoiced</span>
              <span>₹{invoice.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-400 font-medium">
              <span>Amount Paid to Date</span>
              <span>-₹{invoice.paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-bold">
              <span className="text-zinc-200">Outstanding Balance</span>
              <span className={invoice.balance > 0 ? "text-amber-400" : "text-emerald-400"}>
                ${invoice.balance.toLocaleString()} {invoice.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-zinc-800 text-xs">
          <div>
            <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px]">Commercial Notes:</span>
            <p className="text-zinc-400 mt-1">{invoice.notes || "No special notes recorded."}</p>
          </div>
          <div>
            <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px]">Payment Terms:</span>
            <p className="text-zinc-400 mt-1">{invoice.terms || "Standard commercial terms apply."}</p>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="pt-6 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Payment Transactions ({invoice.payments.length})
            </h4>
            {["SENT", "PARTIALLY_PAID"].includes(invoice.status) && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Record Payment
              </button>
            )}
          </div>

          {invoice.payments.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              No payments recorded against this invoice yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="min-w-full divide-y divide-zinc-800 text-left text-xs">
                <thead className="bg-zinc-950/60 uppercase font-semibold text-zinc-400">
                  <tr>
                    <th className="px-4 py-2.5">Reference</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">External Ref</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Recorded By</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {invoice.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5 font-mono font-medium text-white">{p.paymentReference}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5">{p.paymentMethod.replace(/_/g, " ")}</td>
                      <td className="px-4 py-2.5 font-mono text-zinc-400">{p.transactionRef || "—"}</td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-emerald-400">
                        +${p.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400">
                        {p.recordedBy.firstName} {p.recordedBy.lastName}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Record Client Payment</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Outstanding Balance: <span className="text-amber-400 font-semibold">₹{invoice.balance.toLocaleString()}</span>
            </p>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  max={invoice.balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (ACH)</option>
                    <option value="WIRE">Wire Remittance</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="CHECK">Check</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">External Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. WIRE-REF-9920182 or Check #"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional payment notes..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isPending ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
