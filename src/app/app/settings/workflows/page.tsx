import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { WorkflowList } from "@/modules/workflows/workflow-list";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AppWorkflowsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // RBAC validation: Admins, Executives, and Department Heads can access workflows
  const allowedRoles = [
    "SUPER_ADMIN",
    "ADMIN",
    "CEO",
    "CHAIRPERSON",
    "CTO",
    "CFO",
    "CMO",
    "DEPARTMENT_HEAD",
  ];

  if (!allowedRoles.includes(user.roleCode)) {
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/40">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Workflow Automation Access Restricted
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automated workflow configuration and execution engines are restricted to corporate administrators,
            executive leadership, and department heads. Your account role ({user.roleCode}) does not have
            workflow orchestration privileges.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/app/overview"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow Automation & Smart Actions"
        description="Event-driven automation engine: auto-generate tasks, send executive notifications, trigger approvals, and escalate overdue milestones."
      />

      <WorkflowList />
    </div>
  );
}
