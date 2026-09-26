import React from "react";
import { AuthenticatedUser } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KPICard } from "@/components/ui/kpi-card";
import {
  HeartHandshake,
  Users,
  Coins,
  ShieldCheck,
  Building2,
  Stethoscope,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Award,
  Globe2,
  CalendarCheck,
} from "lucide-react";
import { AttendanceWidget } from "@/components/dashboard/widgets/AttendanceWidget";
import { TaskSummaryWidget } from "@/components/dashboard/widgets/TaskSummaryWidget";
import { ProjectProgressWidget } from "@/components/dashboard/widgets/ProjectProgressWidget";
import { LeaveBalanceWidget } from "@/components/dashboard/widgets/LeaveBalanceWidget";
import { UpcomingMeetingsWidget } from "@/components/dashboard/widgets/UpcomingMeetingsWidget";
import { RecentNotificationsWidget } from "@/components/dashboard/widgets/RecentNotificationsWidget";
import { ExpenseWidget } from "@/components/dashboard/widgets/ExpenseWidget";
import { QuickActionsWidget } from "@/components/dashboard/widgets/QuickActionsWidget";
import { OverviewTelemetryData } from "@/services/overview-dashboard.service";

interface NareeFoundationDashboardProps {
  user: AuthenticatedUser;
  telemetry: OverviewTelemetryData | null;
}

export function NareeFoundationDashboard({ user, telemetry }: NareeFoundationDashboardProps) {
  const employeeName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user.email.split("@")[0];

  const designation = user?.employee?.designation || user.roleName;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Naree Foundation Specialized Header */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-[#062016] via-[#083323] to-[#041a12] p-6 shadow-xl shadow-emerald-950/30">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                <HeartHandshake className="h-3 w-3 text-emerald-400" />
                NON-PROFIT & SOCIAL IMPACT
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800/80 border border-slate-700 text-slate-300">
                EUR • PHILANTHROPY & GRANTS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-md border border-emerald-400/40">
                <img
                  src="/logos/naree-logo.jpg"
                  alt="Naree Foundation Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {user.activeCompany?.name || "Naree Foundation"}
              </h1>
            </div>
            <p className="text-xs md:text-sm text-emerald-200/80 max-w-2xl leading-relaxed">
              Empowering communities through sustainable health, primary education, female entrepreneurship,
              and emergency disaster relief programs across designated impact regions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-2 backdrop-blur-md">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Active Session
              </span>
              <span className="text-xs font-semibold text-white font-mono">
                {employeeName} ({designation})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Naree Foundation Social Impact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Social Programs"
          value="8 Drives"
          subtitle="Health, Education & Women Welfare"
          icon={HeartHandshake}
          trend={{ value: "+3 drives launched", positive: true }}
          className="border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-slate-900/60"
        />
        <KPICard
          title="Beneficiaries Reached"
          value="14,250+"
          subtitle="Verified community members"
          icon={Users}
          trend={{ value: "+2,100 this quarter", positive: true }}
          className="border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-slate-900/60"
        />
        <KPICard
          title="Grants & CSR Deployed"
          value="€850,000"
          subtitle="92% budget efficiency"
          icon={Coins}
          trend={{ value: "100% audited", positive: true }}
          className="border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-slate-900/60"
        />
        <KPICard
          title="Field Personnel & Volunteers"
          value="42 Staff"
          subtitle="On-duty field operations"
          icon={Building2}
          trend={{ value: "100% deployment", positive: true }}
          className="border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-slate-900/60"
        />
      </div>

      {/* Social Impact Program Pipeline */}
      <Card className="border-emerald-950/60 bg-[#091711]/90 shadow-lg">
        <CardHeader className="pb-3 border-b border-emerald-950/80">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-emerald-400" />
              Community Impact Drive & Grant Deployment Lifecycle
            </CardTitle>
            <Badge variant="outline" className="text-emerald-300 border-emerald-500/30 text-[10px]">
              Foundation Lifecycle
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-950/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                <span>1. Needs Assessment</span>
                <span className="font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">2 Regions</span>
              </div>
              <p className="text-[11px] text-slate-400">Demographic survey, baseline health data, and local leader liaison.</p>
            </div>

            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/40 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-200">
                <span>2. Grant Allocation</span>
                <span className="font-mono bg-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] text-emerald-300">3 Grants</span>
              </div>
              <p className="text-[11px] text-slate-400">Donor fund disbursement & compliance escrow verification.</p>
            </div>

            <div className="p-3 rounded-lg border border-teal-500/30 bg-teal-950/20 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-teal-300">
                <span>3. Field Execution</span>
                <span className="font-mono bg-teal-500/20 px-1.5 py-0.5 rounded text-[10px]">3 Active Drives</span>
              </div>
              <p className="text-[11px] text-slate-400">Direct distribution of medical supplies and education programs.</p>
            </div>

            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                <span>4. Impact Audit & Report</span>
                <span className="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">1 Audit</span>
              </div>
              <p className="text-[11px] text-slate-400">Independent outcome measurement and donor impact publication.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <QuickActionsWidget permissions={user?.permissions || []} roleLevel={user?.roleLevel || 10} />

      {/* Foundation Workspace Grid (Scoped exclusively to NAREE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AttendanceWidget employeeId={user?.employee?.id} initialRecord={telemetry?.todayAttendance} />
        <TaskSummaryWidget employeeId={user?.employee?.id} scope="SELF" initialData={telemetry?.tasks} />
        <ProjectProgressWidget initialProjects={telemetry?.projects} />
        <LeaveBalanceWidget initialBalances={telemetry?.leaveBalances} />
        <UpcomingMeetingsWidget initialMeetings={telemetry?.upcomingMeetings} />
        <RecentNotificationsWidget initialNotifications={telemetry?.recentNotifications} />
        <ExpenseWidget initialSummary={telemetry?.expenses} />
      </div>
    </div>
  );
}
