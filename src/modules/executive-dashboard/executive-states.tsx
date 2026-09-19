"use client";

import React from "react";
import { ShieldAlert, ArrowLeft, Loader2, Inbox, AlertTriangle } from "lucide-react";
import Link from "next/link";

export function ExecutiveLoadingState({ label = "Loading live executive telemetry..." }: { label?: string }) {
  return (
    <div className="py-32 text-center space-y-4">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
      <p className="text-xs text-slate-400 font-medium">{label}</p>
    </div>
  );
}

export function ExecutiveEmptyState({
  title = "No Data Available",
  description = "No records were found for the selected reporting period and organization scope.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-12 text-center space-y-2">
      <Inbox className="h-8 w-8 text-slate-600 mx-auto" />
      <h4 className="text-sm font-semibold text-slate-300">{title}</h4>
      <p className="text-xs text-slate-500 max-w-md mx-auto">{description}</p>
    </div>
  );
}

export function ExecutiveRestrictedState({
  roleTitle,
  roleCode,
  roleLevel,
  permissionName,
}: {
  roleTitle: string;
  roleCode: string;
  roleLevel: number;
  permissionName: string;
}) {
  return (
    <div className="py-24 text-center max-w-lg mx-auto space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/40">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Executive Access Restricted
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          The {roleTitle} is exclusively provisioned for authorized executive leadership.
          Your current account role ({roleCode} • Level {roleLevel}) lacks the required{" "}
          <code className="text-amber-400 font-mono">{permissionName}</code> entitlement.
        </p>
      </div>
      <div className="pt-2">
        <Link
          href="/app/overview"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Employee Workspace
        </Link>
      </div>
    </div>
  );
}
