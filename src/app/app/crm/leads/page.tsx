"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CrmNav } from "@/modules/crm/components/crm-nav";
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Building,
  Mail,
  Phone,
  IndianRupee,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
  Edit2,
  Trash2,
  User,
  Check,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { ArrowUpDown, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";

interface LeadItem {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  source: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED" | "LOST";
  estimatedValue?: number | null;
  notes?: string | null;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    designation?: string;
  } | null;
  convertedClient?: {
    id: string;
    name: string;
    code: string;
  } | null;
  convertedContact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  activities?: Array<{
    id: string;
    type: string;
    subject: string;
    description?: string | null;
    performedAt: string;
    performedBy: { firstName: string; lastName: string };
  }>;
  createdAt: string;
}

interface ClientOption {
  id: string;
  name: string;
  code: string;
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
}

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [sourceFilter, setSourceFilter] = useState(searchParams.get("source") || "ALL");
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get("ownerId") || "ALL");
  const [datePreset, setDatePreset] = useState(searchParams.get("datePreset") || "ALL");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");

  // Pagination & Sorting
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10) || 1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  );

  // Capture Lead Modal
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [source, setSource] = useState<any>("WEBSITE");
  const [estValue, setEstValue] = useState<number>(50000);
  const [assignedOwnerId, setAssignedOwnerId] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState("");

  // Lead Detail Modal / Drawer
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit Lead Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editSource, setEditSource] = useState<any>("WEBSITE");
  const [editStatus, setEditStatus] = useState<any>("NEW");
  const [editEstValue, setEditEstValue] = useState<number>(50000);
  const [editOwnerId, setEditOwnerId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState("");

  // Convert Lead Modal
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<LeadItem | null>(null);
  const [createOpp, setCreateOpp] = useState(true);
  const [dealVal, setDealVal] = useState(50000);
  const [matchedExistingClientId, setMatchedExistingClientId] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (sourceFilter !== "ALL") params.set("source", sourceFilter);
      if (ownerFilter !== "ALL") params.set("ownerId", ownerFilter);
      if (datePreset !== "ALL") params.set("datePreset", datePreset);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/crm/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setLeads(data.data.leads || []);
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

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/crm/clients?limit=100");
      const data = await res.json();
      if (data.success) {
        setClients(data.data.clients || []);
      }
    } catch {}
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

  // Synchronize URL with active query state
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (sourceFilter !== "ALL") params.set("source", sourceFilter);
    if (ownerFilter !== "ALL") params.set("ownerId", ownerFilter);
    if (datePreset !== "ALL") params.set("datePreset", datePreset);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (page > 1) params.set("page", String(page));
    if (sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);

    const queryString = params.toString();
    const newUrl = queryString ? `/app/crm/leads?${queryString}` : "/app/crm/leads";
    window.history.replaceState(null, "", newUrl);
  }, [statusFilter, sourceFilter, ownerFilter, datePreset, debouncedSearch, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, sourceFilter, ownerFilter, datePreset, debouncedSearch, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchClients();
    fetchEmployees();
  }, []);

  // Handle direct navigation to lead by ID (e.g. from global search)
  useEffect(() => {
    const targetId = searchParams.get("id");
    if (targetId && !detailModalOpen) {
      openLeadDetail(targetId);
    }
  }, [searchParams]);

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
    setSourceFilter("ALL");
    setOwnerFilter("ALL");
    setDatePreset("ALL");
    setSearchTerm("");
    setDebouncedSearch("");
    setPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    sourceFilter !== "ALL" ||
    ownerFilter !== "ALL" ||
    datePreset !== "ALL" ||
    searchTerm.trim().length > 0;

  useEffect(() => {
    fetchClients();
    fetchEmployees();
  }, []);

  const openLeadDetail = async (leadId: string) => {
    try {
      setLoadingDetail(true);
      setDetailModalOpen(true);
      const res = await fetch(`/api/crm/leads/${leadId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedLead(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCaptureLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCaptureError("");
    if (!first.trim() || !company.trim() || !email.trim()) {
      setCaptureError("First name, company, and email are required");
      return;
    }

    try {
      setIsCapturing(true);
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: first.trim(),
          lastName: last.trim() || "",
          companyName: company.trim(),
          email: email.trim(),
          phone: phone || undefined,
          jobTitle: jobTitle || undefined,
          source,
          estimatedValue: Number(estValue) || undefined,
          ownerId: assignedOwnerId || undefined,
          notes: leadNotes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCaptureError(data.error?.message || "Failed to capture lead");
        return;
      }

      setCaptureModalOpen(false);
      setFirst("");
      setLast("");
      setCompany("");
      setEmail("");
      setPhone("");
      setJobTitle("");
      setLeadNotes("");
      fetchLeads();
    } catch (err: any) {
      setCaptureError(err.message || "An error occurred");
    } finally {
      setIsCapturing(false);
    }
  };

  const openEditModal = (lead: LeadItem) => {
    setEditFirst(lead.firstName);
    setEditLast(lead.lastName);
    setEditCompany(lead.companyName);
    setEditEmail(lead.email);
    setEditPhone(lead.phone || "");
    setEditJobTitle(lead.jobTitle || "");
    setEditSource(lead.source);
    setEditStatus(lead.status);
    setEditEstValue(lead.estimatedValue || 50000);
    setEditOwnerId(lead.owner?.id || "");
    setEditNotes(lead.notes || "");
    setEditError("");
    setEditModalOpen(true);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setEditError("");

    try {
      setIsUpdating(true);
      const res = await fetch(`/api/crm/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirst.trim(),
          lastName: editLast.trim(),
          companyName: editCompany.trim(),
          email: editEmail.trim(),
          phone: editPhone || null,
          jobTitle: editJobTitle || null,
          source: editSource,
          status: editStatus,
          estimatedValue: Number(editEstValue),
          ownerId: editOwnerId || null,
          notes: editNotes || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setEditError(json.error?.message || "Failed to update lead");
        return;
      }

      setEditModalOpen(false);
      openLeadDetail(selectedLead.id);
      fetchLeads();
    } catch (err: any) {
      setEditError(err.message || "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus: any, notes?: string) => {
    if (!selectedLead) return;
    try {
      const res = await fetch(`/api/crm/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      const json = await res.json();
      if (json.success) {
        openLeadDetail(selectedLead.id);
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to permanently delete this lead?")) return;

    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setDetailModalOpen(false);
        fetchLeads();
      } else {
        alert(json.error?.message || "Failed to delete lead");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openConvertModal = (lead: LeadItem) => {
    setConvertingLead(lead);
    setDealVal(lead.estimatedValue || 50000);
    setCreateOpp(true);
    setConvertError("");

    const match = clients.find(
      (c) => c.name.toLowerCase().trim() === lead.companyName.toLowerCase().trim()
    );
    setMatchedExistingClientId(match ? match.id : "");
    setConvertModalOpen(true);
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;
    setConvertError("");

    try {
      setIsConverting(true);
      const res = await fetch(`/api/crm/leads/${convertingLead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createOpportunity: createOpp,
          dealValue: Number(dealVal),
          existingClientId: matchedExistingClientId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setConvertError(data.error?.message || "Conversion failed");
        return;
      }

      setConvertModalOpen(false);
      setConvertingLead(null);
      setDetailModalOpen(false);
      fetchLeads();
      fetchClients();

      // Redirect to newly converted client command center!
      if (data.data?.client?.id) {
        router.push(`/app/crm/clients/${data.data.client.id}`);
      }
    } catch (err: any) {
      setConvertError(err.message || "An error occurred");
    } finally {
      setIsConverting(false);
    }
  };

  const getStatusBadge = (status: LeadItem["status"]) => {
    switch (status) {
      case "NEW":
        return <span className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400">NEW</span>;
      case "CONTACTED":
        return <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">CONTACTED</span>;
      case "QUALIFIED":
        return <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400">QUALIFIED</span>;
      case "CONVERTED":
        return <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">CONVERTED</span>;
      case "LOST":
      case "UNQUALIFIED":
        return <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">{status}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <CrmNav />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Inbound Sales Leads & Prospects"
          description="Prospect capture, multi-stage lead qualification, and duplicate-resistant account conversion."
        />
        <button
          onClick={() => setCaptureModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Capture Lead</span>
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
              <option value="ALL">All Lead Stages</option>
              <option value="NEW">New Leads</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CONVERTED">Converted Accounts</option>
              <option value="LOST">Lost / Unqualified</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Sources</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
              <option value="COLD_OUTREACH">Cold Outreach</option>
              <option value="CONFERENCE">Conference</option>
              <option value="PARTNER">Partner</option>
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
              <option value="ALL">All Sales Owners</option>
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
              placeholder="Search contact, company, email, phone..."
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
                Stage: {statusFilter}
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
            {sourceFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300">
                Source: {sourceFilter}
                <button
                  onClick={() => {
                    setSourceFilter("ALL");
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
                Owner: {employees.find((e) => e.id === ownerFilter)?.firstName || "Owner"}
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

      {/* Leads Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0c1322] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">Loading sales prospects...</div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center text-xs">
            <p className="text-slate-300 font-medium text-sm">
              {hasActiveFilters ? "No records match your filters." : "No leads captured yet."}
            </p>
            <p className="text-slate-500 mt-1">
              {hasActiveFilters
                ? "Try adjusting your stage, source, owner, date, or search criteria."
                : "Capture your first sales prospect to start qualifying opportunities."}
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
                onClick={() => setCaptureModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Capture Lead</span>
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-[#0f172a] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort("firstName")}
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Prospect Contact</span>
                    {sortBy === "firstName" ? (
                      sortOrder === "asc" ? <ChevronUp className="h-3 w-3 text-blue-400" /> : <ChevronDown className="h-3 w-3 text-blue-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("companyName")}
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Company Name</span>
                    {sortBy === "companyName" ? (
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
                  onClick={() => handleSort("estimatedValue")}
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Est. Deal Value</span>
                    {sortBy === "estimatedValue" ? (
                      sortOrder === "asc" ? <ChevronUp className="h-3 w-3 text-blue-400" /> : <ChevronDown className="h-3 w-3 text-blue-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("source")}
                  className="px-4 py-3 cursor-pointer select-none hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Source</span>
                    {sortBy === "source" ? (
                      sortOrder === "asc" ? <ChevronUp className="h-3 w-3 text-blue-400" /> : <ChevronDown className="h-3 w-3 text-blue-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-600" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3">Sales Owner</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openLeadDetail(lead.id)}
                      className="text-left flex flex-col hover:opacity-80"
                    >
                      <span className="font-bold text-slate-200 hover:text-blue-400 transition-colors">
                        {lead.firstName} {lead.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {lead.jobTitle || "Stakeholder"} • {lead.email}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-300">{lead.companyName}</td>
                  <td className="px-4 py-3">{getStatusBadge(lead.status)}</td>
                  <td className="px-4 py-3 font-bold text-slate-200">
                    ₹{lead.estimatedValue ? lead.estimatedValue.toLocaleString() : "0"}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{lead.source}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {lead.owner ? `${lead.owner.firstName} ${lead.owner.lastName}` : "Unassigned"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openLeadDetail(lead.id)}
                        className="rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        Details
                      </button>

                      {lead.status === "CONVERTED" && lead.convertedClient ? (
                        <Link
                          href={`/app/crm/clients/${lead.convertedClient.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline ml-1"
                        >
                          <span>{lead.convertedClient.code}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => openConvertModal(lead)}
                          className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-500 transition-colors"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Convert</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Server-Side Pagination Bar */}
        {!loading && leads.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={limit}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </div>

      {/* Lead Detail & History Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {loadingDetail || !selectedLead ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading prospect dossier...</div>
            ) : (
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 font-bold">
                      {selectedLead.firstName[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {selectedLead.firstName} {selectedLead.lastName}
                      </h3>
                      <p className="text-xs text-slate-400">{selectedLead.companyName} • {selectedLead.jobTitle || "Prospect"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedLead.status)}
                    <button
                      onClick={() => setDetailModalOpen(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Stage Progression Bar */}
                {selectedLead.status !== "CONVERTED" && (
                  <div className="mb-5 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-2">
                      Qualification Pipeline Actions
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedLead.status === "NEW" && (
                        <button
                          onClick={() => handleUpdateStatus("CONTACTED")}
                          className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                        >
                          ✓ Mark Contacted
                        </button>
                      )}
                      {(selectedLead.status === "NEW" || selectedLead.status === "CONTACTED") && (
                        <button
                          onClick={() => handleUpdateStatus("QUALIFIED")}
                          className="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 transition-colors"
                        >
                          ★ Mark Qualified
                        </button>
                      )}
                      <button
                        onClick={() => openConvertModal(selectedLead)}
                        className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Convert to Account</span>
                      </button>
                      {selectedLead.status !== "LOST" && (
                        <button
                          onClick={() => handleUpdateStatus("LOST", "Marked as lost/disqualified")}
                          className="rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                        >
                          Mark Lost
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs mb-5">
                  <div className="rounded-lg border border-slate-800 bg-[#0c1322] p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Corporate Email</span>
                    <p className="font-medium text-white mt-0.5">{selectedLead.email}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-[#0c1322] p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Phone Number</span>
                    <p className="font-medium text-white mt-0.5">{selectedLead.phone || "Not provided"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-[#0c1322] p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Est. Contract Value</span>
                    <p className="font-bold text-emerald-400 mt-0.5">₹{(selectedLead.estimatedValue || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-[#0c1322] p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Inbound Source</span>
                    <p className="font-medium text-white mt-0.5">{selectedLead.source}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-[#0c1322] p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Assigned Owner</span>
                    <p className="font-medium text-white mt-0.5">
                      {selectedLead.owner ? `${selectedLead.owner.firstName} ${selectedLead.owner.lastName}` : "Unassigned"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-[#0c1322] p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Captured Date</span>
                    <p className="font-medium text-white mt-0.5">
                      {new Date(selectedLead.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Notes Section */}
                {selectedLead.notes && (
                  <div className="mb-5 rounded-lg border border-slate-800 bg-[#0c1322] p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Prospect Notes</span>
                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{selectedLead.notes}</p>
                  </div>
                )}

                {/* Conversion Details (if converted) */}
                {selectedLead.status === "CONVERTED" && selectedLead.convertedClient && (
                  <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 block mb-1">
                      Conversion Result
                    </span>
                    <p className="text-xs text-white font-medium">
                      Converted into Account:{" "}
                      <Link
                        href={`/app/crm/clients/${selectedLead.convertedClient.id}`}
                        className="underline text-emerald-300 font-bold ml-1"
                      >
                        {selectedLead.convertedClient.name} ({selectedLead.convertedClient.code}) →
                      </Link>
                    </p>
                  </div>
                )}

                {/* Activity & History Timeline */}
                <div className="mb-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                    Lead Touchpoint History ({selectedLead.activities?.length || 0})
                  </h4>
                  {(!selectedLead.activities || selectedLead.activities.length === 0) ? (
                    <p className="text-xs text-slate-500 italic">No touchpoints logged yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedLead.activities.map((act) => (
                        <div
                          key={act.id}
                          className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-white">{act.subject}</span>
                            {act.description && <p className="text-[11px] text-slate-400 mt-0.5">{act.description}</p>}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {new Date(act.performedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Prospect</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(selectedLead)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-blue-400" />
                      <span>Edit Details</span>
                    </button>
                    <button
                      onClick={() => setDetailModalOpen(false)}
                      className="rounded-lg bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Edit Prospect Lead</h3>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFirst}
                    onChange={(e) => setEditFirst(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editLast}
                    onChange={(e) => setEditLast(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Lead Stage</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="UNQUALIFIED">Unqualified</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Assigned Sales Owner</label>
                  <select
                    value={editOwnerId}
                    onChange={(e) => setEditOwnerId(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Inbound Source</label>
                  <select
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="WEBSITE">Website Inbound</option>
                    <option value="CONFERENCE">Industry Conference</option>
                    <option value="REFERRAL">Executive Referral</option>
                    <option value="COLD_OUTREACH">Cold Outreach</option>
                    <option value="PARTNER">Channel Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Est. Value (₹)</label>
                  <input
                    type="number"
                    value={editEstValue}
                    onChange={(e) => setEditEstValue(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isUpdating ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Capture Lead Modal */}
      {captureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Capture Inbound Prospect Lead</h3>
              </div>
              <button
                onClick={() => setCaptureModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {captureError && (
              <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
                {captureError}
              </div>
            )}

            <form onSubmit={handleCaptureLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={first}
                    onChange={(e) => setFirst(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyberdyne Systems"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="Director of Procurement"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="WEBSITE">Website Inbound</option>
                    <option value="CONFERENCE">Industry Conference</option>
                    <option value="REFERRAL">Executive Referral</option>
                    <option value="COLD_OUTREACH">Cold Outreach</option>
                    <option value="PARTNER">Channel Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Est. Value (₹)</label>
                  <input
                    type="number"
                    value={estValue}
                    onChange={(e) => setEstValue(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Assigned Owner</label>
                  <select
                    value={assignedOwnerId}
                    onChange={(e) => setAssignedOwnerId(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Default (Self)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Initial Notes</label>
                <textarea
                  rows={2}
                  placeholder="Requirement details, meeting context..."
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCaptureModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCapturing}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isCapturing ? "Saving..." : "Save Prospect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead Modal with Duplicate Detection */}
      {convertModalOpen && convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Convert Lead to Account</h3>
              </div>
              <button
                onClick={() => setConvertModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {convertError && (
              <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
                {convertError}
              </div>
            )}

            <form onSubmit={handleConvertLead} className="space-y-4 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Converting Prospect</span>
                <p className="text-sm font-bold text-white mt-0.5">{convertingLead.firstName} {convertingLead.lastName}</p>
                <p className="text-xs text-slate-300">{convertingLead.companyName} • {convertingLead.email}</p>
              </div>

              {/* Duplicate Handling Alert / Selector */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Target Client Account (Duplicate Protection)
                </label>
                <select
                  value={matchedExistingClientId}
                  onChange={(e) => setMatchedExistingClientId(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">✨ Auto-create new Client: "{convertingLead.companyName}"</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      Attach to existing: {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                {matchedExistingClientId ? (
                  <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Existing account selected: will attach contact & deal without duplicating company.</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1">
                    System will automatically verify and create an official account profile.
                  </p>
                )}
              </div>

              {/* Opportunity Toggle */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createOpp"
                    checked={createOpp}
                    onChange={(e) => setCreateOpp(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="createOpp" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Initialize Deal Opportunity in Pipeline
                  </label>
                </div>

                {createOpp && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Deal Contract Value (₹)</label>
                    <input
                      type="number"
                      required
                      value={dealVal}
                      onChange={(e) => setDealVal(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConvertModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConverting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isConverting ? "Converting..." : "Complete Conversion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
