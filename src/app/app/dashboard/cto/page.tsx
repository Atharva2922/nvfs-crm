import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ExecutiveDashboardService } from "@/services/executive-dashboard.service";
import { CtoDashboardView } from "@/modules/executive-dashboard/cto-dashboard-view";
import { ExecutiveRestrictedState } from "@/modules/executive-dashboard/executive-states";

export const dynamic = "force-dynamic";

export default async function AppCtoDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Enforce server-side RBAC authorization
  const isAuthorized = ExecutiveDashboardService.isCtoAuthorized(user);

  if (!isAuthorized) {
    return (
      <ExecutiveRestrictedState
        roleTitle="CTO Technology & Operations Command Center"
        roleCode={user.roleCode}
        roleLevel={user.roleLevel}
        permissionName="dashboard.cto.view"
      />
    );
  }

  const initialData = await ExecutiveDashboardService.getCtoDashboardData(user, {
    dateRange: "THIS_MONTH",
  });

  return <CtoDashboardView currentUser={user} initialData={initialData} />;
}
