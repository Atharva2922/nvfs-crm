"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Plus,
  Calendar,
  Building2,
  ChevronDown,
  Database,
  FileText,
  CreditCard,
  BookOpenCheck,
  Receipt,
  Users,
  Briefcase,
  Landmark,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";
import { GlobalAIButton } from "@/modules/ai/components/global-ai-button";
import { CommunicationHeaderWidget } from "@/modules/communications/components/communication-header-widget";
import { cn } from "@/lib/utils";

interface AccountsHeaderProps {
  onOpenQuickCreate?: (type?: string) => void;
  onOpenSearch?: () => void;
  selectedPeriod?: string;
  onSelectPeriod?: (period: string) => void;
  accessibleCompanies?: Array<{
    id: string;
    name: string;
    code: string;
    logo?: string | null;
    primaryColor?: string | null;
  }>;
  selectedCompanyId?: string;
  onSelectCompany?: (companyId: string) => void;
}

export function AccountsHeader({
  onOpenQuickCreate,
  onOpenSearch,
  selectedPeriod = "This Month",
  onSelectPeriod,
  accessibleCompanies = [],
  selectedCompanyId = "ALL",
  onSelectCompany,
}: AccountsHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { activeCompany, user } = useAuth();
  const companyName = activeCompany?.name || "Apex Technologies";
  const primaryColor = activeCompany?.primaryColor || "#2563eb";

  // Build full company options: ALL + accessible companies (or user memberships fallback)
  const availableCompanies =
    accessibleCompanies.length > 0
      ? accessibleCompanies
      : user?.memberships?.map((m) => ({
          id: m.companyId,
          name: m.companyName,
          code: m.companyCode,
          logo: m.logo,
          primaryColor: m.primaryColor,
        })) || (activeCompany ? [activeCompany] : []);

  const currentSelectedCompany =
    selectedCompanyId === "ALL"
      ? null
      : availableCompanies.find((c) => c.id === selectedCompanyId);

  const displayName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user?.email?.split("@")[0] || "Accountant";
  const avatarLetter = (displayName[0] || "A").toUpperCase();
  const displayTitle = user?.employee?.designation || "Accountant";

  const periods = [
    "This Month",
    "Last Month",
    "This Quarter",
    "Last Quarter",
    "Current Fiscal Year (FY 2026-27)",
    "Previous Fiscal Year",
  ];

  // Dynamic breadcrumbs based on pathname
  const pathSegments = (pathname || "/app/accounts")
    .split("/")
    .filter(Boolean)
    .map((seg) => seg.replace(/-/g, " "));

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#090d16]/95 px-5 backdrop-blur-md transition-colors font-sans">
      {/* Left: Cross-Company Selector & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Company Selector Dropdown (Requirement 5) */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
            className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors shadow-xs"
            title="Switch Accounts Scope across Companies"
          >
            {selectedCompanyId === "ALL" ? (
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600/20 text-blue-500 font-bold text-[10px]">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-[11px] font-bold text-blue-600 dark:text-blue-400">All Companies</span>
                  <span className="text-[9px] text-slate-400 font-medium">Consolidated View</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: currentSelectedCompany?.primaryColor || primaryColor }}
                />
                <span className="truncate max-w-[130px] font-bold">
                  {currentSelectedCompany?.name || companyName}
                </span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  {currentSelectedCompany?.code || "COMP"}
                </span>
              </div>
            )}
            <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
          </button>

          {companyDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Central Accounts Scope
              </div>

              {/* All Companies Option */}
              <button
                onClick={() => {
                  onSelectCompany?.("ALL");
                  setCompanyDropdownOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors text-left mb-1",
                  selectedCompanyId === "ALL"
                    ? "bg-blue-600/15 text-blue-500 dark:text-blue-400 font-bold border border-blue-500/30"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600/10 text-blue-500">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-bold">All Companies</div>
                    <div className="text-[10px] text-slate-400">Consolidated Corporate Ledger</div>
                  </div>
                </div>
                {selectedCompanyId === "ALL" && (
                  <span className="text-[10px] font-bold text-blue-500 font-mono">ACTIVE</span>
                )}
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

              {/* Specific Companies */}
              <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-slate-400">
                Specific Companies ({availableCompanies.length})
              </div>
              <div className="space-y-0.5 max-h-56 overflow-y-auto">
                {availableCompanies.map((comp) => {
                  const isSelected = selectedCompanyId === comp.id;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => {
                        onSelectCompany?.(comp.id);
                        setCompanyDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left",
                        isSelected
                          ? "bg-blue-600/15 text-blue-500 dark:text-blue-400 font-bold border border-blue-500/30"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: comp.primaryColor || "#3b82f6" }}
                        />
                        <span className="truncate font-medium">{comp.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 ml-2">
                        {comp.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Breadcrumb Path matching CRM */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span>/</span>
          {pathSegments.map((crumb, idx) => {
            const isLast = idx === pathSegments.length - 1;
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

      {/* Center: Search Bar & Quick Create */}
      <div className="flex items-center gap-2.5 flex-1 max-w-xl justify-center mx-4">
        {/* Search Bar Input */}
        <div
          onClick={onOpenSearch}
          className="relative hidden md:flex items-center cursor-pointer group w-full max-w-xs"
        >
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
          <div className="h-8 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 pl-8 pr-10 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between group-hover:border-blue-500/50 transition-colors">
            <span className="truncate">Search CRM & Accounts...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Accounting Period Selector */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
            className="hidden xl:flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors h-8"
          >
            <Calendar className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[100px]">{selectedPeriod}</span>
            <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
          </button>

          {periodDropdownOpen && (
            <div className="absolute left-0 mt-1 w-52 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] p-1 shadow-xl z-50 animate-in fade-in zoom-in-95">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onSelectPeriod?.(p);
                    setPeriodDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors",
                    selectedPeriod === p
                      ? "bg-blue-600/15 text-blue-400 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Create Button matching CRM blue button */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create</span>
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>

          {quickCreateOpen && (
            <div className="absolute right-0 mt-1.5 w-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Financial Transactions
              </div>
              {[
                { label: "New Invoice", icon: FileText, type: "INVOICE" },
                { label: "New Bill", icon: Receipt, type: "BILL" },
                { label: "Record Payment", icon: CreditCard, type: "PAYMENT" },
                { label: "New Customer", icon: Users, type: "CUSTOMER" },
                { label: "New Vendor", icon: Briefcase, type: "VENDOR" },
                { label: "Journal Entry", icon: BookOpenCheck, type: "JOURNAL" },
                { label: "Bank Transfer", icon: Landmark, type: "TRANSFER" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setQuickCreateOpen(false);
                      onOpenQuickCreate?.(item.type);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Tools & Signed-In Account Profile */}
      <div className="flex items-center gap-3">
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
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 px-2.5 py-1 text-xs hover:border-blue-400/50 dark:hover:border-blue-500/40 transition-all shadow-xs"
          >
            <div
              className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-white shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              {avatarLetter}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                {displayName}
              </span>
              <span
                className="text-[9px] font-semibold leading-none truncate max-w-[120px]"
                style={{ color: primaryColor }}
              >
                {displayTitle}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 ml-1 shrink-0" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {avatarLetter}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {displayName}
                    </span>
                    <span
                      className="text-[11px] font-medium truncate"
                      style={{ color: primaryColor }}
                    >
                      {displayTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">{user?.email}</span>
                  </div>
                </div>
              </div>

              <div className="p-1.5 space-y-0.5 border-t border-slate-100 dark:border-slate-800/80 mt-1">
                <Link
                  href="/app/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Personal Settings</span>
                </Link>
                <button
                  onClick={async () => {
                    setProfileDropdownOpen(false);
                    try {
                      setIsLoggingOut(true);
                      await fetch("/api/auth/logout", { method: "POST" });
                      router.push("/login");
                    } catch {
                      router.push("/login");
                    } finally {
                      setIsLoggingOut(false);
                    }
                  }}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
