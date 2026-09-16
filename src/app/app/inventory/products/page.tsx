"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowRight,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  X,
  RefreshCw,
} from "lucide-react";

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string;
  productType: string;
  unitOfMeasure: string;
  sellingPrice: number;
  costPrice: number | null;
  taxRate: number;
  status: string;
  minStockLevel: number;
  maxStockLevel: number;
  reorderLevel: number;
  totalStock: number;
  availableStock: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  inventoryCount: number;
  leadTimeDays: number | null;
  reorderQuantity: number | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("ALL");
  const [productType, setProductType] = useState("ALL");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    categoryId: "",
    productType: "PHYSICAL",
    unitOfMeasure: "UNIT",
    sellingPrice: "",
    costPrice: "",
    taxRate: "10",
    minStockLevel: "5",
    maxStockLevel: "100",
    reorderLevel: "10",
    initialWarehouseId: "",
    initialQuantity: "",
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stockStatus !== "ALL") params.set("stockStatus", stockStatus);
      if (productType !== "ALL") params.set("productType", productType);

      const res = await fetch(`/api/inventory/products?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load products");
      setProducts(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadAuxData = async () => {
    try {
      const [catsRes, whsRes] = await Promise.all([
        fetch("/api/inventory/categories?type=PRODUCT"),
        fetch("/api/inventory/warehouses"),
      ]);
      const catsJson = await catsRes.json();
      const whsJson = await whsRes.json();
      if (catsJson.data) setCategories(catsJson.data);
      if (whsJson.data) setWarehouses(whsJson.data);
    } catch (e) {
      console.error("Auxiliary data load error", e);
    }
  };

  useEffect(() => {
    fetchProducts();
    loadAuxData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload: any = {
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        productType: formData.productType,
        unitOfMeasure: formData.unitOfMeasure,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        taxRate: parseFloat(formData.taxRate) || 0,
        minStockLevel: parseFloat(formData.minStockLevel) || 0,
        maxStockLevel: parseFloat(formData.maxStockLevel) || 0,
        reorderLevel: parseFloat(formData.reorderLevel) || 10,
      };

      if (formData.initialWarehouseId && parseFloat(formData.initialQuantity) > 0) {
        payload.initialStock = {
          warehouseId: formData.initialWarehouseId,
          quantity: parseFloat(formData.initialQuantity),
        };
      }

      const res = await fetch("/api/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create product");

      setShowModal(false);
      setFormData({
        sku: "",
        name: "",
        description: "",
        categoryId: "",
        productType: "PHYSICAL",
        unitOfMeasure: "UNIT",
        sellingPrice: "",
        costPrice: "",
        taxRate: "10",
        minStockLevel: "5",
        maxStockLevel: "100",
        reorderLevel: "10",
        initialWarehouseId: "",
        initialQuantity: "",
      });
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products Master Catalog"
        description="Authoritative master registry of physical SKUs, specifications, pricing, and multi-location inventory."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchProducts}
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
              New Product
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
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by SKU, Product Name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setTimeout(fetchProducts, 0);
            }}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock Alert</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          <select
            value={productType}
            onChange={(e) => {
              setProductType(e.target.value);
              setTimeout(fetchProducts, 0);
            }}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="PHYSICAL">Physical Product</option>
            <option value="CONSUMABLE">Consumable</option>
            <option value="ASSET">Fixed Asset</option>
          </select>
        </div>
      </div>

      {/* Products Directory Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading product master...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <h3 className="text-sm font-medium text-zinc-300">No products found</h3>
            <p className="text-xs text-zinc-500 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">SKU / Code</th>
                  <th className="py-3 px-4 font-medium">Product Name</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium text-right">Selling Price</th>
                  <th className="py-3 px-4 font-medium text-right">Cost Price</th>
                  <th className="py-3 px-4 font-medium text-right">Total Stock</th>
                  <th className="py-3 px-4 font-medium text-right">Available</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-400">
                      <Link href={`/app/inventory/products/${p.id}`} className="hover:underline">
                        {p.sku}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-100">
                      <div>{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-zinc-500 truncate max-w-xs">{p.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{p.categoryName}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300">
                        {p.productType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-zinc-100">
                      ₹{p.sellingPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400 font-mono">
                      {p.costPrice !== null ? `₹${p.costPrice.toLocaleString()}` : "••••"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-100">
                      {p.totalStock} {p.unitOfMeasure}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-300">
                      {p.availableStock}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.stockStatus === "OUT_OF_STOCK" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <XCircle className="h-3 w-3" /> OUT OF STOCK
                        </span>
                      ) : p.stockStatus === "LOW_STOCK" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="h-3 w-3" /> LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/app/inventory/products/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Create Product Master Record</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    SKU (Unique Identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SKU-SRV-9000"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HyperCluster Blade 4U"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Enterprise specifications, compatibility, and features..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  <label className="block text-zinc-300 font-medium mb-1">Product Type</label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="PHYSICAL">Physical Product</option>
                    <option value="CONSUMABLE">Consumable</option>
                    <option value="ASSET">Fixed Asset</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Unit of Measure</label>
                  <select
                    value={formData.unitOfMeasure}
                    onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="UNIT">UNIT</option>
                    <option value="PIECE">PIECE</option>
                    <option value="BOX">BOX</option>
                    <option value="KG">KG</option>
                    <option value="METER">METER</option>
                    <option value="SET">SET</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Selling Price ($) *</label>
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
                  <label className="block text-zinc-300 font-medium mb-1">
                    Cost Price ($) <span className="text-zinc-500">(RBAC Protected)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Reorder Threshold *</label>
                  <input
                    type="number"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Max Stock Level</label>
                  <input
                    type="number"
                    value={formData.maxStockLevel}
                    onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Initial Warehouse Stock Allocation */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3 space-y-3">
                <span className="text-xs font-semibold text-zinc-200">
                  Initial Warehouse Stocking (Optional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1">Deposit Warehouse</label>
                    <select
                      value={formData.initialWarehouseId}
                      onChange={(e) => setFormData({ ...formData, initialWarehouseId: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.code} - {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1">Initial Quantity</label>
                    <input
                      type="number"
                      placeholder="e.g. 25"
                      value={formData.initialQuantity}
                      onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
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
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
