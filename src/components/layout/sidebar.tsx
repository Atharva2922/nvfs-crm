"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  IndianRupee,
  Package,
  Scale,
  BarChart3,
  Calendar,
  Bell,
  CheckSquare,
  ShieldAlert,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Building,
  Clock,
  FileCheck,
  FolderKanban,
  FileText,
  UserCheck,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { AuthenticatedUser } from "@/types";

interface NavGroup {
  groupName?: string;
  items: Array<{
    title: string;
    href: string;
    icon: React.ElementType;
    subItems?: Array<{ title: string; href: string }>;
  }>;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
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
        console.error("Failed to fetch session user in Sidebar:", err);
      }
    }
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const role = currentUser?.roleCode || "EMPLOYEE";
  const roleLevel = currentUser?.roleLevel || 10;
  const permissions = currentUser?.permissions || [];
  const isManager = roleLevel >= 30 || role === "MANAGER";

  // Build navigation items based on User Role & Permissions
  const navGroups: NavGroup[] = [
    {
      items: [{ title: "Overview", href: "/app/overview", icon: LayoutDashboard }],
    },
    {
      groupName: "MY WORK",
      items: [
        { title: "My Tasks", href: "/app/tasks", icon: CheckSquare },
        { title: "My Projects", href: "/app/projects", icon: FolderKanban },
        { title: "Calendar", href: "/app/calendar", icon: Calendar },
      ],
    },
    {
      groupName: "HR & PROFILE",
      items: [
        { title: "Attendance", href: "/app/hr/attendance", icon: Clock },
        { title: "My Leave", href: "/app/hr/leave", icon: Calendar },
        { title: "My Salary", href: "/app/payroll/my-payslips", icon: FileCheck },
        { title: "My Documents", href: "/app/documents", icon: FileText },
        ...(isManager
          ? [{ title: "Team Attendance", href: "/app/hr/attendance?scope=TEAM", icon: UserCheck }]
          : []),
      ],
    },
    {
      groupName: "SELF SERVICE & SERVICES",
      items: [
        { title: "Expenses", href: "/app/expenses", icon: IndianRupee },
        { title: "On-Duty Field", href: "/app/on-duty", icon: Briefcase },
        { title: "Request Center", href: "/app/requests", icon: FileText },
        { title: "Company People", href: "/app/people", icon: Users },
        { title: "Policies", href: "/app/policies", icon: BookOpen },
        { title: "Notifications", href: "/app/notifications", icon: Bell },
      ],
    },
  ];

  // Optional Administrative / Executive Modules
  if (roleLevel >= 50 || ["SUPER_ADMIN", "ADMIN", "CEO", "CFO", "CTO", "CMO", "CHAIRPERSON"].includes(role)) {
    navGroups.push({
      groupName: "ENTERPRISE MODULES",
      items: [
        ...(role === "CEO" || role === "SUPER_ADMIN" || role === "CHAIRPERSON" || roleLevel >= 90 || permissions.includes("dashboard.ceo.view")
          ? [{ title: "CEO Dashboard", href: "/app/dashboard/ceo", icon: Sparkles }]
          : []),
        ...(role === "CMO" || role === "CEO" || role === "CHAIRPERSON" || role === "SUPER_ADMIN" || roleLevel >= 80 || permissions.some((p) => p.startsWith("crm"))
          ? [{ title: "CRM", href: "/app/crm", icon: Briefcase }]
          : []),
        ...(role === "CTO" || role === "CEO" || role === "CHAIRPERSON" || role === "SUPER_ADMIN" || roleLevel >= 50 || permissions.some((p) => p.startsWith("operations"))
          ? [{ title: "Operations Hub", href: "/app/operations", icon: Layers }]
          : []),
        ...(role === "CFO" || role === "CEO" || role === "CHAIRPERSON" || role === "SUPER_ADMIN" || roleLevel >= 80 || permissions.some((p) => p.startsWith("finance"))
          ? [{ title: "Finance Hub", href: "/app/finance", icon: IndianRupee }]
          : []),
        ...(role === "CFO" || role === "ADMIN" || role === "SUPER_ADMIN" || role === "CEO" || roleLevel >= 80 || permissions.some((p) => p.startsWith("payroll"))
          ? [{ title: "Payroll Management", href: "/app/payroll", icon: FileCheck }]
          : []),
        ...(role === "CFO" || role === "CTO" || role === "CEO" || role === "CHAIRPERSON" || role === "SUPER_ADMIN" || roleLevel >= 50 || permissions.some((p) => p.startsWith("inventory"))
          ? [{ title: "Products & Inventory", href: "/app/inventory", icon: Package }]
          : []),
        ...(role === "ADMIN" || role === "SUPER_ADMIN" || role === "CEO" || role === "CHAIRPERSON" || roleLevel >= 80 || permissions.some((p) => p.startsWith("legal"))
          ? [{ title: "Legal & Compliance", href: "/app/legal", icon: Scale }]
          : []),
        ...(role === "ADMIN" || role === "SUPER_ADMIN" || role === "CEO" || role === "CHAIRPERSON" || role === "DEPARTMENT_HEAD" || roleLevel >= 50 || permissions.some((p) => p.startsWith("hr") || p.startsWith("employees"))
          ? [{ title: "HR & Organization", href: "/app/hr", icon: Building }]
          : []),
        ...(roleLevel >= 50 ? [{ title: "Reports & Cockpit", href: "/app/reports", icon: BarChart3 }] : []),
        ...(roleLevel >= 80 ? [{ title: "Audit Trail", href: "/app/audit", icon: ShieldAlert }] : []),
      ],
    });
  }

  navGroups.push({
    items: [{ title: "Settings", href: "/app/settings", icon: Settings }],
  });

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16] text-slate-700 dark:text-slate-200 transition-all duration-200 ease-in-out select-none z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand & Organization Header */}
      <div className="flex h-14 items-center justify-between px-3.5 border-b border-slate-200 dark:border-slate-800/80">
        <Link href="/app/overview" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-amber-300 border border-amber-400/40 font-bold text-sm shadow-md shadow-blue-900/20">
            NF
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                CRM + NFVS
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400/90 font-mono tracking-wider">
                NFVS GLOBAL CORP
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-7 w-7 items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && group.groupName && (
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                {group.groupName}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/app/overview" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-blue-600 dark:text-amber-400"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    )}
                  />
                  {!collapsed && <span className="truncate flex-1">{item.title}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Organization Boundary Badge */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 p-3">
        {!collapsed ? (
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <span className="truncate max-w-[130px]">NFVS-CORP</span>
            </div>
            <span className="rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 px-1.5 py-0.5 text-[9px] font-mono text-amber-700 dark:text-amber-300 font-medium">
              {currentUser?.roleName || "Active"}
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title="Organization Active">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
        )}
      </div>
    </aside>
  );
}
