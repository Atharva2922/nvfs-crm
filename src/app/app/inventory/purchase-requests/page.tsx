"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  X,
  FileSpreadsheet,
  Building2,
  User,
  Calendar,
} from "lucide-react";

interface PRItem {
  id: string;
  requestNumber: string;
  requester: { id: string; firstName: string; lastName: string; email: string };
  department: { id: string; name: string; code: string };
  approvedBy?: { id: string; firstName: string; lastName: string };
  requestDate: string;
  requiredDate: string;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedCost: number;
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED" | "CONVERTED_TO_PO";
  items: Array<{
    id: string;
    productId: string;
    description: string;
    quantity: number;
    estimatedUnitCost: number;
    estimatedTotal: number;
    product?: { id: string; name: string; sku: string };
  }>;
}

export default function PurchaseRequestsPage() {
  const [requests, setRequests] = useState<PRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    reason: "",
    requiredDate: "",
    priority: "MEDIUM",
    notes: "",
    submitImmediately: true,
    items: [{ productId: "", quantity: 1, estimatedUnitCost: "" }],
  });

  // Convert to PO Modal
  const [convertPr, setConvertPr] = useState<PRItem | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [convertData, setConvertData] = useState({
    vendorId: "",
    expectedDeliveryDate: "",
    paymentTerms: "NET_30",
  });
  const [converting, setConverting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);

      const res = await fetch(`/api/inventory/purchase-requests?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load requests");
      setRequests(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, priorityFilter]);

  const openCreateModal = async () => {
    try {
      const pRes = await fetch("/api/inventory/products");
      const pJson = await pRes.json();
      if (pRes.ok) setProducts(pJson.data || []);

      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      setFormData({
        reason: "",
        requiredDate: nextWeek,
        priority: "MEDIUM",
        notes: "",
        submitImmediately: true,
        items: [{ productId: "", quantity: 1, estimatedUnitCost: "" }],
      });
      setShowModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 1, estimatedUnitCost: "" }],
    });
  };

  const handleRemoveItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, idx) => idx !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formData.items];
    (updated[index] as any)[field] = value;
    setFormData({ ...formData, items: updated });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        ...formData,
        items: formData.items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          estimatedUnitCost: i.estimatedUnitCost ? Number(i.estimatedUnitCost) : undefined,
        })),
      };

      const res = await fetch("/api/inventory/purchase-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create PR");

      setShowModal(false);
      fetchRequests();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (id: string, transition: string, notes?: string) => {
    if (!confirm(`Are you sure you want to ${transition.toLowerCase()} this Purchase Request?`)) return;
    try {
      const res = await fetch(`/api/inventory/purchase-requests/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transition, notesOrReason: notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Transition failed");
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openConvertModal = async (pr: PRItem) => {
    setConvertPr(pr);
    const defaultDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setConvertData({ vendorId: "", expectedDeliveryDate: defaultDate, paymentTerms: "NET_30" });
    try {
      const res = await fetch("/api/inventory/vendors?status=ACTIVE");
      const json = await res.json();
      if (res.ok) setVendors(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertPr) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/inventory/purchase-requests/${convertPr.id}/convert-to-po`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(convertData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to convert PR to PO");
      setConvertPr(null);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Purchase Requests"
        description="Department requisitions, approval workflow, low-stock replenishment, and conversion to PO."
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Purchase Request
          </button>
        }
      />

      <InventoryNav />

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/40 border border-zinc-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search request #, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

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
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CONVERTED_TO_PO">Converted to PO</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 ml-2"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <button
            onClick={fetchRequests}
            title="Refresh"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg ml-auto sm:ml-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* PR Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading purchase requests...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-400" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <ClipboardList className="h-8 w-8 text-zinc-600 mb-1" />
            <p className="text-sm font-medium text-zinc-300">No purchase requests found</p>
            <p className="text-xs text-zinc-500">Create a requisition or convert low stock alerts into PRs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Requester & Dept</th>
                  <th className="py-3 px-4">Required Date</th>
                  <th className="py-3 px-4">Items / Est. Cost</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {requests.map((pr) => (
                  <tr key={pr.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-zinc-100">{pr.requestNumber}</div>
                      <div className="text-[11px] text-zinc-400 line-clamp-1">{pr.reason}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-200">
                        {pr.requester.firstName} {pr.requester.lastName}
                      </div>
                      <div className="text-[10px] text-zinc-500">{pr.department.name}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-zinc-200">{new Date(pr.requiredDate).toLocaleDateString()}</div>
                      <div className="text-[10px] text-zinc-500">
                        Req: {new Date(pr.requestDate).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-100">₹{pr.estimatedCost.toFixed(2)}</div>
                      <div className="text-[10px] text-zinc-400">{pr.items.length} line items</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          pr.priority === "URGENT"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : pr.priority === "HIGH"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {pr.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          pr.status === "APPROVED"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : pr.status === "CONVERTED_TO_PO"
                            ? "bg-blue-950 text-blue-300 border border-blue-800"
                            : pr.status === "REJECTED"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : pr.status === "UNDER_REVIEW"
                            ? "bg-purple-950 text-purple-300 border border-purple-800"
                            : pr.status === "SUBMITTED"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {pr.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {pr.status === "DRAFT" && (
                          <button
                            onClick={() => handleTransition(pr.id, "SUBMIT")}
                            className="px-2 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded text-[11px] font-medium"
                          >
                            Submit
                          </button>
                        )}

                        {pr.status === "SUBMITTED" && (
                          <button
                            onClick={() => handleTransition(pr.id, "REVIEW")}
                            className="px-2 py-1 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded text-[11px] font-medium"
                          >
                            Review
                          </button>
                        )}

                        {["SUBMITTED", "UNDER_REVIEW"].includes(pr.status) && (
                          <>
                            <button
                              onClick={() => handleTransition(pr.id, "APPROVE")}
                              className="px-2 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded text-[11px] font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleTransition(pr.id, "REJECT", prompt("Reason for rejection:") || "Rejected")}
                              className="px-2 py-1 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 rounded text-[11px] font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {pr.status === "APPROVED" && (
                          <button
                            onClick={() => openConvertModal(pr)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium transition shadow-sm"
                          >
                            <FileSpreadsheet className="h-3 w-3" />
                            Convert to PO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create PR Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-500" />
                New Purchase Request
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Reason / Purpose *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4 Server Expansion / Project hardware replenishment"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Required Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.requiredDate}
                    onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="submitNow"
                    checked={formData.submitImmediately}
                    onChange={(e) => setFormData({ ...formData, submitImmediately: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="submitNow" className="text-xs text-zinc-300">
                    Submit immediately for manager review
                  </label>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t border-zinc-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-300 uppercase">Requisition Items</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    + Add Another Item
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Est. Cost"
                        value={item.estimatedUnitCost}
                        onChange={(e) => handleItemChange(idx, "estimatedUnitCost", e.target.value)}
                        className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-zinc-500 hover:text-rose-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
                >
                  {submitting ? "Submitting..." : "Save Purchase Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to PO Modal */}
      {convertPr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-500" />
              Convert {convertPr.requestNumber} to PO
            </h3>
            <p className="text-xs text-zinc-400">
              Select vendor and target delivery date to create a formal Purchase Order.
            </p>

            <form onSubmit={handleConvertSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Select Vendor *</label>
                <select
                  required
                  value={convertData.vendorId}
                  onChange={(e) => setConvertData({ ...convertData, vendorId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.displayName} ({v.vendorCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Expected Delivery Date *</label>
                <input
                  type="date"
                  required
                  value={convertData.expectedDeliveryDate}
                  onChange={(e) => setConvertData({ ...convertData, expectedDeliveryDate: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Payment Terms</label>
                <select
                  value={convertData.paymentTerms}
                  onChange={(e) => setConvertData({ ...convertData, paymentTerms: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="NET_15">Net 15</option>
                  <option value="NET_30">Net 30</option>
                  <option value="NET_60">Net 60</option>
                  <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                  <option value="ADVANCE">Advance</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setConvertPr(null)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
                >
                  {converting ? "Creating PO..." : "Generate Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
