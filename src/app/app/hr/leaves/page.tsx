"use client";

import React, { useState, useEffect, useTransition } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { HrNav } from "@/modules/hr/components/hr-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  AlertTriangle,
  Info,
  Layers,
  Users,
  ShieldCheck,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { CeoLeaveManagementPanel } from "@/modules/hr/components/ceo-leave-management-panel";

interface LeaveBalance {
  id: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
  leavePolicy: {
    id: string;
    code: string;
    name: string;
    monthlyLimit: number | null;
    isPaid: boolean;
  };
}

interface LeaveRequestItem {
  id: string;
  leavePolicyId: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  rejectionReason?: string | null;
  approvalNotes?: string | null;
  createdAt: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    designation: string;
    department?: { name: string };
  };
  leavePolicy: {
    code: string;
    name: string;
    isPaid: boolean;
  };
  approvedBy?: {
    firstName: string;
    lastName: string;
  } | null;
}

export default function LeavesPage() {
  const { user: currentUser, role, roleLevel, isSuperAdmin, isExecutive } = useAuth();

  // Determine executive leadership (Super Admin, Admin, CEO, Chairperson)
  const isExecutiveLeadership =
    isSuperAdmin ||
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "CEO" ||
    role === "CHAIRPERSON";

  // Determine if current user has executive or HR leave governance privileges
  const isCeoOrHrOrAdmin =
    isExecutiveLeadership ||
    isExecutive ||
    role === "HR" ||
    (roleLevel ?? 0) >= 70;

  const [activeTab, setActiveTab] = useState<"my" | "team" | "policies" | "management">(
    isExecutiveLeadership ? "management" : "my"
  );

  useEffect(() => {
    if (isExecutiveLeadership) {
      setActiveTab("management");
    }
  }, [isExecutiveLeadership]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequestItem[]>([]);
  const [teamRequests, setTeamRequests] = useState<LeaveRequestItem[]>([]);
  const [allPolicies, setAllPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Apply Leave Modal state
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyCode, setApplyCode] = useState("CL");
  const [applyStart, setApplyStart] = useState("");
  const [applyEnd, setApplyEnd] = useState("");
  const [applyReason, setApplyReason] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySubmitting, setApplySubmitting] = useState(false);

  // Rejection Modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch My Leaves
      const myRes = await fetch("/api/hr/leaves?scope=my");
      const myData = await myRes.json();
      if (myData.success) {
        setBalances(myData.data.balances || []);
        setMyRequests(myData.data.requests || []);
      }

      // 2. Fetch Team Leaves
      const teamRes = await fetch("/api/hr/leaves?scope=team");
      const teamData = await teamRes.json();
      if (teamData.success) {
        setTeamRequests(teamData.data.requests || []);
      }

      // 3. Fetch Organization Leaves / Policies
      const allRes = await fetch("/api/hr/leaves?scope=all");
      const allData = await allRes.json();
      if (allData.success) {
        setAllPolicies(allData.data.policies || []);
      }
    } catch (err: any) {
      setErrorMsg("Failed to load leave records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Handle Apply Leave Submission
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);
    setApplySubmitting(true);

    try {
      const res = await fetch("/api/hr/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leavePolicyCode: applyCode,
          startDate: applyStart,
          endDate: applyEnd,
          reason: applyReason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setApplyError(json.error?.message || "Failed to submit leave request.");
        setApplySubmitting(false);
        return;
      }

      // Reset form and refresh
      setIsApplyOpen(false);
      setApplyReason("");
      setApplyStart("");
      setApplyEnd("");
      setApplySubmitting(false);
      await fetchLeaves();
    } catch (err: any) {
      setApplyError(err.message || "Network error submitting leave request.");
      setApplySubmitting(false);
    }
  };

  // Handle 1-click Approval
  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/hr/leaves/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Approved by manager via portal" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Failed to approve leave request");
        return;
      }
      await fetchLeaves();
    } catch (err: any) {
      alert("Error approving request: " + err.message);
    }
  };

  // Handle Rejection
  const handleRejectSubmit = async () => {
    if (!rejectingId) return;
    setRejectSubmitting(true);
    try {
      const res = await fetch(`/api/hr/leaves/${rejectingId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason || "Operational constraints" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Failed to reject leave request");
        setRejectSubmitting(false);
        return;
      }
      setRejectingId(null);
      setRejectionReason("");
      setRejectSubmitting(false);
      await fetchLeaves();
    } catch (err: any) {
      alert("Error rejecting request: " + err.message);
      setRejectSubmitting(false);
    }
  };

  // Handle Cancel Request
  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this leave request? Any deducted balances and scheduled leaves will be rolled back.")) {
      return;
    }
    try {
      const res = await fetch(`/api/hr/leaves/${id}/cancel`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Failed to cancel request");
        return;
      }
      await fetchLeaves();
    } catch (err: any) {
      alert("Error cancelling request: " + err.message);
    }
  };

  const getStatusBadge = (status: LeaveRequestItem["status"]) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success">Approved</Badge>;
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      case "CANCELLED":
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Leave Management"
        description="Statutory & custom leave policies, balance tracking, automated non-working day exclusions, and supervisor authorization workflows."
        actions={
          <div className="flex items-center gap-2">
            {isExecutiveLeadership ? (
              <Badge variant="warning" className="px-3 py-1.5 text-xs font-semibold gap-1.5 bg-amber-500/10 border-amber-500/30 text-amber-300">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                Executive Authority Mode
              </Badge>
            ) : (
              <Button
                onClick={() => {
                  setApplyError(null);
                  setIsApplyOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm text-xs"
              >
                <PlusCircle className="h-4 w-4" />
                Apply for Leave
              </Button>
            )}
          </div>
        }
      />

      <HrNav />

      {/* Navigation Subtabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-medium">
        {isExecutiveLeadership ? (
          <>
            <button
              onClick={() => setActiveTab("management")}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "management"
                  ? "border-blue-500 text-blue-400 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="h-4 w-4 text-amber-400" />
              Executive Leave Management
              <span className="ml-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-1.5 py-0.5">
                EXECUTIVE
              </span>
            </button>

            <button
              onClick={() => setActiveTab("team")}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "team"
                  ? "border-blue-500 text-blue-400 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="h-4 w-4" />
              Direct Approvals
              {teamRequests.filter((r) => r.status === "PENDING").length > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.2 text-[11px] font-mono border border-amber-500/30">
                  {teamRequests.filter((r) => r.status === "PENDING").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("policies")}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "policies"
                  ? "border-blue-500 text-blue-400 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="h-4 w-4" />
              Enterprise Policies
            </button>

            <button
              onClick={() => setActiveTab("my")}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "my"
                  ? "border-blue-500 text-blue-400 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Personal Records
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab("my")}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "my"
                  ? "border-blue-500 text-blue-400 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              My Leaves & Balances
            </button>

            <button
              onClick={() => setActiveTab("team")}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "team"
                  ? "border-blue-500 text-blue-400 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="h-4 w-4" />
              Team Approvals
              {teamRequests.filter((r) => r.status === "PENDING").length > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.2 text-[11px] font-mono border border-amber-500/30">
                  {teamRequests.filter((r) => r.status === "PENDING").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("policies")}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "policies"
                  ? "border-blue-500 text-blue-400 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="h-4 w-4" />
              Company Leave Policies
            </button>

            {isCeoOrHrOrAdmin && (
              <button
                onClick={() => setActiveTab("management")}
                className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "management"
                    ? "border-blue-500 text-blue-400 font-semibold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sliders className="h-4 w-4 text-amber-400" />
                HR Leave Management
                <span className="ml-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-1.5 py-0.5">
                  HR
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {/* TAB 1: MY LEAVES */}
      {activeTab === "my" && (
        <div className="space-y-6">
          {/* Balances Grid */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">2026 Leave Balances</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {balances.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 flex flex-col justify-between shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-1.5 py-0.5 rounded">
                        {b.leavePolicy.code}
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-1.5">{b.leavePolicy.name}</h4>
                      {b.leavePolicy.monthlyLimit && (
                        <p className="text-[11px] text-amber-400/90 mt-0.5 font-mono">
                          Max {b.leavePolicy.monthlyLimit} per calendar month
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">{b.remaining}</span>
                      <span className="text-xs text-slate-400 ml-1">left</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      Allocated: <span className="text-slate-200 font-mono">{b.allocated}d</span>
                    </div>
                    <div>
                      Used: <span className="text-slate-200 font-mono">{b.used}d</span>
                    </div>
                    {b.pending > 0 && (
                      <div className="text-amber-400 font-mono">
                        Pending: {b.pending}d
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Leave Requests Table */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Leave History & Applications</h3>
                <p className="text-xs text-slate-400 mt-0.5">Track your requests, manager decisions, and working day calculations.</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Duration</TableHead>
                  <TableHead className="text-slate-400">Working Days</TableHead>
                  <TableHead className="text-slate-400">Reason</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Decision Notes</TableHead>
                  <TableHead className="text-right text-slate-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      No leave requests submitted yet. Click "Apply for Leave" above.
                    </TableCell>
                  </TableRow>
                ) : (
                  myRequests.map((req) => (
                    <TableRow key={req.id} className="border-slate-800/70 hover:bg-slate-800/30">
                      <TableCell className="font-medium text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-blue-400">{req.leavePolicy.code}</span>
                          <span className="text-xs text-slate-400">({req.leavePolicy.name})</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">
                        {new Date(req.startDate).toLocaleDateString()} &rarr; {new Date(req.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-slate-200">
                        {req.daysCount} {req.daysCount === 1 ? "day" : "days"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 max-w-[200px] truncate" title={req.reason}>
                        {req.reason}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {req.status === "APPROVED" && req.approvedBy && (
                          <span className="text-emerald-400/90">
                            Approved by {req.approvedBy.firstName}
                          </span>
                        )}
                        {req.status === "REJECTED" && (
                          <span className="text-rose-400/90">
                            {req.rejectionReason || "Declined"}
                          </span>
                        )}
                        {req.status === "PENDING" && <span className="text-amber-400/80">Awaiting Manager</span>}
                        {req.status === "CANCELLED" && <span className="text-slate-500">Cancelled by employee</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {(req.status === "PENDING" || req.status === "APPROVED") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(req.id)}
                            className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM APPROVALS */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Direct Reports Leave Queue</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review subordinate requests. Approving automatically deducts balance and logs attendance as ON_LEAVE.
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Employee</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Dates Requested</TableHead>
                  <TableHead className="text-slate-400">Working Days</TableHead>
                  <TableHead className="text-slate-400">Reason</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-right text-slate-400">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      No team leave requests found for your supervisory scope.
                    </TableCell>
                  </TableRow>
                ) : (
                  teamRequests.map((req) => (
                    <TableRow key={req.id} className="border-slate-800/70 hover:bg-slate-800/30">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-200">
                            {req.employee?.firstName} {req.employee?.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {req.employee?.employeeNumber} • {req.employee?.department?.name || "General"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-blue-400">
                        {req.leavePolicy.code}
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">
                        {new Date(req.startDate).toLocaleDateString()} &rarr; {new Date(req.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-slate-200">
                        {req.daysCount}d
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 max-w-[180px] truncate" title={req.reason}>
                        {req.reason}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-right">
                        {req.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(req.id)}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setRejectingId(req.id);
                                setRejectionReason("");
                              }}
                              className="h-7 text-xs bg-rose-600 hover:bg-rose-500 text-white gap-1"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Processed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 3: COMPANY LEAVE POLICIES */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Configured Enterprise Leave Policies</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Leave policies are dynamic database configurations (not hardcoded). Rules define allowances, monthly quotas, and carry-forward.
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Code</TableHead>
                  <TableHead className="text-slate-400">Policy Name</TableHead>
                  <TableHead className="text-slate-400">Annual Allowance</TableHead>
                  <TableHead className="text-slate-400">Monthly Limit</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Carry Forward</TableHead>
                  <TableHead className="text-slate-400">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPolicies.map((p) => (
                  <TableRow key={p.id} className="border-slate-800/70 hover:bg-slate-800/30">
                    <TableCell className="font-mono text-xs font-bold text-blue-400">{p.code}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-200">{p.name}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-300">
                      {p.annualAllowance > 0 ? `${p.annualAllowance} days/yr` : "As Approved"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-300">
                      {p.monthlyLimit ? (
                        <span className="text-amber-400 font-semibold">Max {p.monthlyLimit}/month</span>
                      ) : (
                        "No Cap"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isPaid ? "success" : "default"}>
                        {p.isPaid ? "Paid Leave" : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {p.carryForwardMax ? `Up to ${p.carryForwardMax}d` : "None"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 max-w-[250px]">{p.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 4: CEO / HR EXECUTIVE MANAGEMENT */}
      {activeTab === "management" && isCeoOrHrOrAdmin && (
        <CeoLeaveManagementPanel onRefreshParent={fetchLeaves} />
      )}

      {/* APPLY LEAVE DIALOG */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[#0f172a] border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-400" />
              Apply for Leave
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              System will automatically deduct only business working days, excluding weekends and official company holidays.
            </DialogDescription>
          </DialogHeader>

          {applyError && (
            <div className="rounded-lg bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{applyError}</span>
            </div>
          )}

          <form onSubmit={handleApplyLeave} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Leave Policy</label>
              <select
                value={applyCode}
                onChange={(e) => setApplyCode(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
              >
                {allPolicies.length > 0 ? (
                  allPolicies.map((p) => {
                    const userBal = balances.find((b) => b.leavePolicy.code === p.code);
                    const balBadge = userBal !== undefined ? ` [${userBal.remaining}d remaining]` : "";
                    const monthlyText = p.monthlyLimit ? ` (Max ${p.monthlyLimit}/mo)` : "";
                    const allowanceText = p.annualAllowance > 0 ? `${p.annualAllowance}d/yr` : "Special";
                    return (
                      <option key={p.id || p.code} value={p.code}>
                        {p.code} — {p.name} ({allowanceText}{monthlyText}){balBadge}
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value="CL">CL — Casual Leave (12/yr, Max 2/month)</option>
                    <option value="EL">EL — Emergency Leave (2/yr)</option>
                    <option value="ML">ML — Medical Leave (2/yr)</option>
                    <option value="LWP">LWP — Leave Without Pay</option>
                    <option value="C_OFF">C-Off — Compensatory Off</option>
                    <option value="HDW">HDW — Half-Day Work (0.5d)</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
                <Input
                  type="date"
                  required
                  value={applyStart}
                  onChange={(e) => setApplyStart(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
                <Input
                  type="date"
                  required
                  value={applyEnd}
                  onChange={(e) => setApplyEnd(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reason for Leave</label>
              <textarea
                required
                rows={3}
                value={applyReason}
                onChange={(e) => setApplyReason(e.target.value)}
                placeholder="Please state the business rationale or emergency details..."
                className="w-full rounded-md border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsApplyOpen(false)}
                className="border-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={applySubmitting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1"
              >
                {applySubmitting ? "Validating & Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* REJECT LEAVE MODAL */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent className="sm:max-w-[420px] bg-[#0f172a] border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-400" />
              Reject Leave Request
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Provide a reason to the employee. The pending balance quota will be immediately restored.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="E.g., High sprint workload / Project milestone conflict..."
                className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectingId(null)}
              className="border-slate-700 text-slate-300 text-xs"
            >
              Back
            </Button>
            <Button
              size="sm"
              disabled={rejectSubmitting}
              onClick={handleRejectSubmit}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs"
            >
              {rejectSubmitting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
