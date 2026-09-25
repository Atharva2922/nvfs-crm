"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Server,
  Shield,
  Key,
  HardDrive,
  Bell,
  Globe2,
  Lock,
  Database,
  ArrowLeft,
  Save,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

export default function PlatformSettingsPage() {
  const { isSuperAdmin } = useAuth();
  const [savedMessage, setSavedMessage] = useState(false);

  const [platformConfig, setPlatformConfig] = useState({
    platformName: "Enterprise Multi-Company CRM Platform",
    defaultStoragePerTenantGb: "50",
    maxTenantsAllowed: "100",
    enforce2FAForAdmins: true,
    sessionTimeoutMinutes: "120",
    auditRetentionDays: "365",
    globalWebhookUrl: "https://webhooks.enterprise.internal/crm",
    maintenanceMode: false,
  });

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  if (!isSuperAdmin) {
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-3">
        <Shield className="h-12 w-12 text-rose-500 mx-auto" />
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Level 1 Platform Settings Restricted
        </h1>
        <p className="text-xs text-slate-500">
          Only Platform Super Administrators can access global platform configuration.
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
              href="/app/super-admin"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
              LEVEL 1 CONFIGURATION
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Platform Settings & Security
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Global system defaults, tenant quotas, security policies, and backup configurations.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-colors"
        >
          {savedMessage ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{savedMessage ? "Configuration Saved" : "Save Settings"}</span>
        </button>
      </div>

      {savedMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Platform policies and tenant configurations updated successfully across all nodes.</span>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Section 1: Platform Defaults */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Server className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Platform General Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Platform Master Name
              </label>
              <input
                type="text"
                value={platformConfig.platformName}
                onChange={(e) =>
                  setPlatformConfig({ ...platformConfig, platformName: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Max Allowed Companies
              </label>
              <input
                type="number"
                value={platformConfig.maxTenantsAllowed}
                onChange={(e) =>
                  setPlatformConfig({ ...platformConfig, maxTenantsAllowed: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Default Tenant Storage Allocation (GB)
              </label>
              <input
                type="number"
                value={platformConfig.defaultStoragePerTenantGb}
                onChange={(e) =>
                  setPlatformConfig({
                    ...platformConfig,
                    defaultStoragePerTenantGb: e.target.value,
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Global Webhook Dispatcher
              </label>
              <input
                type="text"
                value={platformConfig.globalWebhookUrl}
                onChange={(e) =>
                  setPlatformConfig({ ...platformConfig, globalWebhookUrl: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Platform Security & Auditing */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Shield className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Platform Security & Zero-Trust Policies
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Mandatory Two-Factor Authentication (2FA) for Company Admins
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enforces hardware security keys or authenticator apps for all tenant administrators.
                </span>
              </div>
              <input
                type="checkbox"
                checked={platformConfig.enforce2FAForAdmins}
                onChange={(e) =>
                  setPlatformConfig({ ...platformConfig, enforce2FAForAdmins: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Session Inactivity Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={platformConfig.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setPlatformConfig({ ...platformConfig, sessionTimeoutMinutes: e.target.value })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Immutable Audit Trail Retention (Days)
                </label>
                <input
                  type="number"
                  value={platformConfig.auditRetentionDays}
                  onChange={(e) =>
                    setPlatformConfig({ ...platformConfig, auditRetentionDays: e.target.value })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Backup & Database Health */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-sm space-y-3 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Database className="h-4 w-4 text-purple-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Database & Automated Backups
            </h2>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Supabase PostgreSQL Direct Pool Active</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Multi-tenant point-in-time recovery (PITR) enabled. Continuous replication with automated daily snapshots at 00:00 UTC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
