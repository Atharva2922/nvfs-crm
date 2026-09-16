"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  Sliders,
  Plus,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
} from "lucide-react";

interface AdjustmentItem {
  id: string;
  adjustmentNumber: string;
  warehouse: { id: string; code: string; name: string };
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  reason: string;
  notes: string | null;
  requestedBy: { id: string; firstName: string; lastName: string };
  approvedBy: { id: string; firstName: string; lastName: string } | null;
  rejectionReason: string | null;
  items: Array<{
    id: string;
    product: { sku: string; name: string; unitOfMeasure: string };
    systemQuantity: number;
    countedQuantity: number;
    adjustmentQuantity: number;
    unitCost: number;
  }>;
  createdAt: string;
}

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<AdjustmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; sku: string; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [reason, setReason] = useState<any>("PHYSICAL_COUNT_DISCREPANCY");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<Array<{ productId: string; countedQuantity: string }>>([
    { productId: "", countedQuantity: "" },
  ]);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/inventory/adjustments?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load adjustments");
      setAdjustments(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load adjustments");
    } finally {
      setLoading(false);
    }
  };

  const loadAuxData = async () => {
    try {
      const [whRes, prodRes] = await Promise.all([
        fetch("/api/inventory/warehouses"),
        fetch("/api/inventory/products"),
      ]);
      const whJson = await whRes.json();
      const prodJson = await prodRes.json();
      if (whJson.data) setWarehouses(whJson.data);
      if (prodJson.data) setProducts(prodJson.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdjustments();
    loadAuxData();
  }, []);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { productId: "", countedQuantity: "" }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, val: string) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = val;
    setLineItems(updated);
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const validItems = lineItems
        .filter((it) => it.productId && it.countedQuantity !== "")
        .map((it) => ({
          productId: it.productId,
          countedQuantity: parseFloat(it.countedQuantity),
        }));

      if (validItems.length === 0) {
        throw new Error("Please specify at least one product with a counted quantity");
      }

      const payload = {
        warehouseId: selectedWarehouse,
        reason,
        notes: notes.trim() || undefined,
        items: validItems,
        autoSubmit: true,
      };

      const res = await fetch("/api/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create adjustment");

      setShowModal(false);
      setSelectedWarehouse("");
      setNotes("");
      setLineItems([{ productId: "", countedQuantity: "" }]);
      fetchAdjustments();
    } catch (err: any) {
      setModalError(err.message || "Failed to create adjustment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (id: string, action: "submit" | "approve" | "reject") => {
    try {
      let reasonPrompt = "";
      if (action === "reject") {
        const input = window.prompt("Enter rejection reason:");
        if (!input) return;
        reasonPrompt = input;
      }

      const res = await fetch(`/api/inventory/adjustments/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reasonPrompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || `Failed to ${action} adjustment`);

      fetchAdjustments();
    } catch (err: any) {
      alert(err.message || "Action failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Count Adjustments"
        description="Formal review and approval workflow for reconciling physical counts, damaged stock, and discrepancy write-offs."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchAdjustments}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" />
              New Adjustment
            </button>
          </div>
        }
      />

      <InventoryNav />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs">
        <span className="text-zinc-400 font-medium">Filter by Status:</span>
        <div className="flex items-center gap-2">
          {["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED", "DRAFT"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setTimeout(fetchAdjustments, 0);
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                statusFilter === s
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-zinc-400 hover:bg-zinc-800 border border-transparent"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading adjustments workflow...</div>
        ) : adjustments.length === 0 ? (
          <div className="p-12 text-center">
            <Sliders className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <h3 className="text-sm font-medium text-zinc-300">No inventory adjustments found</h3>
            <p className="text-xs text-zinc-500 mt-1">Submit count variance reconciliation requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">Adjustment #</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Warehouse</th>
                  <th className="py-3 px-4 font-medium">Reason</th>
                  <th className="py-3 px-4 font-medium">Items Count</th>
                  <th className="py-3 px-4 font-medium">Requested By</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-200">
                      {adj.adjustmentNumber}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{new Date(adj.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-medium text-zinc-300">
                      <span className="font-mono text-blue-400 mr-1.5">{adj.warehouse.code}</span>
                      {adj.warehouse.name}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{adj.reason.replace(/_/g, " ")}</td>
                    <td className="py-3 px-4 text-zinc-400">
                      {adj.items.length} product line{adj.items.length > 1 ? "s" : ""}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {adj.requestedBy.firstName} {adj.requestedBy.lastName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {adj.status === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> APPROVED
                        </span>
                      ) : adj.status === "PENDING_APPROVAL" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Clock className="h-3 w-3" /> PENDING
                        </span>
                      ) : adj.status === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <XCircle className="h-3 w-3" /> REJECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          DRAFT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {adj.status === "PENDING_APPROVAL" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTransition(adj.id, "approve")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 font-medium"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleTransition(adj.id, "reject")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 font-medium"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      )}
                      {adj.status === "APPROVED" && adj.approvedBy && (
                        <span className="text-[11px] text-zinc-500">
                          Approved by {adj.approvedBy.firstName}
                        </span>
                      )}
                      {adj.status === "REJECTED" && (
                        <span className="text-[11px] text-rose-400 truncate max-w-xs block">
                          {adj.rejectionReason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Create Physical Count Adjustment</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Facility Warehouse *</label>
                  <select
                    required
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Adjustment Reason *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="PHYSICAL_COUNT_DISCREPANCY">Physical Count Discrepancy</option>
                    <option value="DAMAGED_GOODS">Damaged Goods / Write-Off</option>
                    <option value="LOST_GOODS">Lost or Missing Stock</option>
                    <option value="EXPIRATION">Expired Goods</option>
                    <option value="CORRECTION">Administrative Entry Correction</option>
                    <option value="OTHER">Other Discrepancy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Notes / Audit Justification</label>
                <input
                  type="text"
                  placeholder="Audit justification for financial reconciliation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Physical Stock Count Items</span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Product
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => handleLineChange(index, "productId", e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Product SKU</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} - {p.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="1"
                        required
                        placeholder="Counted Stock"
                        value={item.countedQuantity}
                        onChange={(e) => handleLineChange(index, "countedQuantity", e.target.value)}
                        className="w-36 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                      />

                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(index)}
                          className="p-1.5 text-zinc-400 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
