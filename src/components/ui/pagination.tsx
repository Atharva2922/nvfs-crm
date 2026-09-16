import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize = 10,
  onPageChange,
  className,
}: PaginationProps) {
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords ?? currentPage * pageSize);

  return (
    <div
      className={cn(
        "flex items-center justify-between px-2 py-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80",
        className
      )}
    >
      <div>
        {typeof totalRecords === "number" ? (
          <span>
            Showing <strong className="text-slate-900 dark:text-slate-200">{startRecord}</strong> to{" "}
            <strong className="text-slate-900 dark:text-slate-200">{endRecord}</strong> of{" "}
            <strong className="text-slate-900 dark:text-slate-200">{totalRecords}</strong> results
          </span>
        ) : (
          <span>
            Page <strong className="text-slate-900 dark:text-slate-200">{currentPage}</strong> of{" "}
            <strong className="text-slate-900 dark:text-slate-200">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="px-2 font-mono text-[11px] text-slate-700 dark:text-slate-300">
          {currentPage} / {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
