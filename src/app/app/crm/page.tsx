"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { CrmNav } from "@/modules/crm/components/crm-nav";
import {
  Building,
  TrendingUp,
  UserCheck,
  IndianRupee,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Phone,
  Mail,
  Calendar,
  FileText,
  Plus,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  CheckSquare,
  Award,
  ArrowRight,
  RotateCcw,
  BarChart3,
  Filter,
  Users,
  PieChart,
  Layers,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CrmCockpitData } from "@/services/crm-dashboard.service";

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  designation?: string | null;
}

export default function CrmCockpitPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<CrmCockpitData | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [datePreset, setDatePreset] = useState(searchParams.get("datePreset") || "ALL");
  const [ownerId, setOwnerId] = useState(searchParams.get("ownerId") || "ALL");
  const [scope, setScope] = useState<"all" | "my" | "department">(
    (searchParams.get("scope") as "all" | "my" | "department") || "all"
  );

  // Quick Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (datePreset !== "ALL") params.set("datePreset", datePreset);
    if (ownerId !== "ALL") params.set("ownerId", ownerId);
    if (scope !== "all") params.set("scope", scope);

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [datePreset, ownerId, scope, pathname]);

  const fetchCockpitData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (datePreset && datePreset !== "ALL") params.set("datePreset", datePreset);
      if (ownerId && ownerId !== "ALL") params.set("ownerId", ownerId);
      if (scope && scope !== "all") params.set("scope", scope);

      const res = await fetch(`/api/crm/cockpit?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
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
      const json = await res.json();
      if (json.success && json.data?.employees) {
        setEmployees(json.data.employees);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCockpitData();
  }, [datePreset, ownerId, scope]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Debounced Quick Search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/crm/search?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        if (json.success) {
          setSearchResults(json.data);
        }
      } catch (err) {
        console.error("CRM quick search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResetFilters = () => {
    setDatePreset("ALL");
    setOwnerId("ALL");
    setScope("all");
  };

  const hasActiveFilters = datePreset !== "ALL" || ownerId !== "ALL" || scope !== "all";

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CALL":
        return <Phone className="h-3.5 w-3.5 text-blue-400" />;
      case "MEETING":
        return <Calendar className="h-3.5 w-3.5 text-purple-400" />;
      case "EMAIL":
        return <Mail className="h-3.5 w-3.5 text-emerald-400" />;
      case "PROPOSAL":
        return <IndianRupee className="h-3.5 w-3.5 text-amber-400" />;
      case "DOCUMENT":
        return <FileText className="h-3.5 w-3.5 text-sky-400" />;
      case "STATUS_CHANGE":
        return <Sparkles className="h-3.5 w-3.5 text-indigo-400" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const summary = data?.summary || {
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    leadConversionRate: 0,
    totalClients: 0,
    activeClients: 0,
    activeOpportunities: 0,
    pipelineValue: 0,
    weightedForecast: 0,
    wonOpportunities: 0,
    wonRevenue: 0,
    lostOpportunities: 0,
    lostValue: 0,
    winRate: 0,
    pendingTasksCount: 0,
    overdueTasksCount: 0,
    upcomingMeetingsCount: 0,
    paidRevenueTotal: 0,
    invoicedRevenueTotal: 0,
  };

  const comparison = data?.comparison;

  return (
    <div className="space-y-6">
      <CrmNav />

      {/* Header with Search and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Customer Relationship Management (CRM)"
          description="Live sales telemetry, pipeline forecasting, client relationships, and multi-channel customer activities."
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Global CRM Search Form */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Quick search CRM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-44 md:w-56 rounded-lg border border-slate-800 bg-slate-900 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
            {isSearching && (
              <div className="absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            )}
          </div>

          <Link
            href="/app/crm/leads"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>Capture Lead</span>
          </Link>

          <Link
            href="/app/crm/clients"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Client</span>
          </Link>
        </div>
      </div>

      {/* Search Results Dropdown Overlay */}
      {searchResults && (
        <div className="relative rounded-xl border border-blue-500/40 bg-[#0f172a] p-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <span className="text-xs font-semibold text-white">
              Search Results for &ldquo;{searchQuery}&rdquo;
            </span>
            <button
              onClick={() => {
                setSearchResults(null);
                setSearchQuery("");
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            {/* Leads */}
            <div>
              <h5 className="font-semibold text-indigo-400 uppercase text-[10px] mb-1 flex items-center justify-between">
                <span>Leads</span>
                <span>({searchResults.leads?.length || 0})</span>
              </h5>
              {(!searchResults.leads || searchResults.leads.length === 0) ? (
                <p className="text-slate-500 text-[11px]">No leads matched</p>
              ) : (
                searchResults.leads.map((l: any) => (
                  <Link
                    key={l.id}
                    href={l.navigationTarget || `/app/crm/leads?id=${l.id}`}
                    className="block p-1.5 rounded hover:bg-slate-800/60 text-slate-300 transition-colors"
                  >
                    <span className="font-medium text-white block truncate">{l.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{l.company} • {l.status}</span>
                  </Link>
                ))
              )}
            </div>

            {/* Clients */}
            <div>
              <h5 className="font-semibold text-blue-400 uppercase text-[10px] mb-1 flex items-center justify-between">
                <span>Clients</span>
                <span>({searchResults.clients?.length || 0})</span>
              </h5>
              {(!searchResults.clients || searchResults.clients.length === 0) ? (
                <p className="text-slate-500 text-[11px]">No clients matched</p>
              ) : (
                searchResults.clients.map((c: any) => (
                  <Link
                    key={c.id}
                    href={c.navigationTarget || `/app/crm/clients/${c.id}`}
                    className="block p-1.5 rounded hover:bg-slate-800/60 text-slate-300 transition-colors"
                  >
                    <span className="font-medium text-white block truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{c.code} • {c.tier}</span>
                  </Link>
                ))
              )}
            </div>

            {/* Opportunities */}
            <div>
              <h5 className="font-semibold text-amber-400 uppercase text-[10px] mb-1 flex items-center justify-between">
                <span>Deals</span>
                <span>({searchResults.opportunities?.length || 0})</span>
              </h5>
              {(!searchResults.opportunities || searchResults.opportunities.length === 0) ? (
                <p className="text-slate-500 text-[11px]">No deals matched</p>
              ) : (
                searchResults.opportunities.map((o: any) => (
                  <Link
                    key={o.id}
                    href={o.navigationTarget || `/app/crm/opportunities?id=${o.id}`}
                    className="block p-1.5 rounded hover:bg-slate-800/60 text-slate-300 transition-colors"
                  >
                    <span className="font-medium text-white block truncate">{o.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">₹{o.value.toLocaleString()} • {o.stage}</span>
                  </Link>
                ))
              )}
            </div>

            {/* Tasks */}
            <div>
              <h5 className="font-semibold text-emerald-400 uppercase text-[10px] mb-1 flex items-center justify-between">
                <span>Tasks</span>
                <span>({searchResults.tasks?.length || 0})</span>
              </h5>
              {(!searchResults.tasks || searchResults.tasks.length === 0) ? (
                <p className="text-slate-500 text-[11px]">No tasks matched</p>
              ) : (
                searchResults.tasks.map((t: any) => (
                  <Link
                    key={t.id}
                    href={t.navigationTarget || `/app/tasks?id=${t.id}`}
                    className="block p-1.5 rounded hover:bg-slate-800/60 text-slate-300 transition-colors"
                  >
                    <span className="font-medium text-white block truncate">{t.title}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{t.priority} • {t.status}</span>
                  </Link>
                ))
              )}
            </div>

            {/* Proposals */}
            <div>
              <h5 className="font-semibold text-rose-400 uppercase text-[10px] mb-1 flex items-center justify-between">
                <span>Proposals</span>
                <span>({searchResults.proposals?.length || 0})</span>
              </h5>
              {(!searchResults.proposals || searchResults.proposals.length === 0) ? (
                <p className="text-slate-500 text-[11px]">No proposals</p>
              ) : (
                searchResults.proposals.map((p: any) => (
                  <Link
                    key={p.id}
                    href={p.navigationTarget}
                    className="block p-1.5 rounded hover:bg-slate-800/60 text-slate-300 transition-colors"
                  >
                    <span className="font-medium text-white block truncate">{p.title}</span>
                    <span className="text-[10px] text-slate-400 block truncate">₹{p.grandTotal.toLocaleString()} • {p.status}</span>
                  </Link>
                ))
              )}
            </div>

            {/* Meetings */}
            <div>
              <h5 className="font-semibold text-cyan-400 uppercase text-[10px] mb-1 flex items-center justify-between">
                <span>Meetings</span>
                <span>({searchResults.meetings?.length || 0})</span>
              </h5>
              {(!searchResults.meetings || searchResults.meetings.length === 0) ? (
                <p className="text-slate-500 text-[11px]">No meetings</p>
              ) : (
                searchResults.meetings.map((m: any) => (
                  <Link
                    key={m.id}
                    href={m.navigationTarget || `/app/calendar?id=${m.id}`}
                    className="block p-1.5 rounded hover:bg-slate-800/60 text-slate-300 transition-colors"
                  >
                    <span className="font-medium text-white block truncate">{m.title}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{m.type}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Analytics Control & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-medium">Analytics Scope:</span>
          </div>

          {/* Date Range Preset */}
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="THIS_QUARTER">This Quarter</option>
            <option value="THIS_YEAR">This Year</option>
          </select>

          {/* Deal / Lead Owner Filter */}
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none max-w-[180px]"
          >
            <option value="ALL">All Sales Reps</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
            ))}
          </select>

          {/* Scope Selector */}
          <div className="flex items-center rounded-md border border-slate-800 bg-slate-900 p-0.5">
            <button
              onClick={() => setScope("all")}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
                scope === "all" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Org
            </button>
            <button
              onClick={() => setScope("my")}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
                scope === "my" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              )}
            >
              My Records
            </button>
            <button
              onClick={() => setScope("department")}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
                scope === "department" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Dept
            </button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 h-8 px-2.5 rounded-md border border-slate-800 bg-slate-900 text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time DB Telemetry</span>
        </div>
      </div>

      {/* Core 8 KPI Command Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Open Pipeline Value */}
        <Link
          href="/app/crm/opportunities"
          className="group rounded-xl border border-slate-800 bg-[#0f172a] p-4.5 hover:border-blue-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Open Pipeline Value
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 group-hover:scale-110 transition-transform">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">
            ₹{loading ? "..." : summary.pipelineValue.toLocaleString()}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>{summary.activeOpportunities} active pipeline deal(s)</span>
            {comparison?.pipelineChangePct !== null && comparison?.pipelineChangePct !== undefined && (
              <span className={cn(
                "flex items-center font-medium",
                comparison.pipelineChangePct >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {comparison.pipelineChangePct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(comparison.pipelineChangePct)}%
              </span>
            )}
          </div>
        </Link>

        {/* 2. Weighted Forecast */}
        <Link
          href="/app/crm/opportunities"
          className="group rounded-xl border border-slate-800 bg-[#0f172a] p-4.5 hover:border-emerald-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Weighted Forecast
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">
            ₹{loading ? "..." : summary.weightedForecast.toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Probability-weighted expected revenue</span>
          </p>
        </Link>

        {/* 3. Closed Won Revenue & Win Rate */}
        <Link
          href="/app/crm/opportunities?stage=CLOSED_WON"
          className="group rounded-xl border border-slate-800 bg-[#0f172a] p-4.5 hover:border-teal-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Booked Won Revenue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/20 text-teal-400 group-hover:scale-110 transition-transform">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-teal-400 mt-2">
            ₹{loading ? "..." : summary.wonRevenue.toLocaleString()}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>{summary.wonOpportunities} won • {summary.winRate}% win rate</span>
            {comparison?.wonRevenueChangePct !== null && comparison?.wonRevenueChangePct !== undefined && (
              <span className={cn(
                "flex items-center font-medium",
                comparison.wonRevenueChangePct >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {comparison.wonRevenueChangePct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(comparison.wonRevenueChangePct)}%
              </span>
            )}
          </div>
        </Link>

        {/* 4. Finance Paid Revenue */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Paid Revenue (Finance)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">
            ₹{loading ? "..." : summary.paidRevenueTotal.toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Invoiced: ₹{summary.invoicedRevenueTotal.toLocaleString()}
          </p>
        </div>

        {/* 5. Leads & Conversion Rate */}
        <Link
          href="/app/crm/leads"
          className="group rounded-xl border border-slate-800 bg-[#0f172a] p-4.5 hover:border-indigo-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Leads ({summary.leadConversionRate}% Converted)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 group-hover:scale-110 transition-transform">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">
            {loading ? "..." : summary.totalLeads}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>{summary.newLeads} new • {summary.convertedLeads} converted</span>
            {comparison?.leadsChangePct !== null && comparison?.leadsChangePct !== undefined && (
              <span className={cn(
                "flex items-center font-medium",
                comparison.leadsChangePct >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {comparison.leadsChangePct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(comparison.leadsChangePct)}%
              </span>
            )}
          </div>
        </Link>

        {/* 6. Client Accounts */}
        <Link
          href="/app/crm/clients"
          className="group rounded-xl border border-slate-800 bg-[#0f172a] p-4.5 hover:border-blue-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Client Accounts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600/20 text-sky-400 group-hover:scale-110 transition-transform">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">
            {loading ? "..." : summary.totalClients}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.activeClients} active accounts in directory
          </p>
        </Link>

        {/* 7. Upcoming Meetings */}
        <Link
          href="/app/calendar"
          className="group rounded-xl border border-slate-800 bg-[#0f172a] p-4.5 hover:border-purple-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Upcoming Meetings
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 group-hover:scale-110 transition-transform">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">
            {loading ? "..." : summary.upcomingMeetingsCount}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Scheduled client appointments & calls
          </p>
        </Link>

        {/* 8. Overdue Tasks */}
        <Link
          href="/app/tasks?quickFilter=overdue"
          className={cn(
            "group rounded-xl border p-4.5 transition-all shadow-sm",
            summary.overdueTasksCount > 0 
              ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-500" 
              : "border-slate-800 bg-[#0f172a] hover:border-indigo-500/50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pending Action Items
            </span>
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg group-hover:scale-110 transition-transform",
              summary.overdueTasksCount > 0 ? "bg-rose-500/20 text-rose-400" : "bg-indigo-600/20 text-indigo-400"
            )}>
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <h3 className={cn("text-2xl font-bold mt-2", summary.overdueTasksCount > 0 ? "text-rose-400" : "text-white")}>
            {loading ? "..." : summary.pendingTasksCount}
          </h3>
          <p className={cn("text-[11px] mt-1", summary.overdueTasksCount > 0 ? "text-rose-400 font-semibold" : "text-slate-400")}>
            {summary.overdueTasksCount > 0 ? `${summary.overdueTasksCount} overdue action items!` : "All deliverables on schedule"}
          </p>
        </Link>
      </div>

      {/* Interactive Sales Pipeline Stage Distribution */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Sales Pipeline Stage Distribution
            </h4>
            <span className="text-[11px] text-slate-400">Click any stage to drill down directly into deal Kanban</span>
          </div>
          <Link
            href="/app/crm/opportunities"
            className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <span>Open Pipeline Board</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { key: "DISCOVERY", label: "Discovery", color: "border-sky-500/40 text-sky-400", prob: "25%" },
            { key: "PROPOSAL", label: "Proposal", color: "border-indigo-500/40 text-indigo-400", prob: "50%" },
            { key: "NEGOTIATION", label: "Negotiation", color: "border-amber-500/40 text-amber-400", prob: "75%" },
            { key: "CLOSED_WON", label: "Closed Won", color: "border-emerald-500/40 text-emerald-400", prob: "100%" },
            { key: "CLOSED_LOST", label: "Closed Lost", color: "border-rose-500/40 text-rose-400", prob: "0%" },
          ].map((stage) => {
            const item = data?.stageBreakdown?.[stage.key] || { count: 0, value: 0, weightedValue: 0 };
            return (
              <Link
                key={stage.key}
                href={`/app/crm/opportunities?stage=${stage.key}`}
                className={cn(
                  "rounded-lg border bg-[#0c1322] p-3 text-left transition-all hover:border-slate-600 group",
                  stage.color
                )}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="font-semibold uppercase group-hover:text-white transition-colors">{stage.label}</span>
                  <span className="font-mono text-slate-500">{stage.prob}</span>
                </div>
                <h4 className="text-base font-bold text-white">
                  ₹{item.value.toLocaleString()}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>{item.count} deal(s)</span>
                  {item.weightedValue > 0 && (
                    <span className="font-mono text-[9px] text-emerald-400">₹{Math.round(item.weightedValue).toLocaleString()} wtd</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Lead Funnel & Won/Lost Comparative Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Funnel Progression */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Lead Conversion Funnel
              </h4>
            </div>
            <Link href="/app/crm/leads" className="text-[11px] text-blue-400 hover:underline">
              {summary.totalLeads} Total Leads →
            </Link>
          </div>

          <div className="space-y-2.5">
            {(!data?.leadFunnel?.stages || data.leadFunnel.stages.length === 0) ? (
              <p className="text-xs text-slate-500 py-6 text-center">No leads recorded for conversion analysis.</p>
            ) : (
              data.leadFunnel.stages.map((st) => (
                <div key={st.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{st.label}</span>
                    <span className="font-mono text-[11px] text-slate-400">{st.count} ({st.percentageOfTotal}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        st.status === "CONVERTED" ? "bg-emerald-500" :
                        st.status === "QUALIFIED" ? "bg-blue-500" :
                        st.status === "CONTACTED" ? "bg-indigo-500" :
                        st.status === "LOST" ? "bg-rose-500" : "bg-sky-500"
                      )}
                      style={{ width: `${Math.max(st.percentageOfTotal, 3)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Lead Source Breakdown Pills */}
          {data?.leadSources && data.leadSources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-2">
                Leads by Source:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.leadSources.map((src) => (
                  <span
                    key={src.source}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-300"
                  >
                    <span>{src.label}:</span>
                    <strong className="text-white">{src.count}</strong>
                    <span className="text-[10px] text-slate-500">({src.percentage}%)</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Won vs. Lost Comparative Analysis */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-teal-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Won vs. Lost Deal Analysis
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-slate-300">
              Win Rate: <strong className="text-teal-400">{summary.winRate}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Closed Won</span>
              <h4 className="text-xl font-bold text-white mt-1">₹{summary.wonRevenue.toLocaleString()}</h4>
              <span className="text-[11px] text-slate-400 block mt-0.5">{summary.wonOpportunities} deals won</span>
            </div>
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3.5">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Closed Lost</span>
              <h4 className="text-xl font-bold text-white mt-1">₹{summary.lostValue.toLocaleString()}</h4>
              <span className="text-[11px] text-slate-400 block mt-0.5">{summary.lostOpportunities} deals lost</span>
            </div>
          </div>

          {/* Loss Reasons Breakdown */}
          {data?.wonLostAnalysis?.lossReasons && data.wonLostAnalysis.lossReasons.length > 0 ? (
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-2">
                Primary Reasons for Deal Loss:
              </span>
              <div className="space-y-1.5">
                {data.wonLostAnalysis.lossReasons.map((lr) => (
                  <div key={lr.reason} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300 truncate max-w-[240px]">{lr.reason}</span>
                    <span className="rounded bg-rose-500/15 text-rose-400 px-1.5 py-0.2 text-[10px] font-semibold">
                      {lr.count} deal(s)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No lost deal records recorded in this timeframe.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Top Active Opportunities & Attention/Stale Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Active Opportunities */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Top Active Deal Opportunities
              </h4>
            </div>
            <Link href="/app/crm/opportunities" className="text-[11px] text-blue-400 hover:underline">
              View All Pipeline →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.topOpportunities || data.topOpportunities.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">No active opportunities in pipeline.</div>
            ) : (
              data.topOpportunities.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/app/crm/opportunities?id=${opp.id}`}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-800/40 px-2 rounded transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <h5 className="font-bold text-slate-200 hover:text-blue-400 truncate">{opp.name}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {opp.client.name} • Stage: {opp.stage} ({opp.probability}%)
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-white block">₹{opp.value.toLocaleString()}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : "No date"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Attention Needed / Stale Deals Alert */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Deals Requiring Attention
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">Past close date or inactive &gt; 30d</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.staleOpportunities || data.staleOpportunities.length === 0) ? (
              <div className="p-8 text-center text-xs text-emerald-400/80">
                ✓ All active deals have recent progression activity.
              </div>
            ) : (
              data.staleOpportunities.map((stale) => (
                <Link
                  key={stale.id}
                  href={`/app/crm/opportunities?id=${stale.id}`}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-800/40 px-2 rounded transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-slate-200 truncate">{stale.name}</h5>
                      {stale.isOverdueClose && (
                        <span className="rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.2 text-[9px] font-bold text-rose-400 shrink-0">
                          OVERDUE CLOSE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {stale.client.name} • {stale.daysSinceUpdate} days inactive
                    </p>
                  </div>
                  <span className="font-bold text-white shrink-0">₹{stale.value.toLocaleString()}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Top Clients by Revenue & 6-Month Sales Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Corporate Clients */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Top Client Accounts
              </h4>
            </div>
            <Link href="/app/crm/clients" className="text-[11px] text-blue-400 hover:underline">
              Client Directory →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.topClients || data.topClients.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">No clients registered.</div>
            ) : (
              data.topClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/app/crm/clients/${client.id}`}
                  className="group flex items-center justify-between py-2.5 hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {client.name}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                        {client.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {client.dealsCount} deals • Paid: ₹{client.paidRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block">
                      ₹{client.pipelineValue.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 block">Open Pipeline</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 6-Month Sales & Revenue Trend */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                6-Month Revenue & Bookings Trend
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">Invoiced vs Paid vs Won Deals</span>
          </div>

          <div className="space-y-3">
            {(!data?.salesTrend || data.salesTrend.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">No telemetry data.</div>
            ) : (
              data.salesTrend.map((st) => (
                <div key={st.period} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{st.period}</span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-400">Inv: ₹{st.invoiced.toLocaleString()}</span>
                      <span className="text-emerald-400">Paid: ₹{st.paid.toLocaleString()}</span>
                      <span className="text-teal-300">Won: ₹{st.dealsWonValue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      className="h-full bg-blue-500 rounded-l-full"
                      style={{ width: `${Math.min(st.invoiced > 0 ? (st.paid / st.invoiced) * 100 : 0, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Upcoming Meetings & Client Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Upcoming Client Meetings
              </h4>
            </div>
            <Link href="/app/calendar" className="text-[11px] text-blue-400 hover:underline">
              View Calendar ({data?.upcomingMeetings.length || 0}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.upcomingMeetings || data.upcomingMeetings.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No upcoming client meetings scheduled.
              </div>
            ) : (
              data.upcomingMeetings.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-200">{m.title}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Host: {m.creator.firstName} {m.creator.lastName}
                      {m.location && ` • ${m.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-purple-400">
                      {new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {m.meetUrl && (
                      <a
                        href={m.meetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-semibold hover:bg-purple-500/30"
                      >
                        Join
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Client Tasks */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-indigo-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Pending Action Items
              </h4>
            </div>
            <Link href="/app/tasks" className="text-[11px] text-blue-400 hover:underline">
              Task Center ({data?.taskStatistics?.total || 0}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.pendingTasks || data.pendingTasks.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No pending tasks tagged to clients.
              </div>
            ) : (
              data.pendingTasks.map((t) => (
                <Link
                  key={t.id}
                  href={`/app/tasks?id=${t.id}`}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-800/30 px-1 rounded transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{t.title}</span>
                      {t.isOverdue && (
                        <span className="text-[9px] font-bold uppercase text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {t.client?.name || "Client Account"} • Assignee: {t.assignee?.firstName || "Unassigned"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date"}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-500 uppercase">{t.priority}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Customer Touchpoints Feed */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Customer 360 Activity Stream
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Live multi-channel touchpoints</span>
        </div>

        {(!data?.recentActivities || data.recentActivities.length === 0) ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No customer activities recorded yet. Touchpoints logged from client pages will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recentActivities.map((act) => (
              <div
                key={act.id}
                className="rounded-lg border border-slate-800/80 bg-[#0c1322] p-3 flex items-start gap-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                  {getActivityIcon(act.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate">{act.subject}</span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {new Date(act.performedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {act.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {act.description}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">
                    {act.client?.name ? `Account: ${act.client.name}` : act.lead ? `Lead: ${act.lead.companyName}` : "General"} • by {act.performedBy.firstName} {act.performedBy.lastName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Column Grid: Corporate Clients Directory & Inbound Prospects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Corporate Clients */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Recent Corporate Clients
              </h4>
            </div>
            <Link
              href="/app/crm/clients"
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              View Directory →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.recentClients || data.recentClients.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No client accounts created yet.
              </div>
            ) : (
              data.recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/app/crm/clients/${client.id}`}
                  className="group flex items-center justify-between py-3 hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {client.name}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                        {client.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{client.industry || "General Industry"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[9px] font-semibold uppercase",
                        client.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      )}
                    >
                      {client.status}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Inbound Prospect Leads */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Inbound Sales Prospects
              </h4>
            </div>
            <Link
              href="/app/crm/leads"
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Manage Leads →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.recentLeads || data.recentLeads.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No inbound leads captured yet.
              </div>
            ) : (
              data.recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/app/crm/leads?id=${lead.id}`}
                  className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-slate-800/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        {lead.firstName} {lead.lastName}
                      </span>
                      <span className="text-[11px] text-slate-400">({lead.companyName})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {lead.source} • {lead.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-slate-300">
                      ₹{lead.estimatedValue ? lead.estimatedValue.toLocaleString() : "0"}
                    </span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[9px] font-semibold uppercase",
                        lead.status === "QUALIFIED"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : lead.status === "CONVERTED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      )}
                    >
                      {lead.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
