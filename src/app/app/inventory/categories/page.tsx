"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  FolderTree,
  Plus,
  RefreshCw,
  X,
  Package,
  Briefcase,
  ChevronRight,
  Folder,
} from "lucide-react";

interface CategoryItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  parentId: string | null;
  parent?: { id: string; name: string; code: string } | null;
  children?: CategoryItem[];
  _count?: { products: number; services: number };
}

export default function CategoriesPage() {
  const [treeData, setTreeData] = useState<CategoryItem[]>([]);
  const [flatData, setFlatData] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "BOTH",
    parentId: "",
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const [treeRes, flatRes] = await Promise.all([
        fetch("/api/inventory/categories?tree=true"),
        fetch("/api/inventory/categories"),
      ]);
      const treeJson = await treeRes.json();
      const flatJson = await flatRes.json();
      if (!treeRes.ok) throw new Error(treeJson.error?.message || "Failed to load categories");
      setTreeData(treeJson.data || []);
      setFlatData(flatJson.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        parentId: formData.parentId || undefined,
      };

      const res = await fetch("/api/inventory/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create category");

      setShowModal(false);
      setFormData({
        code: "",
        name: "",
        description: "",
        type: "BOTH",
        parentId: "",
      });
      fetchCategories();
    } catch (err: any) {
      setFormError(err.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product & Service Categories"
        description="Hierarchical classifications, organizational taxonomies, and cross-catalog tagging."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchCategories}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" />
              New Category
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

      {/* Categories Hierarchy Visualization and Flat Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree View */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FolderTree className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Category Hierarchy Tree</h3>
          </div>

          {loading ? (
            <div className="p-4 text-xs text-zinc-500">Loading tree structure...</div>
          ) : treeData.length === 0 ? (
            <div className="p-4 text-xs text-zinc-500">No categories created yet.</div>
          ) : (
            <div className="space-y-2 text-xs">
              {treeData.map((node) => (
                <div key={node.id} className="space-y-1">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-800 text-zinc-200">
                    <Folder className="h-4 w-4 text-indigo-400" />
                    <span className="font-semibold">{node.name}</span>
                    <span className="font-mono text-[10px] text-zinc-500">({node.code})</span>
                  </div>

                  {node.children && node.children.length > 0 && (
                    <div className="pl-6 border-l border-zinc-800 space-y-1 my-1">
                      {node.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-2 p-1.5 rounded bg-zinc-900/40 text-zinc-300 text-[11px]"
                        >
                          <ChevronRight className="h-3 w-3 text-zinc-500" />
                          <span>{child.name}</span>
                          <span className="font-mono text-[10px] text-zinc-500">({child.code})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Directory Table */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 font-semibold text-sm text-zinc-100">
            All Configured Categories ({flatData.length})
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">Code</th>
                  <th className="py-3 px-4 font-medium">Category Name</th>
                  <th className="py-3 px-4 font-medium">Parent Category</th>
                  <th className="py-3 px-4 font-medium">Scope</th>
                  <th className="py-3 px-4 font-medium text-right">Products</th>
                  <th className="py-3 px-4 font-medium text-right">Services</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {flatData.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-400">{c.code}</td>
                    <td className="py-3 px-4 font-medium text-zinc-100">{c.name}</td>
                    <td className="py-3 px-4 text-zinc-400">
                      {c.parent ? `${c.parent.name} (${c.parent.code})` : "— (Root)"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300">
                        {c.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-zinc-200">
                      {c._count?.products || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-zinc-200">
                      {c._count?.services || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Create Category</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Category Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CAT-NET"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Networking & Switching"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Parent Category (Optional)</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">None (Top-Level Root)</option>
                  {flatData.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Catalog Scope</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="BOTH">Both Products & Services</option>
                  <option value="PRODUCT">Physical Products Only</option>
                  <option value="SERVICE">Services Only</option>
                </select>
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
