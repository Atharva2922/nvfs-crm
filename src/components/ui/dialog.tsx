"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogContextValue {
  open: boolean;
  onClose: () => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

export interface DialogProps {
  // Support compound / radix style
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Support simple props-based style
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Dialog({
  open,
  onOpenChange,
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: DialogProps) {
  const isControlledOpen = open !== undefined ? open : isOpen;
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  if (!isControlledOpen) return null;

  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  // If using compound components (children contains DialogContent)
  // or if title is not provided, wrap in DialogContext
  return (
    <DialogContext.Provider value={{ open: !!isControlledOpen, onClose: handleClose }}>
      {title !== undefined ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={handleClose}
          />
          <div
            className={cn(
              "relative w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-2xl transition-all animate-in zoom-in-95",
              sizeStyles[size]
            )}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-5 py-3.5">
              <div>
                {title && <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
                {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
              </div>
              <button
                onClick={handleClose}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80 px-5 py-3 bg-slate-50 dark:bg-slate-900/40 rounded-b-lg">
                {footer}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={handleClose}
          />
          {children}
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function DialogContent({
  className,
  children,
  size = "md",
}: {
  className?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const ctx = React.useContext(DialogContext);
  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-2xl transition-all animate-in zoom-in-95 z-10 p-5",
        sizeStyles[size],
        className
      )}
    >
      <button
        type="button"
        onClick={() => ctx?.onClose()}
        className="absolute right-4 top-4 rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800/80 text-left", className)}>
      {children}
    </div>
  );
}

export function DialogTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn("text-base font-semibold leading-none tracking-tight text-slate-900 dark:text-white", className)}>
      {children}
    </h3>
  );
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1", className)}>{children}</p>;
}

export function DialogFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4", className)}>
      {children}
    </div>
  );
}
