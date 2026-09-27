"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  FileText,
  Receipt,
  Users,
  Briefcase,
  Landmark,
  BookOpenCheck,
  ChevronRight,
  Loader2,
  Building2,
  Building,
  CreditCard,
  UserCheck,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountsSearchDialogProps {
  open: boolean;
  onClose: () => void;
  selectedCompanyId?: string;
}

export function AccountsSearchDialog({ open, onClose, selectedCompanyId = "ALL" }: AccountsSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, any[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [companyFilter, setCompanyFilter] = useState<string>(selectedCompanyId);
  const [accessibleCompanies, setAccessibleCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync company filter when parent scope changes
  useEffect(() => {
    setCompanyFilter(selectedCompanyId);
  }, [selectedCompanyId]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setByCategory({});
      setSelectedCategory("ALL");
    }
  }, [open]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Search debounce with cross-company parameters
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setByCategory({});
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `/api/accounts/search?q=${encodeURIComponent(query.trim())}${
          companyFilter !== "ALL" ? `&companyId=${encodeURIComponent(companyFilter)}` : ""
        }`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setResults(json.data.results || []);
            setByCategory(json.data.byCategory || {});
            if (json.data.accessibleCompanies) {
              setAccessibleCompanies(json.data.accessibleCompanies);
            }
          }
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, companyFilter]);

  if (!open) return null;

  const handleSelectResult = (url: string) => {
    onClose();
    router.push(url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Invoice":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "Bill":
        return <Receipt className="h-4 w-4 text-amber-500" />;
      case "Employee":
        return <UserCheck className="h-4 w-4 text-indigo-500" />;
      case "Customer":
        return <Users className="h-4 w-4 text-emerald-500" />;
      case "Vendor":
        return <Briefcase className="h-4 w-4 text-purple-500" />;
      case "Payment":
        return <CreditCard className="h-4 w-4 text-teal-500" />;
      case "Expense":
        return <Wallet className="h-4 w-4 text-rose-500" />;
      case "Journal Entry":
        return <BookOpenCheck className="h-4 w-4 text-cyan-500" />;
      case "Bank Account":
      case "Account":
        return <Landmark className="h-4 w-4 text-emerald-600" />;
      case "Company":
        return <Building className="h-4 w-4 text-blue-600" />;
      default:
        return <Search className="h-4 w-4 text-slate-400" />;
    }
  };

  const filteredResults =
    selectedCategory === "ALL"
      ? results
      : results.filter((r) => r.category === selectedCategory);

  const categories = [
    "ALL",
    ...Object.keys(byCategory).filter((cat) => (byCategory[cat]?.length || 0) > 0),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Search Header & Inputs */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all companies: employee, customer, vendor, invoice #, bill #, expense, journal..."
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
            />
            {loading && <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-1" />}

            {/* Company Filter Dropdown */}
            {accessibleCompanies.length > 0 && (
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="ALL">All Companies</option>
                {accessibleCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Category Tabs */}
          {results.length > 0 && categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs border-t border-slate-100 dark:border-slate-800/60">
              {categories.map((cat) => {
                const count = cat === "ALL" ? results.length : byCategory[cat]?.length || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5",
                      selectedCategory === cat
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <span>{cat === "ALL" ? "All Results" : cat}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1 py-0.2 rounded-full",
                        selectedCategory === cat
                          ? "bg-blue-800/60 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[220px]">
          {query.trim().length >= 2 && results.length === 0 && !loading && (
            <div className="py-14 text-center text-slate-400 text-sm space-y-1">
              <p className="font-semibold text-slate-300">No records found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500">
                Try searching by employee name, employee ID, invoice number, customer, or account code.
              </p>
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="p-4 text-xs text-slate-400 space-y-3">
              <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                <span>Global Corporate Accounts Search</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">Employee Accounts</div>
                  <p className="text-[11px] text-slate-500">Search by Name, Employee ID (e.g. EMP-1042), Email, Designation, Department</p>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">Financial Transactions</div>
                  <p className="text-[11px] text-slate-500">Search Invoices (INV-2026), Bills (BILL-2026), Payments, Expenses, Journals</p>
                </div>
              </div>
            </div>
          )}

          {filteredResults.length > 0 && (
            <div className="space-y-1.5">
              {filteredResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectResult(res.url)}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-left border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-slate-900/70 transition-all group shadow-xs"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      {getIcon(res.type)}
                    </div>
                    <div className="min-w-0">
                      {/* Title + Company Badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                          {res.title}
                        </span>

                        {/* Mandatory Company Identity Pill (Requirement 2) */}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          <Building2 className="h-2.5 w-2.5" />
                          <span>{res.companyName}</span>
                          <span className="opacity-75">({res.companyCode})</span>
                        </span>

                        {/* Category/Type Pill */}
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {res.type}
                        </span>

                        {/* Status Badge if available */}
                        {res.status && (
                          <span
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.2 rounded uppercase",
                              res.status === "ACTIVE" || res.status === "PAID" || res.status === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : res.status === "OVERDUE" || res.status === "REJECTED"
                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            )}
                          >
                            {res.status}
                          </span>
                        )}
                      </div>

                      {/* Subtitle / Details */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {res.subtitle}
                      </div>

                      {/* Extra metadata if employee or invoice */}
                      {res.details && res.type === "Employee" && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                          <span>ID: {res.details.employeeNumber}</span>
                          <span>•</span>
                          <span>Dept: {res.details.department || "General"}</span>
                          {res.details.email && (
                            <>
                              <span>•</span>
                              <span>{res.details.email}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-500 shrink-0 ml-3">
                    <span className="text-[11px] font-semibold hidden sm:inline">Open</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Press <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">Esc</kbd> to close
            </span>
            <span>•</span>
            <span>Search covers all managed corporate entities</span>
          </div>
          <span className="font-mono text-blue-500 font-semibold">Centralized Accounts Search</span>
        </div>
      </div>
    </div>
  );
}
