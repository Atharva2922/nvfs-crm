"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  LogOut,
  User,
  Building,
  Mail,
  BadgeCheck,
  Settings,
} from "lucide-react";
import { SystemRoleCode } from "@/types";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";
import { CommunicationHeaderWidget } from "@/modules/communications/components/communication-header-widget";
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
  } = useAuth();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  // Close dropdown on outside click or route navigation
  useEffect(() => {
    setRoleDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#header-user-profile-menu")) {
        setRoleDropdownOpen(false);
      }
    };
    if (roleDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [roleDropdownOpen]);

  const displayName = currentUser?.employee
    ? `${currentUser.employee.firstName} ${currentUser.employee.lastName}`
    : currentUser?.email?.split("@")[0] || "Authenticated User";

  const displayTitle = currentUser?.employee?.designation || currentUser?.roleName || "User";
  const avatarLetter = (displayName[0] || "U").toUpperCase();
  const avatarUrl = (currentUser?.employee as any)?.avatarUrl || (currentUser as any)?.avatarUrl;

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

  const primaryColor = activeCompany?.primaryColor || "#2563eb";

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#090d16]/95 px-5 backdrop-blur-md transition-colors">
      {/* Left side spacer to preserve balanced 3-column header layout */}
      <div className="flex items-center gap-3 flex-1 min-w-0" />

      {/* Center: Global Search Bar */}
      <div className="flex items-center justify-center flex-1 max-w-lg mx-4">
        <div
          onClick={() => setGlobalSearchOpen(true)}
          className="relative hidden md:flex items-center cursor-pointer group w-full max-w-md"
        >
          <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
          <div className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 pl-9 pr-2.5 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between group-hover:border-blue-500/50 transition-colors shadow-2xs">
            <span className="truncate">Search CRM records...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
              Ctrl+K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Quick Tools & Signed-In Account Profile */}
      <div className="flex items-center justify-end gap-3 flex-1">

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Communication Widget */}
        <CommunicationHeaderWidget />

        {/* Notification Bell */}
        <NotificationBell />

        {/* Circular Profile Avatar (Click opens full profile info) */}
        <div id="header-user-profile-menu" className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            suppressHydrationWarning
            title={`${displayName} (${displayTitle})`}
            aria-label="User profile options"
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-xs overflow-hidden cursor-pointer group"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <div
                suppressHydrationWarning
                className="flex h-full w-full items-center justify-center font-bold text-xs sm:text-sm text-white transition-transform group-hover:scale-105"
                style={{ backgroundColor: primaryColor }}
              >
                {avatarLetter}
              </div>
            )}
            <span className="sr-only">Toggle user menu</span>
          </button>

          {/* User Profile Card Dropdown Menu with full details */}
          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              {/* Header: Signed-In Account Details */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2.5">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-md shrink-0"
                    />
                  ) : (
                    <div
                      suppressHydrationWarning
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {avatarLetter}
                    </div>
                  )}
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

                <div className="space-y-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
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
                  href="/app/profile"
                  onClick={() => setRoleDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                >
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span>My Profile & Completion</span>
                </Link>

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
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors mt-1 cursor-pointer"
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
