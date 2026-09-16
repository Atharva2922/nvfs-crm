"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();

  const generatedItems: BreadcrumbItem[] = items || (() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      return {
        label: seg.replace(/-/g, " "),
        href: idx === segments.length - 1 ? undefined : href,
      };
    });
  })();

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400", className)}>
      <Link href="/app/overview" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {generatedItems.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors capitalize truncate max-w-[140px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 dark:text-slate-100 font-medium capitalize truncate max-w-[180px]">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
