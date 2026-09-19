"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CrmNav } from "@/modules/crm/components/crm-nav";
import { Pagination } from "@/components/ui/pagination";
import { 
  IndianRupee, 
  TrendingUp, 
  Award, 
  Filter, 
  Plus, 
  Kanban, 
  List, 
  Building2, 
  Calendar, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  ChevronRight,
  Search,
  Edit2,
  Trash2,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from "lucide-react";

interface Opportunity {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: string | null;
  lossReason?: string | null;
  notes?: string | null;
  client: { id: string; name: string; code: string };
  contact?: { id: string; firstName: string; lastName: string; email: string } | null;
  owner: { id: string; firstName: string; lastName: string };
}

interface Metrics {
  pipelineValue: number;
  weightedForecast: number;
  wonValue: number;
  winRate: number;
  stageBreakdown?: Record<string, { count: number; value: number }>;
}

const STAGES = [
  { key: "DISCOVERY", label: "Discovery", color: "border-sky-500/40 bg-sky-500/5 text-sky-400" },
  { key: "PROPOSAL", label: "Proposal", color: "border-indigo-500/40 bg-indigo-500/5 text-indigo-400" },
  { key: "NEGOTIATION", label: "Negotiation", color: "border-amber-500/40 bg-amber-500/5 text-amber-400" },
  { key: "CLOSED_WON", label: "Closed Won", color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400" },
  { key: "CLOSED_LOST", label: "Closed Lost", color: "border-rose-500/40 bg-rose-500/5 text-rose-400" },
];

export default function OpportunitiesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [isPending, startTransition] = useTransition();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [stageFilter, setStageFilter] = useState(searchParams.get("stage") || "ALL");
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get("ownerId") || "ALL");
  const [clientFilter, setClientFilter] = useState(searchParams.get("clientId") || "ALL");
  const [minValue, setMinValue] = useState(searchParams.get("minValue") || "");
  const [maxValue, setMaxValue] = useState(searchParams.get("maxValue") || "");
  const [closeDatePreset, setCloseDatePreset] = useState(searchParams.get("closeDatePreset") || "ALL");

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">((searchParams.get("sortOrder") as "asc" | "desc") || "desc");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [limit, setLimit] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState("DISCOVERY");
  const [probability, setProbability] = useState("25");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");

  // Edit form state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [editName, setEditName] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editStage, setEditStage] = useState("DISCOVERY");
  const [editProb, setEditProb] = useState("25");
  const [editCloseDate, setEditCloseDate] = useState("");
  const [editLossReason, setEditLossReason] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (stageFilter && stageFilter !== "ALL") params.set("stage", stageFilter);
    if (ownerFilter && ownerFilter !== "ALL") params.set("ownerId", ownerFilter);
    if (clientFilter && clientFilter !== "ALL") params.set("clientId", clientFilter);
    if (minValue) params.set("minValue", minValue);
    if (maxValue) params.set("maxValue", maxValue);
    if (closeDatePreset && closeDatePreset !== "ALL") params.set("closeDatePreset", closeDatePreset);
    if (sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    if (page > 1) params.set("page", String(page));

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [debouncedSearch, stageFilter, ownerFilter, clientFilter, minValue, maxValue, closeDatePreset, sortBy, sortOrder, page, pathname]);

  // Fetch opportunities with server-side query params
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // Kan-ban gets more items to show complete pipeline
      params.set("page", String(viewMode === "kanban" ? 1 : page));
      params.set("limit", String(viewMode === "kanban" ? 100 : limit));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (stageFilter && stageFilter !== "ALL") params.set("stage", stageFilter);
      if (ownerFilter && ownerFilter !== "ALL") params.set("ownerId", ownerFilter);
      if (clientFilter && clientFilter !== "ALL") params.set("clientId", clientFilter);
      if (minValue) params.set("minValue", minValue);
      if (maxValue) params.set("maxValue", maxValue);
      if (closeDatePreset && closeDatePreset !== "ALL") params.set("closeDatePreset", closeDatePreset);

      const res = await fetch(`/api/crm/opportunities?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const opps = json.data?.opportunities || [];
        setOpportunities(opps);
        if (json.data?.pagination) {
          setTotalRecords(json.data.pagination.total);
          setTotalPages(json.data.pagination.totalPages);
        } else {
          setTotalRecords(opps.length);
          setTotalPages(1);
        }

        // Deep link: auto-open modal if ?id=... matches
        const targetId = searchParams.get("id");
        if (targetId && !editingOpp) {
          const matched = opps.find((o: Opportunity) => o.id === targetId);
          if (matched) {
            openEditModal(matched);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial metadata loading
  const fetchMetadata = async () => {
    try {
      const [metricsRes, clientsRes, empRes] = await Promise.all([
        fetch("/api/crm/opportunities/metrics"),
        fetch("/api/crm/clients?limit=200"),
        fetch("/api/employees?limit=100")
      ]);

      if (metricsRes.ok) {
        const json = await metricsRes.json();
        setMetrics(json.data || json);
      }
      if (clientsRes.ok) {
        const json = await clientsRes.json();
        const clientList = json.data?.clients || [];
        setClients(clientList);
        if (clientList.length > 0 && !clientId) setClientId(clientList[0].id);
      }
      if (empRes.ok) {
        const json = await empRes.json();
        setEmployees(json.data?.employees || []);
      }
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [debouncedSearch, stageFilter, ownerFilter, clientFilter, minValue, maxValue, closeDatePreset, sortBy, sortOrder, page, viewMode]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStageFilter("ALL");
    setOwnerFilter("ALL");
    setClientFilter("ALL");
    setMinValue("");
    setMaxValue("");
    setCloseDatePreset("ALL");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
    stageFilter !== "ALL" ||
    ownerFilter !== "ALL" ||
    clientFilter !== "ALL" ||
    minValue ||
    maxValue ||
    closeDatePreset !== "ALL"
  );

  const handleUpdateStage = async (oppId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/crm/opportunities/${oppId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage })
      });
      if (res.ok) {
        fetchOpportunities();
      }
    } catch (err) {
      console.error("Stage update error:", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId || !value) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/crm/opportunities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            clientId,
            value: parseFloat(value),
            stage,
            probability: parseInt(probability, 10),
            expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : null,
          })
        });

        if (res.ok) {
          setShowCreateModal(false);
          setName("");
          setValue("");
          fetchOpportunities();
        }
      } catch (err) {
        console.error("Create opportunity error:", err);
      }
    });
  };

  const openEditModal = (opp: Opportunity) => {
    setEditingOpp(opp);
    setEditName(opp.name);
    setEditValue(String(opp.value));
    setEditStage(opp.stage);
    setEditProb(String(opp.probability));
    setEditCloseDate(opp.expectedCloseDate ? opp.expectedCloseDate.split("T")[0] : "");
    setEditLossReason(opp.lossReason || "");
    setEditNotes(opp.notes || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpp) return;

    try {
      const res = await fetch(`/api/crm/opportunities/${editingOpp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          value: parseFloat(editValue),
          stage: editStage,
          probability: parseInt(editProb, 10),
          expectedCloseDate: editCloseDate ? new Date(editCloseDate).toISOString() : null,
          lossReason: editStage === "CLOSED_LOST" ? editLossReason : null,
          notes: editNotes || null,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingOpp(null);
        fetchOpportunities();
      }
    } catch (err) {
      console.error("Edit opportunity error:", err);
    }
  };

  const handleDeleteOpportunity = async (oppId: string) => {
    if (!confirm("Are you sure you want to permanently delete this deal opportunity?")) return;
    try {
      const res = await fetch(`/api/crm/opportunities/${oppId}`, { method: "DELETE" });
      if (res.ok) {
        setShowEditModal(false);
        fetchOpportunities();
      }
    } catch (err) {
      console.error("Delete opportunity error:", err);
    }
  };

  // Drag & Drop handlers
  const onDragStart = (e: React.DragEvent, oppId: string) => {
    e.dataTransfer.setData("text/plain", oppId);
    setDraggedOppId(oppId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData("text/plain") || draggedOppId;
    setDraggedOppId(null);
    if (!oppId) return;

    await handleUpdateStage(oppId, targetStage);
  };

  return (
    <div className="space-y-8">
      {/* Header with Title & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Deal Opportunities & Sales Pipeline</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Visual stage progression, probability-weighted forecasts, drag-and-drop Kanban, and deal lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === "kanban" 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === "table" 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Table
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Deal
          </button>
        </div>
      </div>

      {/* CRM Sub-Navigation */}
      <CrmNav />

      {/* Forecasting KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Open Pipeline</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{(metrics?.pipelineValue || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">Active stages (Discovery to Negotiation)</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Weighted Forecast</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              ₹{(metrics?.weightedForecast || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">Adjusted by win probability</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Closed Won</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{(metrics?.wonValue || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">Successfully booked revenue</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Win Rate</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {metrics?.winRate || 0}%
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">Won vs total closed decisions</span>
          </div>
        </div>
      </div>

      {/* Multi-Filter & Search Bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search deals */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by deal name, client, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 pl-9 pr-4 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Stage Dropdown */}
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Pipeline Stages</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          {/* Owner Filter */}
          <select
            value={ownerFilter}
            onChange={(e) => {
              setOwnerFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Deal Owners</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
            ))}
          </select>

          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => {
              setClientFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none max-w-[180px]"
          >
            <option value="ALL">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Expected Close Date Preset */}
          <select
            value={closeDatePreset}
            onChange={(e) => {
              setCloseDatePreset(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Close Dates</option>
            <option value="THIS_MONTH">Closing This Month</option>
            <option value="NEXT_MONTH">Closing Next Month</option>
            <option value="THIS_QUARTER">Closing This Quarter</option>
            <option value="LAST_30_DAYS">Past 30 Days</option>
          </select>

          {/* Numeric Value Filter Range */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="Min ₹"
              value={minValue}
              onChange={(e) => {
                setMinValue(e.target.value);
                setPage(1);
              }}
              className="h-9 w-24 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-xs text-zinc-500">-</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={maxValue}
              onChange={(e) => {
                setMaxValue(e.target.value);
                setPage(1);
              }}
              className="h-9 w-24 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Active Filters:</span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs">
                Search: &ldquo;{debouncedSearch}&rdquo;
                <button onClick={() => { setSearchTerm(""); setDebouncedSearch(""); }} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {stageFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-xs">
                Stage: {STAGES.find(s => s.key === stageFilter)?.label || stageFilter}
                <button onClick={() => setStageFilter("ALL")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {ownerFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-xs">
                Owner: {employees.find(e => e.id === ownerFilter)?.firstName || "Selected"}
                <button onClick={() => setOwnerFilter("ALL")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {clientFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-xs">
                Client: {clients.find(c => c.id === clientFilter)?.name || "Selected"}
                <button onClick={() => setClientFilter("ALL")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {closeDatePreset !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-xs">
                Close: {closeDatePreset.replace(/_/g, " ")}
                <button onClick={() => setCloseDatePreset("ALL")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(minValue || maxValue) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-xs">
                Value: {minValue ? `₹${minValue}` : "₹0"} - {maxValue ? `₹${maxValue}` : "Any"}
                <button onClick={() => { setMinValue(""); setMaxValue(""); }} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 ml-1 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main View: Kanban or Table */}
      {loading ? (
        <div className="p-16 text-center text-zinc-400">Loading pipeline deals...</div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <IndianRupee className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
          <p className="text-sm font-medium text-zinc-300">
            {hasActiveFilters ? "No deals match your search and filter criteria" : "No deal opportunities found"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {hasActiveFilters 
              ? "Try resetting filters or adjusting search keywords to find opportunities."
              : "Create a deal opportunity to begin tracking your sales pipeline."}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={handleClearFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Deal
            </button>
          )}
        </div>
      ) : viewMode === "kanban" ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {STAGES.map((col) => {
            const colOpps = opportunities.filter((o) => o.stage === col.key);
            const colTotal = colOpps.reduce((sum, o) => sum + o.value, 0);

            return (
              <div
                key={col.key}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, col.key)}
                className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 min-h-[550px] transition-colors hover:border-zinc-700"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        col.key === "CLOSED_WON" ? "bg-emerald-500" :
                        col.key === "CLOSED_LOST" ? "bg-rose-500" :
                        col.key === "NEGOTIATION" ? "bg-amber-500" :
                        col.key === "PROPOSAL" ? "bg-indigo-500" : "bg-sky-500"
                      }`} />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">{col.label}</h3>
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                        {colOpps.length}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-400 block mt-1">
                      ₹{colTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colOpps.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-zinc-800/80 rounded-lg">
                      <span className="text-xs text-zinc-600">Drop deals here</span>
                    </div>
                  ) : (
                    colOpps.map((opp) => (
                      <div 
                        key={opp.id}
                        draggable={true}
                        onDragStart={(e) => onDragStart(e, opp.id)}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4 shadow-sm hover:border-zinc-600 transition-all group cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between">
                          <button
                            onClick={() => openEditModal(opp)}
                            className="text-left font-semibold text-sm text-white group-hover:text-indigo-400 transition-colors"
                          >
                            {opp.name}
                          </button>
                          <span className="text-xs font-bold text-white">
                            ₹{opp.value.toLocaleString()}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                          <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                          <span className="truncate">{opp.client.name}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{opp.owner.firstName}</span>
                          </div>
                          <span className="font-medium text-zinc-400">{opp.probability}% win</span>
                        </div>

                        {/* Stage Selector Dropdown */}
                        <div className="mt-3 flex items-center justify-between gap-1 pt-2 border-t border-zinc-800/40">
                          <select
                            value={opp.stage}
                            onChange={(e) => handleUpdateStage(opp.id, e.target.value)}
                            className="w-full rounded bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-300 border border-zinc-700 hover:border-zinc-600 focus:outline-none"
                          >
                            <option value="DISCOVERY">Discovery (25%)</option>
                            <option value="PROPOSAL">Proposal (50%)</option>
                            <option value="NEGOTIATION">Negotiation (75%)</option>
                            <option value="CLOSED_WON">Closed Won (100%)</option>
                            <option value="CLOSED_LOST">Closed Lost (0%)</option>
                          </select>
                          <button
                            onClick={() => openEditModal(opp)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                            title="Edit Deal Details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
            <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
              <thead className="bg-zinc-950/60 text-xs uppercase font-semibold tracking-wider text-zinc-400">
                <tr>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:text-white select-none"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Opportunity</span>
                      {sortBy === "name" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-indigo-400" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:text-white select-none"
                    onClick={() => handleSort("client")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Client</span>
                      {sortBy === "client" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-indigo-400" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:text-white select-none"
                    onClick={() => handleSort("value")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Value</span>
                      {sortBy === "value" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-indigo-400" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:text-white select-none"
                    onClick={() => handleSort("stage")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Stage</span>
                      {sortBy === "stage" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-indigo-400" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:text-white select-none"
                    onClick={() => handleSort("probability")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Probability</span>
                      {sortBy === "probability" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-indigo-400" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:text-white select-none"
                    onClick={() => handleSort("expectedCloseDate")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Close Date</span>
                      {sortBy === "expectedCloseDate" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-indigo-400" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {opportunities.map((opp) => {
                  const stageConfig = STAGES.find((s) => s.key === opp.stage);
                  return (
                    <tr key={opp.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        <button
                          onClick={() => openEditModal(opp)}
                          className="hover:text-indigo-400 text-left transition-colors font-medium"
                        >
                          {opp.name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-zinc-500" />
                          <span>{opp.client.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        ₹{opp.value.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stageConfig?.color}`}>
                          {stageConfig?.label || opp.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{opp.probability}%</td>
                      <td className="px-6 py-4 text-xs text-zinc-400">
                        {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-400">
                        {opp.owner.firstName} {opp.owner.lastName}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <select
                          value={opp.stage}
                          onChange={(e) => handleUpdateStage(opp.id, e.target.value)}
                          className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 border border-zinc-700 hover:border-zinc-600 focus:outline-none"
                        >
                          <option value="DISCOVERY">Discovery</option>
                          <option value="PROPOSAL">Proposal</option>
                          <option value="NEGOTIATION">Negotiation</option>
                          <option value="CLOSED_WON">Closed Won</option>
                          <option value="CLOSED_LOST">Closed Lost</option>
                        </select>
                        <button
                          onClick={() => openEditModal(opp)}
                          className="rounded p-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={limit}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-base font-semibold text-white">Create New Opportunity</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise CRM Implementation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Client Account *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Deal Value (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="100000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Initial Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => {
                      setStage(e.target.value);
                      if (e.target.value === "DISCOVERY") setProbability("25");
                      if (e.target.value === "PROPOSAL") setProbability("50");
                      if (e.target.value === "NEGOTIATION") setProbability("75");
                      if (e.target.value === "CLOSED_WON") setProbability("100");
                      if (e.target.value === "CLOSED_LOST") setProbability("0");
                    }}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="DISCOVERY">Discovery (25%)</option>
                    <option value="PROPOSAL">Proposal (50%)</option>
                    <option value="NEGOTIATION">Negotiation (75%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Expected Close Date</label>
                <input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-zinc-700 px-4 py-2 font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-base font-semibold text-white">Edit Deal: {editingOpp.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Contract Value (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Stage</label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="DISCOVERY">Discovery</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="CLOSED_WON">Closed Won</option>
                    <option value="CLOSED_LOST">Closed Lost</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Win Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editProb}
                    onChange={(e) => setEditProb(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Expected Close Date</label>
                  <input
                    type="date"
                    value={editCloseDate}
                    onChange={(e) => setEditCloseDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {editStage === "CLOSED_LOST" && (
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Reason for Loss</label>
                  <input
                    type="text"
                    placeholder="e.g. Budget cut, selected competitor, delayed project..."
                    value={editLossReason}
                    onChange={(e) => setEditLossReason(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleDeleteOpportunity(editingOpp.id)}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Deal</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="rounded-lg border border-zinc-700 px-4 py-2 font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
