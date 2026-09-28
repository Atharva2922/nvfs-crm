"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Printer,
  Edit,
  Boxes,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Building2,
  Tag,
  Barcode,
  Layers,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ItemDetailStandalonePage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try finding in localStorage first
    try {
      const stored = localStorage.getItem("nfvs_inventory_items");
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = parsed.find(
          (p: any) =>
            String(p.id).toLowerCase() === id.toLowerCase() ||
            String(p.sku).toLowerCase() === id.toLowerCase()
        );
        if (match) {
          setItem(match);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Fetch from backend products API
    fetch(`/api/inventory/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setItem(data.data);
        }
      })
      .catch((err) => console.warn(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const fallback = item || {
    sku: id || "SKU-ITEM",
    name: "Inventory Product Item",
    brand: "Enterprise OEM",
    manufacturer: "Certified Manufacturer",
    hsnCode: "84715000",
    unit: "units",
    stock: "Available in warehouse",
    sellingPrice: "₹1,45,000",
    costPrice: "₹1,20,000",
    salesAccount: "Sales",
    purchaseAccount: "Cost of Goods Sold",
    status: "ACTIVE",
    description: "Enterprise grade tracked inventory item with double-entry accounting reconciliation.",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 p-6 sm:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/accounts/inventory/items"
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                {fallback.sku}
              </span>
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                {fallback.status || "ACTIVE"}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              {fallback.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/app/accounts/inventory/items/new?edit=${encodeURIComponent(fallback.sku || fallback.id || id)}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-slate-200 dark:border-slate-800"
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Edit Item
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 text-xs border-slate-200 dark:border-slate-800"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print Spec
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/app/accounts/inventory/items")}
            className="h-9 text-xs bg-blue-600 hover:bg-blue-500 text-white"
          >
            Back to Items
          </Button>
        </div>
      </div>

      {/* Main Spec Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Standard Selling Rate</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {fallback.sellingPrice || "₹0"}
          </div>
          <div className="text-xs text-slate-500 mt-2">Account: {fallback.salesAccount || "Sales"}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Unit Cost Price</div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 mt-1">
            {fallback.costPrice || fallback.purchasePrice || "₹0"}
          </div>
          <div className="text-xs text-slate-500 mt-2">Account: {fallback.purchaseAccount || "COGS"}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Stock Availability</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {fallback.stock || "Tracked"}
          </div>
          <div className="text-xs text-slate-500 mt-2">Unit: {fallback.unit || "units"}</div>
        </div>
      </div>

      {/* Specifications */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
          General & Accounting Details
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5">Brand</span>
            <span className="font-semibold text-slate-900 dark:text-white">{fallback.brand || "Dell"}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Manufacturer</span>
            <span className="font-semibold text-slate-900 dark:text-white">{fallback.manufacturer || "OEM"}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">HSN Code</span>
            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{fallback.hsnCode || "84715000"}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Tax Preference</span>
            <span className="font-semibold text-slate-900 dark:text-white">{fallback.taxPreference || "Taxable"}</span>
          </div>
        </div>

        <div>
          <span className="text-slate-500 text-xs block mb-1">Item Description</span>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
            {fallback.description || "High-performance enterprise hardware registered under centralized inventory ledger."}
          </p>
        </div>
      </div>
    </div>
  );
}
