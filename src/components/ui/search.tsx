import * as React from "react";
import { cn } from "@/lib/utils";
import { Search as SearchIcon, X } from "lucide-react";

export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Search({
  value,
  onChange,
  placeholder = "Search records...",
  className,
}: SearchProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <SearchIcon className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 pl-8 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-xs"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
