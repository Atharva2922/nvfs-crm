"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  Truck,
  Plus,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  X,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  Globe,
} from "lucide-react";

interface VendorItem {
  id: string;
  vendorCode: string;
  legalName: string;
  displayName: string;
  vendorType: string;
  email: string;
  phone: string | null;
  website: string | null;
  country: string | null;
  paymentTerms: string;
  currency: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED" | "PENDING_REVIEW";
  createdAt: string;
  _count: {
    contacts: number;
    vendorProducts: number;
    purchaseOrders: number;
    goodsReceipts: number;
  };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    legalName: "",
    displayName: "",
    vendorType: "SUPPLIER",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    taxId: "",
    paymentTerms: "NET_30",
    currency: "INR",
    bankName: "",
    bankAccountNumber: "",
    bankRoutingCode: "",
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
    notes: "",
  });

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("vendorType", typeFilter);

      const res = await fetch(`/api/inventory/vendors?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load vendors");
      setVendors(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVendors();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/inventory/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create vendor");

      setShowModal(false);
      setFormData({
        legalName: "",
        displayName: "",
        vendorType: "SUPPLIER",
        email: "",
        phone: "",
        website: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        taxId: "",
        paymentTerms: "NET_30",
        currency: "INR",
        bankName: "",
        bankAccountNumber: "",
        bankRoutingCode: "",
        primaryContactName: "",
        primaryContactEmail: "",
        primaryContactPhone: "",
        notes: "",
      });
      fetchVendors();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // KPIs
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.status === "ACTIVE").length;
  const blockedVendors = vendors.filter((v) => v.status === "BLOCKED").length;
  const pendingVendors = vendors.filter((v) => v.status === "PENDING_REVIEW").length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Vendors & Suppliers"
        description="Manage vendor master catalog, preferred suppliers, contracts, and procurement performance."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Vendor
          </button>
        }
      />

      <InventoryNav />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Vendors</span>
            <Building2 className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalVendors}</p>
          <span className="text-xs text-zinc-400">Master supplier directory</span>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/15 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-300">{activeVendors}</p>
          <span className="text-xs text-emerald-500/80">Authorized for procurement</span>
        </div>

        <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Review</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300">{pendingVendors}</p>
          <span className="text-xs text-amber-500/80">Awaiting vendor verification</span>
        </div>

        <div className="rounded-xl border border-rose-900/40 bg-rose-950/15 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Blocked</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-300">{blockedVendors}</p>
          <span className="text-xs text-rose-500/80">Purchasing restricted</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/40 border border-zinc-800 p-3 rounded-xl">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition"
          >
            Search
          </button>
        </form>

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
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
            <option value="PENDING_REVIEW">Pending Review</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-zinc-400 ml-2">
            <span>Type:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="SUPPLIER">Supplier</option>
            <option value="DISTRIBUTOR">Distributor</option>
            <option value="MANUFACTURER">Manufacturer</option>
            <option value="SERVICE_PROVIDER">Service Provider</option>
            <option value="WHOLESALER">Wholesaler</option>
          </select>

          <button
            onClick={fetchVendors}
            title="Refresh Vendors"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg ml-auto sm:ml-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading vendor catalog...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-400" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        ) : vendors.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <Truck className="h-8 w-8 text-zinc-600 mb-1" />
            <p className="text-sm font-medium text-zinc-300">No vendors found</p>
            <p className="text-xs text-zinc-500">Create your first vendor to begin issuing purchase orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Vendor Code & Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Terms & Currency</th>
                  <th className="py-3 px-4 text-center">Catalog & POs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-zinc-100 flex items-center gap-2">
                          <Link
                            href={`/app/inventory/vendors/${vendor.id}`}
                            className="hover:text-blue-400 transition"
                          >
                            {vendor.displayName}
                          </Link>
                          <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                            {vendor.vendorCode}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">{vendor.legalName}</div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-medium text-zinc-300 bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-700/50">
                        {vendor.vendorType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Mail className="h-3 w-3 text-zinc-500" />
                          <span>{vendor.email}</span>
                        </div>
                        {vendor.phone && (
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Phone className="h-3 w-3 text-zinc-500" />
                            <span>{vendor.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[11px]">
                        <span className="font-medium text-zinc-200">{vendor.paymentTerms}</span>
                        <span className="text-zinc-500 ml-1.5 font-mono">({vendor.currency})</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">{vendor.country || "India"}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-2 font-mono text-[11px] text-zinc-300">
                        <span title="Products in Catalog" className="bg-zinc-800 px-1.5 py-0.5 rounded">
                          {vendor._count.vendorProducts} prods
                        </span>
                        <span title="Purchase Orders" className="bg-zinc-800 px-1.5 py-0.5 rounded">
                          {vendor._count.purchaseOrders} POs
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          vendor.status === "ACTIVE"
                            ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/40"
                            : vendor.status === "BLOCKED"
                            ? "bg-rose-950/70 text-rose-400 border border-rose-800/40"
                            : vendor.status === "PENDING_REVIEW"
                            ? "bg-amber-950/70 text-amber-400 border border-amber-800/40"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {vendor.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/app/inventory/vendors/${vendor.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition"
                      >
                        Profile 360
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-semibold text-zinc-100">Create New Vendor</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Hardware Supplies"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Legal / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Industrial Solutions LLC"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Vendor Type
                  </label>
                  <select
                    value={formData.vendorType}
                    onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="SUPPLIER">Supplier</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                    <option value="MANUFACTURER">Manufacturer</option>
                    <option value="SERVICE_PROVIDER">Service Provider</option>
                    <option value="WHOLESALER">Wholesaler</option>
                    <option value="CONTRACTOR">Contractor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="procurement@apex.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    placeholder="https://apexsupplies.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="NET_15">Net 15</option>
                    <option value="NET_30">Net 30</option>
                    <option value="NET_60">Net 60</option>
                    <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                    <option value="ADVANCE">Advance / Prepaid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Location & Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="100 Technology Parkway, Suite 400"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Austin"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Tax / GST / VAT ID
                  </label>
                  <input
                    type="text"
                    placeholder="US-EIN-98765432"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Bank Information (Masked) */}
              <div className="border-t border-zinc-800 pt-3">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Banking Reference (Stored Securely & Masked)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="HDFC Bank"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="9876543210"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Routing / Swift Code
                    </label>
                    <input
                      type="text"
                      placeholder="CHASUS33"
                      value={formData.bankRoutingCode}
                      onChange={(e) => setFormData({ ...formData, bankRoutingCode: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Contact Person */}
              <div className="border-t border-zinc-800 pt-3">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Primary Contact Person
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Miller"
                      value={formData.primaryContactName}
                      onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      placeholder="jmiller@apex.com"
                      value={formData.primaryContactEmail}
                      onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+1 (555) 345-6789"
                      value={formData.primaryContactPhone}
                      onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? "Saving Vendor..." : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
