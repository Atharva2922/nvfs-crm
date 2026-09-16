"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  Truck,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  CreditCard,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Plus,
  Package,
  FileSpreadsheet,
  PackageCheck,
  Receipt,
  Banknote,
  Activity,
  UserCheck,
  RefreshCw,
  Star,
  ExternalLink,
} from "lucide-react";

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "contacts" | "products" | "purchaseOrders" | "goodsReceipts" | "invoices" | "payments" | "activity"
  >("overview");

  // Contact Modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactData, setContactData] = useState({
    name: "",
    designation: "",
    email: "",
    phone: "",
    isPrimary: false,
  });

  // Product Link Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productData, setProductData] = useState({
    productId: "",
    vendorSku: "",
    purchasePrice: "",
    leadTimeDays: "7",
    minOrderQuantity: "1",
    isPreferred: false,
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchVendorDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes, pRes] = await Promise.all([
        fetch(`/api/inventory/vendors/${vendorId}`),
        fetch(`/api/inventory/vendors/${vendorId}/performance`),
      ]);

      const vJson = await vRes.json();
      if (!vRes.ok) throw new Error(vJson.error?.message || "Failed to load vendor");
      setVendor(vJson.data);

      if (pRes.ok) {
        const pJson = await pRes.json();
        setPerformance(pJson.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) fetchVendorDetails();
  }, [vendorId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change vendor status to ${newStatus}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inventory/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchVendorDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inventory/vendors/${vendorId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });
      if (!res.ok) throw new Error("Failed to add contact");
      setShowContactModal(false);
      setContactData({ name: "", designation: "", email: "", phone: "", isPrimary: false });
      fetchVendorDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openProductModal = async () => {
    try {
      const res = await fetch("/api/inventory/products");
      const json = await res.json();
      if (res.ok) setAllProducts(json.data || []);
      setShowProductModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inventory/vendors/${vendorId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productData,
          purchasePrice: Number(productData.purchasePrice),
          leadTimeDays: Number(productData.leadTimeDays),
          minOrderQuantity: Number(productData.minOrderQuantity),
        }),
      });
      if (!res.ok) throw new Error("Failed to link product to vendor");
      setShowProductModal(false);
      setProductData({
        productId: "",
        vendorSku: "",
        purchasePrice: "",
        leadTimeDays: "7",
        minOrderQuantity: "1",
        isPreferred: false,
      });
      fetchVendorDetails();
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
        <p className="text-sm">Loading Vendor 360 profile...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="py-20 text-center text-rose-400 flex flex-col items-center gap-3">
        <AlertCircle className="h-8 w-8 text-rose-400" />
        <p className="text-sm font-medium">{error || "Vendor not found"}</p>
        <Link
          href="/app/inventory/vendors"
          className="text-xs text-zinc-400 underline hover:text-zinc-200"
        >
          Return to Vendors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/app/inventory/vendors" className="hover:text-zinc-200 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          Back to Vendors
        </Link>
        <span>/</span>
        <span className="text-zinc-200 font-medium">{vendor.displayName}</span>
      </div>

      <PageHeader
        title={vendor.displayName}
        description={`${vendor.vendorCode} • ${vendor.legalName} • ${vendor.vendorType}`}
        actions={
          <div className="flex items-center gap-2">
            {/* Status selector */}
            <select
              value={vendor.status}
              disabled={actionLoading}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border focus:outline-none ${
                vendor.status === "ACTIVE"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  : vendor.status === "BLOCKED"
                  ? "bg-rose-950/80 text-rose-300 border-rose-800"
                  : vendor.status === "PENDING_REVIEW"
                  ? "bg-amber-950/80 text-amber-300 border-amber-800"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="PENDING_REVIEW">PENDING REVIEW</option>
            </select>

            <Link
              href={`/app/inventory/purchase-orders?new=true&vendorId=${vendor.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Create PO
            </Link>
          </div>
        }
      />

      <InventoryNav />

      {/* Profile Header Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/40">
                {vendor.vendorCode}
              </span>
              <span className="text-xs text-zinc-400 border-l border-zinc-700 pl-2">
                Created on {new Date(vendor.createdAt).toLocaleDateString()}
              </span>
              {vendor.createdBy && (
                <span className="text-xs text-zinc-500">
                  by {vendor.createdBy.firstName} {vendor.createdBy.lastName}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-zinc-300 pt-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-zinc-500" />
                <a href={`mailto:${vendor.email}`} className="hover:text-blue-400 underline">
                  {vendor.email}
                </a>
              </div>
              {vendor.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-zinc-500" />
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-zinc-500" />
                  <a
                    href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-400 flex items-center gap-1"
                  >
                    Website <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-500" />
                <span>
                  {[vendor.city, vendor.state, vendor.country].filter(Boolean).join(", ") || "India"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800/80 px-4 py-3 rounded-xl">
            <div className="text-center px-3 border-r border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Total POs</div>
              <div className="text-lg font-bold text-zinc-100">{performance?.numberOfPos ?? 0}</div>
            </div>
            <div className="text-center px-3 border-r border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Open Orders</div>
              <div className="text-lg font-bold text-blue-400">{performance?.openOrdersCount ?? 0}</div>
            </div>
            <div className="text-center px-3 border-r border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">On-Time Rate</div>
              <div className="text-lg font-bold text-emerald-400">
                {performance ? `${performance.onTimeDeliveryRate}%` : "—"}
              </div>
            </div>
            <div className="text-center px-3">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Rejection Rate</div>
              <div className="text-lg font-bold text-rose-400">
                {performance ? `${performance.rejectionRate}%` : "0%"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor 360 Tabs Navigation */}
      <div className="border-b border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        {[
          { id: "overview", label: "Overview & Performance", icon: Building2 },
          { id: "contacts", label: `Contacts (${vendor.contacts?.length ?? 0})`, icon: UserCheck },
          { id: "products", label: `Catalog (${vendor.vendorProducts?.length ?? 0})`, icon: Package },
          { id: "purchaseOrders", label: `Purchase Orders (${vendor.purchaseOrders?.length ?? 0})`, icon: FileSpreadsheet },
          { id: "goodsReceipts", label: `Goods Receipts (${vendor.goodsReceipts?.length ?? 0})`, icon: PackageCheck },
          { id: "invoices", label: `Invoices & AP (${vendor.invoices?.length ?? 0})`, icon: Receipt },
          { id: "payments", label: `Payments (${vendor.payments?.length ?? 0})`, icon: Banknote },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition whitespace-nowrap ${
                active
                  ? "border-blue-500 text-blue-400 bg-blue-500/5"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-blue-400" : "text-zinc-500"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Business & Commercial Terms */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-400" />
                Commercial Terms & Billing Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px] uppercase">Payment Terms</span>
                  <span className="font-semibold text-zinc-100 text-sm">{vendor.paymentTerms}</span>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px] uppercase">Standard Currency</span>
                  <span className="font-semibold text-zinc-100 text-sm">{vendor.currency}</span>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px] uppercase">Tax / GST Number</span>
                  <span className="font-mono text-zinc-200 text-sm">{vendor.taxId || "Not Registered"}</span>
                </div>
              </div>

              {/* Masked Banking Details */}
              <div className="border-t border-zinc-800 pt-4">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                  Bank Account Reference
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Bank Name</span>
                    <span className="text-zinc-200 font-medium">{vendor.bankName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Account Number (Masked)</span>
                    <span className="font-mono text-zinc-200">{vendor.bankAccountNumberMasked || "—"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Routing / Swift</span>
                    <span className="font-mono text-zinc-200">{vendor.bankRoutingCode || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Scorecard */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Vendor Performance Scorecard (Actual Data)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] uppercase block">Total Purchase Value</span>
                  <span className="text-base font-bold text-zinc-100">
                    {performance?.totalPurchaseValue !== null && performance?.totalPurchaseValue !== undefined
                      ? `₹${performance.totalPurchaseValue.toLocaleString()}`
                      : "Restricted"}
                  </span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] uppercase block">Avg Delivery Time</span>
                  <span className="text-base font-bold text-zinc-100">
                    {performance?.averageDeliveryTimeDays ?? 0} days
                  </span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] uppercase block">Total Units Received</span>
                  <span className="text-base font-bold text-emerald-400">
                    {performance?.totalReceivedQuantity ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] uppercase block">Total Damaged / Rejected</span>
                  <span className="text-base font-bold text-rose-400">
                    {performance?.totalRejectedQuantity ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Primary Contact & Address */}
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3 text-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Primary Contact
              </span>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-1.5">
                <div className="font-semibold text-zinc-100 text-sm">
                  {vendor.primaryContactName || "No primary contact set"}
                </div>
                {vendor.primaryContactEmail && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{vendor.primaryContactEmail}</span>
                  </div>
                )}
                {vendor.primaryContactPhone && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Phone className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{vendor.primaryContactPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3 text-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Registered Address
              </span>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-zinc-300 space-y-1">
                <div>{vendor.address || "No street address specified"}</div>
                <div>{[vendor.city, vendor.state].filter(Boolean).join(", ")}</div>
                <div className="font-medium text-zinc-200">{vendor.country || "India"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Contacts */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">Vendor Contacts Directory</h3>
            <button
              onClick={() => setShowContactModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Contact
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Primary</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {vendor.contacts?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No contacts recorded for this vendor.
                    </td>
                  </tr>
                ) : (
                  vendor.contacts.map((c: any) => (
                    <tr key={c.id} className="hover:bg-zinc-800/20">
                      <td className="py-3 px-4 font-medium text-zinc-100">{c.name}</td>
                      <td className="py-3 px-4 text-zinc-400">{c.designation || "—"}</td>
                      <td className="py-3 px-4 text-zinc-300">{c.email}</td>
                      <td className="py-3 px-4 text-zinc-400">{c.phone || "—"}</td>
                      <td className="py-3 px-4 text-center">
                        {c.isPrimary ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800/40">
                            Primary
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-medium text-emerald-400">{c.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Products Catalog */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Supplied Products & Pricing</h3>
              <p className="text-xs text-zinc-400">
                Vendor-specific purchase pricing, lead times, and minimum order quantities.
              </p>
            </div>
            <button
              onClick={openProductModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Link Product
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Product Name & SKU</th>
                  <th className="py-3 px-4">Vendor SKU</th>
                  <th className="py-3 px-4">Purchase Price</th>
                  <th className="py-3 px-4">Lead Time</th>
                  <th className="py-3 px-4">MOQ</th>
                  <th className="py-3 px-4 text-center">Preferred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {vendor.vendorProducts?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No products linked to this vendor yet.
                    </td>
                  </tr>
                ) : (
                  vendor.vendorProducts.map((vp: any) => (
                    <tr key={vp.id} className="hover:bg-zinc-800/20">
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-100">{vp.product?.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400">{vp.product?.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400">{vp.vendorSku || "—"}</td>
                      <td className="py-3 px-4 font-semibold text-zinc-100">
                        {vp.purchasePrice > 0
                          ? `${vp.currency || "₹"} ${vp.purchasePrice.toFixed(2)}`
                          : "Restricted"}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{vp.leadTimeDays} days</td>
                      <td className="py-3 px-4 text-zinc-300">{vp.minOrderQuantity} units</td>
                      <td className="py-3 px-4 text-center">
                        {vp.isPreferred ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold">
                            <Star className="h-3.5 w-3.5 fill-amber-400" /> Preferred
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Purchase Orders */}
      {activeTab === "purchaseOrders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">Purchase Orders Issued</h3>
            <Link
              href={`/app/inventory/purchase-orders?new=true&vendorId=${vendor.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              New PO
            </Link>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {vendor.purchaseOrders?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No purchase orders recorded for this vendor.
                    </td>
                  </tr>
                ) : (
                  vendor.purchaseOrders.map((po: any) => (
                    <tr key={po.id} className="hover:bg-zinc-800/20">
                      <td className="py-3 px-4 font-mono font-medium text-blue-400">
                        <Link href={`/app/inventory/purchase-orders/${po.id}`} className="hover:underline">
                          {po.poNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {new Date(po.poDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-100">
                        {po.total !== null ? `${po.currency || "₹"} ${po.total.toFixed(2)}` : "Restricted"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/app/inventory/purchase-orders/${po.id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                        >
                          View PO
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Goods Receipts */}
      {activeTab === "goodsReceipts" && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200">Goods Receipt History</h3>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Receipt Number</th>
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {vendor.goodsReceipts?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No goods receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  vendor.goodsReceipts.map((gr: any) => (
                    <tr key={gr.id} className="hover:bg-zinc-800/20">
                      <td className="py-3 px-4 font-mono font-medium text-zinc-100">{gr.receiptNumber}</td>
                      <td className="py-3 px-4 font-mono text-blue-400">
                        {gr.purchaseOrder?.poNumber || "—"}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {new Date(gr.receivedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {gr.warehouse ? `${gr.warehouse.name} (${gr.warehouse.code})` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                          {gr.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Invoices */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200">Vendor Invoices (Accounts Payable)</h3>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {vendor.invoices?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      No vendor invoices found in Accounts Payable.
                    </td>
                  </tr>
                ) : (
                  vendor.invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-zinc-800/20">
                      <td className="py-3 px-4 font-mono font-medium text-zinc-100">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-zinc-400">
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-medium text-zinc-200">₹{inv.total?.toFixed(2) ?? "—"}</td>
                      <td className="py-3 px-4 text-emerald-400">₹{inv.paidAmount?.toFixed(2) ?? "—"}</td>
                      <td className="py-3 px-4 font-semibold text-rose-400">₹{inv.balance?.toFixed(2) ?? "—"}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Payments */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200">Vendor Payment Disbursements</h3>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount Disbursed</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {vendor.payments?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No payments disbursed to this vendor yet.
                    </td>
                  </tr>
                ) : (
                  vendor.payments.map((pay: any) => (
                    <tr key={pay.id} className="hover:bg-zinc-800/20">
                      <td className="py-3 px-4 font-mono font-medium text-zinc-100">{pay.paymentReference}</td>
                      <td className="py-3 px-4 text-zinc-400">
                        {new Date(pay.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{pay.paymentMethod}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">
                        ${pay.amount?.toFixed(2) ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-semibold text-zinc-100">Add Vendor Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Designation</label>
                <input
                  type="text"
                  value={contactData.designation}
                  onChange={(e) => setContactData({ ...contactData, designation: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={contactData.phone}
                  onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="primaryContact"
                  checked={contactData.isPrimary}
                  onChange={(e) => setContactData({ ...contactData, isPrimary: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-0"
                />
                <label htmlFor="primaryContact" className="text-xs text-zinc-300">
                  Set as Primary Contact for this Vendor
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-semibold text-zinc-100">Link Product to Vendor</h3>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Select Product *</label>
                <select
                  required
                  value={productData.productId}
                  onChange={(e) => setProductData({ ...productData, productId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Product --</option>
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Vendor's SKU / Catalog #</label>
                <input
                  type="text"
                  placeholder="e.g. APX-998"
                  value={productData.vendorSku}
                  onChange={(e) => setProductData({ ...productData, vendorSku: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Purchase Price ({vendor.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={productData.purchasePrice}
                  onChange={(e) => setProductData({ ...productData, purchasePrice: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={productData.leadTimeDays}
                    onChange={(e) => setProductData({ ...productData, leadTimeDays: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Min Order Qty (MOQ)</label>
                  <input
                    type="number"
                    value={productData.minOrderQuantity}
                    onChange={(e) => setProductData({ ...productData, minOrderQuantity: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="preferredVendor"
                  checked={productData.isPreferred}
                  onChange={(e) => setProductData({ ...productData, isPreferred: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-0"
                />
                <label htmlFor="preferredVendor" className="text-xs text-zinc-300">
                  Mark this supplier as Preferred Vendor for this product
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
