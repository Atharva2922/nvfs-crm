"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  RefreshCw,
  Scale,
  ShieldCheck,
  Clock,
  BookOpen,
  FileCheck2,
  AlertTriangle,
  Calendar,
  BarChart3,
  Plus,
} from "lucide-react";

interface NavTab {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_TABS: NavTab[] = [
  { label: "Dashboard", href: "/app/legal", icon: LayoutDashboard },
  { label: "Contracts", href: "/app/legal/contracts", icon: FileText },
  { label: "Renewals", href: "/app/legal/renewals", icon: RefreshCw },
  { label: "Cases & Litigation", href: "/app/legal/cases", icon: Scale },
  { label: "Compliance", href: "/app/legal/compliance", icon: ShieldCheck },
  { label: "Deadlines", href: "/app/legal/deadlines", icon: Clock },
  { label: "External Counsel", href: "/app/legal/contacts", icon: BookOpen },
  { label: "Document Vault", href: "/app/legal/documents", icon: FileCheck2 },
  { label: "Risk Register", href: "/app/legal/risks", icon: AlertTriangle },
  { label: "Calendar", href: "/app/legal/calendar", icon: Calendar },
  { label: "Reports & Export", href: "/app/legal/reports", icon: BarChart3 },
];

export function LegalNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-6 overflow-x-auto gap-4 scrollbar-none">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/app/legal"
              ? pathname === "/app/legal"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/app/legal/contracts/new"
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Contract</span>
        </Link>
      </div>
    </div>
  );
}
