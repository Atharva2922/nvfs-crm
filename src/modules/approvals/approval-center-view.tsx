"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ArrowRight,
  Filter,
  User,
  Building,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

interface ApprovalItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  entityType: string;
  createdAt: string;
  metadata?: string | null;
  requestedBy: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
    avatarUrl?: string | null;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
  } | null;
}

interface ApprovalCenterViewProps {
  initialApprovals: ApprovalItem[];
}

export function ApprovalCenterView({ initialApprovals }: ApprovalCenterViewProps) {
  const { user, activeCompany, isExecutive, isManager, isDeptHead, role } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Request Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRequestType, setNewRequestType] = useState("LEAVE_REQUEST");
  const [newRequestTitle, setNewRequestTitle] = useState("");
  const [newRequestDesc, setNewRequestDesc] = useState("");

  const filtered = approvals.filter((a) => {
    if (activeTab === "ALL") return true;
    return a.status === activeTab;
  });

  const handleDecision = async (approvalId: string, decision: "APPROVED" | "REJECTED") => {
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/approvals/${approvalId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          comment: decisionComment || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || "Failed to submit approval decision");
        setIsSubmitting(false);
        return;
      }

      // Update state locally
      setApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? { ...a, status: decision } : a))
      );
      setSelectedApproval(null);
      setDecisionComment("");
    } catch {
      setActionError("Communication error while processing approval");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestTitle.trim()) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newRequestType,
          title: newRequestTitle,
          description: newRequestDesc || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        // Refetch or add to list
        const refreshedRes = await fetch("/api/approvals");
        if (refreshedRes.ok) {
          const refJson = await refreshedRes.json();
          if (refJson.data) setApprovals(refJson.data);
        }
        setIsCreateOpen(false);
        setNewRequestTitle("");
        setNewRequestDesc("");
      } else {
        setActionError(json.error?.message || "Failed to submit request");
      }
    } catch {
      setActionError("Error connecting to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryColor = activeCompany?.primaryColor || "#2563eb";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div
            className="inline-flex items-center gap-2 rounded-md px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Multi-Tier Approval Engine • {activeCompany?.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Enterprise Approval Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review and grant authorized sign-offs across budgets, technology purchases, leaves, and strategic initiatives.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="h-4 w-4" />
          <span>New Approval Request</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-colors",
              activeTab === tab
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            {tab === "ALL" ? "All Requests" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Approval List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const parsedMeta = item.metadata ? JSON.parse(item.metadata) : {};
            const isPending = item.status === "PENDING";
            const currentRole = parsedMeta.currentRequiredRole || "Approver";
            const stepNum = parsedMeta.currentStepIndex || 1;
            const totalSteps = parsedMeta.totalSteps || 1;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-4 shadow-sm hover:border-blue-400/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80 font-bold text-xs text-slate-700 dark:text-slate-200">
                    {item.requestedBy.firstName[0]}
                    {item.requestedBy.lastName[0]}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {item.title}
                      </span>
                      <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                        {item.entityType}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Requested by{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {item.requestedBy.firstName} {item.requestedBy.lastName}
                      </strong>{" "}
                      ({item.requestedBy.designation}) • {new Date(item.createdAt).toLocaleDateString()}
                    </p>

                    {/* Step Chain Indicator */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-medium">
                        Step {stepNum} of {totalSteps}: Awaiting {currentRole}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      item.status === "APPROVED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : item.status === "REJECTED"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    )}
                  >
                    {item.status}
                  </span>

                  {isPending && (
                    <button
                      onClick={() => {
                        setSelectedApproval(item);
                        setActionError(null);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 transition-colors"
                    >
                      <span>Take Action</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-slate-400 text-xs">
            No {activeTab.toLowerCase()} approval requests found for this company.
          </div>
        )}
      </div>

      {/* Action Modal (Approve / Reject) */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Approval Review
              </h3>
              <button
                onClick={() => setSelectedApproval(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {actionError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="text-slate-500">Request:</div>
              <div className="font-semibold text-sm">{selectedApproval.title}</div>
              <div className="text-slate-500 pt-1">Requester:</div>
              <div>
                {selectedApproval.requestedBy.firstName} {selectedApproval.requestedBy.lastName} (
                {selectedApproval.requestedBy.designation})
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Decision Notes / Comment (Optional)
              </label>
              <textarea
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder="Reasoning or notes for this sign-off..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedApproval(null)}
                className="rounded-lg px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDecision(selectedApproval.id, "REJECTED")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDecision(selectedApproval.id, "APPROVED")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Approve Step</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Initiate Approval Workflow
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {actionError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Workflow Type
                </label>
                <select
                  value={newRequestType}
                  onChange={(e) => setNewRequestType(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="LEAVE_REQUEST">Leave Request (Employee → Manager → HR)</option>
                  <option value="MARKETING_BUDGET">Marketing Budget (Manager → CMO → CFO)</option>
                  <option value="TECH_PURCHASE">Tech Purchase (CTO → CFO → CEO)</option>
                  <option value="LARGE_FINANCIAL">Large Financial Disbursement (CFO → CEO)</option>
                  <option value="SYSTEM_PERMISSION">System Permission (Employee → Manager → Admin)</option>
                  <option value="STRATEGIC_PROJECT">Strategic Project (Dept Head → Executive → CEO)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Request Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  value={newRequestTitle}
                  onChange={(e) => setNewRequestTitle(e.target.value)}
                  placeholder="e.g. Q4 Cloud Server Cluster Expansion"
                  className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Details & Justification
                </label>
                <textarea
                  value={newRequestDesc}
                  onChange={(e) => setNewRequestDesc(e.target.value)}
                  placeholder="Explain why this approval is required..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg px-3 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>Submit Workflow</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
