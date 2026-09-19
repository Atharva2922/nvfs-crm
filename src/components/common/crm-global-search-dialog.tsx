"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  UserCheck,
  Building,
  Users,
  TrendingUp,
  CheckSquare,
  Calendar,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CrmSearchResultData {
  leads: Array<{
    id: string;
    name: string;
    company: string;
    status: string;
    email: string;
    phone?: string | null;
    owner?: string | null;
    date?: string | null;
    navigationTarget: string;
  }>;
  clients: Array<{
    id: string;
    name: string;
    code: string;
    tier: string;
    status: string;
    phone?: string | null;
    owner?: string | null;
    date?: string | null;
    navigationTarget: string;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    clientName: string;
    clientId: string;
    designation?: string | null;
    navigationTarget: string;
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    value: number;
    stage: string;
    clientName: string;
    clientId: string;
    owner?: string | null;
    expectedCloseDate?: string | null;
    navigationTarget: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    clientName?: string | null;
    dueDate?: string | null;
    assignee?: string | null;
    navigationTarget: string;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    type: string;
    startDate: string;
    endDate?: string | null;
    location?: string | null;
    organizer?: string | null;
    navigationTarget: string;
  }>;
  proposals: Array<{
    id: string;
    proposalNumber: string;
    title: string;
    status: string;
    grandTotal: number;
    clientName: string;
    clientId: string;
    date?: string | null;
    navigationTarget: string;
  }>;
}

type EntityCategory = "all" | "leads" | "clients" | "contacts" | "opportunities" | "tasks" | "meetings" | "proposals";

