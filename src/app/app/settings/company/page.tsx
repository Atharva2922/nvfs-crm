"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building,
  Palette,
  Layers,
  Users,
  Shield,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Globe2,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export default function CompanySettingsPage() {
  const { user, activeCompany, role, isSuperAdmin } = useAuth();
  const isCompanyAdmin = role === "ADMIN" || role === "CEO" || isSuperAdmin;
  const [savedMessage, setSavedMessage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [companyProfile, setCompanyProfile] = useState({
    name: activeCompany?.name || "",
    legalName: activeCompany?.legalName || activeCompany?.name || "",
    industry: activeCompany?.industry || "Enterprise Technology Services",
    website: activeCompany?.website || "https://apex-tech.internal",
    email: activeCompany?.email || "contact@apex-tech.internal",
    phone: activeCompany?.phone || "+1 (555) 019-2831",
    address: activeCompany?.address || "100 Innovation Parkway, Suite 400",
    primaryColor: activeCompany?.primaryColor || "#2563eb",
    secondaryColor: activeCompany?.secondaryColor || "#1e40af",
    currency: activeCompany?.currency || "USD",
    timezone: activeCompany?.timezone || "UTC",
    dateFormat: activeCompany?.dateFormat || "YYYY-MM-DD",
    fiscalYear: activeCompany?.fiscalYear || "JAN-DEC",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/super-admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: activeCompany.id,
          settings: companyProfile,
        }),
      });

      if (res.ok) {
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update company settings", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isCompanyAdmin) {
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-3">
        <Building className="h-12 w-12 text-rose-500 mx-auto" />
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Level 2 Company Settings Restricted
        </h1>
        <p className="text-xs text-slate-500">
          Only the Company Administrator or Executive leadership can modify company-level settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/app/overview"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span
              className="rounded px-2 py-0.5 font-mono text-[10px] font-bold"
              style={{
                backgroundColor: `${companyProfile.primaryColor}15`,
                color: companyProfile.primaryColor,
              }}
            >
              LEVEL 2 COMPANY CONFIGURATION
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {activeCompany?.name || "Company"} Settings & Branding
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tenant-isolated profile, visual branding, regional localization, and operational parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: companyProfile.primaryColor }}
        >
          {savedMessage ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{savedMessage ? "Saved Successfully" : isSaving ? "Saving..." : "Save Company Settings"}</span>
        </button>
      </div>

      {savedMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Company profile and branding updated. Changes are active across your company tenant.</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Building className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Company Entity Master
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Company Display Name
              </label>
              <input
                type="text"
                value={companyProfile.name}
                onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Tenant Code (Immutable)
              </label>
              <input
                type="text"
                value={activeCompany?.code || ""}
                disabled
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 text-xs font-mono text-slate-500 focus:outline-none cursor-not-allowed"
              />
            </div>

            <div className="space-y-1 col-span-2">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Legal Entity Name
              </label>
              <input
                type="text"
                value={companyProfile.legalName}
                onChange={(e) => setCompanyProfile({ ...companyProfile, legalName: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Official Corporate Email
              </label>
              <input
                type="email"
                value={companyProfile.email}
                onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Official Telephone
              </label>
              <input
                type="text"
                value={companyProfile.phone}
                onChange={(e) => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Branding & Visual Identity */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Palette className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Company Branding & Theme Colors
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Primary Brand Color (Sidebar & Accent)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={companyProfile.primaryColor}
                  onChange={(e) =>
                    setCompanyProfile({ ...companyProfile, primaryColor: e.target.value })
                  }
                  className="h-9 w-12 rounded cursor-pointer border border-slate-200 dark:border-slate-800 bg-transparent"
                />
                <input
                  type="text"
                  value={companyProfile.primaryColor}
                  onChange={(e) =>
                    setCompanyProfile({ ...companyProfile, primaryColor: e.target.value })
                  }
                  className="h-9 flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs font-mono uppercase text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Secondary Brand Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={companyProfile.secondaryColor}
                  onChange={(e) =>
                    setCompanyProfile({ ...companyProfile, secondaryColor: e.target.value })
                  }
                  className="h-9 w-12 rounded cursor-pointer border border-slate-200 dark:border-slate-800 bg-transparent"
                />
                <input
                  type="text"
                  value={companyProfile.secondaryColor}
                  onChange={(e) =>
                    setCompanyProfile({ ...companyProfile, secondaryColor: e.target.value })
                  }
                  className="h-9 flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs font-mono uppercase text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Regional & Financial Formatting */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Globe2 className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Financial Year & Localization
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Operating Currency
              </label>
              <select
                value={companyProfile.currency}
                onChange={(e) =>
                  setCompanyProfile({ ...companyProfile, currency: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="AED">AED (د.إ - UAE Dirham)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Company Timezone
              </label>
              <select
                value={companyProfile.timezone}
                onChange={(e) =>
                  setCompanyProfile({ ...companyProfile, timezone: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
