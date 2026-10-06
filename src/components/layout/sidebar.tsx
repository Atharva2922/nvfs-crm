"use client";

import React, { useState, useMemo } from "react";
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
  CalendarCheck,
  Bell,
  MessageSquare,
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
  Zap,
  Globe2,
  Server,
  Activity,
  UserPlus,
  ShieldCheck,
  GitBranch,
  Landmark,
  User,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  groupName?: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const {
    user: currentUser,
    role,
    roleLevel,
    permissions,
    activeCompany,
    isSuperAdmin,
    isExecutive,
    isDeptHead,
    isManager,
  } = useAuth();

  // Determine dynamic company branding
  const companyName = activeCompany?.name || "Apex Global Technologies";
  const companyCode = activeCompany?.code || "APEX-TECH";
  const primaryColor = activeCompany?.primaryColor || "#2563eb";
  const companyLogo =
    activeCompany?.logo ||
    (companyCode === "NFVS" || companyName.toLowerCase().includes("venture")
      ? "/logos/nfvs-logo.jpg"
      : companyCode === "NAREE" || companyName.toLowerCase().includes("naree")
      ? "/logos/naree-logo.jpg"
      : null);
  const companyInitials = companyName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Build role-specific navigation groups strictly scoped by designation
  const deptCode = (currentUser?.employee?.departmentCode || "").toUpperCase();
  const deptName = (currentUser?.employee?.departmentName || "").toLowerCase();
  const designation = (currentUser?.employee?.designation || "").toLowerCase();
  const userEmail = (currentUser?.email || "").toLowerCase();

  const isOpsStaff =
    deptCode === "OPS" ||
    deptName.includes("operation") ||
    designation.includes("operation") ||
    userEmail.startsWith("operations");

  const isFinStaff =
    deptCode === "FIN" ||
    deptName.includes("finance") ||
    deptName.includes("account") ||
    designation.includes("finance") ||
    designation.includes("accountant") ||
    designation.includes("accounts") ||
    userEmail.startsWith("finance");

  const isMktStaff =
    deptCode === "MKT" ||
    deptName.includes("market") ||
    designation.includes("market") ||
    userEmail.startsWith("marketing");

  const isIntlStaff =
    deptCode === "INTL" ||
    deptName.includes("international") ||
    designation.includes("international") ||
    userEmail.startsWith("international");

  const navGroups: NavGroup[] = useMemo(() => {
    const navGroups: NavGroup[] = [];

  // ========================================================
  // 1. SUPER ADMIN (Platform-Level Cockpit & Read-Only Governance)
  // ========================================================
  if (isSuperAdmin) {
    navGroups.push({
      groupName: "PLATFORM GOVERNANCE",
      items: [
        { title: "Platform Overview", href: "/app/super-admin", icon: Server },
        { title: "Persona & Role Allocations", href: "/app/super-admin#personas", icon: ShieldAlert },
        { title: "Company Management", href: "/app/super-admin/companies", icon: Building },
        { title: "Platform Settings", href: "/app/super-admin/settings", icon: Settings },
      ],
    });
    navGroups.push({
      groupName: "ENTERPRISE OVERSIGHT",
      items: [
        { title: "Employee Directory", href: "/app/hr/employees", icon: Users },
        { title: "Org Hierarchy Tree", href: "/app/hr/hierarchy", icon: GitBranch },
        { title: "Company People", href: "/app/people", icon: UserPlus },
        { title: "CRM & Customers", href: "/app/crm", icon: Briefcase },
        { title: "Operations & Delivery", href: "/app/operations", icon: Layers },
        { title: "Finance Hub", href: "/app/finance", icon: IndianRupee },
        { title: "Accounts & Books", href: "/app/accounts", icon: Landmark },
        { title: "Payroll Master", href: "/app/payroll", icon: FileCheck },
        { title: "Products & Inventory", href: "/app/inventory", icon: Package },
      ],
    });
  }

  // ========================================================
  // 2. ADMIN (Company Administration Tier)
  // ========================================================
  else if (role === "ADMIN") {
    navGroups.push({
      groupName: "COMPANY ADMINISTRATION",
      items: [
        { title: "Admin Center", href: "/app/dashboard/admin", icon: ShieldAlert },
        { title: "Employee Directory", href: "/app/hr/employees", icon: Users },
        { title: "Users & Roles", href: "/app/people", icon: UserPlus },
        { title: "Organization Hierarchy", href: "/app/hr/hierarchy", icon: GitBranch },
        { title: "Departments & Teams", href: "/app/hr", icon: Building },
        { title: "Workflows & Automations", href: "/app/settings/workflows", icon: Zap },
        { title: "Company Audit Trail", href: "/app/audit", icon: ShieldAlert },
        { title: "Company Settings", href: "/app/settings/company", icon: Settings },
      ],
    });
  }

  // ========================================================
  // 3. CEO & CHAIRPERSON (Executive Cockpit)
  // ========================================================
  else if (role === "CEO" || role === "CHAIRPERSON") {
    navGroups.push({
      groupName: "EXECUTIVE SUITE",
      items: [
        { title: "CEO Executive Cockpit", href: "/app/dashboard/ceo", icon: Sparkles },
        ...(role === "CHAIRPERSON"
          ? [{ title: "Chairperson Oversight", href: "/app/dashboard/chairperson", icon: Building }]
          : []),
        { title: "Employee Directory", href: "/app/hr/employees", icon: Users },
        { title: "Accounts & Books", href: "/app/accounts", icon: Landmark },
        { title: "Org Hierarchy Tree", href: "/app/hr/hierarchy", icon: GitBranch },
        { title: "Executive Approvals", href: "/app/approvals", icon: ShieldCheck },
        { title: "Company People", href: "/app/people", icon: UserPlus },
        { title: "Strategic Reports", href: "/app/reports", icon: BarChart3 },
      ],
    });
  }

  // ========================================================
  // 4. HR (People & Culture Tier)
  // ========================================================
  else if (role === "HR") {
    navGroups.push({
      groupName: "PEOPLE & CULTURE",
      items: [
        { title: "HR Executive Center", href: "/app/dashboard/hr", icon: Sparkles },
        { title: "Employee Directory", href: "/app/hr/employees", icon: Users },
        { title: "Company People", href: "/app/people", icon: UserPlus },
        { title: "Organization Hierarchy", href: "/app/hr/hierarchy", icon: GitBranch },
        { title: "Departments & Teams", href: "/app/hr", icon: Building },
        { title: "Attendance Roster", href: "/app/hr/attendance", icon: Clock },
        { title: "Leave Approvals", href: "/app/approvals", icon: ShieldCheck },
        { title: "Payroll Master", href: "/app/payroll", icon: FileCheck },
      ],
    });
  }

  // ========================================================
  // 5. DOMAIN CXOs (COO, CFO, CIO/CTO, CMO)
  // ========================================================
  else if (role === "COO") {
    navGroups.push({
      groupName: "OPERATIONS LEADERSHIP",
      items: [
        { title: "COO Operations Hub", href: "/app/dashboard/coo", icon: Activity },
        { title: "Employee Directory", href: "/app/hr/employees", icon: Users },
        { title: "Service Delivery & Operations", href: "/app/operations", icon: Layers },
        { title: "Products & Inventory", href: "/app/inventory", icon: Package },
        { title: "Company Projects", href: "/app/projects", icon: FolderKanban },
        { title: "Operations Approvals", href: "/app/approvals", icon: ShieldCheck },
      ],
    });
  } else if (role === "CFO") {
    navGroups.push({
      groupName: "FINANCE & TREASURY",
      items: [
        { title: "CFO Treasury Center", href: "/app/dashboard/cfo", icon: IndianRupee },
        { title: "Employee Directory", href: "/app/hr/employees", icon: Users },
        { title: "Accounts & Books", href: "/app/accounts", icon: Landmark },
        { title: "Finance Hub", href: "/app/finance", icon: IndianRupee },
        { title: "Payroll Operations", href: "/app/payroll", icon: FileCheck },
        { title: "Financial Approvals", href: "/app/approvals", icon: ShieldCheck },
      ],
    });
  } else if (role === "CIO" || role === "CTO") {
    navGroups.push({
      groupName: "TECHNOLOGY LEADERSHIP",
      items: [
        { title: "Tech Leadership Center", href: "/app/dashboard/cto", icon: Layers },
        { title: "Employee Directory", href: "/app/hr/employees", icon: Users },
        { title: "IT Infrastructure & Systems", href: "/app/operations", icon: GitBranch },
        { title: "Hardware & IT Inventory", href: "/app/inventory", icon: Package },
        { title: "Technology Projects", href: "/app/projects", icon: FolderKanban },
        { title: "Tech Approvals", href: "/app/approvals", icon: ShieldCheck },
      ],
    });
  } else if (role === "CMO") {
    navGroups.push({
      groupName: "GROWTH & MARKETING",
      items: [
        { title: "CMO Growth Center", href: "/app/dashboard/cmo", icon: BarChart3 },
        { title: "Employee Directory", href: "/app/hr/employees", icon: Users },
        { title: "CRM & Pipelines", href: "/app/crm", icon: Briefcase },
        { title: "Marketing Campaigns", href: "/app/projects", icon: FolderKanban },
        { title: "Marketing Approvals", href: "/app/approvals", icon: ShieldCheck },
        { title: "Growth Analytics", href: "/app/reports", icon: Activity },
      ],
    });
  }

  // ========================================================
  // 6. FUNCTIONAL TEAMS (Operations, Finance, Marketing, Intl)
  // ========================================================
  if (role === "EMPLOYEE" || (!isSuperAdmin && !["ADMIN", "CEO", "HR", "COO", "CFO", "CIO", "CTO", "CMO"].includes(role))) {
    if (isOpsStaff) {
      navGroups.push({
        groupName: "OPERATIONS TEAM",
        items: [
          { title: "Operations & Delivery", href: "/app/operations", icon: Layers },
          { title: "Products & Inventory", href: "/app/inventory", icon: Package },
          { title: "Operations Projects", href: "/app/projects", icon: FolderKanban },
          { title: "Team Tasks", href: "/app/tasks", icon: CheckSquare },
        ],
      });
    } else if (isFinStaff) {
      navGroups.push({
        groupName: "FINANCE TEAM",
        items: [
          { title: "Accounts & Books", href: "/app/accounts", icon: Landmark },
          { title: "Finance Hub", href: "/app/finance", icon: IndianRupee },
          { title: "Financial Tasks", href: "/app/tasks", icon: CheckSquare },
        ],
      });
    } else if (isMktStaff) {
      navGroups.push({
        groupName: "MARKETING TEAM",
        items: [
          { title: "CRM & Customers", href: "/app/crm", icon: Briefcase },
          { title: "Marketing Campaigns", href: "/app/projects", icon: FolderKanban },
          { title: "Marketing Tasks", href: "/app/tasks", icon: CheckSquare },
        ],
      });
    } else if (isIntlStaff) {
      navGroups.push({
        groupName: "INTERNATIONAL AFFAIRS TEAM",
        items: [
          { title: "International Projects", href: "/app/projects", icon: FolderKanban },
          { title: "Global Operations", href: "/app/operations", icon: Layers },
          { title: "International Tasks", href: "/app/tasks", icon: CheckSquare },
        ],
      });
    }
  }

  // ========================================================
  // 7. MY WORKSPACE (Universal Personal Portal)
  // ========================================================
  const isExecutiveOrAdmin =
    isSuperAdmin ||
    isExecutive ||
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "CEO" ||
    role === "CHAIRPERSON";

  navGroups.push({
    groupName: "MY WORKSPACE",
    items: [
      { title: "Workspace Overview", href: "/app/overview", icon: LayoutDashboard },
      { title: "My Profile", href: "/app/profile", icon: User },
      ...(isExecutiveOrAdmin ? [{ title: "Employee Directory", href: "/app/hr/employees", icon: Users }] : []),
      { title: "My Tasks", href: "/app/tasks", icon: CheckSquare },
      { title: "My Attendance", href: "/app/hr/attendance", icon: Clock },
      {
        title: isExecutiveOrAdmin ? "Leave Management" : "My Leave",
        href: "/app/hr/leaves",
        icon: isExecutiveOrAdmin ? CalendarCheck : Calendar,
      },
      { title: "My Salary & Payslips", href: "/app/payroll/my-payslips", icon: FileCheck },
      { title: "My Documents", href: "/app/documents", icon: FileText },
      { title: "Request Center", href: "/app/requests", icon: FileText },
      { title: "Communications", href: "/app/communications", icon: MessageSquare },
      { title: "Calendar", href: "/app/calendar", icon: Calendar },
    ],
  });

  // Settings
  navGroups.push({
    items: [
      { title: "Personal Settings", href: "/app/settings", icon: Settings },
    ],
  });

    return navGroups;
  }, [
    isSuperAdmin,
    isExecutive,
    role,
    roleLevel,
    deptCode,
    deptName,
    designation,
    userEmail,
    permissions,
  ]);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16] text-slate-700 dark:text-slate-200 transition-all duration-200 ease-in-out select-none z-30",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Brand & Organization Header - No Overlap on Logo */}
      <div className="flex h-14 items-center border-b border-slate-200 dark:border-slate-800/80 px-2.5">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full overflow-hidden">
            <Link href="/app/overview" className="flex items-center gap-2.5 overflow-hidden">
              {companyLogo ? (
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white p-0.5 shadow-sm">
                  <img
                    src={companyLogo}
                    alt={companyName}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-bold text-sm text-white shadow-md transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  {companyInitials || "CR"}
                </div>
              )}
              <div className="flex flex-col truncate">
                <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white truncate">
                  {companyName}
                </span>
                <span
                  className="text-[10px] font-mono tracking-wider truncate font-semibold"
                  style={{ color: primaryColor }}
                >
                  {companyCode}
                </span>
              </div>
            </Link>
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors ml-1"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Clean centered logo with zero overlap when collapsed */
          <div className="w-full flex items-center justify-center">
            <Link
              href="/app/overview"
              className="flex items-center justify-center group focus:outline-none"
              title={companyName}
            >
              {companyLogo ? (
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white p-0.5 shadow-sm group-hover:scale-105 transition-transform">
                  <img
                    src={companyLogo}
                    alt={companyName}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-bold text-sm text-white shadow-md group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: primaryColor }}
                >
                  {companyInitials || "CR"}
                </div>
              )}
            </Link>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-1.5 py-3 space-y-4">
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
                    "group rounded-lg transition-all",
                    collapsed
                      ? "flex flex-col items-center justify-center py-2 px-1 text-center w-full"
                      : "flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium",
                    isActive
                      ? "bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                  title={item.title}
                >
                  <Icon
                    className={cn(
                      "shrink-0 transition-transform group-hover:scale-105",
                      collapsed ? "h-4 w-4 mb-0.5" : "h-4 w-4",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    )}
                  />
                  {collapsed ? (
                    <span className="text-[10px] leading-3 text-center truncate max-w-[58px] tracking-tight font-medium">
                      {item.title}
                    </span>
                  ) : (
                    <span className="truncate flex-1">{item.title}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Tenant Boundary & Role Badge / Bottom Expand Toggle */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 p-2 shrink-0">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center h-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 px-1 py-1">
            <div className="flex items-center gap-1.5 truncate max-w-[130px]">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="truncate font-medium">{companyName}</span>
            </div>
            <span
              suppressHydrationWarning
              className="rounded px-1.5 py-0.5 text-[9px] font-mono font-medium"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                border: `1px solid ${primaryColor}35`,
              }}
            >
              {currentUser?.roleName || "Active"}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
