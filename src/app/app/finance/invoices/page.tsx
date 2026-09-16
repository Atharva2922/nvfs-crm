"use client";

import { useEffect, useState, useTransition } from "react";
import { FinanceNav } from "@/modules/finance/components/finance-nav";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Building2, 
  Calendar, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  XCircle,
  ArrowRight,
  Trash2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  currency: string;
  total: number;
  paidAmount: number;
  balance: number;
  status: string;
  invoiceDate: string;
  dueDate: string;
  client: { id: string; name: string; code: string };
  contact?: { id: string; firstName: string; lastName: string; email: string } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  _count: { items: number; payments: number };
}

interface ClientOption {
  id: string;
  name: string;
  code: string;
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

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create Invoice Form State
  const [clientId, setClientId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [currency, setCurrency] = useState("INR");
  const [taxRate, setTaxRate] = useState("10");
  const [discountRate, setDiscountRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Net 30. Standard corporate payment terms apply.");
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number; productId?: string; serviceId?: string }>>([
    { description: "Enterprise Consulting & Cloud Architecture", quantity: 1, unitPrice: 5000 },
  ]);
  const [catalogItems, setCatalogItems] = useState<Array<{ id: string; type: "PRODUCT" | "SERVICE"; label: string; price: number }>>([]);
  const [formError, setFormError] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/finance/invoices?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setInvoices(json.data.invoices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const [crmRes, prodRes, srvRes] = await Promise.all([
        fetch("/api/crm/clients?limit=100"),
        fetch("/api/inventory/products"),
        fetch("/api/inventory/services"),
      ]);

      if (crmRes.ok) {
        const json = await crmRes.json();
        const list = json.data?.clients || [];
        setClients(list);
        if (list.length > 0 && !clientId) setClientId(list[0].id);
      }

      const combined: Array<{ id: string; type: "PRODUCT" | "SERVICE"; label: string; price: number }> = [];
      if (prodRes.ok) {
        const pJson = await prodRes.json();
        (pJson.data || []).forEach((p: any) => {
          combined.push({
            id: p.id,
            type: "PRODUCT",
            label: `[Product] ${p.sku} - ${p.name}`,
            price: p.sellingPrice,
          });
        });
      }
      if (srvRes.ok) {
        const sJson = await srvRes.json();
        (sJson.data || []).forEach((s: any) => {
          combined.push({
            id: s.id,
            type: "SERVICE",
            label: `[Service] ${s.serviceCode} - ${s.name}`,
            price: s.sellingPrice,
          });
        });
      }
      setCatalogItems(combined);
    } catch {}
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  // Preview Totals
  const subtotal = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0), 0);
  const taxAmount = (subtotal * (parseFloat(taxRate) || 0)) / 100;
  const discountAmount = (subtotal * (parseFloat(discountRate) || 0)) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!clientId) {
      setFormError("Please select a client account");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/finance/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            invoiceDate,
            dueDate,
            currency,
            taxRate: parseFloat(taxRate) || 0,
            discountRate: parseFloat(discountRate) || 0,
            notes,
            terms,
            items: items.map((it) => ({
              description: it.description,
              productId: it.productId || undefined,
              serviceId: it.serviceId || undefined,
              quantity: parseFloat(String(it.quantity)),
              unitPrice: parseFloat(String(it.unitPrice)),
            })),
          }),
        });

        if (res.ok) {
          setShowCreateModal(false);
          fetchInvoices();
        } else {
          const json = await res.json();
          setFormError(json.error?.message || "Failed to create invoice");
        }
      } catch (err: any) {
        setFormError(err.message || "Network error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Customer Invoices</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage corporate billing, status approvals, line item breakdown, and accounts receivable tracking.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </button>
      </div>

      {/* Sub-Navigation */}
      <FinanceNav />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search invoice number, client, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {["ALL", "DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "PARTIALLY_PAID", "PAID", "CANCELLED"].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {st === "ALL" ? "All" : STATUS_CONFIG[st]?.label || st}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-950/60 text-xs uppercase font-semibold tracking-wider text-zinc-400">
            <tr>
              <th className="px-6 py-4">Invoice #</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Invoice Date</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Balance</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  No invoices found matching criteria.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const cfg = STATUS_CONFIG[inv.status] || { label: inv.status, color: "bg-zinc-800 text-zinc-400" };
                const isOverdue = new Date(inv.dueDate) < new Date() && inv.balance > 0;

                return (
                  <tr key={inv.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-white">
                      <Link href={`/app/finance/invoices/${inv.id}`} className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-zinc-500" />
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="font-medium text-white">{inv.client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className={isOverdue ? "text-rose-400 font-semibold" : "text-zinc-400"}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                        {isOverdue && " (Overdue)"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      ${inv.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${inv.balance > 0 ? "text-amber-400" : "text-zinc-500"}`}>
                        ${inv.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/finance/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold text-white">Create Customer Invoice</h3>
            <p className="text-xs text-zinc-400 mt-1">Generate a commercial billing invoice with calculated line items.</p>

            {formError && (
              <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Client Account *</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Line Items</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Item
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((it, idx) => (
                    <div key={idx} className="space-y-1 rounded-lg border border-zinc-700/60 bg-zinc-800/40 p-2">
                      <div className="flex items-center gap-2">
                        {catalogItems.length > 0 && (
                          <select
                            onChange={(e) => {
                              const selected = catalogItems.find((c) => c.id === e.target.value);
                              if (selected) {
                                const updated = [...items];
                                updated[idx] = {
                                  ...updated[idx],
                                  description: selected.label.replace(/^\[(Product|Service)\]\s*/, ""),
                                  unitPrice: selected.price,
                                  productId: selected.type === "PRODUCT" ? selected.id : undefined,
                                  serviceId: selected.type === "SERVICE" ? selected.id : undefined,
                                };
                                setItems(updated);
                              }
                            }}
                            className="w-48 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">Catalog Item...</option>
                            {catalogItems.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.label} (${cat.price})
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          placeholder="Item description"
                          required
                          value={it.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white text-center focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Rate"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                          className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white text-right focus:border-indigo-500 focus:outline-none"
                        />
                        <span className="text-xs font-semibold text-white w-20 text-right">
                          ${((it.quantity || 0) * (it.unitPrice || 0)).toLocaleString()}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-zinc-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Calculation */}
              <div className="rounded-lg bg-zinc-800/50 p-3 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-medium text-white">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1">
                    Tax (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-14 rounded bg-zinc-700 px-1 py-0.5 text-xs text-white text-right focus:outline-none"
                    />
                  </span>
                  <span className="font-medium text-white">+₹{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1">
                    Discount (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountRate}
                      onChange={(e) => setDiscountRate(e.target.value)}
                      className="w-14 rounded bg-zinc-700 px-1 py-0.5 text-xs text-white text-right focus:outline-none"
                    />
                  </span>
                  <span className="font-medium text-white">-₹{discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-700 text-sm font-bold text-white">
                  <span>Grand Total</span>
                  <span className="text-emerald-400">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">Payment Terms</label>
                <input
                  type="text"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Create Draft Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
