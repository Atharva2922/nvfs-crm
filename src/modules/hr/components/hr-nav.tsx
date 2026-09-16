"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Network,
  CalendarDays,
  Clock,
  CalendarOff,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { AuthenticatedUser } from "@/types";

const HR_LINKS = [
  { label: "Overview", href: "/app/hr", icon: LayoutDashboard, exact: true, requiresManagement: false },
  { label: "Employees", href: "/app/hr/employees", icon: Users, exact: false, requiresManagement: true },
  { label: "Org Hierarchy", href: "/app/hr/organization", icon: Network, exact: false, requiresManagement: true },
  { label: "Leave Management", href: "/app/hr/leaves", icon: CalendarDays, exact: false, requiresManagement: false },
  { label: "Attendance", href: "/app/hr/attendance", icon: Clock, exact: false, requiresManagement: false },
  { label: "Work Days & Holidays", href: "/app/hr/work-days", icon: CalendarOff, exact: false, requiresManagement: true },
  { label: "HR Policies", href: "/app/hr/policies", icon: BookOpen, exact: false, requiresManagement: false },
  { label: "Compliance", href: "/app/hr/compliance", icon: ShieldCheck, exact: false, requiresManagement: true },
];

export function HrNav() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (isMounted) setCurrentUser(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user session in HrNav:", err);
      }
    }
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const isManagement = currentUser
    ? currentUser.roleCode === "SUPER_ADMIN" ||
      currentUser.roleCode === "ADMIN" ||
      currentUser.roleCode === "CEO" ||
      currentUser.roleCode === "CHAIRPERSON" ||
      currentUser.roleCode === "DEPARTMENT_HEAD" ||
      currentUser.roleCode === "MANAGER" ||
      (currentUser.roleLevel || 10) >= 30
    : true; // Default allow while loading

  const visibleLinks = HR_LINKS.filter((link) => !link.requiresManagement || isManagement);

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-sm -mx-6 px-6 -mt-2 mb-6 overflow-x-auto no-scrollbar">
      <nav className="flex space-x-1 py-2">
        {visibleLinks.map((link) => {
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
                  ? "bg-blue-600/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"
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

