import * as React from "react";
import { cn } from "@/lib/utils";
import { Filter, RotateCcw } from "lucide-react";
import { Button } from "./button";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterBarProps {
  children?: React.ReactNode;
  onReset?: () => void;
  className?: string;
}

export function FilterBar({ children, onReset, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-3 shadow-xs",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>
        {children}
      </div>

      {onReset && (
        <Button
          variant="ghost"
          size="xs"
          onClick={onReset}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </Button>
      )}
    </div>
  );
}
