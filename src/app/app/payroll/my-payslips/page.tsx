"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { FileCheck, IndianRupee, Download, Lock, CheckCircle2 } from "lucide-react";

interface Payslip {
  id: string;
  payrollPeriod: {
    code: string;
    name: string;
    year: number;
    month: number;
    status: string;
  };
  baseSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  earningsBreakdown: string;
  deductionsBreakdown: string;
  status: string;
  createdAt: string;
}

export default function MyPayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  useEffect(() => {
    async function fetchPayslips() {
      try {
        setLoading(true);
        const res = await fetch("/api/payroll/my-payslips");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setPayslips(json.data);
            if (json.data.length > 0) setSelectedPayslip(json.data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch payslips:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayslips();
  }, []);

  const parseJson = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="My Salary & Payslips"
        description="Confidential self-service access to your personal compensation history."
        badge={
          <Badge variant="gold" size="sm" className="gap-1">
            <Lock className="h-3 w-3 text-amber-500" />
            <span>Confidential Self-Service</span>
          </Badge>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading secure payslips...</div>
      ) : payslips.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-8">
          <FileCheck className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Payslips Released</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Your payroll periods are currently processing or have not been finalized for distribution.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: List of Payslip Periods */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payroll History</h3>
            {payslips.map((ps) => (
              <button
                key={ps.id}
                onClick={() => setSelectedPayslip(ps)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedPayslip?.id === ps.id
                    ? "bg-blue-50/90 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 shadow-xs"
                    : "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">
                    {ps.payrollPeriod.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {ps.status}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Net Payable:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ${ps.netSalary.toLocaleString()}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Selected Payslip Detail View */}
          {selectedPayslip && (
            <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs space-y-6">
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                    PAYSLIP STATEMENT
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedPayslip.payrollPeriod.name}
                  </h2>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Print / PDF
                </button>
              </div>

              {/* High-level Summary Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-center border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Gross Salary</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    ${selectedPayslip.grossSalary.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-center border border-rose-200/50 dark:border-rose-800/50">
                  <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 uppercase">Total Deductions</span>
                  <p className="text-base font-bold text-rose-800 dark:text-rose-300 mt-0.5">
                    ${selectedPayslip.totalDeductions.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-center border border-emerald-200/50 dark:border-emerald-800/50">
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Net Disbursed</span>
                  <p className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 mt-0.5">
                    ${selectedPayslip.netSalary.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Breakdown Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Earnings</h4>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {parseJson(selectedPayslip.earningsBreakdown).map((e: any, idx: number) => (
                      <div key={idx} className="flex justify-between p-2.5">
                        <span className="text-slate-600 dark:text-slate-300">{e.name || e.code}</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">₹{e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Deductions & Taxes</h4>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {parseJson(selectedPayslip.deductionsBreakdown).map((d: any, idx: number) => (
                      <div key={idx} className="flex justify-between p-2.5">
                        <span className="text-slate-600 dark:text-slate-300">{d.name || d.code}</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">₹{d.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
