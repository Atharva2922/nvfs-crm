"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck2,
  Layers,
  Users,
  FileText,
} from "lucide-react";

const PAYROLL_LINKS = [
  { label: "Overview", href: "/app/payroll", icon: LayoutDashboard, exact: true },
  { label: "Payroll Runs", href: "/app/payroll/periods", icon: CalendarCheck2, exact: false },
  { label: "Salary Structures", href: "/app/payroll/structures", icon: Layers, exact: false },
  { label: "Employee Salaries", href: "/app/payroll/employee-salaries", icon: Users, exact: false },
  { label: "My Payslips", href: "/app/payroll/my-payslips", icon: FileText, exact: false },
];

export function PayrollNav() {
  const pathname = usePathname();

  return (
    <div className="flex border-b border-slate-800 bg-[#0c121e]/80 backdrop-blur-sm -mx-6 px-6 -mt-2 mb-6 overflow-x-auto no-scrollbar">
      <nav className="flex space-x-1 py-2">
        {PAYROLL_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
