"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Stable, dimension-matched table rows skeleton that prevents table collapse and layout shift.
 */
export function CrmTableSkeleton({
  columns = 5,
  rows = 8,
  className,
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <tbody className={cn("divide-y divide-slate-800/60 bg-[#0a0f1d]", className)}>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="h-12 animate-pulse">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className="px-4 py-3">
              <div
                className={cn(
                  "h-4 rounded bg-slate-800/80",
                  cIdx === 0
                    ? "w-32"
                    : cIdx === 1
                    ? "w-24"
                    : cIdx === 2
                    ? "w-20"
                    : cIdx === columns - 1
                    ? "w-16 ml-auto"
                    : "w-28"
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/**
 * 8-Card Command Grid KPI Skeleton with fixed min-h-[108px] matching final cards.
 */
export function CrmKpiSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-800 bg-[#0f172a] p-4.5 shadow-sm min-h-[108px] flex flex-col justify-between animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded bg-slate-800" />
            <div className="h-8 w-8 rounded-lg bg-slate-800" />
          </div>
          <div className="h-7 w-32 rounded bg-slate-700/80 my-2" />
          <div className="flex items-center justify-between">
            <div className="h-3 w-36 rounded bg-slate-800/60" />
            <div className="h-3 w-10 rounded bg-slate-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Sales Pipeline Stage Distribution 5-Stage Skeleton with fixed min-h-[90px].
 */
export function CrmPipelineStagesSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-slate-800 bg-[#0c1322] p-3 text-left min-h-[90px] flex flex-col justify-between animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-16 rounded bg-slate-800" />
            <div className="h-2.5 w-8 rounded bg-slate-800" />
          </div>
          <div className="h-5 w-24 rounded bg-slate-700/70 my-1" />
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-12 rounded bg-slate-800/60" />
            <div className="h-2.5 w-14 rounded bg-slate-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Funnel progression skeleton with 5 stage bars.
 */
export function CrmFunnelSkeleton() {
  return (
    <div className="space-y-3.5 py-1 animate-pulse">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-slate-800" />
            <div className="h-3 w-12 rounded bg-slate-800" />
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800/80" />
        </div>
      ))}
    </div>
  );
}

/**
 * List widget skeleton (Top Deals, Top Clients, Recent Activities, Pending Tasks).
 */
export function CrmListWidgetSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-800/60 animate-pulse">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="py-2.5 flex items-center justify-between px-2">
          <div className="space-y-1.5">
            <div className="h-3.5 w-36 rounded bg-slate-800" />
            <div className="h-2.5 w-24 rounded bg-slate-800/60" />
          </div>
          <div className="space-y-1.5 text-right">
            <div className="h-3.5 w-20 rounded bg-slate-800 ml-auto" />
            <div className="h-2.5 w-14 rounded bg-slate-800/60 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
