"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AccountsSidebar } from "./accounts-sidebar";
import { AccountsHeader } from "./accounts-header";
import { AccountsQuickCreateModal } from "./accounts-quick-create-modal";
import { AccountsSearchDialog } from "./accounts-search-dialog";

interface AccountsLayoutProps {
  children: React.ReactNode;
}

// Custom events for cross-component communication
export const ACCOUNTS_COMPANY_CHANGED_EVENT = "accounts-company-changed";
export const ACCOUNTS_DATA_MUTATED_EVENT = "accounts-data-mutated";

export function AccountsLayout({ children }: AccountsLayoutProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<string>("INVOICE");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("ALL");
  const [accessibleCompanies, setAccessibleCompanies] = useState<
    Array<{
      id: string;
      name: string;
      code: string;
      logo?: string | null;
      primaryColor?: string | null;
    }>
  >([]);

  // Fetch accessible companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/accounts/companies");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setAccessibleCompanies(json.data);
          }
        }
      } catch {
        // silently fail – header still works with empty list
      }
    };
    fetchCompanies();
  }, []);

  const handleOpenQuickCreate = (type?: string) => {
    setQuickCreateType(type || "INVOICE");
    setQuickCreateOpen(true);
  };

  const handleSelectCompany = useCallback((companyId: string) => {
    setSelectedCompanyId(companyId);
    // Broadcast so child pages (e.g. dashboard) can reload data
    window.dispatchEvent(
      new CustomEvent(ACCOUNTS_COMPANY_CHANGED_EVENT, {
        detail: { companyId, period: selectedPeriod },
      })
    );
  }, [selectedPeriod]);

  const handleSelectPeriod = useCallback((period: string) => {
    setSelectedPeriod(period);
    window.dispatchEvent(
      new CustomEvent(ACCOUNTS_COMPANY_CHANGED_EVENT, {
        detail: { companyId: selectedCompanyId, period },
      })
    );
  }, [selectedCompanyId]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 font-sans">
      {/* Dedicated Accounts Sidebar */}
      <AccountsSidebar />

      {/* Main Accounts Workplace Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AccountsHeader
          onOpenQuickCreate={handleOpenQuickCreate}
          onOpenSearch={() => setSearchOpen(true)}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={handleSelectPeriod}
          accessibleCompanies={accessibleCompanies}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={handleSelectCompany}
        />

        <main className="flex-1 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          {children}
        </main>
      </div>

      {/* Quick Create Dialog */}
      <AccountsQuickCreateModal
        open={quickCreateOpen}
        type={quickCreateType}
        onClose={() => setQuickCreateOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent(ACCOUNTS_DATA_MUTATED_EVENT));
        }}
      />

      {/* Accounts Global Search Dialog */}
      <AccountsSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        selectedCompanyId={selectedCompanyId}
      />
    </div>
  );
}
