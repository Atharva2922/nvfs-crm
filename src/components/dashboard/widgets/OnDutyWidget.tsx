"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, MapPin, ArrowRight } from "lucide-react";

interface OnDutyItem {
  id: string;
  assignmentNumber: string;
  clientName?: string | null;
  location: string;
  date: string;
  purpose: string;
  status: string;
}

export function OnDutyWidget() {
  const [duties, setDuties] = useState<OnDutyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOnDuty() {
      try {
        setLoading(true);
        const res = await fetch("/api/on-duty/my-duties");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setDuties(Array.isArray(json.data) ? json.data : []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch on-duty assignments:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOnDuty();
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">On-Duty Field Work</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Client visits & offsite duties</p>
          </div>
        </div>
        <Link
          href="/app/on-duty"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-amber-400 hover:underline"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading on-duty logs...</div>
      ) : !Array.isArray(duties) || duties.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          No on-duty field assignments today
        </div>
      ) : (
        <div className="space-y-2">
          {duties.slice(0, 2).map((duty) => (
            <div
              key={duty.id}
              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {duty.clientName || duty.purpose}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                  {duty.status}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <MapPin className="h-3 w-3 shrink-0 text-orange-500" />
                <span className="truncate">{duty.location}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