interface CrmGlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function CrmGlobalSearchDialog({
  isOpen,
  onClose,
  initialQuery = "",
}: CrmGlobalSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<EntityCategory>("all");
  const [results, setResults] = useState<CrmSearchResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount/open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (initialQuery) setQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  // Debounced search query
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/crm/search?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setResults(json.data);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Flatten active items for keyboard traversal
  const flattenedItems = React.useMemo(() => {
    if (!results) return [];
    const list: Array<{
      category: string;
      id: string;
      title: string;
      subtitle: string;
      status?: string | null;
      owner?: string | null;
      date?: string | null;
      navigationTarget: string;
      badgeColor: string;
    }> = [];

    if (activeCategory === "all" || activeCategory === "leads") {
      results.leads.forEach((l) =>
        list.push({
          category: "Lead",
          id: l.id,
          title: l.name,
          subtitle: `${l.company} • ${l.email}`,
          status: l.status,
          owner: l.owner,
          date: l.date ? new Date(l.date).toLocaleDateString() : null,
          navigationTarget: l.navigationTarget,
          badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        })
      );
    }

    if (activeCategory === "all" || activeCategory === "clients") {
      results.clients.forEach((c) =>
        list.push({
          category: "Client",
          id: c.id,
          title: c.name,
          subtitle: `${c.code} • ${c.tier} Account`,
          status: c.status,
          owner: c.owner,
          date: c.date ? new Date(c.date).toLocaleDateString() : null,
          navigationTarget: c.navigationTarget,
          badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        })
      );
    }

    if (activeCategory === "all" || activeCategory === "opportunities") {
      results.opportunities.forEach((o) =>
        list.push({
          category: "Deal",
          id: o.id,
          title: o.name,
          subtitle: `${o.clientName} • ₹${o.value.toLocaleString()}`,
          status: o.stage,
          owner: o.owner,
          date: o.expectedCloseDate ? new Date(o.expectedCloseDate).toLocaleDateString() : null,
          navigationTarget: o.navigationTarget,
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        })
      );
    }

    if (activeCategory === "all" || activeCategory === "contacts") {
      results.contacts.forEach((con) =>
        list.push({
          category: "Contact",
          id: con.id,
          title: con.name,
          subtitle: `${con.designation || "Contact"} at ${con.clientName}`,
          status: null,
          owner: con.email,
          date: null,
          navigationTarget: con.navigationTarget,
          badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        })
      );
    }

    if (activeCategory === "all" || activeCategory === "tasks") {
      results.tasks.forEach((t) =>
        list.push({
          category: "Task",
          id: t.id,
          title: t.title,
          subtitle: t.clientName ? `Client: ${t.clientName}` : "Operational Task",
          status: `${t.priority} • ${t.status}`,
          owner: t.assignee,
          date: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : null,
          navigationTarget: t.navigationTarget,
          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        })
      );
    }

    if (activeCategory === "all" || activeCategory === "meetings") {
      results.meetings.forEach((m) =>
        list.push({
          category: "Meeting",
          id: m.id,
          title: m.title,
          subtitle: m.location || m.type,
          status: m.type,
          owner: m.organizer,
          date: new Date(m.startDate).toLocaleDateString(),
          navigationTarget: m.navigationTarget,
          badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        })
      );
    }

    if (activeCategory === "all" || activeCategory === "proposals") {
      results.proposals.forEach((p) =>
        list.push({
          category: "Proposal",
          id: p.id,
          title: `${p.proposalNumber} - ${p.title}`,
          subtitle: `${p.clientName} • ₹${p.grandTotal.toLocaleString()}`,
          status: p.status,
          owner: null,
          date: p.date ? new Date(p.date).toLocaleDateString() : null,
          navigationTarget: p.navigationTarget,
          badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        })
      );
    }

    return list;
  }, [results, activeCategory]);

  const handleSelect = (item: (typeof flattenedItems)[0]) => {
    onClose();
    router.push(item.navigationTarget);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flattenedItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flattenedItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flattenedItems.length) % flattenedItems.length);
    } else if (e.key === "Enter" && flattenedItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(flattenedItems[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  const totalHits = results
    ? results.leads.length +
      results.clients.length +
      results.contacts.length +
      results.opportunities.length +
      results.tasks.length +
      results.meetings.length +
      results.proposals.length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl rounded-xl border border-slate-700/70 bg-[#0b1120] text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3.5 bg-slate-900/60">
          <Search className="h-4 w-4 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, clients, deals, tasks, proposals, meetings..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults(null);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-mono uppercase text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto scrollbar-none text-xs">
          {[
            { key: "all", label: "All", count: totalHits },
            { key: "leads", label: "Leads", count: results?.leads.length || 0 },
            { key: "clients", label: "Clients", count: results?.clients.length || 0 },
            { key: "opportunities", label: "Deals", count: results?.opportunities.length || 0 },
            { key: "contacts", label: "Contacts", count: results?.contacts.length || 0 },
            { key: "tasks", label: "Tasks", count: results?.tasks.length || 0 },
            { key: "meetings", label: "Meetings", count: results?.meetings.length || 0 },
            { key: "proposals", label: "Proposals", count: results?.proposals.length || 0 },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setActiveCategory(cat.key as EntityCategory);
                setSelectedIndex(0);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-colors text-[11px] whitespace-nowrap",
                activeCategory === cat.key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <span>{cat.label}</span>
              {results && <span className="opacity-70 text-[10px]">({cat.count})</span>}
            </button>
          ))}
        </div>

        {/* Search Results / Status / Empty States */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span>Searching authorized CRM records...</span>
            </div>
          ) : !query || query.trim().length < 2 ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-1.5">
              <Command className="h-6 w-6 text-slate-600 mb-1" />
              <p className="font-medium text-slate-400">Search CRM Intelligence Hub</p>
              <p className="text-[11px] max-w-sm">
                Type at least 2 characters to discover leads, corporate accounts, deals, tasks, customer meetings, and proposals.
              </p>
            </div>
          ) : flattenedItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <p className="font-medium text-slate-300">No CRM records found</p>
              <p className="text-slate-500 mt-1 text-[11px]">
                No matching results found for &ldquo;<span className="text-slate-300">{query}</span>&rdquo; in your authorized scope.
              </p>
            </div>
          ) : (
            flattenedItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.category}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group",
                    isSelected ? "bg-slate-800/90 border border-blue-500/30" : "hover:bg-slate-800/40"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0",
                        item.badgeColor
                      )}
                    >
                      {item.category}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-medium text-slate-100 truncate group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h4>
                        {item.status && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right shrink-0 ml-4">
                    <div className="hidden sm:block text-[10px] text-slate-500">
                      {item.owner && <div>{item.owner}</div>}
                      {item.date && <div>{item.date}</div>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 mr-1">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 mr-1">
                ↵
              </kbd>
              Open
            </span>
          </div>
          <div>Authorized scope enforced</div>
        </div>
      </div>
    </div>
  );
}
