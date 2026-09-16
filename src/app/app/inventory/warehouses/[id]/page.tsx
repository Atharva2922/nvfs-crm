"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  Building2,
  Boxes,
  ArrowLeft,
  RefreshCw,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export default function WarehouseDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [warehouse, setWarehouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouse = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/inventory/warehouses/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Warehouse not found");
      setWarehouse(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load warehouse details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchWarehouse();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Warehouse Facility Details" description="Loading facility inventory..." />
        <InventoryNav />
        <div className="h-64 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="space-y-6">
        <PageHeader title="Warehouse Not Found" description="The requested facility could not be located." />
        <InventoryNav />
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-xs text-red-400">
          {error || "Warehouse not found"}
          <div className="mt-4">
            <Link
              href="/app/inventory/warehouses"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Warehouses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/inventory/warehouses"
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                {warehouse.code}
              </span>
              <h1 className="text-xl font-bold text-zinc-100">{warehouse.name}</h1>
              {warehouse.isDefault && (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Primary Facility
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-zinc-500" />
              <span>
                {warehouse.address ? `${warehouse.address}, ` : ""}
                {warehouse.city || ""}, {warehouse.state || ""} {warehouse.country || ""}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={fetchWarehouse}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <InventoryNav />

      {/* Facility Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-400">Total Units Stored</span>
          <div className="mt-1 text-2xl font-bold text-zinc-100">
            {warehouse.totalUnits.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-400">Available ATP</span>
          <div className="mt-1 text-2xl font-bold text-emerald-400">
            {warehouse.availableUnits.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-400">Unique SKUs</span>
          <div className="mt-1 text-2xl font-bold text-blue-400">
            {warehouse.inventoryItems?.length || 0}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-xs text-zinc-400">Facility Manager</span>
          <div className="mt-1 text-base font-semibold text-zinc-200 truncate">
            {warehouse.manager ? `${warehouse.manager.firstName} ${warehouse.manager.lastName}` : "Unassigned"}
          </div>
        </div>
      </div>

      {/* Warehouse Stored SKUs Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 font-semibold text-sm text-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-blue-400" />
            <span>Inventory Stored at {warehouse.name}</span>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                <th className="py-3 px-4 font-medium">SKU</th>
                <th className="py-3 px-4 font-medium">Product Name</th>
                <th className="py-3 px-4 font-medium">Location Coordinate</th>
                <th className="py-3 px-4 font-medium text-right">On-Hand Stock</th>
                <th className="py-3 px-4 font-medium text-right">Reserved</th>
                <th className="py-3 px-4 font-medium text-right">Available ATP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {warehouse.inventoryItems?.map((item: any) => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-blue-400">
                    <Link href={`/app/inventory/products/${item.product.id}`} className="hover:underline">
                      {item.product.sku}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-medium text-zinc-100">{item.product.name}</td>
                  <td className="py-3 px-4 text-zinc-400 font-mono">
                    {item.aisle ? `${item.aisle}-${item.shelf}-${item.bin}` : "General Stock"}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-zinc-100">
                    {item.quantity} {item.product.unitOfMeasure}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-400">{item.reservedQuantity}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                    {Math.max(0, item.quantity - item.reservedQuantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
