"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";
import {
  Settings,
  Save,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function InventorySettingsPage() {
  const [config, setConfig] = useState<Record<string, string>>({
    DEFAULT_REORDER_LEVEL: "10",
    DEFAULT_LEAD_TIME_DAYS: "7",
    SKU_PREFIX: "SKU",
    ENABLE_LOW_STOCK_NOTIFICATIONS: "true",
    AUTO_GENERATE_SKU: "true",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/inventory/settings");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load settings");
      if (json.data) setConfig((prev) => ({ ...prev, ...json.data }));
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/inventory/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to save settings");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Inventory Settings"
        description="Configure organization-wide stock thresholds, reorder lead times, and SKU generation policies."
      />

      <InventoryNav />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Settings saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6 text-xs">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
            Reorder & Stock Threshold Policies
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Default Reorder Threshold
              </label>
              <input
                type="number"
                value={config.DEFAULT_REORDER_LEVEL}
                onChange={(e) => setConfig({ ...config, DEFAULT_REORDER_LEVEL: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-zinc-500">Trigger low-stock alerts when on-hand inventory drops to this level</span>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Default Supplier Lead Time (Days)
              </label>
              <input
                type="number"
                value={config.DEFAULT_LEAD_TIME_DAYS}
                onChange={(e) => setConfig({ ...config, DEFAULT_LEAD_TIME_DAYS: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-zinc-500">Anticipated replenishment turnaround for planning</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
            SKU & Catalog Policies
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">SKU Auto-Generation Prefix</label>
              <input
                type="text"
                value={config.SKU_PREFIX}
                onChange={(e) => setConfig({ ...config, SKU_PREFIX: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-zinc-500">Default prefix for new product SKUs</span>
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifToggle"
                  checked={config.ENABLE_LOW_STOCK_NOTIFICATIONS === "true"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      ENABLE_LOW_STOCK_NOTIFICATIONS: e.target.checked ? "true" : "false",
                    })
                  }
                  className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0"
                />
                <label htmlFor="notifToggle" className="text-zinc-200 font-medium cursor-pointer">
                  Enable Low Stock In-App Notifications
                </label>
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 pl-6">
                Broadcast urgent alert notices to warehouse managers and admins
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-zinc-800">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
