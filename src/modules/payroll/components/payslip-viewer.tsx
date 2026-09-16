"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  ArrowLeft,
  Building,
  ShieldCheck,
  CheckCircle2,
  Download,
} from "lucide-react";

interface PayslipViewerProps {
  payslip: {
    id: string;
    totalPeriodDays: number;
    workingDays: number;
    presentDays: number;
    unpaidLeaveDays: number;
    baseSalary: number;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    status: string;
    paymentMethod: string;
    paymentReference?: string | null;
    paymentDate?: Date | string | null;
    earnings: Array<{ code: string; name: string; amount: number; type: string }>;
    deductions: Array<{ code: string; name: string; amount: number; type: string }>;
    payrollPeriod: {
      code: string;
      name: string;
      month: number;
      year: number;
      startDate: Date | string;
      endDate: Date | string;
    };
    employee: {
      id: string;
      firstName: string;
      lastName: string;
      employeeNumber: string;
      designation: string;
      hireDate: Date | string;
      department?: { name: string; code: string } | null;
      organization: { name: string; code: string };
      salaryStructures: Array<{
        bankAccountMask?: string | null;
        taxIdNumber?: string | null;
        bankName?: string | null;
      }>;
    };
  };
}

export function PayslipViewer({ payslip }: PayslipViewerProps) {
  const activeStructure = payslip.employee.salaryStructures?.[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/app/payroll/my-payslips"
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Payslips
        </Link>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm text-xs"
          >
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Payslip Document (White background on print, sleek dark on screen) */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] text-slate-100 p-8 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0 max-w-4xl mx-auto">
        {/* Header Branding */}
        <div className="border-b border-slate-800 print:border-slate-300 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                  NF
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white print:text-black">
                    {payslip.employee.organization.name}
                  </h1>
                  <span className="text-xs text-slate-400 print:text-slate-600 font-mono">
                    Official Statement of Earnings and Statutory Deductions
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 print:text-slate-500 mt-2 space-y-0.5">
                <div>Corporate Headquarters: BKC Commercial Complex, Bandra East, Mumbai, Maharashtra 400051</div>
                <div>Tax Identification: EIN-9482019 • Org Code: {payslip.employee.organization.code}</div>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono text-xs uppercase px-2.5 py-1 rounded bg-slate-800 text-blue-400 border border-slate-700 print:bg-slate-100 print:text-black print:border-slate-300">
                PAYSLIP — {payslip.payrollPeriod.code}
              </span>
              <div className="text-xs text-slate-400 print:text-slate-600 mt-2">
                Status: <span className="text-emerald-400 font-semibold">{payslip.status}</span>
              </div>
              {payslip.paymentDate && (
                <div className="text-[11px] text-slate-400 print:text-slate-500 font-mono">
                  Paid Date: {new Date(payslip.paymentDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Demographics & Attendance Grid */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-800/80 print:border-slate-300 bg-slate-900/40 print:bg-slate-50 p-4 mb-6 text-xs">
          {/* Employee Column */}
          <div className="space-y-1.5">
            <div className="flex justify-between border-b border-slate-800/60 print:border-slate-200 pb-1">
              <span className="text-slate-400 print:text-slate-600">Employee Name:</span>
              <span className="font-bold text-slate-100 print:text-black">
                {payslip.employee.firstName} {payslip.employee.lastName}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 print:border-slate-200 pb-1">
              <span className="text-slate-400 print:text-slate-600">Employee ID:</span>
              <span className="font-mono text-slate-200 print:text-black">{payslip.employee.employeeNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 print:border-slate-200 pb-1">
              <span className="text-slate-400 print:text-slate-600">Designation:</span>
              <span className="text-slate-200 print:text-black">{payslip.employee.designation}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 print:border-slate-200 pb-1">
              <span className="text-slate-400 print:text-slate-600">Department:</span>
              <span className="text-slate-200 print:text-black">{payslip.employee.department?.name || "General"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-slate-600">Tax Identification:</span>
              <span className="font-mono text-slate-200 print:text-black">
                {activeStructure?.taxIdNumber || "On File"}
              </span>
            </div>
          </div>

          {/* Period & Payment Column */}
          <div className="space-y-1.5">
            <div className="flex justify-between border-b border-slate-800/60 print:border-slate-200 pb-1">
              <span className="text-slate-400 print:text-slate-600">Payroll Cycle:</span>
              <span className="font-semibold text-slate-100 print:text-black">{payslip.payrollPeriod.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 print:border-slate-200 pb-1">
              <span className="text-slate-400 print:text-slate-600">Working / Present Days:</span>
              <span className="font-mono text-slate-200 print:text-black">
                {payslip.presentDays} / {payslip.workingDays} days
                {payslip.unpaidLeaveDays > 0 && ` (${payslip.unpaidLeaveDays} LWP)`}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 print:border-slate-200 pb-1">
              <span className="text-slate-400 print:text-slate-600">Disbursement Method:</span>
              <span className="text-slate-200 print:text-black">{payslip.paymentMethod.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 print:border-slate-200 pb-1">
              <span className="text-slate-400 print:text-slate-600">Bank Account:</span>
              <span className="font-mono text-slate-200 print:text-black">
                {activeStructure?.bankAccountMask || "Direct Wire"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-slate-600">Transaction Reference:</span>
              <span className="font-mono text-slate-200 print:text-black">
                {payslip.paymentReference || "Direct ACH"}
              </span>
            </div>
          </div>
        </div>

        {/* Side-by-Side Earnings and Deductions Table */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Earnings */}
          <div className="border border-slate-800 print:border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-900/80 print:bg-slate-100 px-4 py-2 border-b border-slate-800 print:border-slate-300 font-semibold text-xs text-white print:text-black flex justify-between">
              <span>Earnings Component</span>
              <span>Amount (INR)</span>
            </div>
            <div className="p-3 space-y-2 text-xs">
              {payslip.earnings.map((e) => (
                <div key={e.code} className="flex justify-between text-slate-300 print:text-slate-800">
                  <span>{e.name}</span>
                  <span className="font-mono text-slate-100 print:text-black">₹{e.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/40 print:bg-slate-50 px-4 py-2.5 border-t border-slate-800 print:border-slate-300 flex justify-between text-xs font-bold text-white print:text-black">
              <span>Gross Earnings</span>
              <span className="font-mono">₹{payslip.grossSalary.toLocaleString()}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="border border-slate-800 print:border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-900/80 print:bg-slate-100 px-4 py-2 border-b border-slate-800 print:border-slate-300 font-semibold text-xs text-white print:text-black flex justify-between">
              <span>Deduction Component</span>
              <span>Amount (INR)</span>
            </div>
            <div className="p-3 space-y-2 text-xs">
              {payslip.deductions.map((d) => (
                <div key={d.code} className="flex justify-between text-slate-300 print:text-slate-800">
                  <span>{d.name}</span>
                  <span className="font-mono text-rose-400 print:text-rose-700">-₹{d.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/40 print:bg-slate-50 px-4 py-2.5 border-t border-slate-800 print:border-slate-300 flex justify-between text-xs font-bold text-white print:text-black">
              <span>Total Deductions</span>
              <span className="font-mono text-rose-400 print:text-rose-700">-₹{payslip.totalDeductions.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Net Take-Home Highlight Block */}
        <div className="rounded-xl border-2 border-emerald-500/40 print:border-emerald-600 bg-emerald-950/20 print:bg-emerald-50 p-5 flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 print:text-emerald-800">
              Net Take-Home Payable
            </span>
            <div className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              Net Amount Credited to Employee Disbursement Account
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-300 print:text-emerald-800">
            ₹{payslip.netSalary.toLocaleString()}
          </div>
        </div>

        {/* Signatures & Corporate Legal Disclaimer */}
        <div className="border-t border-slate-800 print:border-slate-300 pt-6 text-[11px] text-slate-500 print:text-slate-600 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <div className="font-semibold text-slate-400 print:text-slate-700">Confidentiality & Compliance</div>
              <div>This statement contains confidential compensation information.</div>
              <div>System Audit Trace ID: {payslip.id}</div>
            </div>
            <div className="text-right">
              <div className="font-serif italic text-slate-300 print:text-black text-sm mb-1">Julian Sterling</div>
              <div className="border-t border-slate-700 print:border-slate-400 pt-1 text-[10px]">
                Authorized Corporate Treasury Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
