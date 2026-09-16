"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PayrollNav } from "@/modules/payroll/components/payroll-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Users,
  PlusCircle,
  ShieldCheck,
  Building,
  CreditCard,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface AssignmentItem {
  id: string;
  baseSalary: number;
  paymentMethod: string;
  bankName?: string | null;
  bankAccountMask?: string | null;
  taxIdNumber?: string | null;
  effectiveFrom: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    designation: string;
    department?: { name: string; code: string };
  };
  salaryStructure: {
    id: string;
    name: string;
    currency: string;
  };
}

export default function EmployeeSalariesPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [structuresList, setStructuresList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Assign Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedStructId, setSelectedStructId] = useState("");
  const [monthlyBase, setMonthlyBase] = useState(10000);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [bankName, setBankName] = useState("Chase Commercial Bank");
  const [bankAccountMask, setBankAccountMask] = useState("•••• •••• 4092");
  const [taxIdNumber, setTaxIdNumber] = useState("TAX-US-001");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const res = await fetch("/api/payroll/employee-salaries");
      const json = await res.json();
      if (!res.ok && res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      if (json.success) {
        setAssignments(json.data.assignments || []);
      }

      // Fetch employees for dropdown
      const empRes = await fetch("/api/employees?limit=100");
      const empJson = await empRes.json();
      if (empJson.data) setEmployeesList(empJson.data);

      // Fetch structures for dropdown
      const structRes = await fetch("/api/payroll/structures");
      const structJson = await structRes.json();
      if (structJson.data?.structures) setStructuresList(structJson.data.structures);
    } catch (err) {
      console.error("Failed to load employee salaries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/payroll/employee-salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          salaryStructureId: selectedStructId,
          baseSalary: Number(monthlyBase),
          paymentMethod,
          bankName,
          bankAccountMask,
          taxIdNumber,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error?.message || "Failed to assign salary package");
        setSubmitting(false);
        return;
      }
      setIsOpen(false);
      setSubmitting(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
      setSubmitting(false);
    }
  };

  if (accessDenied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Personnel Salary Allocations"
          description="Highly restricted executive compensation directory."
        />
        <PayrollNav />
        <div className="rounded-xl border border-rose-800/60 bg-rose-950/20 p-8 text-center space-y-3">
          <Lock className="h-10 w-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-semibold text-white">Confidential Personnel Information</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You do not possess executive or treasury privileges to view all personnel salaries. Subordinate salaries are not disclosed to managers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personnel Salary Allocations"
        description="Confidential employee compensation register: base salaries, assigned structure templates, masked bank details, and tax registrations."
        badge={
          <Badge variant="info" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Restricted Access</span>
          </Badge>
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              setErrorMsg(null);
              if (employeesList.length > 0) setSelectedEmpId(employeesList[0].id);
              if (structuresList.length > 0) setSelectedStructId(structuresList[0].id);
              setIsOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Assign Salary Package
          </Button>
        }
      />

      <PayrollNav />

      {/* Main Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Active Employee Salary Assignments</h3>
            <p className="text-xs text-slate-400 mt-0.5">Corporate workforce base rates and disbursement accounts.</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{assignments.length} Personnel Configured</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Employee</TableHead>
              <TableHead className="text-slate-400">Assigned Structure</TableHead>
              <TableHead className="text-slate-400">Monthly Base</TableHead>
              <TableHead className="text-slate-400">Annualized</TableHead>
              <TableHead className="text-slate-400">Payment Account</TableHead>
              <TableHead className="text-slate-400">Tax Registration</TableHead>
              <TableHead className="text-slate-400">Effective Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                  No employee salary structures found.
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((item) => (
                <TableRow key={item.id} className="border-slate-800/70 hover:bg-slate-800/30">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200">
                        {item.employee.firstName} {item.employee.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.employee.employeeNumber} • {item.employee.department?.name || "General"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-blue-400">
                    {item.salaryStructure.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-white">
                    ${Math.round(item.baseSalary).toLocaleString()}/mo
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-300">
                    ${Math.round(item.baseSalary * 12).toLocaleString()}/yr
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-300 font-mono">
                        {item.bankAccountMask || "Direct Wire"}
                      </span>
                      {item.bankName && (
                        <span className="text-[10px] text-slate-500">{item.bankName}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    {item.taxIdNumber || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {new Date(item.effectiveFrom).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ASSIGN PACKAGE MODAL */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#0f172a] border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-400" />
              Assign Employee Salary Package
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Link personnel to a compensation structure template and establish monthly base salary.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-lg bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAssign} className="space-y-3.5 py-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Employee</label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
              >
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeNumber}) — {emp.designation}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Salary Structure Template</label>
              <select
                value={selectedStructId}
                onChange={(e) => setSelectedStructId(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
              >
                {structuresList.map((struct) => (
                  <option key={struct.id} value={struct.id}>
                    {struct.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Base Salary (₹)</label>
                <Input
                  type="number"
                  step="any"
                  required
                  value={monthlyBase}
                  onChange={(e) => setMonthlyBase(Number(e.target.value))}
                  className="bg-slate-900 border-slate-700 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="DIRECT_DEPOSIT">Direct Bank Transfer</option>
                  <option value="CHEQUE">Corporate Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bank Name</label>
                <Input
                  type="text"
                  placeholder="e.g. HDFC Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Masked Account</label>
                <Input
                  type="text"
                  placeholder="•••• •••• 4092"
                  value={bankAccountMask}
                  onChange={(e) => setBankAccountMask(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tax / PAN Identification</label>
              <Input
                type="text"
                placeholder="PAN (e.g. ABCDE1234F)"
                value={taxIdNumber}
                onChange={(e) => setTaxIdNumber(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
              >
                {submitting ? "Assigning..." : "Assign Package"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
