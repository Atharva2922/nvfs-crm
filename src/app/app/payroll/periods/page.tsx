"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PayrollNav } from "@/modules/payroll/components/payroll-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CalendarCheck2,
  PlusCircle,
  Calculator,
  CheckCircle2,
  ShieldCheck,
  Send,
  Eye,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface PeriodItem {
  id: string;
  code: string;
  name: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  paymentDate?: string | null;
  status: "DRAFT" | "CALCULATED" | "REVIEWED" | "APPROVED" | "PROCESSED";
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  remarks?: string | null;
  _count?: { entries: number };
}

export default function PayrollPeriodsPage() {
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Period Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("2026-10");
  const [newName, setNewName] = useState("October 2026 Payroll Run");
  const [newYear, setNewYear] = useState(2026);
  const [newMonth, setNewMonth] = useState(10);
  const [newStartDate, setNewStartDate] = useState("2026-10-01");
  const [newEndDate, setNewEndDate] = useState("2026-10-31");
  const [newRemarks, setNewRemarks] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/periods");
      const json = await res.json();
      if (json.success) {
        setPeriods(json.data.periods || []);
      }
    } catch (err) {
      console.error("Failed to load payroll periods:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/payroll/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          name: newName,
          year: Number(newYear),
          month: Number(newMonth),
          startDate: newStartDate,
          endDate: newEndDate,
          remarks: newRemarks || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setModalError(json.error?.message || "Failed to create payroll period");
        setSubmitting(false);
        return;
      }
      setIsModalOpen(false);
      setSubmitting(false);
      await fetchPeriods();
    } catch (err: any) {
      setModalError(err.message || "Network error");
      setSubmitting(false);
    }
  };

  // 1-Click Action Handlers
  const handleCalculate = async (periodId: string) => {
    setActionLoading(periodId);
    try {
      const res = await fetch(`/api/payroll/periods/${periodId}/calculate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Calculation failed");
        return;
      }
      await fetchPeriods();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReview = async (periodId: string) => {
    setActionLoading(periodId);
    try {
      const res = await fetch(`/api/payroll/periods/${periodId}/review`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Review failed");
        return;
      }
      await fetchPeriods();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (periodId: string) => {
    if (!confirm("Are you sure you want to approve this payroll run? This will lock calculations for disbursement.")) {
      return;
    }
    setActionLoading(periodId);
    try {
      const res = await fetch(`/api/payroll/periods/${periodId}/approve`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Approval failed");
        return;
      }
      await fetchPeriods();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcess = async (periodId: string) => {
    if (!confirm("Confirm execution of disbursements? All payslips will be marked as PAID and available to employees.")) {
      return;
    }
    setActionLoading(periodId);
    try {
      const res = await fetch(`/api/payroll/periods/${periodId}/process`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Processing failed");
        return;
      }
      await fetchPeriods();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: PeriodItem["status"]) => {
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
        return <Badge variant="default">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Periods & Run Lifecycle"
        description="Execute auditable monthly payroll runs with automated attendance deduction synchronization, stage gating, and treasury approvals."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPeriods()}
              className="border-slate-700 hover:bg-slate-800 text-slate-200 gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setModalError(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              New Payroll Period
            </Button>
          </div>
        }
      />

      <PayrollNav />

      {/* Main Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">All Corporate Payroll Cycles</h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological list of draft, approved, and disbursed cycles.</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Period Code</TableHead>
              <TableHead className="text-slate-400">Cycle Name</TableHead>
              <TableHead className="text-slate-400">Date Range</TableHead>
              <TableHead className="text-slate-400">Personnel</TableHead>
              <TableHead className="text-slate-400">Gross Amount</TableHead>
              <TableHead className="text-slate-400">Deductions</TableHead>
              <TableHead className="text-slate-400">Net Disbursed</TableHead>
              <TableHead className="text-slate-400">Lifecycle Status</TableHead>
              <TableHead className="text-right text-slate-400">Console & Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-500 text-xs">
                  No payroll periods found. Create one using the button above.
                </TableCell>
              </TableRow>
            ) : (
              periods.map((period) => (
                <TableRow key={period.id} className="border-slate-800/70 hover:bg-slate-800/30">
                  <TableCell className="font-mono text-xs font-bold text-blue-400">
                    {period.code}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-200">
                    {period.name}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(period.startDate).toLocaleDateString()} &rarr; {new Date(period.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-300">
                    {period.employeeCount} Staff
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-200">
                    ₹{Math.round(period.totalGross).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-rose-400">
                    -₹{Math.round(period.totalDeductions).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold text-emerald-400">
                    ₹{Math.round(period.totalNet).toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(period.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Step Action Buttons */}
                      {period.status === "DRAFT" && (
                        <Button
                          size="sm"
                          disabled={actionLoading === period.id}
                          onClick={() => handleCalculate(period.id)}
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1"
                        >
                          <Calculator className="h-3 w-3" /> Calculate
                        </Button>
                      )}

                      {period.status === "CALCULATED" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === period.id}
                            onClick={() => handleCalculate(period.id)}
                            className="h-7 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
                            title="Recalculate"
                          >
                            Recalc
                          </Button>
                          <Button
                            size="sm"
                            disabled={actionLoading === period.id}
                            onClick={() => handleReview(period.id)}
                            className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-white gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Mark Reviewed
                          </Button>
                        </>
                      )}

                      {period.status === "REVIEWED" && (
                        <Button
                          size="sm"
                          disabled={actionLoading === period.id}
                          onClick={() => handleApprove(period.id)}
                          className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" /> Approve
                        </Button>
                      )}

                      {period.status === "APPROVED" && (
                        <Button
                          size="sm"
                          disabled={actionLoading === period.id}
                          onClick={() => handleProcess(period.id)}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                        >
                          <Send className="h-3 w-3" /> Disburse
                        </Button>
                      )}

                      <Link href={`/app/payroll/periods/${period.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> Details
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* CREATE PERIOD MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[#0f172a] border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CalendarCheck2 className="h-5 w-5 text-blue-400" />
              Initialize Payroll Period Run
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Creates an initial draft cycle. You will be able to trigger automated batch compensation calculations.
            </DialogDescription>
          </DialogHeader>

          {modalError && (
            <div className="rounded-lg bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          <form onSubmit={handleCreatePeriod} className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Period Code</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. 2026-10"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Month & Year</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={newMonth}
                    onChange={(e) => setNewMonth(Number(e.target.value))}
                    className="bg-slate-900 border-slate-700 text-xs font-mono"
                  />
                  <Input
                    type="number"
                    min={2020}
                    required
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="bg-slate-900 border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Run Name</label>
              <Input
                type="text"
                required
                placeholder="e.g. October 2026 Corporate Payroll Run"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
                <Input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
                <Input
                  type="date"
                  required
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Remarks / Audit Note (Optional)</label>
              <Input
                type="text"
                placeholder="Disbursement notes..."
                value={newRemarks}
                onChange={(e) => setNewRemarks(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
              >
                {submitting ? "Creating..." : "Create Period"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
