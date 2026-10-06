"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CtaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  minWidth?: string;
}

export const CtaButton = React.forwardRef<HTMLButtonElement, CtaButtonProps>(
  (
    {
      children,
      className,
      disabled,
      loading = false,
      icon,
      variant = "primary",
      size = "md",
      minWidth,
      type = "button",
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 border border-blue-500/30",
      secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm",
      danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 border border-rose-500/30",
      outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300",
      ghost: "bg-transparent hover:bg-slate-800/60 text-slate-300",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-xs font-semibold gap-2",
      lg: "h-10 px-5 text-sm font-semibold gap-2.5",
    };

    const defaultMinWidth = minWidth
      ? minWidth
      : size === "sm"
      ? "min-w-[90px]"
      : size === "lg"
      ? "min-w-[130px]"
      : "min-w-[110px]";

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          "relative inline-flex items-center justify-center rounded-lg transition-all select-none font-medium",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]",
          variantStyles[variant],
          sizeStyles[size],
          defaultMinWidth,
          className
        )}
        {...props}
      >
        {/* Dimension-preserving content wrapper */}
        <span
          className={cn(
            "inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-opacity",
            loading ? "opacity-0 invisible" : "opacity-100 visible"
          )}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </span>

        {/* Absolute centered spinner when loading */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center text-current">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          </span>
        )}
      </button>
    );
  }
);

CtaButton.displayName = "CtaButton";
