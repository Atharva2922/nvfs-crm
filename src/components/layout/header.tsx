"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Database,
  ChevronDown,
  LogOut,
  Shield,
  Network,
  User,
  Building,
  Briefcase,
  Mail,
  BadgeCheck,
  Building2,
  ArrowRightLeft,
  Sparkles,
  Settings,
} from "lucide-react";
import { SystemRoleCode } from "@/types";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";
import { CommunicationHeaderWidget } from "@/modules/communications/components/communication-header-widget";
import { GlobalAIButton } from "@/modules/ai/components/global-ai-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";
import { CrmGlobalSearchDialog } from "@/components/common/crm-global-search-dialog";

interface HeaderProps {
  currentRole?: SystemRoleCode;
  onRoleChange?: (role: SystemRoleCode) => void;
}

export function Header({ currentRole = "SUPER_ADMIN", onRoleChange }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user: currentUser,
    activeCompany,
    memberships,
    isMultiCompanyUser,
    isSuperAdmin,
    switchCompany,
  } = useAuth();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on outside click or navigation
  useEffect(() => {
    setRoleDropdownOpen(false);
    setCompanyDropdownOpen(false);
  }, [pathname]);

  // Generate breadcrumb items
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs =
    pathSegments.length === 0
      ? ["Overview"]
      : pathSegments.map((s) => s.replace(/-/g, " "));

  const displayName = currentUser?.employee
    ? `${currentUser.employee.firstName} ${currentUser.employee.lastName}`
    : currentUser?.email?.split("@")[0] || "Authenticated User";

  const displayTitle = currentUser?.employee?.designation || currentUser?.roleName || "User";
  const avatarLetter = (displayName[0] || "U").toUpperCase();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSwitchCompanyContext = async (targetCompanyId: string) => {
    if (targetCompanyId === activeCompany?.id) {
      setCompanyDropdownOpen(false);
      return;
    }
    setIsSwitchingCompany(true);
    await switchCompany(targetCompanyId);
    setIsSwitchingCompany(false);
  };

  const primaryColor = activeCompany?.primaryColor || "#2563eb";

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#090d16]/95 px-5 backdrop-blur-md transition-colors">
      {/* Left: Breadcrumbs & Company Context Indicator */}
      <div className="flex items-center gap-3">
        {/* ======================================================== */}
        {/* COMPANY SWITCHER / BADGE (Requirement #19)              */}
        {/* Hidden for regular single-company employees              */}
        {/* ======================================================== */}
        {isMultiCompanyUser ? (
          <div className="relative">
            <button
              onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
              disabled={isSwitchingCompany}
              className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 px-2.5 py-1 text-xs hover:border-blue-400 dark:hover:border-blue-600 transition-colors shadow-xs"
              title="Switch Active Company"
            >
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold leading-none">
                  {isSuperAdmin ? "Platform Tenant" : "Current Company"}
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px] leading-tight">
                  {activeCompany?.name || "Company"}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1 shrink-0" />
            </button>

            {/* Company Switcher Dropdown */}
            {companyDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <span>Switch Organization</span>
                  <span className="font-mono text-[9px] text-blue-500 font-medium">
                    {memberships.length} Available
                  </span>
                </div>

                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                  {memberships.map((m) => {
                    const isCurrent = m.companyId === activeCompany?.id;
                    return (
                      <button
                        key={m.companyId}
                        onClick={() => handleSwitchCompanyContext(m.companyId)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs text-left transition-all",
                          isCurrent
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: m.primaryColor || "#2563eb" }}
                          />
                          <div className="flex flex-col truncate">
                            <span className="truncate">{m.companyName}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {m.companyCode}
                            </span>
                          </div>
                        </div>
                        {isCurrent && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isSuperAdmin && (
                  <div className="pt-1.5 mt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                    <Link
                      href="/app/super-admin/companies"
                      onClick={() => setCompanyDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Manage All Companies →</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Static Company Context Badge for regular single-company staff */
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="truncate max-w-[140px] font-semibold">{activeCompany?.name}</span>
          </div>
        )}

        {/* Breadcrumb Path */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span>/</span>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb}>
                <span
                  className={
                    isLast
                      ? "font-medium capitalize text-slate-900 dark:text-slate-100"
                      : "capitalize text-slate-500 dark:text-slate-400"
                  }
                >
                  {crumb}
                </span>
                {!isLast && <span>/</span>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Right: Quick Tools & Signed-In Account Profile */}
      <div className="flex items-center gap-3">
        {/* Search Bar Input */}
        <div
          onClick={() => setGlobalSearchOpen(true)}
          className="relative hidden md:flex items-center cursor-pointer group"
        >
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
          <div className="h-8 w-56 lg:w-64 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 pl-8 pr-10 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between group-hover:border-blue-500/50 transition-colors">
            <span className="truncate">Search CRM records...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Database Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-md border border-emerald-400/40 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
          <Database className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>Tenant Isolated</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Global AI Intelligence Assistant */}
        <GlobalAIButton />

        {/* Communication Widget */}
        <CommunicationHeaderWidget />

        {/* Notification Bell */}
        <NotificationBell />

        {/* Signed-In Account User Session Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            suppressHydrationWarning
            className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 px-2.5 py-1 text-xs hover:border-blue-400/50 dark:hover:border-blue-500/40 transition-all shadow-xs"
          >
            <div
              suppressHydrationWarning
              className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-white shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              {avatarLetter}
            </div>
            <div className="flex flex-col text-left">
              <span
                suppressHydrationWarning
                className="text-[11px] font-medium text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]"
              >
                {displayName}
              </span>
              <span
                suppressHydrationWarning
                className="text-[9px] font-semibold leading-none truncate max-w-[120px]"
                style={{ color: primaryColor }}
              >
                {displayTitle}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 ml-1 shrink-0" />
          </button>

          {/* User Profile Card Dropdown Menu */}
          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              {/* Header: Signed-In Account Details */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div
                    suppressHydrationWarning
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {avatarLetter}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span
                      suppressHydrationWarning
                      className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate"
                    >
                      {displayName}
                    </span>
                    <span
                      suppressHydrationWarning
                      className="text-[11px] font-medium truncate"
                      style={{ color: primaryColor }}
                    >
                      {displayTitle}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                  {currentUser?.email && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{currentUser.email}</span>
                    </div>
                  )}
                  {activeCompany && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Building className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{activeCompany.name}</span>
                    </div>
                  )}
                  {currentUser?.roleName && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <BadgeCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">
                        {currentUser.roleName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Options */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 mt-2 space-y-0.5">
                <Link
                  href="/app/settings"
                  onClick={() => setRoleDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Personal Settings</span>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors mt-1"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global CRM Search & Command Palette Modal */}
      <CrmGlobalSearchDialog
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
      />
    </header>
  );
}
