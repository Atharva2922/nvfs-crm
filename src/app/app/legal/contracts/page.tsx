"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  FileText,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  ChevronRight,
  Calendar,
  IndianRupee,
  AlertTriangle,
  Building2,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function ContractsListPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchContracts();
  }, [search, statusFilter, typeFilter, page]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("contractType", typeFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/legal/contracts?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setContracts(json.data.contracts);
        setTotalPages(json.data.pagination.totalPages || 1);
        setTotalCount(json.data.pagination.total || 0);
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "PENDING_APPROVAL":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "UNDER_REVIEW":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "EXPIRING_SOON":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "EXPIRED":
      case "TERMINATED":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-700/50 text-slate-400 border-slate-700";
    }
  };

  const formatCurrency = (val?: number | null, curr = "INR") => {
    if (val === undefined || val === null) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Indefinite";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Contracts & Master Agreements"
          description="Enterprise contract vault, bilateral obligations, counterparty terms, auto-renewals, and execution states."
        />
        <Link
          href="/app/legal/contracts/new"
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Contract</span>
        </Link>
      </div>

      <LegalNav />

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search contracts by title, number, party..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-amber-500/50 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING_SOON">Expiring Soon</option>
              <option value="EXPIRED">Expired</option>
              <option value="TERMINATED">Terminated</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-amber-500/50 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="MSA">MSA</option>
              <option value="NDA">NDA</option>
              <option value="SLA">SLA</option>
              <option value="VENDOR_AGREEMENT">Vendor Agreement</option>
              <option value="EMPLOYMENT">Employment</option>
              <option value="LEASE">Lease</option>
              <option value="LICENSING">Licensing</option>
              <option value="PARTNERSHIP">Partnership</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FileText className="mx-auto h-8 w-8 text-slate-600" />
            <p className="text-sm font-semibold">No contracts found</p>
            <p className="text-xs text-slate-500">Try adjusting your search criteria or register a new contract.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Contract Code & Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Counterparty</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Auto Renew</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <Link
                          href={`/app/legal/contracts/${c.id}`}
                          className="text-slate-200 font-semibold hover:text-amber-400 transition-colors"
                        >
                          {c.title}
                        </Link>
                        <div className="text-[11px] text-amber-400/80 font-mono mt-0.5">{c.contractNumber}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300 font-medium">
                        {c.contractType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.client ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-blue-400" />
                          <span>{c.client.name}</span>
                        </div>
                      ) : c.vendor ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-purple-400" />
                          <span>{c.vendor.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Internal / Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {formatCurrency(c.value, c.currency)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(c.endDate)}
                    </td>
                    <td className="py-3 px-4">
                      {c.autoRenew ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Yes ({c.renewalTermMonths || 12}m)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(c.status)}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/app/legal/contracts/${c.id}`}
                        className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <span>Workspace</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{contracts.length}</span> of{" "}
            <span className="font-semibold text-slate-200">{totalCount}</span> contracts
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border border-slate-800 px-2.5 py-1 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              Previous
            </button>
            <span className="text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded border border-slate-800 px-2.5 py-1 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
