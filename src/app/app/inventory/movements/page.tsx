"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  ArrowLeftRight,
  Plus,
  RefreshCw,
  X,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
} from "lucide-react";

interface MovementItem {
  id: string;
  movementNumber: string;
  productId: string;
  product: { id: string; sku: string; name: string; unitOfMeasure: string };
  type: string;
  quantity: number;
  sourceWarehouse: { id: string; code: string; name: string } | null;
  destinationWarehouse: { id: string; code: string; name: string } | null;
  reason: string;
  previousBalance: number;
  newBalance: number;
  performedBy: { id: string; firstName: string; lastName: string } | null;
  notes: string | null;
  createdAt: string;
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modal (Transfer vs In/Out)
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showInOutModal, setShowInOutModal] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string; sku: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Transfer state
  const [transferData, setTransferData] = useState({
    productId: "",
    sourceWarehouseId: "",
    destinationWarehouseId: "",
    quantity: "",
    reason: "",
    notes: "",
  });

  // In/Out state
  const [inOutData, setInOutData] = useState({
    type: "STOCK_IN",
    productId: "",
    warehouseId: "",
    quantity: "",
    reason: "",
    notes: "",
  });

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);

      const res = await fetch(`/api/inventory/movements?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load movements");
      setMovements(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load movements");
    } finally {
      setLoading(false);
    }
  };

  const loadAuxData = async () => {
    try {
      const [prodRes, whRes] = await Promise.all([
        fetch("/api/inventory/products"),
        fetch("/api/inventory/warehouses"),
      ]);
      const prodJson = await prodRes.json();
      const whJson = await whRes.json();
      if (prodJson.data) setProducts(prodJson.data);
      if (whJson.data) setWarehouses(whJson.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMovements();
    loadAuxData();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        productId: transferData.productId,
        sourceWarehouseId: transferData.sourceWarehouseId,
        destinationWarehouseId: transferData.destinationWarehouseId,
        quantity: parseFloat(transferData.quantity),
        reason: transferData.reason.trim(),
        notes: transferData.notes.trim() || undefined,
      };

      const res = await fetch("/api/inventory/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to execute transfer");

      setShowTransferModal(false);
      setTransferData({
        productId: "",
        sourceWarehouseId: "",
        destinationWarehouseId: "",
        quantity: "",
        reason: "",
        notes: "",
      });
      fetchMovements();
    } catch (err: any) {
      setModalError(err.message || "Failed to execute transfer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        type: inOutData.type,
        productId: inOutData.productId,
        warehouseId: inOutData.warehouseId,
        quantity: parseFloat(inOutData.quantity),
        reason: inOutData.reason.trim(),
        notes: inOutData.notes.trim() || undefined,
      };

      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to execute movement");

      setShowInOutModal(false);
      setInOutData({
        type: "STOCK_IN",
        productId: "",
        warehouseId: "",
        quantity: "",
        reason: "",
        notes: "",
      });
      fetchMovements();
    } catch (err: any) {
      setModalError(err.message || "Failed to execute movement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movements & Transfers"
        description="Traceable, double-entry audit ledger of every inventory receipt, shipment, and inter-warehouse transfer."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchMovements}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setShowInOutModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Stock In / Out
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Transfer Stock
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

      {/* Movement Type Filter */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs">
        <span className="text-zinc-400 font-medium">Filter Movement Types:</span>
        <div className="flex items-center gap-2">
          {["ALL", "STOCK_IN", "STOCK_OUT", "TRANSFER", "ADJUSTMENT"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t);
                setTimeout(fetchMovements, 0);
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                typeFilter === t
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-400 hover:bg-zinc-800 border border-transparent"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Movements Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading stock movements ledger...</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowLeftRight className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <h3 className="text-sm font-medium text-zinc-300">No stock movements recorded</h3>
            <p className="text-xs text-zinc-500 mt-1">Execute stock intake or transfer to record movements</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">Movement #</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Product (SKU)</th>
                  <th className="py-3 px-4 font-medium text-right">Quantity</th>
                  <th className="py-3 px-4 font-medium">Facility / Route</th>
                  <th className="py-3 px-4 font-medium">Reason</th>
                  <th className="py-3 px-4 font-medium text-right">Pre / Post Balance</th>
                  <th className="py-3 px-4 font-medium">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-200">{m.movementNumber}</td>
                    <td className="py-3 px-4 text-zinc-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      {m.type === "STOCK_IN" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <ArrowDownLeft className="h-3 w-3" /> STOCK IN
                        </span>
                      ) : m.type === "STOCK_OUT" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <ArrowUpRight className="h-3 w-3" /> STOCK OUT
                        </span>
                      ) : m.type === "TRANSFER" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          <ArrowLeftRight className="h-3 w-3" /> TRANSFER
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <Sliders className="h-3 w-3" /> {m.type}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/app/inventory/products/${m.product.id}`}
                        className="font-mono font-medium text-blue-400 hover:underline"
                      >
                        {m.product.sku}
                      </Link>
                      <div className="text-[11px] text-zinc-400 truncate max-w-xs">{m.product.name}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-100">
                      {m.quantity} {m.product.unitOfMeasure}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {m.type === "TRANSFER"
                        ? `${m.sourceWarehouse?.code || "?"} → ${m.destinationWarehouse?.code || "?"}`
                        : m.destinationWarehouse?.name || m.sourceWarehouse?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{m.reason}</td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-300">
                      <span className="text-zinc-500">{m.previousBalance}</span> →{" "}
                      <span className="font-semibold text-zinc-200">{m.newBalance}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {m.performedBy ? `${m.performedBy.firstName} ${m.performedBy.lastName}` : "System"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Transfer Modal (Transactional) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Transfer Stock Between Facilities</h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Product SKU *</label>
                <select
                  required
                  value={transferData.productId}
                  onChange={(e) => setTransferData({ ...transferData, productId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Product to Move</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Source Facility *</label>
                  <select
                    required
                    value={transferData.sourceWarehouseId}
                    onChange={(e) => setTransferData({ ...transferData, sourceWarehouseId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">From Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Destination Facility *</label>
                  <select
                    required
                    value={transferData.destinationWarehouseId}
                    onChange={(e) => setTransferData({ ...transferData, destinationWarehouseId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">To Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Quantity to Transfer *</label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 10"
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Transfer Justification / Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stock rebalancing for West Coast delivery"
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Transferring..." : "Execute Atomic Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In / Out Modal */}
      {showInOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Direct Stock Inward / Outward</h3>
              </div>
              <button onClick={() => setShowInOutModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInOut} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Direction *</label>
                <select
                  value={inOutData.type}
                  onChange={(e) => setInOutData({ ...inOutData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="STOCK_IN">STOCK IN (Receiving Inventory)</option>
                  <option value="STOCK_OUT">STOCK OUT (Issuing Inventory)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Product SKU *</label>
                <select
                  required
                  value={inOutData.productId}
                  onChange={(e) => setInOutData({ ...inOutData, productId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Warehouse Facility *</label>
                <select
                  required
                  value={inOutData.warehouseId}
                  onChange={(e) => setInOutData({ ...inOutData, warehouseId: e.target.value })}
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
                <label className="block text-zinc-300 font-medium mb-1">Quantity *</label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 50"
                  value={inOutData.quantity}
                  onChange={(e) => setInOutData({ ...inOutData, quantity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Reason / Notes *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO Receipt or Engineering Demo loan"
                  value={inOutData.reason}
                  onChange={(e) => setInOutData({ ...inOutData, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowInOutModal(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Record Movement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
