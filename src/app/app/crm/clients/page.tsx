"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CrmNav } from "@/modules/crm/components/crm-nav";
import {
  Building,
  Plus,
  Search,
  Filter,
  Users,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Globe,
  Phone,
  Mail,
  X,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { ArrowUpDown, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";

interface ClientListItem {
  id: string;
  code: string;
  name: string;
  industry?: string | null;
  status: string;
  tier: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
  } | null;
  _count: {
    contacts: number;
    opportunities: number;
    activities: number;
    tasks: number;
  };
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
}

export default function ClientsDirectoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [tierFilter, setTierFilter] = useState(searchParams.get("tier") || "ALL");
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get("ownerId") || "ALL");
  const [datePreset, setDatePreset] = useState(searchParams.get("datePreset") || "ALL");

  // Pagination & Sorting
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10) || 1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  );

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState<"ENTERPRISE" | "MID_MARKET" | "SMB">("MID_MARKET");
  const [ownerId, setOwnerId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (tierFilter !== "ALL") params.set("tier", tierFilter);
      if (ownerFilter !== "ALL") params.set("ownerId", ownerFilter);
      if (datePreset !== "ALL") params.set("datePreset", datePreset);
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/crm/clients?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setClients(data.data.clients || []);
        if (data.meta) {
          setTotalPages(data.meta.totalPages || 1);
          setTotalRecords(data.meta.total || 0);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data.employees || []);
      }
    } catch {}
  };

  // Sync URL query state
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (tierFilter !== "ALL") params.set("tier", tierFilter);
    if (ownerFilter !== "ALL") params.set("ownerId", ownerFilter);
    if (datePreset !== "ALL") params.set("datePreset", datePreset);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (page > 1) params.set("page", String(page));
    if (sortBy !== "updatedAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);

    const queryString = params.toString();
    const newUrl = queryString ? `/app/crm/clients?${queryString}` : "/app/crm/clients";
    window.history.replaceState(null, "", newUrl);
  }, [statusFilter, tierFilter, ownerFilter, datePreset, debouncedSearch, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchClients();
  }, [statusFilter, tierFilter, ownerFilter, datePreset, debouncedSearch, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setTierFilter("ALL");
    setOwnerFilter("ALL");
    setDatePreset("ALL");
    setSearchTerm("");
    setDebouncedSearch("");
    setPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    tierFilter !== "ALL" ||
    ownerFilter !== "ALL" ||
    datePreset !== "ALL" ||
    searchTerm.trim().length > 0;

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError("Company name is required");
      return;
    }

    try {
      setIsCreating(true);
      const res = await fetch("/api/crm/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          industry: industry || undefined,
          website: website || undefined,
          email: email || undefined,
          phone: phone || undefined,
          tier,
          ownerId: ownerId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error?.message || "Failed to create client");
        return;
      }

      setCreateModalOpen(false);
      setName("");
      setIndustry("");
      setWebsite("");
      setEmail("");
      setPhone("");
      fetchClients();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">Active</span>;
      case "PROSPECT":
        return <span className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400 uppercase">Prospect</span>;
      case "LEAD":
        return <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 uppercase">Lead</span>;
      case "CHURNED":
        return <span className="rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold text-rose-400 uppercase">Churned</span>;
      default:
        return <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 uppercase">{status}</span>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "ENTERPRISE":
        return <span className="rounded bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-400 uppercase">Enterprise</span>;
      case "MID_MARKET":
        return <span className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400 uppercase">Mid-Market</span>;
      default:
        return <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 uppercase">SMB</span>;
    }
  };

  return (
    <div className="space-y-6">
      <CrmNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Corporate Client Accounts"
          description="Client directory, account management, multi-stakeholder contacts, and Customer 360 overviews."
        />
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-[#0f172a]/90 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Clients</option>
              <option value="PROSPECT">Prospects</option>
              <option value="LEAD">Leads</option>
              <option value="INACTIVE">Inactive</option>
              <option value="CHURNED">Churned</option>
            </select>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Account Tiers</option>
              <option value="ENTERPRISE">Enterprise Tier</option>
              <option value="MID_MARKET">Mid-Market Tier</option>
              <option value="SMB">SMB Tier</option>
            </select>

            {/* Owner Filter */}
            <select
              value={ownerFilter}
              onChange={(e) => {
                setOwnerFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Account Leads</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>

            {/* Date Preset Filter */}
            <select
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Creation Dates</option>
              <option value="today">Created Today</option>
              <option value="yesterday">Created Yesterday</option>
              <option value="last7Days">Last 7 Days</option>
              <option value="last30Days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
            </select>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search company, code, phone, industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-full rounded-md border border-slate-800 bg-slate-900 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Active:</span>
            {statusFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300">
                Status: {statusFilter}
                <button
                  onClick={() => {
                    setStatusFilter("ALL");
                    setPage(1);
                  }}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {tierFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300">
                Tier: {tierFilter}
                <button
                  onClick={() => {
                    setTierFilter("ALL");
                    setPage(1);
                  }}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {ownerFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
                Lead: {employees.find((e) => e.id === ownerFilter)?.firstName || "Owner"}
                <button
                  onClick={() => {
                    setOwnerFilter("ALL");
                    setPage(1);
                  }}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {datePreset !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
                Date: {datePreset}
                <button
                  onClick={() => {
                    setDatePreset("ALL");
                    setPage(1);
                  }}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                &ldquo;{debouncedSearch}&rdquo;
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDebouncedSearch("");
                    setPage(1);
                  }}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 underline font-medium ml-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Clients Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0c1322] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">Loading client directory...</div>
        ) : clients.length === 0 ? (
          <div className="p-16 text-center text-xs">
            <p className="text-slate-300 font-medium text-sm">
              {hasActiveFilters ? "No records match your filters." : "No client accounts found."}
            </p>
            <p className="text-slate-500 mt-1">
              {hasActiveFilters
                ? "Try resetting or broadening your status, tier, owner, date or search criteria."
                : "Add your first corporate client account to commence relationship management."}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Client</span>
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-[#0f172a] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Client Account</span>
                    {sortBy === "name" ? (
                      sortOrder === "asc" ? <ChevronUp className="h-3 w-3 text-blue-400" /> : <ChevronDown className="h-3 w-3 text-blue-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    {sortBy === "status" ? (
                      sortOrder === "asc" ? <ChevronUp className="h-3 w-3 text-blue-400" /> : <ChevronDown className="h-3 w-3 text-blue-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("tier")}
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Tier</span>
                    {sortBy === "tier" ? (
                      sortOrder === "asc" ? <ChevronUp className="h-3 w-3 text-blue-400" /> : <ChevronDown className="h-3 w-3 text-blue-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("industry")}
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Industry</span>
                    {sortBy === "industry" ? (
                      sortOrder === "asc" ? <ChevronUp className="h-3 w-3 text-blue-400" /> : <ChevronDown className="h-3 w-3 text-blue-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-600" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3">Account Lead</th>
                <th className="px-4 py-3 text-center">Contacts</th>
                <th className="px-4 py-3 text-center">Deals</th>
                <th className="px-4 py-3 text-right">Customer 360</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link href={`/app/crm/clients/${c.id}`} className="group flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {c.name}
                        </span>
                        <span className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                          {c.code}
                        </span>
                      </div>
                      {c.website && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Globe className="h-2.5 w-2.5" />
                          {c.website.replace("https://", "")}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                  <td className="px-4 py-3">{getTierBadge(c.tier)}</td>
                  <td className="px-4 py-3 text-slate-300">{c.industry || "General"}</td>
                  <td className="px-4 py-3">
                    {c.owner ? (
                      <span className="text-slate-200 font-medium">
                        {c.owner.firstName} {c.owner.lastName}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                      {c._count.contacts}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-blue-950 px-2 py-0.5 text-[11px] font-mono text-blue-300 border border-blue-800/50">
                      {c._count.opportunities}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/crm/clients/${c.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:bg-slate-700 transition-colors"
                    >
                      <span>360 Profile</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Server-Side Pagination Bar */}
        {!loading && clients.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={limit}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </div>

      {/* Add Client Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-semibold text-white">Create Corporate Client Account</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Cybernetics Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Industry</label>
                  <input
                    type="text"
                    placeholder="e.g. Technology, Healthcare"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Account Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ENTERPRISE">Enterprise Tier</option>
                    <option value="MID_MARKET">Mid-Market Tier</option>
                    <option value="SMB">SMB Tier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="info@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Primary Phone</label>
                  <input
                    type="tel"
                    placeholder="+1-800-..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Account Owner</label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Current User</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
