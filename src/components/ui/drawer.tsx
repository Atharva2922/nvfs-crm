"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: DrawerProps) {
  if (!isOpen) return null;

  const sizeStyles = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={cn(
            "w-screen border-l border-slate-800 bg-[#0f172a] shadow-2xl flex flex-col transition-all duration-300",
            sizeStyles[size]
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
            <div>
              {title && (
                <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
              )}
              {description && (
                <p className="mt-0.5 text-xs text-slate-400">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-slate-800/80 px-5 py-3 bg-slate-900/40">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
