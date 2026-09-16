"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Building, UserCheck, TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_TABS = [
  { label: "CRM Cockpit", href: "/app/crm", icon: BarChart3, exact: true },
  { label: "Clients & Accounts", href: "/app/crm/clients", icon: Building },
  { label: "Leads & Prospects", href: "/app/crm/leads", icon: UserCheck },
  { label: "Deals & Pipeline", href: "/app/crm/opportunities", icon: TrendingUp },
];

export function CrmNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 bg-[#090d16]/80 px-4 py-2">
      {NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
