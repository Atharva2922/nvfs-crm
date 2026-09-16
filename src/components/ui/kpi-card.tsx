import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  icon?: LucideIcon;
  badge?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  badge,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0c1322]/90 p-4 transition-all duration-150 hover:border-blue-400/60 dark:hover:border-amber-400/40 shadow-xs hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-amber-300 border border-blue-100 dark:border-blue-800/40">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
          {value}
        </span>
        {badge && (
          <span className="rounded bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border border-amber-300/80 dark:from-amber-950/70 dark:to-yellow-950/70 dark:text-amber-300 dark:border-amber-600/60 px-1.5 py-0.5 text-[10px] font-semibold shadow-xs">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {trend && (
            <span
              className={cn(
                "font-medium",
                trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
