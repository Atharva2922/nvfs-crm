"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  Boxes,
  Search,
  Building2,
  RefreshCw,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react";

interface StockMatrixItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  categoryName: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseCity: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unitOfMeasure: string;
  sellingPrice: number;
  costPrice: number | null;
  valuation: number | null;
  reorderLevel: number;
  aisle: string | null;
  shelf: string | null;
  bin: string | null;
  updatedAt: string;
}

export default function StockMatrixPage() {
  const [stockItems, setStockItems] = useState<StockMatrixItem[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedWarehouse, setSelectedWarehouse] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchStock = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedWarehouse !== "ALL") params.set("warehouseId", selectedWarehouse);
      if (search) params.set("search", search);

      const res = await fetch(`/api/inventory/stock?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load stock matrix");
      setStockItems(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load stock matrix");
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await fetch("/api/inventory/warehouses");
      const json = await res.json();
      if (json.data) setWarehouses(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStock();
    loadWarehouses();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Location-Aware Stock Matrix"
        description="Fine-grained breakdown of physical inventory across warehouses, aisles, shelves, and bins."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchStock}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <Link
              href="/app/inventory/movements"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Stock Transfers
            </Link>
          </div>
        }
      />

      <InventoryNav />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by SKU or Product Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchStock()}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedWarehouse}
          onChange={(e) => {
            setSelectedWarehouse(e.target.value);
            setTimeout(fetchStock, 0);
          }}
          className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Warehouses & Locations</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.code} - {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Matrix Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading location stock matrix...</div>
        ) : stockItems.length === 0 ? (
          <div className="p-12 text-center">
            <Boxes className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <h3 className="text-sm font-medium text-zinc-300">No inventory entries found</h3>
            <p className="text-xs text-zinc-500 mt-1">Try selecting a different warehouse or clearing search</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">SKU</th>
                  <th className="py-3 px-4 font-medium">Product Name</th>
                  <th className="py-3 px-4 font-medium">Warehouse</th>
                  <th className="py-3 px-4 font-medium">Location Bin</th>
                  <th className="py-3 px-4 font-medium text-right">Physical Stock</th>
                  <th className="py-3 px-4 font-medium text-right">Reserved</th>
                  <th className="py-3 px-4 font-medium text-right">Available ATP</th>
                  <th className="py-3 px-4 font-medium text-right">Unit Price</th>
                  <th className="py-3 px-4 font-medium text-right">Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {stockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-400">
                      <Link href={`/app/inventory/products/${item.productId}`} className="hover:underline">
                        {item.productSku}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-100">{item.productName}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-zinc-300 mr-1.5">{item.warehouseCode}</span>
                      <span className="text-zinc-400 text-[11px]">{item.warehouseName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {item.aisle ? `${item.aisle}-${item.shelf}-${item.bin}` : "General Stock"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-100">
                      {item.quantity} {item.unitOfMeasure}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {item.reservedQuantity}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                      {item.availableQuantity}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-300">
                      ₹{item.sellingPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-purple-400">
                      {item.valuation !== null ? `₹${Math.round(item.valuation).toLocaleString()}` : "••••"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
