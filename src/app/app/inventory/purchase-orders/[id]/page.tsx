"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  PackageCheck,
  Building2,
  Clock,
  Printer,
  Receipt,
  Truck,
  Plus,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id as string;

  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Goods Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [receiptData, setReceiptData] = useState({
    warehouseId: "",
    notes: "",
    items: [] as Array<{
      purchaseOrderItemId: string;
      productName: string;
      sku: string;
      ordered: number;
      alreadyReceived: number;
      remaining: number;
      receivedQuantity: number;
      rejectedQuantity: number;
      rejectionReason: string;
    }>,
  });

  const fetchPo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inventory/purchase-orders/${poId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load PO");
      setPo(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (poId) fetchPo();
  }, [poId]);

  const handleTransition = async (transition: string, reason?: string) => {
    if (!confirm(`Are you sure you want to perform action: ${transition}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inventory/purchase-orders/${poId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transition, reasonOrNotes: reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Status transition failed");
      fetchPo();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openReceiptModal = async () => {
    try {
      const wRes = await fetch("/api/inventory/warehouses");
      const wJson = await wRes.json();
      if (wRes.ok) setWarehouses(wJson.data || []);

      const items = po.items.map((item: any) => {
        const remaining = Math.max(0, item.quantity - item.receivedQuantity);
        return {
          purchaseOrderItemId: item.id,
          productName: item.product.name,
          sku: item.product.sku,
          ordered: item.quantity,
          alreadyReceived: item.receivedQuantity,
          remaining,
          receivedQuantity: remaining,
          rejectedQuantity: 0,
          rejectionReason: "",
        };
      });

      setReceiptData({
        warehouseId: warehouses[0]?.id || "",
        notes: "",
        items,
      });
      setShowReceiptModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReceiptChange = (index: number, field: string, value: any) => {
    const updated = [...receiptData.items];
    (updated[index] as any)[field] = value;
    setReceiptData({ ...receiptData, items: updated });
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptData.warehouseId) {
      alert("Please select destination warehouse");
      return;
    }

    const validItems = receiptData.items
      .filter((i) => Number(i.receivedQuantity) > 0)
      .map((i) => ({
        purchaseOrderItemId: i.purchaseOrderItemId,
        receivedQuantity: Number(i.receivedQuantity),
        rejectedQuantity: Number(i.rejectedQuantity || 0),
        rejectionReason: i.rejectionReason,
      }));

    if (validItems.length === 0) {
      alert("Must specify at least one received item with quantity > 0");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/inventory/goods-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseOrderId: po.id,
          warehouseId: receiptData.warehouseId,
          notes: receiptData.notes,
          items: validItems,
          finalizeImmediately: true, // Atomically updates stock & ledger
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to process goods receipt");

      setShowReceiptModal(false);
      fetchPo();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm">Loading Purchase Order...</p>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="py-20 text-center text-rose-400 flex flex-col items-center gap-3">
        <AlertCircle className="h-8 w-8 text-rose-400" />
        <p className="text-sm font-medium">{error || "Purchase order not found"}</p>
        <Link href="/app/inventory/purchase-orders" className="text-xs text-zinc-400 underline">
          Return to Purchase Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/app/inventory/purchase-orders" className="hover:text-zinc-200 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          Purchase Orders
        </Link>
        <span>/</span>
        <span className="text-zinc-200 font-mono font-medium">{po.poNumber}</span>
      </div>

      <PageHeader
        title={`Purchase Order ${po.poNumber}`}
        description={`Issued to ${po.vendor.displayName} on ${new Date(po.poDate).toLocaleDateString()}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Action Bar based on Status */}
            {po.status === "DRAFT" && (
              <button
                onClick={() => handleTransition("SUBMIT")}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
              >
                Submit for Approval
              </button>
            )}

            {po.status === "PENDING_APPROVAL" && (
              <>
                <button
                  onClick={() => handleTransition("APPROVE")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  Approve PO
                </button>
                <button
                  onClick={() => handleTransition("REJECT", prompt("Reason for rejection:") || undefined)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-700/50"
                >
                  Reject PO
                </button>
              </>
            )}

            {po.status === "APPROVED" && (
              <button
                onClick={() => handleTransition("SEND")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
                Send to Vendor
              </button>
            )}

            {["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(po.status) && (
              <button
                onClick={openReceiptModal}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Record Goods Receipt
              </button>
            )}

            {["RECEIVED", "PARTIALLY_RECEIVED"].includes(po.status) && (
              <button
                onClick={() => handleTransition("CLOSE")}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
              >
                Close PO
              </button>
            )}

            {!["RECEIVED", "CLOSED", "CANCELLED"].includes(po.status) && (
              <button
                onClick={() => handleTransition("CANCEL", prompt("Reason for cancellation:") || undefined)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-rose-950 text-rose-400 border border-zinc-800"
              >
                Cancel PO
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              title="Print Document"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <InventoryNav />

      {/* Formal Purchase Order Business Document Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl space-y-8 print:p-0 print:border-none">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-zinc-800/80 pb-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
              PURCHASE ORDER
            </span>
            <h1 className="text-2xl font-mono font-bold text-zinc-100">{po.poNumber}</h1>
            <div className="flex items-center gap-2 pt-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
              {po.purchaseRequest && (
                <span className="text-xs text-zinc-500 font-mono">
                  Ref PR: {po.purchaseRequest.requestNumber}
                </span>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs text-zinc-400">
            <div>
              <span className="text-zinc-500">Order Date:</span>{" "}
              <span className="text-zinc-200 font-medium">
                {new Date(po.poDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Expected Delivery:</span>{" "}
              <span className="text-zinc-200 font-medium">
                {new Date(po.expectedDeliveryDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Payment Terms:</span>{" "}
              <span className="text-zinc-200 font-medium">{po.paymentTerms}</span>
            </div>
            <div>
              <span className="text-zinc-500">Currency:</span>{" "}
              <span className="text-zinc-200 font-medium font-mono">{po.currency}</span>
            </div>
          </div>
        </div>

        {/* Vendor & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-zinc-800/80 pb-6">
          <div className="space-y-1.5 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Vendor / Supplier
            </span>
            <div className="text-base font-semibold text-zinc-100">
              <Link href={`/app/inventory/vendors/${po.vendor.id}`} className="hover:text-blue-400">
                {po.vendor.displayName}
              </Link>
            </div>
            <div className="text-zinc-400">{po.vendor.legalName}</div>
            <div className="text-zinc-400">{po.vendor.email}</div>
            {po.vendor.phone && <div className="text-zinc-400">{po.vendor.phone}</div>}
            <div className="text-zinc-500 font-mono">Code: {po.vendor.vendorCode}</div>
          </div>

          <div className="space-y-1.5 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Issued By & Shipping
            </span>
            <div className="font-semibold text-zinc-200">
              Buyer: {po.createdBy.firstName} {po.createdBy.lastName}
            </div>
            {po.approvedBy && (
              <div className="text-emerald-400">
                Approved By: {po.approvedBy.firstName} {po.approvedBy.lastName}
              </div>
            )}
            <div className="text-zinc-400 pt-1">
              Shipping Address: {po.shippingAddress || "Main Distribution Hub, Warehouse A"}
            </div>
          </div>
        </div>

        {/* Line Items Table with Receiving Progress */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Order Items & Receiving Status
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item & Description</th>
                  <th className="py-3 px-4 text-center">Ordered</th>
                  <th className="py-3 px-4 text-center">Received</th>
                  <th className="py-3 px-4 text-center">Progress</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {po.items.map((line: any) => {
                  const pct = Math.min(100, Math.round((line.receivedQuantity / line.quantity) * 100));
                  return (
                    <tr key={line.id}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-100">{line.product.name}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{line.product.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-zinc-200">
                        {line.quantity} {line.product.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-emerald-400">
                        {line.receivedQuantity}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="w-24 mx-auto bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                          {pct}% fulfilled
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-200">
                        ${line.unitCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-zinc-100">
                        ${line.total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal:</span>
              <span className="text-zinc-200">₹{po.subtotal.toFixed(2)}</span>
            </div>
            {po.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({po.discountRate}%):</span>
                <span>-₹{po.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Tax ({po.taxRate}%):</span>
              <span className="text-zinc-200">₹{po.taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-zinc-800 pt-2 flex justify-between font-bold text-sm text-zinc-100">
              <span>Grand Total:</span>
              <span className="text-blue-400 font-mono">₹{po.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Goods Receipts Section */}
        {po.goodsReceipts?.length > 0 && (
          <div className="border-t border-zinc-800 pt-6 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-emerald-400" />
              Goods Receipts Recorded Against this PO
            </h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Receipt #</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Warehouse</th>
                    <th className="py-2.5 px-4">Received By</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {po.goodsReceipts.map((gr: any) => (
                    <tr key={gr.id}>
                      <td className="py-2.5 px-4 font-mono text-zinc-100">{gr.receiptNumber}</td>
                      <td className="py-2.5 px-4 text-zinc-400">
                        {new Date(gr.receivedDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-300">{gr.warehouse?.name}</td>
                      <td className="py-2.5 px-4 text-zinc-400">
                        {gr.receivedBy.firstName} {gr.receivedBy.lastName}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-emerald-400 font-medium text-[11px]">{gr.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Goods Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-emerald-500" />
                Record Goods Receipt for {po.poNumber}
              </h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReceiptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Destination Warehouse *
                </label>
                <select
                  required
                  value={receiptData.warehouseId}
                  onChange={(e) => setReceiptData({ ...receiptData, warehouseId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Table */}
              <div className="space-y-3 border-t border-zinc-800 pt-3">
                <span className="text-xs font-semibold text-zinc-300 uppercase">Received Quantities</span>
                <div className="space-y-2.5">
                  {receiptData.items.map((line, idx) => (
                    <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-zinc-100">{line.productName}</span>
                          <span className="text-zinc-500 font-mono ml-2">({line.sku})</span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Ordered: {line.ordered} • Remaining:{" "}
                          <span className="text-blue-400 font-semibold">{line.remaining}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-1">Received Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={line.remaining}
                            value={line.receivedQuantity}
                            onChange={(e) => handleReceiptChange(idx, "receivedQuantity", e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-1">Rejected / Damaged Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={line.receivedQuantity}
                            value={line.rejectedQuantity}
                            onChange={(e) => handleReceiptChange(idx, "rejectedQuantity", e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-1">Rejection Reason</label>
                          <input
                            type="text"
                            placeholder="Damaged in transit"
                            value={line.rejectionReason}
                            onChange={(e) => handleReceiptChange(idx, "rejectionReason", e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Receipt Notes</label>
                <textarea
                  rows={2}
                  placeholder="Delivery condition, packing slip #..."
                  value={receiptData.notes}
                  onChange={(e) => setReceiptData({ ...receiptData, notes: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium"
                >
                  {actionLoading ? "Finalizing Receipt..." : "Finalize & Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
