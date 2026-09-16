import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SalaryService } from "@/services/salary.service";
import { PageHeader } from "@/components/layout/page-header";
import { PayrollNav } from "@/modules/payroll/components/payroll-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CalendarCheck2,
  Calculator,
  CheckCircle2,
  ShieldCheck,
  Send,
  FileText,
  ArrowLeft,
  IndianRupee,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PayrollPeriodConsolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !user.employee) return notFound();

  // Strict Security Check: Only privileged roles can view full payroll run details
  if (!SalaryService.isPrivilegedPayrollUser(user)) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-slate-400">
          Corporate payroll runs and team salary breakdowns are restricted to authorized executive leadership and treasury.
        </p>
        <Link href="/app/payroll/my-payslips">
          <Button variant="outline" className="border-slate-700 text-slate-200">
            View My Personal Payslips
          </Button>
        </Link>
      </div>
    );
  }

  const period = await db.payrollPeriod.findUnique({
    where: { id },
    include: {
      entries: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
              designation: true,
              department: { select: { name: true, code: true } },
            },
          },
        },
        orderBy: { employee: { employeeNumber: "asc" } },
      },
    },
  });

  if (!period) return notFound();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSED":
        return <Badge variant="success">Processed & Paid</Badge>;
      case "APPROVED":
        return <Badge variant="info">Approved</Badge>;
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
      <div className="flex items-center gap-2 -mb-3">
        <Link href="/app/payroll/periods" className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Payroll Periods
        </Link>
      </div>

      <PageHeader
        title={`${period.name} (${period.code})`}
        description={`Lifecycle Stage: ${period.status}. Scheduled run from ${new Date(period.startDate).toLocaleDateString()} to ${new Date(period.endDate).toLocaleDateString()}.`}
        badge={getStatusBadge(period.status)}
        actions={
          <div className="flex gap-2">
            <Link href="/app/payroll/periods">
              <Button size="sm" variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300">
                Periods List
              </Button>
            </Link>
          </div>
        }
      />

      <PayrollNav />

      {/* Summary KPI Cards for this Period */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Personnel</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">{period.entries.length} Staff</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Covered in cycle</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Gross</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            ₹{Math.round(period.totalGross).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Basic + Allowances</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Deductions</span>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
            -₹{Math.round(period.totalDeductions).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">PF, Taxes & LOP</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net Disbursed</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            ₹{Math.round(period.totalNet).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total Treasury Outflow</div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Employee Compensation Breakdowns</h3>
            <p className="text-xs text-slate-400 mt-0.5">Calculated lines, loss-of-pay deductions, and issued payslip links.</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Employee</TableHead>
              <TableHead className="text-slate-400">Days / LWP</TableHead>
              <TableHead className="text-slate-400">Base Salary</TableHead>
              <TableHead className="text-slate-400">Gross Salary</TableHead>
              <TableHead className="text-slate-400">Deductions</TableHead>
              <TableHead className="text-slate-400">Net Payable</TableHead>
              <TableHead className="text-slate-400">Payment Status</TableHead>
              <TableHead className="text-right text-slate-400">Payslip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {period.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                  No calculations run yet for this cycle. Return to the periods list to trigger calculation.
                </TableCell>
              </TableRow>
            ) : (
              period.entries.map((entry) => (
                <TableRow key={entry.id} className="border-slate-800/70 hover:bg-slate-800/30">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200">
                        {entry.employee.firstName} {entry.employee.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {entry.employee.employeeNumber} • {entry.employee.department?.name || "General"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-300">
                    {entry.presentDays}/{entry.workingDays}d
                    {entry.unpaidLeaveDays > 0 && (
                      <span className="text-rose-400 font-semibold ml-1">({entry.unpaidLeaveDays} LWP)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-300">
                    ₹{Math.round(entry.baseSalary).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-200">
                    ₹{Math.round(entry.grossSalary).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-rose-400">
                    -₹{Math.round(entry.totalDeductions).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold text-emerald-400">
                    ₹{Math.round(entry.netSalary).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.status === "PAID" ? "success" : "default"}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/app/payroll/payslips/${entry.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 gap-1"
                      >
                        <FileText className="h-3.5 w-3.5" /> View Payslip
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
