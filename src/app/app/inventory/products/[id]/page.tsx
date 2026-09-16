"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  Package,
  Boxes,
  IndianRupee,
  ArrowLeftRight,
  Clock,
  ArrowLeft,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "pricing" | "movements" | "activity">("overview");

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/inventory/products/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Product not found");
      setProduct(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Product Master Details" description="Loading specifications and warehouse balances..." />
        <InventoryNav />
        <div className="h-64 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <PageHeader title="Product Not Found" description="The requested product could not be located." />
        <InventoryNav />
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-xs text-red-400">
          {error || "Product not found"}
          <div className="mt-4">
            <Link
              href="/app/inventory/products"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const margin =
    product.costPrice !== null && product.sellingPrice > 0
      ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/inventory/products"
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                {product.sku}
              </span>
              <h1 className="text-xl font-bold text-zinc-100">{product.name}</h1>
              {product.stockStatus === "OUT_OF_STOCK" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <XCircle className="h-3 w-3" /> OUT OF STOCK
                </span>
              ) : product.stockStatus === "LOW_STOCK" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="h-3 w-3" /> LOW STOCK
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3" /> IN STOCK
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{product.category?.name || "Uncategorized Product"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProduct}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <InventoryNav />

      {/* Product Summary Header Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-400">Total Stock On-Hand</span>
          <div className="mt-1 text-2xl font-bold text-zinc-100">
            {product.totalStock} <span className="text-sm font-normal text-zinc-500">{product.unitOfMeasure}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-400">Available Stock</span>
          <div className="mt-1 text-2xl font-bold text-emerald-400">
            {product.availableStock} <span className="text-sm font-normal text-zinc-500">{product.unitOfMeasure}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-400">Selling Price</span>
          <div className="mt-1 text-2xl font-bold text-zinc-100">
            ${product.sellingPrice.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-400">Estimated Valuation</span>
          <div className="mt-1 text-2xl font-bold text-purple-400">
            {product.totalValuation !== null ? `₹${Math.round(product.totalValuation).toLocaleString()}` : "••••••"}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-800 flex items-center gap-6 text-xs font-medium text-zinc-400">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 border-b-2 transition ${
            activeTab === "overview"
              ? "border-blue-500 text-blue-400 font-semibold"
              : "border-transparent hover:text-zinc-200"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "inventory"
              ? "border-blue-500 text-blue-400 font-semibold"
              : "border-transparent hover:text-zinc-200"
          }`}
        >
          <Boxes className="h-3.5 w-3.5" />
          Location Inventory ({product.inventoryItems.length})
        </button>
        <button
          onClick={() => setActiveTab("pricing")}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "pricing"
              ? "border-blue-500 text-blue-400 font-semibold"
              : "border-transparent hover:text-zinc-200"
          }`}
        >
          <IndianRupee className="h-3.5 w-3.5" />
          Pricing & Valuation
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "movements"
              ? "border-blue-500 text-blue-400 font-semibold"
              : "border-transparent hover:text-zinc-200"
          }`}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Stock Movements ({product.stockMovements.length})
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "activity"
              ? "border-blue-500 text-blue-400 font-semibold"
              : "border-transparent hover:text-zinc-200"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Activity Log
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h3 className="font-semibold text-zinc-100 text-sm border-b border-zinc-800 pb-2">
              Product Specifications
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-zinc-400">
              <div>SKU / Identifier:</div>
              <div className="font-mono font-medium text-zinc-200">{product.sku}</div>

              <div>Product Name:</div>
              <div className="font-medium text-zinc-200">{product.name}</div>

              <div>Category:</div>
              <div className="text-zinc-200">{product.category?.name || "None"}</div>

              <div>Classification:</div>
              <div className="text-zinc-200">{product.productType}</div>

              <div>Unit of Measure:</div>
              <div className="text-zinc-200">{product.unitOfMeasure}</div>

              <div>Status:</div>
              <div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                  {product.status}
                </span>
              </div>

              <div>Description:</div>
              <div className="text-zinc-300 col-span-2 mt-1 rounded bg-zinc-800/40 p-3 border border-zinc-800">
                {product.description || "No description provided."}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h3 className="font-semibold text-zinc-100 text-sm border-b border-zinc-800 pb-2">
              Stock Thresholds & Procurement Policy
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-zinc-400">
              <div>Min Stock Level:</div>
              <div className="font-medium text-zinc-200">{product.minStockLevel} {product.unitOfMeasure}</div>

              <div>Reorder Point:</div>
              <div className="font-medium text-amber-400">{product.reorderLevel} {product.unitOfMeasure}</div>

              <div>Max Stock Capacity:</div>
              <div className="font-medium text-zinc-200">{product.maxStockLevel} {product.unitOfMeasure}</div>

              <div>Supplier Lead Time:</div>
              <div className="text-zinc-200">{product.leadTimeDays ? `${product.leadTimeDays} days` : "7 days (Standard)"}</div>

              <div>Standard Reorder Batch:</div>
              <div className="text-zinc-200">{product.reorderQuantity || 20} {product.unitOfMeasure}</div>

              <div>Created By:</div>
              <div className="text-zinc-200">
                {product.createdBy?.firstName} {product.createdBy?.lastName}
              </div>

              <div>Record Created:</div>
              <div className="text-zinc-200">{new Date(product.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Location-Aware Inventory */}
      {activeTab === "inventory" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-zinc-100">Multi-Location Warehouse Inventory</h3>
            </div>
            <Link
              href="/app/inventory/movements"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              Transfer Stock <ArrowLeftRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">Warehouse</th>
                  <th className="py-3 px-4 font-medium">Location</th>
                  <th className="py-3 px-4 font-medium">Location Coordinates</th>
                  <th className="py-3 px-4 font-medium text-right">Physical On-Hand</th>
                  <th className="py-3 px-4 font-medium text-right">Reserved</th>
                  <th className="py-3 px-4 font-medium text-right">Available To Promise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {product.inventoryItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-zinc-200">
                      <span className="font-mono text-blue-400 mr-2">{item.warehouse.code}</span>
                      {item.warehouse.name}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{item.warehouse.city || "Primary Facility"}</td>
                    <td className="py-3 px-4 text-zinc-400 font-mono">
                      {item.aisle ? `Aisle ${item.aisle} • Shelf ${item.shelf} • Bin ${item.bin}` : "General Storage"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-100">
                      {item.quantity} {product.unitOfMeasure}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {item.reservedQuantity}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                      {Math.max(0, item.quantity - item.reservedQuantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Pricing & Valuation */}
      {activeTab === "pricing" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <span className="text-zinc-400 font-medium">Commercial Selling Price</span>
            <div className="text-2xl font-bold text-zinc-100">₹{product.sellingPrice.toLocaleString()}</div>
            <p className="text-[11px] text-zinc-500">Standard client invoicing price before volume discounts</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Cost Price</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">RBAC Guarded</span>
            </div>
            <div className="text-2xl font-bold text-zinc-200">
              {product.costPrice !== null ? `₹${product.costPrice.toLocaleString()}` : "••••••••"}
            </div>
            <p className="text-[11px] text-zinc-500">
              {product.costPrice !== null ? "Procurement landed purchase cost" : "Access restricted to authorized financial officers"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <span className="text-zinc-400 font-medium">Gross Margin</span>
            <div className="text-2xl font-bold text-emerald-400">
              {margin !== null ? `${margin}%` : "••••"}
            </div>
            <p className="text-[11px] text-zinc-500">
              {margin !== null ? "Estimated unit operating gross margin" : "Valuation protected"}
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Stock Movements */}
      {activeTab === "movements" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden text-xs">
          <div className="p-4 border-b border-zinc-800 font-semibold text-zinc-100">
            Traceable Movement History
          </div>
          {product.stockMovements.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No stock movements recorded for this product.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-2.5 px-4 font-medium">Movement #</th>
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Type</th>
                  <th className="py-2.5 px-4 font-medium text-right">Quantity</th>
                  <th className="py-2.5 px-4 font-medium">Facility / Route</th>
                  <th className="py-2.5 px-4 font-medium">Reason</th>
                  <th className="py-2.5 px-4 font-medium text-right">Balance</th>
                  <th className="py-2.5 px-4 font-medium">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {product.stockMovements.map((m: any) => (
                  <tr key={m.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-2.5 px-4 font-mono font-medium text-zinc-200">{m.movementNumber}</td>
                    <td className="py-2.5 px-4 text-zinc-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                        {m.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-zinc-100">{m.quantity}</td>
                    <td className="py-2.5 px-4 text-zinc-300">
                      {m.type === "TRANSFER"
                        ? `${m.sourceWarehouse?.code} → ${m.destinationWarehouse?.code}`
                        : m.destinationWarehouse?.name || m.sourceWarehouse?.name || "General"}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400">{m.reason}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-zinc-300">{m.newBalance}</td>
                    <td className="py-2.5 px-4 text-zinc-400">
                      {m.performedBy ? `${m.performedBy.firstName} ${m.performedBy.lastName}` : "System"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 5: Activity Log */}
      {activeTab === "activity" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-xs space-y-4">
          <h3 className="font-semibold text-zinc-100 text-sm">Product Lifecycle Audit Events</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-800/40">
              <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5" />
              <div>
                <div className="font-medium text-zinc-200">Product Record Created</div>
                <div className="text-[11px] text-zinc-500">
                  Initial SKU {product.sku} created by {product.createdBy?.firstName} {product.createdBy?.lastName} on{" "}
                  {new Date(product.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
