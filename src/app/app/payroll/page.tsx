import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SalaryService } from "@/services/salary.service";
import { PageHeader } from "@/components/layout/page-header";
import { PayrollNav } from "@/modules/payroll/components/payroll-nav";
import { KPICard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  CalendarCheck2,
  Layers,
  FileText,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Salary & Payroll Cockpit | CRM + NFVS",
  description: "Enterprise compensation structures, payroll runs, automated disbursements and payslips.",
};

export const dynamic = "force-dynamic";

export default async function PayrollOverviewPage() {
  const user = await getCurrentUser();
  const orgId = user?.employee?.organizationId || "";
  const isPrivileged = user ? SalaryService.isPrivilegedPayrollUser(user) : false;

  // 1. Fetch live metrics
  const [
    lastProcessedPeriod,
    activeDraftPeriod,
    allPeriods,
    structuresCount,
    mySalaryAssignment,
    myLatestPayslip,
  ] = await Promise.all([
    orgId
      ? db.payrollPeriod.findFirst({
          where: { organizationId: orgId, status: "PROCESSED" },
          orderBy: { code: "desc" },
        })
      : null,
    orgId
      ? db.payrollPeriod.findFirst({
          where: { organizationId: orgId, status: { in: ["DRAFT", "CALCULATED", "REVIEWED", "APPROVED"] } },
          orderBy: { code: "desc" },
        })
      : null,
    orgId
      ? db.payrollPeriod.findMany({
          where: { organizationId: orgId },
          orderBy: { code: "desc" },
          take: 5,
        })
      : [],
    orgId ? db.salaryStructure.count({ where: { organizationId: orgId, isActive: true } }) : 0,
    user?.employee
      ? db.employeeSalaryStructure.findFirst({
          where: { employeeId: user.employee.id, isActive: true },
          include: {
            salaryStructure: {
              include: {
                items: { include: { component: true }, orderBy: { order: "asc" } },
              },
            },
          },
        })
      : null,
    user?.employee
      ? db.payrollEntry.findFirst({
          where: { employeeId: user.employee.id, status: { in: ["APPROVED", "PAID"] } },
          orderBy: { createdAt: "desc" },
          include: { payrollPeriod: true },
        })
      : null,
  ]);

  let myComputedBreakdown = null;
  if (mySalaryAssignment) {
    myComputedBreakdown = SalaryService.calculateSalaryBreakdown(
      mySalaryAssignment.baseSalary,
      mySalaryAssignment.salaryStructure.items
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSED":
      case "PAID":
        return <Badge variant="success">Processed & Disbursed</Badge>;
      case "APPROVED":
        return <Badge variant="info">Executive Approved</Badge>;
      case "REVIEWED":
        return <Badge variant="warning">Reviewed</Badge>;
      case "CALCULATED":
        return <Badge variant="outline" className="border-blue-500/40 text-blue-300">Calculated</Badge>;
      default:
        return <Badge variant="default">Draft Cycle</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Compensation & Payroll Operations"
        description="Statutory & custom compensation formulas, automated monthly payroll lifecycles, executive approvals, and immutable employee payslips."
        actions={
          <div className="flex gap-2">
            {isPrivileged && (
              <Link href="/app/payroll/periods">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm">
                  <CalendarCheck2 className="h-4 w-4" />
                  Execute Payroll Run
                </Button>
              </Link>
            )}
            {myLatestPayslip && (
              <Link href={`/app/payroll/payslips/${myLatestPayslip.id}`}>
                <Button size="sm" variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-200 gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  My Latest Payslip
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <PayrollNav />

      {/* Top Financial & Operational KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Monthly Net Disbursed"
          value={lastProcessedPeriod ? `₹${Math.round(lastProcessedPeriod.totalNet).toLocaleString()}` : "₹0"}
          icon={Wallet}
          subtitle={lastProcessedPeriod ? `Period: ${lastProcessedPeriod.code}` : "No completed disbursements"}
          trend={{ value: "100%", positive: true }}
        />
        <KPICard
          title="Total Gross Compensation"
          value={lastProcessedPeriod ? `₹${Math.round(lastProcessedPeriod.totalGross).toLocaleString()}` : "₹0"}
          icon={TrendingUp}
          subtitle="Includes Allowances & Basic"
        />
        <KPICard
          title="Statutory Deductions"
          value={lastProcessedPeriod ? `₹${Math.round(lastProcessedPeriod.totalDeductions).toLocaleString()}` : "₹0"}
          icon={TrendingDown}
          subtitle="PF & Tax Withholdings"
        />
        <KPICard
          title="Active Payroll Run"
          value={activeDraftPeriod ? activeDraftPeriod.code : "Concluded"}
          icon={Clock}
          subtitle={activeDraftPeriod ? `Status: ${activeDraftPeriod.status}` : "All periods processed"}
          trend={{
            value: activeDraftPeriod ? activeDraftPeriod.status : "Idle",
            positive: activeDraftPeriod?.status === "APPROVED",
          }}
        />
      </div>

      {/* Main Grid: Operational Runs & Personal Compensation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Payroll Periods Lifecycle Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Payroll Lifecycle Management</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  5-stage auditable progression: Draft &rarr; Calculated &rarr; Reviewed &rarr; Approved &rarr; Processed.
                </p>
              </div>
              <Link href="/app/payroll/periods" className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View All Runs <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {allPeriods.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">No payroll periods configured.</div>
              ) : (
                allPeriods.map((period) => (
                  <div
                    key={period.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-800/80 bg-slate-900/40 hover:border-slate-700 transition-colors gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {period.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{period.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {new Date(period.startDate).toLocaleDateString()} &rarr; {new Date(period.endDate).toLocaleDateString()}
                        {period.employeeCount > 0 && <span> • {period.employeeCount} Personnel</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-emerald-400">
                          ₹{Math.round(period.totalNet).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">Net Payable</div>
                      </div>
                      <div>{getStatusBadge(period.status)}</div>
                      {isPrivileged && (
                        <Link href={`/app/payroll/periods/${period.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 hover:bg-slate-800 text-slate-300">
                            Console
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Sub-Module Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/app/payroll/structures"
              className="group rounded-xl border border-slate-800 bg-[#0d1424] p-4 hover:border-blue-500/40 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <Layers className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                  {structuresCount} Templates
                </Badge>
              </div>
              <h4 className="text-sm font-semibold text-white mt-3 group-hover:text-blue-400 transition-colors">
                Compensation Structures & Formulas
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Dynamic allowances (TA, DA, HRA), statutory deductions (PF, Tax), and custom component formula builders.
              </p>
              <div className="flex items-center gap-1 text-xs text-blue-400 font-medium mt-3">
                Manage Structures <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {isPrivileged ? (
              <Link
                href="/app/payroll/employee-salaries"
                className="group rounded-xl border border-slate-800 bg-[#0d1424] p-4 hover:border-indigo-500/40 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                    <Users className="h-5 w-5" />
                  </div>
                  <Badge variant="info">Restricted Access</Badge>
                </div>
                <h4 className="text-sm font-semibold text-white mt-3 group-hover:text-indigo-400 transition-colors">
                  Personnel Salary Allocations
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Assign base salaries, structure templates, masked bank accounts, and tax registrations per employee.
                </p>
                <div className="flex items-center gap-1 text-xs text-indigo-400 font-medium mt-3">
                  Assign Salaries <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ) : (
              <Link
                href="/app/payroll/my-payslips"
                className="group rounded-xl border border-slate-800 bg-[#0d1424] p-4 hover:border-emerald-500/40 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                    <FileText className="h-5 w-5" />
                  </div>
                  <Badge variant="success">Self-Service</Badge>
                </div>
                <h4 className="text-sm font-semibold text-white mt-3 group-hover:text-emerald-400 transition-colors">
                  My Monthly Payslips
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Access historical monthly payslip statements, earnings breakdowns, and direct PDF/print export.
                </p>
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium mt-3">
                  Open Payslips <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: User Personal Salary Snapshot */}
        <div className="space-y-6">
          {mySalaryAssignment && myComputedBreakdown ? (
            <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4 text-emerald-400" />
                    My Compensation Package
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {mySalaryAssignment.salaryStructure.name}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Monthly Base Salary</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    ₹{Math.round(mySalaryAssignment.baseSalary).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Net Take-Home</span>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    ₹{Math.round(myComputedBreakdown.netSalary).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Monthly Earnings
                </span>
                {myComputedBreakdown.earnings.map((e) => (
                  <div key={e.code} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{e.name}</span>
                    <span className="font-mono text-slate-200">+${e.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Deductions Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Deductions & Withholdings
                </span>
                {myComputedBreakdown.deductions.map((d) => (
                  <div key={d.code} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{d.name}</span>
                    <span className="font-mono text-rose-400">-${d.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Bank Mask */}
              {mySalaryAssignment.bankAccountMask && (
                <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-2.5 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Disbursement Account</span>
                  <span className="font-mono text-slate-200">{mySalaryAssignment.bankAccountMask}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 text-center text-xs text-slate-500">
              No salary package assigned to your profile yet.
            </div>
          )}

          {/* Privacy Notice Banner */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs text-blue-300 flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-blue-200">Strict Salary Security Policy</span>
              Salary allocations are encrypted and accessible only by corporate executives and treasury. Subordinate salaries are never visible to direct managers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
