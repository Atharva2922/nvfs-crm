import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { AttendanceWidget } from "@/components/dashboard/widgets/AttendanceWidget";
import { TaskSummaryWidget } from "@/components/dashboard/widgets/TaskSummaryWidget";
import { ProjectProgressWidget } from "@/components/dashboard/widgets/ProjectProgressWidget";
import { LeaveBalanceWidget } from "@/components/dashboard/widgets/LeaveBalanceWidget";
import { UpcomingMeetingsWidget } from "@/components/dashboard/widgets/UpcomingMeetingsWidget";
import { RecentNotificationsWidget } from "@/components/dashboard/widgets/RecentNotificationsWidget";
import { ExpenseWidget } from "@/components/dashboard/widgets/ExpenseWidget";
import { RequestWidget } from "@/components/dashboard/widgets/RequestWidget";
import { OnDutyWidget } from "@/components/dashboard/widgets/OnDutyWidget";
import { AnnouncementWidget } from "@/components/dashboard/widgets/AnnouncementWidget";
import { QuickActionsWidget } from "@/components/dashboard/widgets/QuickActionsWidget";
import { EmployeeSectionWidget } from "@/components/dashboard/widgets/EmployeeSectionWidget";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Building2 } from "lucide-react";
import { OverviewDashboardService } from "@/services/overview-dashboard.service";

export const dynamic = "force-dynamic";

export default async function AppOverviewPage() {
  const user = await getCurrentUser();
  const telemetry = user ? await OverviewDashboardService.getOverviewTelemetry(user) : null;

  if (!user) {
    return null;
  }

  const employeeName = user.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user.email.split("@")[0] || "Employee";

  const designation = user.employee?.designation || user.roleName || "Staff Member";
  const departmentName = user.employee?.departmentName || "General";
  const companyName = user.activeCompany?.name || user.employee?.organizationName || "Naree Foundation";
  const companyCode = user.activeCompany?.code || "NAREE";
  const isVentureStudio = companyCode === "NFVS" || companyName.toLowerCase().includes("venture");

  const isManager = (user.roleLevel ?? 0) >= 30 || user.roleCode === "MANAGER";
  const isDeptHead = (user.roleLevel ?? 0) >= 50 || user.roleCode === "DEPARTMENT_HEAD";

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Unified Company Banner Header - Identical elements for both companies */}
      <PageHeader
        title={`Good Morning, ${employeeName}`}
        description={`${designation} • ${departmentName} Department • ${companyName}`}
        badge={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border tracking-wide uppercase transition-colors ${
                isVentureStudio
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              <img
                src={isVentureStudio ? "/logos/nfvs-logo.jpg" : "/logos/naree-logo.jpg"}
                alt={companyName}
                className="h-4 w-4 rounded-full object-contain bg-white p-0.5 border border-slate-300 dark:border-slate-700"
              />
              <span>{companyName}</span>
            </span>
            <Badge variant="gold" size="sm" className="gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>MY WORKSPACE</span>
            </Badge>
          </div>
        }
      />

      {/* Quick Action Bar */}
      <QuickActionsWidget permissions={user.permissions || []} roleLevel={user.roleLevel || 10} />

      {/* Dedicated Corporate Employee & Personnel Directory Section */}
      <EmployeeSectionWidget
        companyName={companyName}
        companyCode={companyCode}
        summary={telemetry?.employeesSummary}
        canAddEmployee={
          (user.roleLevel ?? 0) >= 30 ||
          ["HR", "ADMIN", "SUPER_ADMIN", "CEO"].includes(user.roleCode) ||
          user.permissions.includes("employees.employee.create")
        }
      />

      {/* Core Self-Service Dashboard Grid - All 9 elements identical for both companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AttendanceWidget employeeId={user.employee?.id} initialRecord={telemetry?.todayAttendance} />
        <TaskSummaryWidget employeeId={user.employee?.id} scope="SELF" initialData={telemetry?.tasks} />
        <ProjectProgressWidget initialProjects={telemetry?.projects} />

        <LeaveBalanceWidget initialBalances={telemetry?.leaveBalances} />
        <UpcomingMeetingsWidget initialMeetings={telemetry?.upcomingMeetings} />
        <RecentNotificationsWidget initialNotifications={telemetry?.recentNotifications} />

        <ExpenseWidget initialSummary={telemetry?.expenses} />
        <RequestWidget initialData={telemetry?.requests} />
        <OnDutyWidget initialDuties={telemetry?.onDuty?.recentTrips} />
      </div>

      {/* Manager & Department Head Team Extensions - Identical for both companies */}
      {(isManager || isDeptHead) && (
        <div className="mt-8 space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isDeptHead ? "Department & Team Workload" : "My Team Workload"}
            </h2>
            <Badge variant="info" size="sm">
              {isDeptHead ? "Department Scope" : "Team Scope"}
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({companyName})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TaskSummaryWidget employeeId={user.employee?.id} scope={isDeptHead ? "DEPARTMENT" : "TEAM"} />
            <AnnouncementWidget />
          </div>
        </div>
      )}
    </div>
  );
}
