import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatusIndicatorProps {
  status: "online" | "offline" | "busy" | "warning" | "active" | "inactive";
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  pulse = false,
  className,
}: StatusIndicatorProps) {
  const colorMap = {
    online: "bg-emerald-500",
    active: "bg-emerald-500",
    offline: "bg-slate-500",
    inactive: "bg-slate-500",
    busy: "bg-rose-500",
    warning: "bg-amber-500",
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-slate-300", className)}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              colorMap[status]
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            colorMap[status]
          )}
        />
      </span>
      {label && <span className="capitalize">{label}</span>}
    </div>
  );
}
