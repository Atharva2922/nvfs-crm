"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  GanttChart,
  Calendar,
  Users2,
  AlertTriangle,
  BarChart3,
  Plus,
} from "lucide-react";

interface NavTab {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_TABS: NavTab[] = [
  { label: "Dashboard", href: "/app/operations", icon: LayoutDashboard },
  { label: "Operations List", href: "/app/operations/list", icon: ListTodo },
  { label: "Gantt Timeline", href: "/app/operations/timeline", icon: GanttChart },
  { label: "Calendar", href: "/app/operations/calendar", icon: Calendar },
  { label: "Resource Matrix", href: "/app/operations/resources", icon: Users2 },
  { label: "Issues & Risks", href: "/app/operations/issues", icon: AlertTriangle },
  { label: "Reports & Cockpit", href: "/app/operations/reports", icon: BarChart3 },
];

export function OperationsNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-blue-900/30 pb-2 mb-6 overflow-x-auto gap-4 scrollbar-none">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/app/operations"
              ? pathname === "/app/operations"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-blue-600/15 text-blue-700 dark:text-amber-300 border border-blue-500/30 dark:border-amber-400/40 shadow-xs font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-blue-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Link
        href="/app/operations/new"
        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-800 hover:to-blue-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs shadow-blue-500/25 transition-all whitespace-nowrap shrink-0"
      >
        <Plus className="h-3.5 w-3.5 text-amber-300" />
        New Operation
      </Link>
    </div>
  );
}
