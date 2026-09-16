"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  Briefcase,
  Plus,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
} from "lucide-react";

interface ServiceItem {
  id: string;
  serviceCode: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string;
  sellingPrice: number;
  costPrice: number | null;
  taxRate: number;
  billingUnit: string;
  status: string;
  createdAt: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [billingUnit, setBillingUnit] = useState("ALL");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    serviceCode: "",
    name: "",
    description: "",
    categoryId: "",
    sellingPrice: "",
    costPrice: "",
    taxRate: "0",
    billingUnit: "HOURLY",
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (billingUnit !== "ALL") params.set("billingUnit", billingUnit);

      const res = await fetch(`/api/inventory/services?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load services");
      setServices(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/inventory/categories?type=SERVICE");
      const json = await res.json();
      if (json.data) setCategories(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchServices();
    loadCategories();
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload: any = {
        serviceCode: formData.serviceCode.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        taxRate: parseFloat(formData.taxRate) || 0,
        billingUnit: formData.billingUnit,
      };

      const res = await fetch("/api/inventory/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create service");

      setShowModal(false);
      setFormData({
        serviceCode: "",
        name: "",
        description: "",
        categoryId: "",
        sellingPrice: "",
        costPrice: "",
        taxRate: "0",
        billingUnit: "HOURLY",
      });
      fetchServices();
    } catch (err: any) {
      setFormError(err.message || "Failed to create service");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services & Professional Offerings"
        description="Centralized catalog of non-inventory billable professional services, SLAs, and consulting rates."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchServices}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" />
              New Service
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

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by service code, title, or scope..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchServices()}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={billingUnit}
          onChange={(e) => {
            setBillingUnit(e.target.value);
            setTimeout(fetchServices, 0);
          }}
          className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Billing Units</option>
          <option value="HOURLY">Hourly Rate</option>
          <option value="FIXED_PRICE">Fixed Price / Milestone</option>
          <option value="MONTHLY_RETAINER">Monthly Retainer</option>
          <option value="DAILY">Daily Rate</option>
          <option value="PER_PROJECT">Per Project</option>
        </select>
      </div>

      {/* Services Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading service catalog...</div>
        ) : services.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <h3 className="text-sm font-medium text-zinc-300">No service offerings found</h3>
            <p className="text-xs text-zinc-500 mt-1">Create billable service packages for invoicing</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">Service Code</th>
                  <th className="py-3 px-4 font-medium">Offering Name</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Billing Model</th>
                  <th className="py-3 px-4 font-medium text-right">Standard Rate</th>
                  <th className="py-3 px-4 font-medium text-right">Internal Cost</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{s.serviceCode}</td>
                    <td className="py-3 px-4 font-medium text-zinc-100">
                      <div>{s.name}</div>
                      {s.description && (
                        <div className="text-[11px] text-zinc-500 truncate max-w-sm">{s.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{s.categoryName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300">
                        {s.billingUnit.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-zinc-100">
                      ₹{s.sellingPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400 font-mono">
                      {s.costPrice !== null ? `₹${s.costPrice.toLocaleString()}` : "••••"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" /> {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Service Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Create Service Offering</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Service Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SRV-CNS-09"
                    value={formData.serviceCode}
                    onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DevOps Pipeline Audit"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Deliverables, methodology, and SLAs..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Billing Model</label>
                  <select
                    value={formData.billingUnit}
                    onChange={(e) => setFormData({ ...formData, billingUnit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="HOURLY">Hourly Rate</option>
                    <option value="FIXED_PRICE">Fixed Price</option>
                    <option value="MONTHLY_RETAINER">Monthly Retainer</option>
                    <option value="DAILY">Daily Rate</option>
                    <option value="PER_PROJECT">Per Project</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Selling Rate ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Internal Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
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
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
