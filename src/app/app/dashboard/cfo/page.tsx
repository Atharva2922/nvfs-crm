import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ExecutiveDashboardService } from "@/services/executive-dashboard.service";
import { CfoDashboardView } from "@/modules/executive-dashboard/cfo-dashboard-view";
import { ExecutiveRestrictedState } from "@/modules/executive-dashboard/executive-states";

export const dynamic = "force-dynamic";

export default async function AppCfoDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Enforce server-side RBAC authorization
  const isAuthorized = ExecutiveDashboardService.isCfoAuthorized(user);

  if (!isAuthorized) {
    return (
      <ExecutiveRestrictedState
        roleTitle="CFO Treasury & Financial Command Center"
        roleCode={user.roleCode}
        roleLevel={user.roleLevel}
        permissionName="dashboard.cfo.view"
      />
    );
  }

  const initialData = await ExecutiveDashboardService.getCfoDashboardData(user, {
    dateRange: "THIS_MONTH",
  });

  return <CfoDashboardView currentUser={user} initialData={initialData} />;
}
