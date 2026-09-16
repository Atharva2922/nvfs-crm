import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CeoDashboardService } from "@/services/ceo-dashboard.service";
import { CeoDashboardView } from "@/modules/ceo-dashboard/ceo-dashboard-view";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AppCeoDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Enforce server-side RBAC authorization
  const isAuthorized = CeoDashboardService.isAuthorized(user);

  if (!isAuthorized) {
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-950/40">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Executive Access Restricted
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The CEO Executive Dashboard is exclusively provisioned for the Chief Executive Officer,
            Chairperson, and executive enterprise leadership. Your account role ({user.roleCode} • Level {user.roleLevel})
            lacks the required <code className="text-amber-400 font-mono">dashboard.ceo.view</code> permission.
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

  return <CeoDashboardView currentUser={user} />;
}
