"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  PackageCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  FileSpreadsheet,
  Calendar,
  X,
  Eye,
} from "lucide-react";

interface GRItem {
  id: string;
  receiptNumber: string;
  receivedDate: string;
  status: "DRAFT" | "FINALIZED" | "CANCELLED";
  vendor: { id: string; vendorCode: string; displayName: string };
  warehouse: { id: string; code: string; name: string };
  purchaseOrder: { id: string; poNumber: string; status: string };
  receivedBy: { id: string; firstName: string; lastName: string };
  _count: { items: number };
}

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Detail Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/inventory/goods-receipts?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load receipts");
      setReceipts(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [statusFilter]);

  const viewReceiptDetails = async (id: string) => {
    setModalLoading(true);
    try {
      const res = await fetch(`/api/inventory/goods-receipts/${id}`);
      const json = await res.json();
      if (res.ok) setSelectedReceipt(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Goods Receipts"
        description="Warehouse receiving ledger, multi-stage delivery reconciliation, and inventory intake audit trail."
      />

      <InventoryNav />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/40 border border-zinc-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search receipt #, PO #, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchReceipts()}
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
            <option value="FINALIZED">Finalized (Stock Updated)</option>
            <option value="DRAFT">Draft</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchReceipts}
            title="Refresh"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg ml-auto sm:ml-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading receiving records...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-400" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        ) : receipts.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <PackageCheck className="h-8 w-8 text-zinc-600 mb-1" />
            <p className="text-sm font-medium text-zinc-300">No goods receipts recorded</p>
            <p className="text-xs text-zinc-500">
              Record receipts directly from approved Purchase Orders to increase physical inventory.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Purchase Order</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Destination Warehouse</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4">Receiver</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {receipts.map((gr) => (
                  <tr key={gr.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-100">
                      {gr.receiptNumber}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-blue-400">
                      <Link
                        href={`/app/inventory/purchase-orders/${gr.purchaseOrder.id}`}
                        className="hover:underline"
                      >
                        {gr.purchaseOrder.poNumber}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-200">{gr.vendor.displayName}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{gr.vendor.vendorCode}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-zinc-200">{gr.warehouse.name}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{gr.warehouse.code}</div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-300">
                      {new Date(gr.receivedDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-400">
                      {gr.receivedBy.firstName} {gr.receivedBy.lastName}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          gr.status === "FINALIZED"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : gr.status === "DRAFT"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-rose-950 text-rose-300 border border-rose-800"
                        }`}
                      >
                        {gr.status === "FINALIZED" && <CheckCircle2 className="h-3 w-3" />}
                        {gr.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => viewReceiptDetails(gr.id)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition"
                        title="View Receipt Breakdown"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Goods Receipt Detail Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-emerald-500" />
                <div>
                  <h3 className="text-base font-semibold text-zinc-100 font-mono">
                    {selectedReceipt.receiptNumber}
                  </h3>
                  <span className="text-[11px] text-zinc-400">
                    Received against PO {selectedReceipt.purchaseOrder?.poNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">Vendor</span>
                <span className="font-semibold text-zinc-200">
                  {selectedReceipt.vendor?.displayName}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">Warehouse</span>
                <span className="font-semibold text-zinc-200">
                  {selectedReceipt.warehouse?.name}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">Received Date</span>
                <span className="font-semibold text-zinc-200">
                  {new Date(selectedReceipt.receivedDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">Receiver</span>
                <span className="font-semibold text-zinc-200">
                  {selectedReceipt.receivedBy?.firstName} {selectedReceipt.receivedBy?.lastName}
                </span>
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Reconciled Line Items
              </h4>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3 text-center">Ordered</th>
                      <th className="py-2 px-3 text-center">Received</th>
                      <th className="py-2 px-3 text-center text-rose-400">Rejected</th>
                      <th className="py-2 px-3 text-center text-emerald-400">Accepted (+Stock)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {selectedReceipt.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3">
                          <div className="font-medium text-zinc-100">{item.product?.name}</div>
                          <div className="text-[10px] font-mono text-zinc-500">{item.product?.sku}</div>
                          {item.rejectionReason && (
                            <div className="text-[10px] text-rose-400 mt-0.5">
                              Rejected: {item.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center text-zinc-400">{item.orderedQuantity}</td>
                        <td className="py-2 px-3 text-center text-zinc-200">{item.receivedQuantity}</td>
                        <td className="py-2 px-3 text-center text-rose-400 font-semibold">
                          {item.rejectedQuantity}
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-400 font-bold">
                          +{item.acceptedQuantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedReceipt.notes && (
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-300">
                <span className="text-zinc-500 text-[10px] uppercase font-semibold block mb-0.5">
                  Receipt Notes
                </span>
                {selectedReceipt.notes}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
