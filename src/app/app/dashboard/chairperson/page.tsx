import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ExecutiveDashboardService } from "@/services/executive-dashboard.service";
import { ChairpersonDashboardView } from "@/modules/executive-dashboard/chairperson-dashboard-view";
import { ExecutiveRestrictedState } from "@/modules/executive-dashboard/executive-states";

export const dynamic = "force-dynamic";

export default async function AppChairpersonDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Enforce server-side RBAC authorization
  const isAuthorized = ExecutiveDashboardService.isChairpersonAuthorized(user);

  if (!isAuthorized) {
    return (
      <ExecutiveRestrictedState
        roleTitle="Chairperson Strategic Oversight"
        roleCode={user.roleCode}
        roleLevel={user.roleLevel}
        permissionName="dashboard.chairperson.view"
      />
    );
  }

  const initialData = await ExecutiveDashboardService.getChairpersonDashboardData(user, {
    dateRange: "THIS_MONTH",
  });

  return <ChairpersonDashboardView currentUser={user} initialData={initialData} />;
}
