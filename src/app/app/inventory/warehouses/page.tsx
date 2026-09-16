"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  Building2,
  Plus,
  RefreshCw,
  X,
  ArrowRight,
  Boxes,
  MapPin,
  CheckCircle2,
} from "lucide-react";

interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  managerName: string;
  status: string;
  isDefault: boolean;
  totalUnits: number;
  totalReserved: number;
  availableUnits: number;
  uniqueSkusCount: number;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    status: "ACTIVE",
    isDefault: false,
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/inventory/warehouses");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load warehouses");
      setWarehouses(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || "India",
        status: formData.status as any,
        isDefault: formData.isDefault,
      };

      const res = await fetch("/api/inventory/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create warehouse");

      setShowModal(false);
      setFormData({
        code: "",
        name: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        status: "ACTIVE",
        isDefault: false,
      });
      fetchWarehouses();
    } catch (err: any) {
      setFormError(err.message || "Failed to create warehouse");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses & Storage Facilities"
        description="Multi-facility logistical hubs, regional fulfillment centers, and location-aware depots."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchWarehouses}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" />
              New Warehouse
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

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {warehouses.map((w) => (
          <div
            key={w.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 hover:border-zinc-700 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                    {w.code}
                  </span>
                  {w.isDefault && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Primary
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-zinc-100 mt-2">{w.name}</h3>
                <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                  <MapPin className="h-3 w-3 text-zinc-500" />
                  <span>
                    {w.city ? `${w.city}, ${w.state || w.country}` : "Global Facility"}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" /> {w.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-500">Total Units:</span>
                <div className="font-bold text-zinc-100 text-sm">{w.totalUnits.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-zinc-500">Unique SKUs:</span>
                <div className="font-bold text-zinc-100 text-sm">{w.uniqueSkusCount}</div>
              </div>
              <div>
                <span className="text-zinc-500">Available:</span>
                <div className="font-medium text-emerald-400">{w.availableUnits.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-zinc-500">Manager:</span>
                <div className="text-zinc-300 truncate">{w.managerName}</div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/app/inventory/warehouses/${w.id}`}
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                View Facility Details <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* New Warehouse Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Create Warehouse Location</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-004"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Facility Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central Texas Hub"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. 100 Logistics Way, Bay 3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Dallas"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">State</label>
                  <input
                    type="text"
                    placeholder="TX"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0"
                />
                <label htmlFor="isDefault" className="text-zinc-300 text-xs">
                  Set as primary organization dispatch warehouse
                </label>
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
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
