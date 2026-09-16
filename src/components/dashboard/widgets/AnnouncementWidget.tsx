"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Megaphone, ArrowRight } from "lucide-react";

interface PolicyItem {
  id: string;
  title: string;
  category: string;
  effectiveDate: string;
}

export function AnnouncementWidget() {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPolicies() {
      try {
        setLoading(true);
        const res = await fetch("/api/policies?limit=3");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setPolicies(Array.isArray(json.data) ? json.data : []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch policies:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPolicies();
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Company Policies</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Handbooks & compliance</p>
          </div>
        </div>
        <Link
          href="/app/policies"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-amber-400 hover:underline"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading announcements...</div>
      ) : !Array.isArray(policies) || policies.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          No company policy announcements
        </div>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => (
            <Link
              key={p.id}
              href="/app/policies"
              className="block p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors text-xs"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{p.title}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                  {p.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
