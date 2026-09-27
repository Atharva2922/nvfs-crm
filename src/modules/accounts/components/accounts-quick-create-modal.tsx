"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  FileText,
  Receipt,
  CreditCard,
  BookOpenCheck,
  ArrowRightLeft,
  Users,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickCreateModalProps {
  open: boolean;
  type: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AccountsQuickCreateModal({
  open,
  type,
  onClose,
  onSuccess,
}: QuickCreateModalProps) {
  const [activeTab, setActiveTab] = useState(type || "INVOICE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reference lists
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [glAccounts, setGlAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (type) setActiveTab(type);
  }, [type]);

  // Load auxiliary lists on open
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccessMsg(null);

    Promise.all([
      fetch("/api/accounts/customers").then((r) => r.json()),
      fetch("/api/accounts/vendors").then((r) => r.json()),
      fetch("/api/accounts/banking").then((r) => r.json()),
      fetch("/api/accounts/invoices").then((r) => r.json()),
      fetch("/api/accounts/chart-of-accounts").then((r) => r.json()),
    ])
      .then(([cRes, vRes, bRes, iRes, glRes]) => {
        if (cRes.success) setCustomers(cRes.data || []);
        if (vRes.success) setVendors(vRes.data || []);
        if (bRes.success) setBankAccounts(bRes.data || []);
        if (iRes.success) setInvoices(iRes.data || []);
        if (glRes.success) setGlAccounts(glRes.data || []);
      })
      .catch((err) => console.error("Error loading auxiliary data:", err));
  }, [open]);

  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
    items: [{ description: "Enterprise Services", quantity: 1, unitPrice: 50000, taxRate: 18 }],
    notes: "Thank you for your business. Please remit payment within terms.",
    terms: "Net 30 days. Late payments subject to interest.",
  });

  const [billForm, setBillForm] = useState({
    vendorId: "",
    billDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
    items: [{ description: "Vendor Supplies & Services", quantity: 1, unitPrice: 25000, taxRate: 18 }],
    notes: "Vendor procurement bill",
  });

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "",
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "BANK_TRANSFER",
    reference: "",
    bankAccountId: "",
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    category: "OFFICE_RENT",
    amount: 15000,
    date: new Date().toISOString().split("T")[0],
    description: "Monthly Office Workspace",
    paymentMethod: "BANK_TRANSFER",
  });

  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split("T")[0],
    reference: "",
    notes: "End-of-period manual accounting adjustment",
    lines: [
      { accountId: "", type: "DEBIT" as "DEBIT" | "CREDIT", amount: 10000, description: "Debit line" },
      { accountId: "", type: "CREDIT" as "DEBIT" | "CREDIT", amount: 10000, description: "Credit line" },
    ],
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: 50000,
    date: new Date().toISOString().split("T")[0],
    reference: "",
    notes: "Internal liquidity balancing",
  });

  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Mumbai",
    state: "Maharashtra",
    taxId: "",
  });

  const [vendorForm, setVendorForm] = useState({
    displayName: "",
    legalName: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    paymentTerms: "NET_30",
  });

  if (!open) return null;

  // Handlers
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.clientId) {
      setError("Please select a customer");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to create invoice");
      setSuccessMsg(`Invoice created successfully: ${json.data?.invoiceNumber}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billForm.vendorId) {
      setError("Please select a vendor");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to create bill");
      setSuccessMsg(`Vendor bill created successfully: ${json.data?.invoiceNumber}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.invoiceId) {
      setError("Please select an invoice or bill to settle");
      return;
    }
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to record payment");
      setSuccessMsg(`Payment recorded and ledger updated! Ref: ${json.data?.paymentReference}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    const debitSum = journalForm.lines
      .filter((l) => l.type === "DEBIT")
      .reduce((s, l) => s + (Number(l.amount) || 0), 0);
    const creditSum = journalForm.lines
      .filter((l) => l.type === "CREDIT")
      .reduce((s, l) => s + (Number(l.amount) || 0), 0);

    if (Math.abs(debitSum - creditSum) > 0.01) {
      setError(`Unbalanced entry: Total Debit (₹${debitSum}) must equal Total Credit (₹${creditSum})`);
      return;
    }
    if (journalForm.lines.some((l) => !l.accountId)) {
      setError("Please select an account for each journal line");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(journalForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to post journal");
      setSuccessMsg(`Double-entry Journal Posted: ${json.data?.entryNumber}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.fromAccountId || !transferForm.toAccountId) {
      setError("Select both source and destination accounts");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts/banking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TRANSFER", ...transferForm }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Transfer failed");
      setSuccessMsg("Bank transfer completed and ledger posted!");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name) {
      setError("Customer name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to create customer");
      setSuccessMsg(`Customer profile created: ${json.data?.name}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.displayName) {
      setError("Vendor display name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to create vendor");
      setSuccessMsg(`Vendor profile created: ${json.data?.displayName}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Plus className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Accounts Quick Create</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex overflow-x-auto px-6 pt-3 pb-1 border-b border-slate-200 dark:border-slate-800 gap-1.5 bg-slate-50 dark:bg-slate-900/50">
          {[
            { id: "INVOICE", label: "Invoice", icon: FileText },
            { id: "BILL", label: "Bill", icon: Receipt },
            { id: "PAYMENT", label: "Payment", icon: CreditCard },
            { id: "JOURNAL", label: "Journal", icon: BookOpenCheck },
            { id: "TRANSFER", label: "Transfer", icon: ArrowRightLeft },
            { id: "CUSTOMER", label: "Customer", icon: Users },
            { id: "VENDOR", label: "Vendor", icon: Briefcase },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: INVOICE */}
          {activeTab === "INVOICE" && (
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer *
                  </label>
                  <select
                    value={invoiceForm.clientId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">Select Customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.invoiceDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Line Items (Auto-calculated GST)
                </label>
                <div className="space-y-2">
                  {invoiceForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <input
                        type="text"
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => {
                          const next = [...invoiceForm.items];
                          next[idx].description = e.target.value;
                          setInvoiceForm({ ...invoiceForm, items: next });
                        }}
                        className="flex-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const next = [...invoiceForm.items];
                          next[idx].quantity = Number(e.target.value);
                          setInvoiceForm({ ...invoiceForm, items: next });
                        }}
                        className="w-16 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white text-right"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const next = [...invoiceForm.items];
                          next[idx].unitPrice = Number(e.target.value);
                          setInvoiceForm({ ...invoiceForm, items: next });
                        }}
                        className="w-24 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white text-right"
                      />
                      <select
                        value={item.taxRate}
                        onChange={(e) => {
                          const next = [...invoiceForm.items];
                          next[idx].taxRate = Number(e.target.value);
                          setInvoiceForm({ ...invoiceForm, items: next });
                        }}
                        className="w-24 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white"
                      >
                        <option value={18}>GST 18%</option>
                        <option value={12}>GST 12%</option>
                        <option value={5}>GST 5%</option>
                        <option value={0}>GST 0%</option>
                      </select>
                      <span className="w-24 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        ₹{(item.quantity * item.unitPrice * (1 + item.taxRate / 100)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-md transition-colors"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Invoice & Post Ledger
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: BILL */}
          {activeTab === "BILL" && (
            <form onSubmit={handleCreateBill} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor *
                  </label>
                  <select
                    value={billForm.vendorId}
                    onChange={(e) => setBillForm({ ...billForm, vendorId: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.displayName} ({v.vendorCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bill Date
                  </label>
                  <input
                    type="date"
                    value={billForm.billDate}
                    onChange={(e) => setBillForm({ ...billForm, billDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={billForm.dueDate}
                    onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Line Items
                </label>
                {billForm.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => {
                        const next = [...billForm.items];
                        next[idx].description = e.target.value;
                        setBillForm({ ...billForm, items: next });
                      }}
                      className="flex-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const next = [...billForm.items];
                        next[idx].unitPrice = Number(e.target.value);
                        setBillForm({ ...billForm, items: next });
                      }}
                      className="w-28 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white text-right"
                    />
                    <select
                      value={item.taxRate}
                      onChange={(e) => {
                        const next = [...billForm.items];
                        next[idx].taxRate = Number(e.target.value);
                        setBillForm({ ...billForm, items: next });
                      }}
                      className="w-24 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white"
                    >
                      <option value={18}>GST 18%</option>
                      <option value={12}>GST 12%</option>
                      <option value={5}>GST 5%</option>
                      <option value={0}>GST 0%</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-md transition-colors"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Record Vendor Bill
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: RECORD PAYMENT */}
          {activeTab === "PAYMENT" && (
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Invoice / Bill *
                  </label>
                  <select
                    value={paymentForm.invoiceId}
                    onChange={(e) => {
                      const inv = invoices.find((i) => i.id === e.target.value);
                      setPaymentForm({
                        ...paymentForm,
                        invoiceId: e.target.value,
                        amount: inv?.balance || inv?.total || 0,
                      });
                    }}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">Select Invoice / Bill to settle...</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} • {inv.client?.name || inv.vendor?.displayName} • Balance: ₹
                        {inv.balance?.toLocaleString("en-IN")} ({inv.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Received/Paid (₹) *
                  </label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT / IMPS</option>
                    <option value="UPI">UPI / Instant Pay</option>
                    <option value="CREDIT_CARD">Corporate Card</option>
                    <option value="CHECK">Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deposit to Bank Account
                  </label>
                  <select
                    value={paymentForm.bankAccountId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bankAccountId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">Default Operating Account</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountName} (₹{b.currentBalance.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Reference
                  </label>
                  <input
                    type="text"
                    placeholder="UTR / Check # / Ref"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-md transition-colors"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Record Payment & Update Balances
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: JOURNAL ENTRY */}
          {activeTab === "JOURNAL" && (
            <form onSubmit={handleCreateJournal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Journal Date
                  </label>
                  <input
                    type="date"
                    value={journalForm.date}
                    onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reference / Voucher #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ADJ-001"
                    value={journalForm.reference}
                    onChange={(e) => setJournalForm({ ...journalForm, reference: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Journal Lines */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Double-Entry Lines (Total Debit must equal Total Credit)
                </label>
                <div className="space-y-2">
                  {journalForm.lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <select
                        value={line.accountId}
                        onChange={(e) => {
                          const next = [...journalForm.lines];
                          next[idx].accountId = e.target.value;
                          setJournalForm({ ...journalForm, lines: next });
                        }}
                        required
                        className="flex-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="">Select Ledger Account...</option>
                        {glAccounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                      <select
                        value={line.type}
                        onChange={(e) => {
                          const next = [...journalForm.lines];
                          next[idx].type = e.target.value as any;
                          setJournalForm({ ...journalForm, lines: next });
                        }}
                        className="w-24 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="DEBIT">Debit</option>
                        <option value="CREDIT">Credit</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Amount"
                        value={line.amount}
                        onChange={(e) => {
                          const next = [...journalForm.lines];
                          next[idx].amount = Number(e.target.value);
                          setJournalForm({ ...journalForm, lines: next });
                        }}
                        className="w-28 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white text-right font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-md transition-colors"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Validate & Post Journal Entry
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: BANK TRANSFER */}
          {activeTab === "TRANSFER" && (
            <form onSubmit={handleBankTransfer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transfer From Account *
                  </label>
                  <select
                    value={transferForm.fromAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">Select source account...</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountName} (₹{b.currentBalance.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transfer To Account *
                  </label>
                  <select
                    value={transferForm.toAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">Select destination account...</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountName} (₹{b.currentBalance.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transfer Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: Number(e.target.value) })}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="TRF-001"
                    value={transferForm.reference}
                    onChange={(e) => setTransferForm({ ...transferForm, reference: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-md transition-colors"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Execute Transfer
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: CUSTOMER */}
          {activeTab === "CUSTOMER" && (
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Acme Enterprises Pvt Ltd"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="accounts@acme.com"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN / Tax Registration
                  </label>
                  <input
                    type="text"
                    placeholder="27ABCDE1234F1Z5"
                    value={customerForm.taxId}
                    onChange={(e) => setCustomerForm({ ...customerForm, taxId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-md transition-colors"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Customer Profile
                </button>
              </div>
            </form>
          )}

          {/* TAB 7: VENDOR */}
          {activeTab === "VENDOR" && (
            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Global Cloud Services Ltd"
                    value={vendorForm.displayName}
                    onChange={(e) => setVendorForm({ ...vendorForm, displayName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="27AABCT3518Q1ZG"
                    value={vendorForm.taxId}
                    onChange={(e) => setVendorForm({ ...vendorForm, taxId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={vendorForm.paymentTerms}
                    onChange={(e) => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="NET_15">Net 15 Days</option>
                    <option value="NET_30">Net 30 Days</option>
                    <option value="NET_60">Net 60 Days</option>
                    <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-md transition-colors"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Vendor Profile
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
