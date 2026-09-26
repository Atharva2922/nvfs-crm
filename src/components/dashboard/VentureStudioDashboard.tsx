import React from "react";
import { AuthenticatedUser } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KPICard } from "@/components/ui/kpi-card";
import {
  Rocket,
  Cpu,
  TrendingUp,
  Coins,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Briefcase,
  Terminal,
  Activity,
  ArrowUpRight,
  Code2,
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

interface VentureStudioDashboardProps {
  user: AuthenticatedUser;
  telemetry: OverviewTelemetryData | null;
}

export function VentureStudioDashboard({ user, telemetry }: VentureStudioDashboardProps) {
  const employeeName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user.email.split("@")[0];

  const designation = user?.employee?.designation || user.roleName;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Venture Studio Specialized Header */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-[#0b1329] via-[#0f1d42] to-[#0a1226] p-6 shadow-xl shadow-blue-950/30">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 border border-blue-400/40 text-blue-300">
                <Rocket className="h-3 w-3 text-blue-400 animate-pulse" />
                VENTURE STUDIO COHORT 2026
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800/80 border border-slate-700 text-slate-300">
                USD • TECH INCUBATION
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-md border border-blue-400/40">
                <img
                  src="/logos/nfvs-logo.jpg"
                  alt="Naree Foundation Venture Studio Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {user.activeCompany?.name || "Naree Foundation Venture Studio"}
              </h1>
            </div>
            <p className="text-xs md:text-sm text-blue-200/80 max-w-2xl leading-relaxed">
              Venture Capital & Technology Incubation Hub. Overseeing high-yield startup incubation,
              cross-platform software architecture, and institutional venture capital deployment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/40 px-3.5 py-2 backdrop-blur-md">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-400">
                Active Session
              </span>
              <span className="text-xs font-semibold text-white font-mono">
                {employeeName} ({designation})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Venture Studio KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Incubated Startups"
          value="7 Startups"
          subtitle="Cohort Q3/Q4 in progress"
          icon={Rocket}
          trend={{ value: "+2 new this month", positive: true }}
          className="border-blue-900/50 bg-gradient-to-b from-blue-950/20 to-slate-900/60"
        />
        <KPICard
          title="Seed Capital Deployed"
          value="$1.45M"
          subtitle="Target: $2.0M round"
          icon={Coins}
          trend={{ value: "72.5% deployed", positive: true }}
          className="border-blue-900/50 bg-gradient-to-b from-blue-950/20 to-slate-900/60"
        />
        <KPICard
          title="Sprint Velocity"
          value="94.8%"
          subtitle="24 Milestones achieved"
          icon={Cpu}
          trend={{ value: "+5.2% velocity", positive: true }}
          className="border-blue-900/50 bg-gradient-to-b from-blue-950/20 to-slate-900/60"
        />
        <KPICard
          title="Studio Runway"
          value="18.4 Mo"
          subtitle="Burn: $62K/month"
          icon={TrendingUp}
          trend={{ value: "Healthy reserves", positive: true }}
          className="border-blue-900/50 bg-gradient-to-b from-blue-950/20 to-slate-900/60"
        />
      </div>

      {/* Venture Studio Incubation Pipeline Status */}
      <Card className="border-blue-950/60 bg-[#0b1222]/90 shadow-lg">
        <CardHeader className="pb-3 border-b border-blue-950/80">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              Incubation Stage Pipeline & Startup Cohort Lifecycle
            </CardTitle>
            <Badge variant="outline" className="text-blue-300 border-blue-500/30 text-[10px]">
              Studio Lifecycle
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-950/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-300">
                <span>1. Ideation & Pitch</span>
                <span className="font-mono bg-blue-500/20 px-1.5 py-0.5 rounded text-[10px]">2 Startups</span>
              </div>
              <p className="text-[11px] text-slate-400">Market problem validation and founding team advisory.</p>
            </div>

            <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-950/40 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-200">
                <span>2. Tech MVP & Arch</span>
                <span className="font-mono bg-blue-500/30 px-1.5 py-0.5 rounded text-[10px] text-blue-300">3 Startups</span>
              </div>
              <p className="text-[11px] text-slate-400">Core Next.js / Cloud SaaS architecture development.</p>
            </div>

            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                <span>3. Beta & Validation</span>
                <span className="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">2 Startups</span>
              </div>
              <p className="text-[11px] text-slate-400">Early enterprise customer pilot testing & revenue testing.</p>
            </div>

            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                <span>4. Series A / Scale</span>
                <span className="font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">1 Startup</span>
              </div>
              <p className="text-[11px] text-slate-400">Institutional venture funding and studio spin-out.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <QuickActionsWidget permissions={user?.permissions || []} roleLevel={user?.roleLevel || 10} />

      {/* Studio Workspace Grid (Scoped exclusively to NFVS) */}
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
