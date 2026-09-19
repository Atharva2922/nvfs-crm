import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ExecutiveDashboardService } from "@/services/executive-dashboard.service";
import { CmoDashboardView } from "@/modules/executive-dashboard/cmo-dashboard-view";
import { ExecutiveRestrictedState } from "@/modules/executive-dashboard/executive-states";

export const dynamic = "force-dynamic";

export default async function AppCmoDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Enforce server-side RBAC authorization
  const isAuthorized = ExecutiveDashboardService.isCmoAuthorized(user);

  if (!isAuthorized) {
    return (
      <ExecutiveRestrictedState
        roleTitle="CMO Growth & Marketing Command Center"
        roleCode={user.roleCode}
        roleLevel={user.roleLevel}
        permissionName="dashboard.cmo.view"
      />
    );
  }

  const initialData = await ExecutiveDashboardService.getCmoDashboardData(user, {
    dateRange: "THIS_MONTH",
  });

  return <CmoDashboardView currentUser={user} initialData={initialData} />;
}
