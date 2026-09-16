"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  Package,
  Briefcase,
  Boxes,
  AlertTriangle,
  XCircle,
  IndianRupee,
  ArrowRight,
  Plus,
  ArrowLeftRight,
  Sliders,
  Building2,
  FolderTree,
  RefreshCw,
} from "lucide-react";

interface OverviewData {
  totalProducts: number;
  totalServices: number;
  totalInventoryUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValuation: number | null;
  canViewValuation: boolean;
  lowStockAlerts: Array<{
    id: string;
    sku: string;
    name: string;
    currentStock: number;
    reorderLevel: number;
    status: "LOW_STOCK" | "OUT_OF_STOCK";
    leadTimeDays: number | null;
    reorderQuantity: number | null;
  }>;
  warehouseDistribution: Array<{
    id: string;
    code: string;
    name: string;
    units: number;
    skuCount: number;
  }>;
  categoryDistribution: Array<{
    id: string;
    name: string;
    code: string;
    productCount: number;
    totalUnits: number;
  }>;
}

export default function InventoryOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/inventory/overview");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load inventory data");
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products, Services & Inventory"
        description="Centralized master catalog, billable services, location-aware stock tracking, and transactional movements."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchOverview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <Link
              href="/app/inventory/products"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" />
              New Product
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

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-zinc-900/60 border border-zinc-800/60" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Products</span>
                <Package className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-zinc-100">{data.totalProducts}</div>
              <span className="text-[11px] text-zinc-500">Active physical SKUs</span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Services</span>
                <Briefcase className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-zinc-100">{data.totalServices}</div>
              <span className="text-[11px] text-zinc-500">Billable offerings</span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total Units</span>
                <Boxes className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-zinc-100">
                {data.totalInventoryUnits.toLocaleString()}
              </div>
              <span className="text-[11px] text-zinc-500">Across all warehouses</span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Low Stock</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-400">{data.lowStockCount}</div>
              <span className="text-[11px] text-amber-500/80">At or below reorder</span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Out of Stock</span>
                <XCircle className="h-4 w-4 text-rose-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-400">{data.outOfStockCount}</div>
              <span className="text-[11px] text-rose-500/80">Zero units on hand</span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Inventory Value</span>
                <IndianRupee className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-400">
                {data.canViewValuation && data.totalValuation !== null
                  ? `₹${Math.round(data.totalValuation).toLocaleString()}`
                  : "••••••"}
              </div>
              <span className="text-[11px] text-zinc-500">
                {data.canViewValuation ? "At cost price" : "Restricted (RBAC)"}
              </span>
            </div>
          </div>

          {/* Low Stock Urgent Alerts Table */}
          {data.lowStockAlerts.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Stock Reorder Alerts ({data.lowStockAlerts.length})
                  </h3>
                </div>
                <Link
                  href="/app/inventory/products?stockStatus=LOW_STOCK"
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  View all in catalog <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="pb-2 font-medium">SKU</th>
                      <th className="pb-2 font-medium">Product Name</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Current On-Hand</th>
                      <th className="pb-2 font-medium text-right">Reorder Threshold</th>
                      <th className="pb-2 font-medium text-right">Lead Time</th>
                      <th className="pb-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {data.lowStockAlerts.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-2.5 font-mono font-medium text-zinc-200">{item.sku}</td>
                        <td className="py-2.5 text-zinc-100 font-medium">{item.name}</td>
                        <td className="py-2.5">
                          {item.status === "OUT_OF_STOCK" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              OUT OF STOCK
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              LOW STOCK
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-zinc-100">
                          {item.currentStock}
                        </td>
                        <td className="py-2.5 text-right text-zinc-400">{item.reorderLevel} units</td>
                        <td className="py-2.5 text-right text-zinc-400">
                          {item.leadTimeDays ? `${item.leadTimeDays} days` : "7 days"}
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={async () => {
                                if (!confirm(`Create Purchase Request to reorder ${item.name}?`)) return;
                                try {
                                  const res = await fetch("/api/inventory/purchase-requests/from-low-stock", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ productId: item.id, quantity: item.reorderQuantity || 50 }),
                                  });
                                  const json = await res.json();
                                  if (!res.ok) throw new Error(json.error?.message || "Failed to create PR");
                                  alert(`Purchase Request ${json.data.requestNumber} created successfully!`);
                                } catch (e: any) {
                                  alert(e.message);
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-[11px] font-medium transition"
                            >
                              Reorder PR
                            </button>
                            <Link
                              href={`/app/inventory/products/${item.id}`}
                              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
                            >
                              Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warehouses & Categories Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warehouses Location Breakdown */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-zinc-100">Warehouse Storage Facilities</h3>
                </div>
                <Link
                  href="/app/inventory/warehouses"
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                >
                  Manage <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {data.warehouseDistribution.map((wh) => {
                  const percentage =
                    data.totalInventoryUnits > 0
                      ? Math.round((wh.units / data.totalInventoryUnits) * 100)
                      : 0;
                  return (
                    <div key={wh.id} className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-zinc-200">{wh.code}</span>
                          <span className="text-zinc-400 font-medium">{wh.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300 font-medium">
                          <span>{wh.units.toLocaleString()} units</span>
                          <span className="text-zinc-500">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-zinc-100">Stock by Product Category</h3>
                </div>
                <Link
                  href="/app/inventory/categories"
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                >
                  Manage <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {data.categoryDistribution.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 text-xs"
                  >
                    <div>
                      <div className="font-medium text-zinc-200">{cat.name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {cat.code} • {cat.productCount} SKUs
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-zinc-100">
                        {cat.totalUnits.toLocaleString()} units
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Operation Action Hub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/app/inventory/movements"
              className="flex items-center gap-3.5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/50 hover:border-zinc-700 transition group"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-100">Stock Movements & Transfers</div>
                <div className="text-[11px] text-zinc-400">Execute inbound, outbound, and inter-depot moves</div>
              </div>
            </Link>

            <Link
              href="/app/inventory/adjustments"
              className="flex items-center gap-3.5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/50 hover:border-zinc-700 transition group"
            >
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-100">Count Adjustments</div>
                <div className="text-[11px] text-zinc-400">Reconcile physical counts and authorized audits</div>
              </div>
            </Link>

            <Link
              href="/app/inventory/stock"
              className="flex items-center gap-3.5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/50 hover:border-zinc-700 transition group"
            >
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-100">Location Stock Matrix</div>
                <div className="text-[11px] text-zinc-400">Search and audit specific bins, aisles, and shelves</div>
              </div>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
