"use client";

import React from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  AlertTriangle,
  IndianRupee,
  Clock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface LowStockAlert {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  status: "LOW_STOCK" | "OUT_OF_STOCK";
}

interface DelayedDelivery {
  id: string;
  poNumber: string;
  vendorName: string;
  total: number;
  status: string;
  expectedDeliveryDate: Date | string;
  daysDelayed: number;
}

interface CeoInventoryProcurementProps {
  inventory: {
    totalValuation: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockAlerts: LowStockAlert[];
  };
  procurement: {
    activeVendorsCount: number;
    pendingPOCount: number;
    delayedPOCount: number;
    totalPOValue: number;
    delayedDeliveries: DelayedDelivery[];
  };
}

export function CeoInventoryProcurement({
  inventory,
  procurement,
}: CeoInventoryProcurementProps) {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Inventory & Supply Chain Overview */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-400" />
              Inventory Valuation & Stock Health
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Asset capital tied up in warehouses and material shortages.</p>
          </div>
          <Link
            href="/app/inventory"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            Inventory <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {/* Inventory Metric Cards */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Total Valuation</span>
            <span className="text-base font-bold text-emerald-400 block mt-1">
              {formatINR(inventory.totalValuation)}
            </span>
          </div>
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
            <span className="text-[10px] uppercase font-semibold text-amber-400">Low Stock SKUs</span>
            <span className="text-base font-bold text-amber-300 block mt-1">{inventory.lowStockCount}</span>
          </div>
          <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3">
            <span className="text-[10px] uppercase font-semibold text-rose-400">Out of Stock</span>
            <span className="text-base font-bold text-rose-300 block mt-1">{inventory.outOfStockCount}</span>
          </div>
        </div>

        {/* Low Stock Alert Table */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Critical Stock Shortages
          </span>
          {inventory.lowStockAlerts.length === 0 ? (
            <div className="py-6 text-center text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
              ✓ All product inventory levels are above required reorder thresholds.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase font-semibold text-slate-400">
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-2">SKU</th>
                    <th className="py-2.5 px-2 text-right">Current</th>
                    <th className="py-2.5 px-2 text-right">Min</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {inventory.lowStockAlerts.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-medium text-white truncate max-w-[140px]">{item.name}</td>
                      <td className="py-2 px-2 text-slate-400 font-mono text-[10px]">{item.sku}</td>
                      <td className="py-2 px-2 text-right font-bold text-rose-400">{item.currentStock}</td>
                      <td className="py-2 px-2 text-right text-slate-400">{item.reorderLevel}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            item.status === "OUT_OF_STOCK"
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {item.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 2. Vendor & Procurement Overview */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-400" />
              Vendor & Procurement Commitments
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Supplier relationships, active purchase commitments, and delivery delays.</p>
          </div>
          <Link
            href="/app/inventory/purchase-orders"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            POs <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {/* Procurement Metric Cards */}
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Active Vendors</span>
            <span className="text-base font-bold text-white block mt-1">{procurement.activeVendorsCount}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Pending POs</span>
            <span className="text-base font-bold text-blue-400 block mt-1">{procurement.pendingPOCount}</span>
          </div>
          <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3">
            <span className="text-[10px] uppercase font-semibold text-rose-400">Delayed</span>
            <span className="text-base font-bold text-rose-300 block mt-1">{procurement.delayedPOCount}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Total Commitment</span>
            <span className="text-base font-bold text-amber-400 block mt-1 truncate">
              {formatINR(procurement.totalPOValue)}
            </span>
          </div>
        </div>

        {/* Delayed Deliveries Table */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Vendor Deliveries Behind Schedule
          </span>
          {procurement.delayedDeliveries.length === 0 ? (
            <div className="py-6 text-center text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
              ✓ All vendor purchase orders and goods deliveries are within delivery SLAs.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase font-semibold text-slate-400">
                    <th className="py-2.5 px-3">PO Number</th>
                    <th className="py-2.5 px-2">Vendor</th>
                    <th className="py-2.5 px-2 text-right">Amount</th>
                    <th className="py-2.5 px-2">Expected Date</th>
                    <th className="py-2.5 px-3 text-center">Delay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {procurement.delayedDeliveries.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-semibold text-white font-mono text-[11px]">{po.poNumber}</td>
                      <td className="py-2 px-2 text-slate-300 truncate max-w-[120px]">{po.vendorName}</td>
                      <td className="py-2 px-2 text-right font-semibold text-white">{formatINR(po.total)}</td>
                      <td className="py-2 px-2 text-slate-400 font-mono text-[10px]">
                        {new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold">
                          +{po.daysDelayed}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
