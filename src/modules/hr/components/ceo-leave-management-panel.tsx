"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Minus,
  RotateCcw,
  Search,
  Sliders,
  Users,
  Calendar,
  AlertTriangle,
  HeartPulse,
  Flame,
  Coffee,
  Building2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface Policy {
  id: string;
  code: string;
  name: string;
  annualAllowance: number;
  monthlyLimit: number | null;
  description: string | null;
}

interface PendingRequest {
  id: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: string;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    designation: string;
    department?: { name: string };
  };
  leavePolicy: {
    code: string;
    name: string;
  };
}

interface EmployeeWithBalances {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  designation: string;
  department?: { name: string };
  leaveBalances: Array<{
    id: string;
    allocated: number;
    used: number;
    pending: number;
    remaining: number;
    leavePolicy: {
      id: string;
      code: string;
      name: string;
    };
  }>;
}

export function CeoLeaveManagementPanel({
  onRefreshParent,
}: {
  onRefreshParent?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithBalances[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Policy editing state
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [policyAllowanceDraft, setPolicyAllowanceDraft] = useState<number>(0);
  const [syncWithEmployees, setSyncWithEmployees] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Reject modal state
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Reset all balances state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resettingAll, setResettingAll] = useState(false);

  // Adjusting single employee balance
  const [adjustingBalanceId, setAdjustingBalanceId] = useState<string | null>(null);

  const fetchManagementData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/hr/leaves/management");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load leave management data");
      }

      setPolicies(json.data.policies || []);
      setPendingRequests(json.data.pendingRequests || []);
      setEmployees(json.data.employeesWithBalances || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagementData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // 1. Approve Leave Request
  const handleApprove = async (requestId: string) => {
    try {
      const res = await fetch(`/api/hr/leaves/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Approved by executive management" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to approve request");
      }

      showNotification("Leave request approved successfully!");
      await fetchManagementData();
      onRefreshParent?.();
    } catch (err: any) {
      alert("Approval error: " + err.message);
    }
  };

  // 2. Reject Leave Request
  const handleReject = async () => {
    if (!rejectingRequestId) return;
    setRejectSubmitting(true);
    try {
      const res = await fetch(`/api/hr/leaves/${rejectingRequestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason || "Declined by management" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to reject request");
      }

      setRejectingRequestId(null);
      setRejectReason("");
      showNotification("Leave request rejected and balance restored.");
      await fetchManagementData();
      onRefreshParent?.();
    } catch (err: any) {
      alert("Rejection error: " + err.message);
    } finally {
      setRejectSubmitting(false);
    }
  };

  // 3. Save Policy Allowance (CEO / HR Panel)
  const handleSavePolicy = async (policy: Policy, allowance: number) => {
    setSavingPolicy(true);
    try {
      const res = await fetch("/api/hr/leaves/management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_POLICY",
          policyId: policy.id,
          annualAllowance: allowance,
          syncEmployeeBalances: syncWithEmployees,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update policy");
      }

      setEditingPolicyId(null);
      showNotification(`Updated ${policy.name} allowance to ${allowance} days!`);
      await fetchManagementData();
      onRefreshParent?.();
    } catch (err: any) {
      alert("Policy update error: " + err.message);
    } finally {
      setSavingPolicy(false);
    }
  };

  // 4. Adjust Individual Employee Balance (+1 or -1)
  const handleAdjustBalance = async (balanceId: string, adjustment: number) => {
    setAdjustingBalanceId(balanceId);
    try {
      const res = await fetch("/api/hr/leaves/management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADJUST_BALANCE",
          balanceId,
          adjustment,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to adjust balance");
      }

      showNotification(`Adjusted balance (${adjustment > 0 ? `+${adjustment}` : adjustment}d)!`);
      await fetchManagementData();
      onRefreshParent?.();
    } catch (err: any) {
      alert("Adjustment error: " + err.message);
    } finally {
      setAdjustingBalanceId(null);
    }
  };

  // 5. Reset All Employee Balances to Defaults
  const handleResetAll = async () => {
    setResettingAll(true);
    try {
      const res = await fetch("/api/hr/leaves/management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_ALL_BALANCES",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to reset balances");
      }

      setIsResetConfirmOpen(false);
      showNotification(`Successfully reset all 2026 employee leave balances to policy defaults!`);
      await fetchManagementData();
      onRefreshParent?.();
    } catch (err: any) {
      alert("Reset error: " + err.message);
    } finally {
      setResettingAll(false);
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const q = searchQuery.toLowerCase();
    const name = `${e.firstName} ${e.lastName}`.toLowerCase();
    const num = (e.employeeNumber || "").toLowerCase();
    const dept = (e.department?.name || "").toLowerCase();
    return name.includes(q) || num.includes(q) || dept.includes(q);
  });

  const getPolicyIcon = (code: string) => {
    switch (code) {
      case "ML":
        return <HeartPulse className="h-4 w-4 text-rose-400" />;
      case "EL":
        return <Flame className="h-4 w-4 text-amber-400" />;
      case "CL":
        return <Coffee className="h-4 w-4 text-blue-400" />;
      default:
        return <Calendar className="h-4 w-4 text-indigo-400" />;
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Loading CEO / HR Leave Management Panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-emerald-950/90 border border-emerald-500/40 p-4 text-xs font-semibold text-emerald-200 shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Approvals */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#1a140a] via-[#141008] to-[#0c0d16] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {pendingRequests.length}
            </span>
            <span className="text-xs text-amber-400/80">applications awaiting decision</span>
          </div>
        </div>

        {/* Card 2: Configured Policies */}
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-[#0c1428] via-[#091022] to-[#0c0d16] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Leave Types
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <Sliders className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{policies.length}</span>
            <span className="text-xs text-blue-400/80">active enterprise policies</span>
          </div>
        </div>

        {/* Card 3: Employees Managed */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0a1e16] via-[#081812] to-[#0c0d16] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Employees Monitored
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{employees.length}</span>
            <span className="text-xs text-emerald-400/80">active personnel in 2026</span>
          </div>
        </div>

        {/* Card 4: Quick Reset Action */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d1424] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Annual Quota Actions
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Reset all active employees to the configured policy allowance for 2026.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsResetConfirmOpen(true)}
            variant="outline"
            className="mt-3 border-blue-500/40 text-blue-400 hover:bg-blue-950/40 hover:text-blue-300 text-xs gap-1.5 w-full"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Balances
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PENDING EMPLOYEE LEAVE APPLICATIONS                            */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1322] p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Pending Employee Leave Applications</span>
              {pendingRequests.length > 0 && (
                <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-xs font-mono border border-amber-500/30">
                  {pendingRequests.length} Requires Action
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and immediately approve or decline pending leave requests from each employee.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchManagementData}
            className="text-xs text-slate-400 hover:text-white gap-1 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-8 text-center space-y-2 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
            <CheckCircle2 className="h-8 w-8 text-emerald-400/60 mx-auto" />
            <p className="text-xs font-medium text-slate-300">
              All employee leave applications are currently processed.
            </p>
            <p className="text-[11px] text-slate-500">
              New submissions will appear here automatically for executive or HR authorization.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <Table>
              <TableHeader className="bg-slate-900/80">
                <TableRow className="border-slate-800">
                  <TableHead className="text-xs text-slate-300">Employee</TableHead>
                  <TableHead className="text-xs text-slate-300">Leave Type</TableHead>
                  <TableHead className="text-xs text-slate-300">Dates Requested</TableHead>
                  <TableHead className="text-xs text-slate-300">Working Days</TableHead>
                  <TableHead className="text-xs text-slate-300">Reason</TableHead>
                  <TableHead className="text-xs text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((req) => (
                  <TableRow key={req.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                    <TableCell className="font-medium text-white text-xs">
                      <div>
                        <div className="font-semibold text-slate-100">
                          {req.employee.firstName} {req.employee.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {req.employee.employeeNumber} • {req.employee.designation}
                        </div>
                        <div className="text-[10px] text-blue-400">
                          {req.employee.department?.name || "General"}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getPolicyIcon(req.leavePolicy.code)}
                        <span className="text-xs font-semibold text-slate-200">
                          {req.leavePolicy.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({req.leavePolicy.code})
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-slate-300 font-mono">
                      {new Date(req.startDate).toLocaleDateString()} →{" "}
                      {new Date(req.endDate).toLocaleDateString()}
                    </TableCell>

                    <TableCell>
                      <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400 font-mono">
                        {req.daysCount} {req.daysCount === 1 ? "day" : "days"}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-slate-300 max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req.id)}
                          className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectingRequestId(req.id);
                            setRejectReason("");
                          }}
                          className="h-7 px-2.5 border-rose-500/40 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: LEAVE POLICY LIMITS CONFIGURATION (CEO / HR PANEL)             */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1322] p-5 space-y-4 shadow-xl">
        <div className="border-b border-slate-800/80 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-400" />
              <span>Leave Policy Limits & Allowances (CEO / HR Panel)</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Real-time DB Sync
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Set and dynamically adjust the annual default days for each leave type (e.g. Medical Leave: 2, Emergency Leave: 2).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((p) => {
            const isEditing = editingPolicyId === p.id;
            const currentDays = isEditing ? policyAllowanceDraft : p.annualAllowance;

            return (
              <div
                key={p.id}
                className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700">
                        {getPolicyIcon(p.code)}
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-blue-400">
                          {p.code}
                        </span>
                        <h4 className="text-sm font-bold text-white">{p.name}</h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {p.description || "Enterprise standard leave policy."}
                  </p>
                  {p.monthlyLimit && (
                    <div className="mt-1 text-[11px] font-mono text-amber-400">
                      Monthly Limit: Max {p.monthlyLimit} days/mo
                    </div>
                  )}
                </div>

                {/* Allowance Controls */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Annual Allowance:</span>
                    <div className="flex items-center gap-1.5">
                      {/* Decrease button */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = Math.max(0, currentDays - 1);
                          if (!isEditing) {
                            setEditingPolicyId(p.id);
                            setPolicyAllowanceDraft(nextVal);
                          } else {
                            setPolicyAllowanceDraft(nextVal);
                          }
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        title="Decrease annual days"
                      >
                        <Minus className="h-3 w-3" />
                      </button>

                      {/* Display value / input */}
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          max={365}
                          value={policyAllowanceDraft}
                          onChange={(e) => setPolicyAllowanceDraft(Math.max(0, parseInt(e.target.value) || 0))}
                          className="h-7 w-12 rounded-lg border border-blue-500 bg-slate-900 text-center font-mono text-sm font-bold text-white focus:outline-none"
                        />
                      ) : (
                        <span className="min-w-[32px] text-center font-mono text-base font-bold text-white">
                          {p.annualAllowance}
                        </span>
                      )}

                      {/* Increase button */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = currentDays + 1;
                          if (!isEditing) {
                            setEditingPolicyId(p.id);
                            setPolicyAllowanceDraft(nextVal);
                          } else {
                            setPolicyAllowanceDraft(nextVal);
                          }
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        title="Increase annual days"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="text-xs text-slate-400">days/yr</span>
                    </div>
                  </div>

                  {/* Save button when edited */}
                  {isEditing && (
                    <div className="mt-3 pt-2 border-t border-slate-800 space-y-2">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={syncWithEmployees}
                          onChange={(e) => setSyncWithEmployees(e.target.checked)}
                          className="h-3 w-3 rounded border-slate-700 bg-slate-900 text-blue-600"
                        />
                        <span>Sync with active employee balances</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={savingPolicy}
                          onClick={() => handleSavePolicy(p, policyAllowanceDraft)}
                          className="h-7 flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                        >
                          {savingPolicy ? "Saving..." : "Save Policy"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPolicyId(null)}
                          className="h-7 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: EMPLOYEE LEAVE QUOTAS & INDIVIDUAL ADJUSTMENTS                 */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1322] p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span>Employee Leave Quotas & Individual Adjustments</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Directly view, increase (+), or decrease (-) each employee&apos;s allocated and remaining leave days.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee or dept..."
              className="pl-8 bg-slate-900 border-slate-700 text-xs h-9 text-slate-200 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <Table>
            <TableHeader className="bg-slate-900/80">
              <TableRow className="border-slate-800">
                <TableHead className="text-xs text-slate-300">Employee</TableHead>
                <TableHead className="text-xs text-slate-300">Department</TableHead>
                <TableHead className="text-xs text-slate-300">Medical Leave (ML)</TableHead>
                <TableHead className="text-xs text-slate-300">Emergency Leave (EL)</TableHead>
                <TableHead className="text-xs text-slate-300">Casual Leave (CL)</TableHead>
                <TableHead className="text-xs text-slate-300">Other Quotas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-slate-400">
                    No matching employees found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => {
                  const mlBalance = emp.leaveBalances.find((b) => b.leavePolicy.code === "ML");
                  const elBalance = emp.leaveBalances.find((b) => b.leavePolicy.code === "EL");
                  const clBalance = emp.leaveBalances.find((b) => b.leavePolicy.code === "CL");
                  const otherBalances = emp.leaveBalances.filter(
                    (b) => !["ML", "EL", "CL"].includes(b.leavePolicy.code)
                  );

                  const renderBalanceCell = (balance: typeof mlBalance) => {
                    if (!balance) {
                      return <span className="text-xs text-slate-500 font-mono">—</span>;
                    }

                    const isAdjusting = adjustingBalanceId === balance.id;

                    return (
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-mono text-xs font-bold text-white">
                            {balance.remaining}d{" "}
                            <span className="text-[10px] text-slate-400 font-normal">
                              / {balance.allocated}d
                            </span>
                          </div>
                          {balance.pending > 0 && (
                            <div className="text-[10px] text-amber-400 font-mono">
                              {balance.pending}d pending
                            </div>
                          )}
                        </div>

                        {/* Inline Steppers */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isAdjusting || balance.remaining <= 0}
                            onClick={() => handleAdjustBalance(balance.id, -1)}
                            className="flex h-5 w-5 items-center justify-center rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 transition-colors"
                            title="Deduct 1 day"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isAdjusting}
                            onClick={() => handleAdjustBalance(balance.id, 1)}
                            className="flex h-5 w-5 items-center justify-center rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 transition-colors"
                            title="Add 1 day"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <TableRow key={emp.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="font-medium text-white text-xs">
                        <div className="font-semibold text-slate-100">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {emp.employeeNumber} • {emp.designation}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-blue-400">
                        {emp.department?.name || "General"}
                      </TableCell>

                      <TableCell>{renderBalanceCell(mlBalance)}</TableCell>
                      <TableCell>{renderBalanceCell(elBalance)}</TableCell>
                      <TableCell>{renderBalanceCell(clBalance)}</TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {otherBalances.map((b) => (
                            <span
                              key={b.id}
                              className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700"
                              title={`${b.leavePolicy.name}: ${b.remaining} remaining`}
                            >
                              {b.leavePolicy.code}: {b.remaining}d
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* REJECT LEAVE MODAL */}
      <Dialog open={!!rejectingRequestId} onOpenChange={(open) => !open && setRejectingRequestId(null)}>
        <DialogContent className="sm:max-w-[420px] bg-[#0f172a] border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-400" />
              Reject Employee Leave Request
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Provide a rationale. The pending leave quota will be automatically restored to the employee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reason for Rejection</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g., Critical sprint deliverable / Team coverage conflict..."
                className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectingRequestId(null)}
              className="border-slate-700 text-slate-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={rejectSubmitting}
              onClick={handleReject}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs"
            >
              {rejectSubmitting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESET ALL BALANCES CONFIRMATION DIALOG */}
      <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <DialogContent className="sm:max-w-[450px] bg-[#0f172a] border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-400" />
              Reset All Employee Leave Balances for 2026?
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              This will re-initialize all active employees in this company to the current policy allowances:
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1.5 text-xs font-mono">
            {policies.map((p) => (
              <div key={p.id} className="flex justify-between text-slate-300">
                <span>{p.name} ({p.code}):</span>
                <span className="text-blue-400 font-bold">{p.annualAllowance} days</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-amber-300/80">
            Note: Any previously used days will be cleared back to 0 so all employees receive their full allowance.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetConfirmOpen(false)}
              className="border-slate-700 text-slate-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={resettingAll}
              onClick={handleResetAll}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold gap-1.5"
            >
              {resettingAll ? "Resetting..." : "Confirm & Reset All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
