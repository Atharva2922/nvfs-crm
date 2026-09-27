"use client";

import React, { useState, useEffect, useRef } from "react";
import { AccountsDashboardView } from "@/modules/accounts/components/accounts-dashboard-view";
import { AccountsQuickCreateModal } from "@/modules/accounts/components/accounts-quick-create-modal";
import { AccountsDashboardData } from "@/services/accounts.service";
import { Loader2, RefreshCw } from "lucide-react";

export default function AccountsDashboardPage() {
  const [data, setData] = useState<AccountsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickCreateType, setQuickCreateType] = useState<string | null>(null);

  // Track current company/period selection via refs so event listeners have stable references
  const selectedCompanyIdRef = useRef<string>("ALL");
  const selectedPeriodRef = useRef<string>("This Month");

  const fetchDashboardData = async (companyId?: string, period?: string) => {
    const cId = companyId ?? selectedCompanyIdRef.current;
    const p = period ?? selectedPeriodRef.current;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (cId && cId !== "ALL") params.set("companyId", cId);
      if (p) params.set("period", p);

      const query = params.toString();
      const res = await fetch(`/api/accounts/dashboard${query ? `?${query}` : ""}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load accounts dashboard");
      }
      setData(json.data);
    } catch (err: any) {
      console.error("Dashboard load error:", err);
      setError(err.message || "Failed to connect to accounts ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for company/period scope changes from layout header
    const handleCompanyChange = (e: Event) => {
      const { companyId, period } = (e as CustomEvent).detail || {};
      if (companyId !== undefined) selectedCompanyIdRef.current = companyId;
      if (period !== undefined) selectedPeriodRef.current = period;
      fetchDashboardData(companyId, period);
    };

    // Listen for data mutations (quick create, etc.)
    const handleMutation = () => fetchDashboardData();

    window.addEventListener("accounts-company-changed", handleCompanyChange);
    window.addEventListener("accounts-data-mutated", handleMutation);
    return () => {
      window.removeEventListener("accounts-company-changed", handleCompanyChange);
      window.removeEventListener("accounts-data-mutated", handleMutation);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          Syncing Accounts Ledger & Financial Records...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center max-w-lg mx-auto my-12 space-y-3">
        <h3 className="text-sm font-bold text-red-400">Failed to Load Accounts Overview</h3>
        <p className="text-xs text-slate-300">{error}</p>
        <button
          onClick={() => fetchDashboardData()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Sync</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <AccountsDashboardView
        data={data}
        onRefresh={() => fetchDashboardData()}
        onOpenQuickCreate={(type) => setQuickCreateType(type || "INVOICE")}
      />

      <AccountsQuickCreateModal
        open={quickCreateType !== null}
        type={quickCreateType || "INVOICE"}
        onClose={() => setQuickCreateType(null)}
        onSuccess={() => fetchDashboardData()}
      />
    </>
  );
}
