"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  PackageCheck,
  XCircle,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  X,
  Truck,
  IndianRupee,
} from "lucide-react";

interface POItem {
  id: string;
  poNumber: string;
  vendor: { id: string; vendorCode: string; displayName: string };
  createdBy: { id: string; firstName: string; lastName: string };
  approvedBy?: { id: string; firstName: string; lastName: string };
  poDate: string;
  expectedDeliveryDate: string;
  currency: string;
  total: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CLOSED" | "CANCELLED";
  _count: { items: number; goodsReceipts: number };
}

function PurchaseOrdersContent() {
  const searchParams = useSearchParams();
  const initialNew = searchParams.get("new") === "true";
  const initialVendorId = searchParams.get("vendorId") || "";

  const [orders, setOrders] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal
  const [showModal, setShowModal] = useState(initialNew);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vendorId: initialVendorId,
    expectedDeliveryDate: "",
    currency: "INR",
    paymentTerms: "NET_30",
    shippingAddress: "",
    billingAddress: "",
    discountRate: 0,
    taxRate: 10,
    notes: "",
    terms: "Payment strictly as per agreed payment terms.",
    items: [{ productId: "", description: "", quantity: 1, unitCost: "", discount: 0, tax: 0 }],
  });

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/inventory/purchase-orders?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load purchase orders");
      setOrders(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const loadDependencies = async () => {
    try {
      const [vRes, pRes] = await Promise.all([
        fetch("/api/inventory/vendors?status=ACTIVE"),
        fetch("/api/inventory/products"),
      ]);
      const [vJson, pJson] = await vRes.json();
      if (vRes.ok) setVendors(vJson.data || []);
      if (pRes.ok) setProducts(pJson.data || []);

      const nextWeek = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, expectedDeliveryDate: nextWeek }));
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = () => {
    loadDependencies();
    setShowModal(true);
  };

  const handleAddItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { productId: "", description: "", quantity: 1, unitCost: "", discount: 0, tax: 0 },
      ],
    });
  };

  const handleRemoveItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, idx) => idx !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formData.items];
    (updated[index] as any)[field] = value;

    if (field === "productId") {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        updated[index].description = prod.name;
        if (!updated[index].unitCost && prod.costPrice > 0) {
          updated[index].unitCost = String(prod.costPrice);
        }
      }
    }

    setFormData({ ...formData, items: updated });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        ...formData,
        items: formData.items.map((i) => ({
          productId: i.productId,
          description: i.description,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
          discount: Number(i.discount || 0),
          tax: Number(i.tax || 0),
        })),
      };

      const res = await fetch("/api/inventory/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create Purchase Order");

      setShowModal(false);
      fetchOrders();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Purchase Orders"
        description="Formal procurement orders, vendor delivery commitments, and receiving progress."
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Purchase Order
          </button>
        }
      />

      <InventoryNav />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/40 border border-zinc-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PO #, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchOrders()}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="SENT">Sent to Vendor</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Received (Complete)</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchOrders}
            title="Refresh"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg ml-auto sm:ml-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading purchase orders...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-400" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-zinc-600 mb-1" />
            <p className="text-sm font-medium text-zinc-300">No purchase orders found</p>
            <p className="text-xs text-zinc-500">Generate a PO directly or convert an approved Purchase Request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">PO Date</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4 text-center">Receipts</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {orders.map((po) => (
                  <tr key={po.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                      <Link href={`/app/inventory/purchase-orders/${po.id}`} className="hover:underline">
                        {po.poNumber}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-200">{po.vendor.displayName}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{po.vendor.vendorCode}</div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-300">
                      {new Date(po.poDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-300">
                      {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-zinc-100">
                      {po.total !== null ? `${po.currency || "$"} ${po.total.toFixed(2)}` : "Restricted"}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-[11px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                        {po._count.goodsReceipts} GRs
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          po.status === "RECEIVED"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : po.status === "PARTIALLY_RECEIVED"
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                            : po.status === "SENT"
                            ? "bg-blue-950 text-blue-300 border border-blue-800"
                            : po.status === "APPROVED"
                            ? "bg-purple-950 text-purple-300 border border-purple-800"
                            : po.status === "PENDING_APPROVAL"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : po.status === "CANCELLED"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/app/inventory/purchase-orders/${po.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition"
                      >
                        Document
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create PO Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                Issue Purchase Order
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Vendor *</label>
                  <select
                    required
                    value={formData.vendorId}
                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.displayName} ({v.vendorCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Expected Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="NET_15">Net 15</option>
                    <option value="NET_30">Net 30</option>
                    <option value="NET_60">Net 60</option>
                    <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                    <option value="ADVANCE">Advance</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-zinc-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-300 uppercase">Purchase Order Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                        className="w-full sm:w-56 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Description / Specs"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        className="flex-1 min-w-[120px] bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200"
                      />

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200"
                        />
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Unit Cost"
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(idx, "unitCost", e.target.value)}
                          className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200"
                        />
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1 text-zinc-500 hover:text-rose-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Discount */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-zinc-800 pt-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Discount Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountRate}
                    onChange={(e) => setFormData({ ...formData, discountRate: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
                >
                  {submitting ? "Generating..." : "Issue Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm">Loading Purchase Orders...</p>
        </div>
      }
    >
      <PurchaseOrdersContent />
    </React.Suspense>
  );
}
