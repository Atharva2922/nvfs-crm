import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({
  message = "Loading records...",
  size = "md",
  className,
}: LoadingStateProps) {
  const sizeStyles = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center space-y-2.5",
        className
      )}
    >
      <Loader2 className={cn("animate-spin text-blue-500", sizeStyles[size])} />
      {message && <p className="text-xs text-slate-400">{message}</p>}
    </div>
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded bg-slate-800/80", className)}
      {...props}
    />
  );
}
