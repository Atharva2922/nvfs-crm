"use client";

import { useEffect, useState, useTransition } from "react";
import { FinanceNav } from "@/modules/finance/components/finance-nav";
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CreditCard, 
  ExternalLink,
  IndianRupee,
  AlertCircle
} from "lucide-react";

interface ExpenseItem {
  id: string;
  expenseNumber: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  receiptUrl?: string | null;
  status: string;
  rejectionReason?: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string };
  department: { id: string; name: string; code: string };
  approver?: { id: string; firstName: string; lastName: string } | null;
}

const CATEGORIES = [
  "TRAVEL",
  "SOFTWARE_SUBSCRIPTION",
  "HARDWARE_EQUIPMENT",
  "OFFICE_SUPPLIES",
  "MARKETING",
  "MEALS_ENTERTAINMENT",
  "CONSULTING",
  "UTILITIES",
  "OTHER",
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-zinc-800 text-zinc-400 border-zinc-700" },
  SUBMITTED: { label: "Submitted", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  APPROVED: { label: "Approved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  REJECTED: { label: "Rejected", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  PAID: { label: "Paid", color: "bg-violet-500/10 text-violet-400 border-violet-500/30" },
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [scope, setScope] = useState<"all" | "my">("all");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Submit Expense Form State
  const [category, setCategory] = useState("TRAVEL");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      params.set("scope", scope);

      const res = await fetch(`/api/finance/expenses?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.data.expenses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [statusFilter, categoryFilter, scope]);

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/finance/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            amount: parseFloat(amount),
            currency,
            date,
            description,
            receiptUrl: receiptUrl.trim() || undefined,
          }),
        });

        if (res.ok) {
          setShowSubmitModal(false);
          setAmount("");
          setDescription("");
          setReceiptUrl("");
          fetchExpenses();
        } else {
          const json = await res.json();
          setErrorMsg(json.error?.message || "Failed to submit expense");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Network error");
      }
    });
  };

  const handleTransition = async (id: string, action: string, reason?: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/finance/expenses/${id}/transition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason }),
        });

        if (res.ok) {
          fetchExpenses();
        } else {
          const json = await res.json();
          alert(json.error?.message || `Failed to execute ${action}`);
        }
      } catch (err: any) {
        alert(err.message || "Network error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Expense Reimbursements</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Submit corporate claims, multi-tier manager & finance reviews, receipt auditing, and settlement disbursement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Scope Toggle */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
            <button
              onClick={() => setScope("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                scope === "all" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Expenses
            </button>
            <button
              onClick={() => setScope("my")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                scope === "my" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              My Claims
            </button>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Submit Claim
          </button>
        </div>
      </div>

      {/* Sub-Navigation */}
      <FinanceNav />

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PAID", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-zinc-800 text-white font-semibold border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {st === "ALL" ? "All Statuses" : STATUS_CONFIG[st]?.label || st}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-950/60 text-xs uppercase font-semibold tracking-wider text-zinc-400">
            <tr>
              <th className="px-6 py-4">Expense #</th>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Workflow Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  Loading corporate expenses...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  No expense claims found matching filter.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => {
                const sCfg = STATUS_CONFIG[exp.status] || { label: exp.status, color: "bg-zinc-800 text-zinc-400" };
                return (
                  <tr key={exp.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-white flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5 text-zinc-500" />
                      {exp.expenseNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-white">
                        {exp.employee.firstName} {exp.employee.lastName}
                      </span>
                      <span className="text-[11px] text-zinc-500 block">{exp.employee.employeeNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{exp.department.name}</td>
                    <td className="px-6 py-4 text-xs">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                        {exp.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-300 max-w-xs">
                      <p className="truncate">{exp.description}</p>
                      {exp.receiptUrl && (
                        <a
                          href={exp.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:underline mt-0.5"
                        >
                          <ExternalLink className="h-2.5 w-2.5" /> View Receipt
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      ${exp.amount.toLocaleString()} {exp.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sCfg.color}`}>
                        {sCfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {exp.status === "SUBMITTED" && (
                          <>
                            <button
                              onClick={() => handleTransition(exp.id, "REVIEW")}
                              disabled={isPending}
                              className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleTransition(exp.id, "APPROVE")}
                              disabled={isPending}
                              className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const r = prompt("Enter rejection reason:");
                                if (r) handleTransition(exp.id, "REJECT", r);
                              }}
                              disabled={isPending}
                              className="rounded bg-rose-600/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 text-xs font-medium hover:bg-rose-600/30"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {exp.status === "UNDER_REVIEW" && (
                          <>
                            <button
                              onClick={() => handleTransition(exp.id, "APPROVE")}
                              disabled={isPending}
                              className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const r = prompt("Enter rejection reason:");
                                if (r) handleTransition(exp.id, "REJECT", r);
                              }}
                              disabled={isPending}
                              className="rounded bg-rose-600/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 text-xs font-medium hover:bg-rose-600/30"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {exp.status === "APPROVED" && (
                          <button
                            onClick={() => handleTransition(exp.id, "PAY")}
                            disabled={isPending}
                            className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 flex items-center gap-1"
                          >
                            <IndianRupee className="h-3 w-3" /> Disburse Payment
                          </button>
                        )}

                        {exp.status === "PAID" && (
                          <span className="text-xs text-zinc-500 font-medium">Settled</span>
                        )}

                        {exp.status === "REJECTED" && (
                          <span className="text-xs text-rose-400 font-medium" title={exp.rejectionReason || ""}>
                            Declined
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Submit Expense Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Submit Expense Claim</h3>
            <p className="text-xs text-zinc-400 mt-1">Submit receipts for reimbursement or corporate account reconciliation.</p>

            {errorMsg && (
              <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitExpense} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="150.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Business justification and breakdown of expense..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">Receipt Attachment URL</label>
                <input
                  type="url"
                  placeholder="https://documents.nfvs.internal/receipts/doc.pdf"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isPending ? "Submitting..." : "Submit Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
