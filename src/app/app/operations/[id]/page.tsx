"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Layers,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  Users,
  Package,
  Truck,
  AlertTriangle,
  FileText,
  History,
  ShieldCheck,
  Plus,
  Play,
  Pause,
  XCircle,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  AlertOctagon,
  Check,
  X,
  Send,
  MessageSquare,
  FileSpreadsheet,
} from "lucide-react";

export default function OperationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [operation, setOperation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "team" | "inventory" | "vendors" | "timeline" | "issues" | "documents" | "financial" | "approvals"
  >("overview");

  // State Transition & Confirmation modal
  const [transitioning, setTransitioning] = useState(false);
  const [readinessWarnings, setReadinessWarnings] = useState<string[]>([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState("");

  // Sub-Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [selectedInvItem, setSelectedInvItem] = useState<any | null>(null);
  const [usedQtyInput, setUsedQtyInput] = useState(0);
  const [invStatusInput, setInvStatusInput] = useState("CONSUMED");

  // Edit Operation Form State
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [editRiskLevel, setEditRiskLevel] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("LOW");
  const [editRiskDesc, setEditRiskDesc] = useState("");
  const [editMitigation, setEditMitigation] = useState("");
  const [editBudget, setEditBudget] = useState(0);
  const [editEstCost, setEditEstCost] = useState(0);
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editOwnerId, setEditOwnerId] = useState("");
  const [editDeptId, setEditDeptId] = useState("");

  // Form Submissions
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskHours, setNewTaskHours] = useState(8);
  const [newTaskDependency, setNewTaskDependency] = useState("");

  const [newTeamEmployeeId, setNewTeamEmployeeId] = useState("");
  const [newTeamRole, setNewTeamRole] = useState("ENGINEER");
  const [newTeamHours, setNewTeamHours] = useState(40);

  const [newInvProductId, setNewInvProductId] = useState("");
  const [newInvQty, setNewInvQty] = useState(1);

  const [newVendorId, setNewVendorId] = useState("");
  const [newVendorRole, setNewVendorRole] = useState("SUPPLIER");
  const [newVendorEstCost, setNewVendorEstCost] = useState(1000);

  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueDesc, setNewIssueDesc] = useState("");
  const [newIssueSeverity, setNewIssueSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");

  const [newDocName, setNewDocName] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("SPECIFICATION");

  const [newApprovalTitle, setNewApprovalTitle] = useState("");
  const [newApprovalDesc, setNewApprovalDesc] = useState("");

  // Reference lists
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchOperation();
    fetchReferenceData();
  }, [id]);

  const fetchOperation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/operations/${id}`);
      const json = await res.json();
      if (json.success) {
        setOperation(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [empRes, prodRes, venRes] = await Promise.all([
        fetch("/api/employees?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
        fetch("/api/inventory/products?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
        fetch("/api/inventory/vendors?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
      ]);
      const emps = empRes.data?.items || [];
      setEmployees(emps);
      if (emps.length > 0) {
        setNewTaskAssignee(emps[0].id);
        setNewTeamEmployeeId(emps[0].id);
      }

      const prods = prodRes.data?.items || [];
      setProducts(prods);
      if (prods.length > 0) setNewInvProductId(prods[0].id);

      const vens = venRes.data?.items || [];
      setVendors(vens);
      if (vens.length > 0) setNewVendorId(vens[0].id);
    } catch {}
  };

  const initiateTransition = async (status: string) => {
    setTargetStatus(status);
    if (status === "COMPLETED") {
      const checkRes = await fetch(`/api/operations/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", force: false }),
      });
      const checkJson = await checkRes.json();
      if (checkJson.data?.requiresConfirmation) {
        setReadinessWarnings(checkJson.data.warnings || []);
        setConfirmModalOpen(true);
        return;
      }
    }
    executeTransition(status, true);
  };

  const executeTransition = async (status: string, force: boolean = true) => {
    setTransitioning(true);
    try {
      const res = await fetch(`/api/operations/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, force }),
      });
      const json = await res.json();
      if (json.success) {
        setConfirmModalOpen(false);
        fetchOperation();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransitioning(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/operations/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          assigneeId: newTaskAssignee || undefined,
          priority: newTaskPriority,
          dueDate: newTaskDue || undefined,
          estimatedHours: Number(newTaskHours) || undefined,
          dependencyId: newTaskDependency || undefined,
        }),
      });
      setTaskModalOpen(false);
      setNewTaskTitle("");
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/operations/${id}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: newTeamEmployeeId,
          role: newTeamRole,
          assignedHours: Number(newTeamHours) || 0,
        }),
      });
      setTeamModalOpen(false);
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/operations/${id}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: newInvProductId,
          requiredQuantity: Number(newInvQty) || 1,
        }),
      });
      setInventoryModalOpen(false);
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLinkVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/operations/${id}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: newVendorId,
          role: newVendorRole,
          estimatedCost: Number(newVendorEstCost) || 0,
        }),
      });
      setVendorModalOpen(false);
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/operations/${id}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newIssueTitle,
          description: newIssueDesc,
          severity: newIssueSeverity,
        }),
      });
      setIssueModalOpen(false);
      setNewIssueTitle("");
      setNewIssueDesc("");
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/operations/${id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDocName,
          fileUrl: newDocUrl || "https://nfvs.internal/docs/spec.pdf",
          category: newDocCategory,
        }),
      });
      setDocModalOpen(false);
      setNewDocName("");
      setNewDocUrl("");
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/operations/${id}/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newApprovalTitle,
          description: newApprovalDesc,
          entityType: "OPERATION",
        }),
      });
      setApprovalModalOpen(false);
      setNewApprovalTitle("");
      setNewApprovalDesc("");
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecideApproval = async (approvalId: string, decision: "APPROVED" | "REJECTED") => {
    try {
      await fetch(`/api/approvals/${approvalId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditModal = () => {
    if (!operation) return;
    setEditName(operation.name || "");
    setEditDesc(operation.description || "");
    setEditPriority(operation.priority || "MEDIUM");
    setEditRiskLevel(operation.riskLevel || "LOW");
    setEditRiskDesc(operation.riskDescription || "");
    setEditMitigation(operation.mitigationPlan || "");
    setEditBudget(operation.approvedBudget || 0);
    setEditEstCost(operation.estimatedCost || 0);
    setEditTargetDate(operation.expectedCompletionDate ? operation.expectedCompletionDate.slice(0, 10) : "");
    setEditOwnerId(operation.ownerId || "");
    setEditDeptId(operation.departmentId || "");
    setEditModalOpen(true);
  };

  const handleUpdateOperationDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/operations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          priority: editPriority,
          riskLevel: editRiskLevel,
          riskDescription: editRiskDesc,
          mitigationPlan: editMitigation,
          approvedBudget: Number(editBudget),
          estimatedCost: Number(editEstCost),
          expectedCompletionDate: editTargetDate,
          ownerId: editOwnerId || undefined,
          departmentId: editDeptId || undefined,
        }),
      });
      setEditModalOpen(false);
      fetchOperation();
    } catch (err) {
      console.error("Update operation error:", err);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    let nextStatus = "IN_PROGRESS";
    if (currentStatus === "TODO") nextStatus = "IN_PROGRESS";
    else if (currentStatus === "IN_PROGRESS") nextStatus = "COMPLETED";
    else if (currentStatus === "COMPLETED") nextStatus = "TODO";
    
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTeam = async (employeeId: string) => {
    if (!confirm("Are you sure you want to remove this employee from the operation roster?")) return;
    try {
      await fetch(`/api/operations/${id}/team?employeeId=${employeeId}`, { method: "DELETE" });
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenUsageModal = (item: any) => {
    setSelectedInvItem(item);
    setUsedQtyInput(item.usedQuantity || 0);
    setInvStatusInput(item.status || "CONSUMED");
    setUsageModalOpen(true);
  };

  const handleRecordInventoryUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvItem) return;
    try {
      await fetch(`/api/operations/${id}/inventory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedInvItem.id,
          usedQuantity: Number(usedQtyInput),
          status: invStatusInput,
        }),
      });
      setUsageModalOpen(false);
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveInventory = async (itemId: string) => {
    if (!confirm("Remove this inventory requirement?")) return;
    try {
      await fetch(`/api/operations/${id}/inventory?itemId=${itemId}`, { method: "DELETE" });
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlinkVendor = async (vendorRecordId: string) => {
    if (!confirm("Unlink this vendor from the operation?")) return;
    try {
      await fetch(`/api/operations/${id}/vendors?vendorRecordId=${vendorRecordId}`, { method: "DELETE" });
      fetchOperation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOperation = async () => {
    if (!confirm("Are you sure you want to Cancel / Archive this operation?")) return;
    await initiateTransition("CANCELLED");
  };

  if (loading || !operation) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Layers className="h-8 w-8 mx-auto mb-2 animate-pulse text-blue-500" />
        Loading operation workspace...
      </div>
    );
  }

  const isPastDue =
    new Date(operation.expectedCompletionDate) < new Date() &&
    !["COMPLETED", "CANCELLED"].includes(operation.status);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app/operations"
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-blue-400">{operation.operationCode}</span>
              <span className="text-slate-600">•</span>
              <h1 className="text-lg font-bold text-white tracking-tight">{operation.name}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {operation.department?.name} Department • Led by {operation.owner?.firstName}{" "}
              {operation.owner?.lastName}
            </p>
          </div>
        </div>

        {/* Action Controls & Status Flow */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenEditModal}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
          >
            Edit Parameters
          </button>

          {operation.status === "PLANNING" && (
            <button
              onClick={() => initiateTransition("IN_PROGRESS")}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              <Play className="h-3.5 w-3.5" /> Start Execution
            </button>
          )}

          {operation.status === "IN_PROGRESS" && (
            <>
              <button
                onClick={() => initiateTransition("QUALITY_REVIEW")}
                className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Submit for Review
              </button>
              <button
                onClick={() => initiateTransition("ON_HOLD")}
                className="flex items-center gap-1.5 rounded-lg border border-amber-800/80 bg-amber-950/40 hover:bg-amber-900/60 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors"
              >
                <Pause className="h-3.5 w-3.5" /> Hold
              </button>
            </>
          )}

          {operation.status === "QUALITY_REVIEW" && (
            <button
              onClick={() => initiateTransition("COMPLETED")}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              <Check className="h-3.5 w-3.5" /> Finalize & Complete
            </button>
          )}

          {operation.status === "ON_HOLD" && (
            <button
              onClick={() => initiateTransition("IN_PROGRESS")}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              <Play className="h-3.5 w-3.5" /> Resume Operation
            </button>
          )}

          {operation.status !== "COMPLETED" && operation.status !== "CANCELLED" && (
            <button
              onClick={handleCancelOperation}
              className="flex items-center gap-1 rounded-lg border border-rose-900/60 bg-rose-950/20 hover:bg-rose-900/40 px-2.5 py-1.5 text-xs font-medium text-rose-300 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </button>
          )}

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200">
              {operation.status.replace(/_/g, " ")}
            </span>
            <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs font-medium text-blue-400 font-mono">
              {operation.priority}
            </span>
            <span className="rounded border border-amber-900/60 bg-amber-950/40 px-2 py-1 text-[11px] font-semibold text-amber-300">
              Risk: {operation.riskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* 10 Workspaces Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-1 text-xs font-medium scrollbar-none">
        {[
          { id: "overview", label: "Overview & Scope", icon: Layers },
          { id: "tasks", label: `Tasks (${operation.tasks?.length || 0})`, icon: CheckCircle2 },
          { id: "team", label: `Team (${operation.teamMembers?.length || 0})`, icon: Users },
          { id: "inventory", label: `Inventory (${operation.inventoryItems?.length || 0})`, icon: Package },
          { id: "vendors", label: `Vendors (${operation.vendors?.length || 0})`, icon: Truck },
          { id: "timeline", label: "Timeline & Activity", icon: History },
          { id: "issues", label: `Issues (${operation.issues?.length || 0})`, icon: AlertTriangle },
          { id: "documents", label: `Documents (${operation.documents?.length || 0})`, icon: FileText },
          { id: "financial", label: "Financials & Budget", icon: IndianRupee },
          { id: "approvals", label: `Approvals (${operation.approvals?.length || 0})`, icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition-all whitespace-nowrap ${
                isActive
                  ? "bg-slate-800/90 text-white border-b-2 border-blue-500 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description & Mission Scope</h3>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {operation.description || "No operational description provided."}
              </p>
            </div>

            {/* Progress & Target Milestone */}
            <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Execution Progress</h3>
                <span className="text-sm font-bold text-blue-400 font-mono">{operation.progress}%</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${operation.progress}%` }} />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 text-center text-xs">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Start Date</span>
                  <span className="font-semibold text-slate-200">{new Date(operation.startDate).toLocaleDateString()}</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Target Date</span>
                  <span className={`font-semibold ${isPastDue ? "text-rose-400" : "text-slate-200"}`}>
                    {new Date(operation.expectedCompletionDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Actual Completed</span>
                  <span className="font-semibold text-emerald-400">
                    {operation.actualCompletionDate ? new Date(operation.actualCompletionDate).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Governance */}
            <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Assessment & Mitigation</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Threat Severity:</span>
                <span className="rounded border border-amber-900/60 bg-amber-950/40 px-2 py-0.5 text-xs font-bold text-amber-300">
                  {operation.riskLevel}
                </span>
              </div>
              {operation.riskDescription && (
                <div className="text-xs text-slate-300">
                  <strong className="text-slate-400">Vulnerability: </strong>
                  {operation.riskDescription}
                </div>
              )}
              {operation.mitigationPlan && (
                <div className="text-xs text-slate-300">
                  <strong className="text-slate-400">Mitigation: </strong>
                  {operation.mitigationPlan}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Meta Info */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stakeholder Attributes</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Owner / Lead</span>
                  <span className="text-white font-medium">
                    {operation.owner?.firstName} {operation.owner?.lastName} ({operation.owner?.designation})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Client Account</span>
                  <span className="text-white font-medium">{operation.client?.name || "Internal Initiative"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Project Reference</span>
                  <span className="text-white font-medium">{operation.projectName || "General Operations"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Related Deal (CRM)</span>
                  <span className="text-white font-medium">{operation.opportunity?.name || "None"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Department</span>
                  <span className="text-white font-medium">{operation.department?.name}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Budget Telemetry</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Approved Budget:</span>
                  <span className="font-mono text-slate-200">${operation.approvedBudget?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Cost:</span>
                  <span className="font-mono text-slate-200">${operation.estimatedCost?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Actual Spend:</span>
                  <span className="font-mono text-emerald-400">${operation.actualCost?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TASKS TAB */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Operational Sub-Tasks & Milestones ({operation.tasks?.length || 0})
            </h3>
            <button
              onClick={() => setTaskModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Task
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0c121e] overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Task Title</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dependency</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Quick Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {operation.tasks?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No tasks scheduled for this operation.
                    </td>
                  </tr>
                ) : (
                  operation.tasks.map((task: any) => (
                    <tr key={task.id} className="hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-medium text-white">{task.title}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : "Unassigned"}
                      </td>
                      <td className="px-4 py-3 font-medium text-[11px] text-blue-400">{task.priority}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${
                            task.status === "COMPLETED"
                              ? "border-emerald-800 bg-emerald-950/60 text-emerald-300"
                              : task.status === "IN_PROGRESS"
                              ? "border-blue-800 bg-blue-950/60 text-blue-300"
                              : "border-slate-700 bg-slate-800 text-slate-300"
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-purple-400">
                        {task.dependsOn ? `Depends on: ${task.dependsOn.title}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleTaskStatus(task.id, task.status)}
                          className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] text-slate-200"
                        >
                          {task.status === "COMPLETED" ? "Re-open" : task.status === "IN_PROGRESS" ? "Complete" : "Start"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TEAM TAB */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Staffing & Dedicated Personnel ({operation.teamMembers?.length || 0})
            </h3>
            <button
              onClick={() => setTeamModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Staff Team Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operation.teamMembers?.map((m: any) => (
              <div key={m.id} className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white text-xs">
                    {m.employee?.firstName} {m.employee?.lastName}
                  </div>
                  <div className="text-[11px] text-slate-400">{m.employee?.designation}</div>
                  <div className="text-[10px] text-blue-400 mt-1">Role: {m.role}</div>
                </div>
                <div className="text-right text-xs space-y-1">
                  <div className="font-mono text-slate-300">{m.assignedHours} hrs</div>
                  <button
                    onClick={() => handleRemoveTeam(m.employeeId)}
                    className="text-[10px] text-slate-500 hover:text-rose-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Required Inventory Items & Material Allocation
            </h3>
            <button
              onClick={() => setInventoryModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Allocate Inventory
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0c121e] overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Required</th>
                  <th className="px-4 py-3">Allocated</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {operation.inventoryItems?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No inventory required for this operation.
                    </td>
                  </tr>
                ) : (
                  operation.inventoryItems.map((item: any) => {
                    const remaining = Math.max(0, item.requiredQuantity - (item.usedQuantity || 0));
                    return (
                      <tr key={item.id} className="hover:bg-slate-900/50">
                        <td className="px-4 py-3 font-medium text-white">{item.product?.name}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{item.product?.sku}</td>
                        <td className="px-4 py-3 font-mono">{item.requiredQuantity}</td>
                        <td className="px-4 py-3 font-mono text-cyan-400">{item.allocatedQuantity}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400">{item.usedQuantity}</td>
                        <td className="px-4 py-3 font-mono text-amber-300">{remaining}</td>
                        <td className="px-4 py-3">
                          <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px]">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenUsageModal(item)}
                            className="rounded bg-blue-600 hover:bg-blue-500 px-2 py-1 text-[10px] text-white"
                          >
                            Update Usage
                          </button>
                          <button
                            onClick={() => handleRemoveInventory(item.id)}
                            className="rounded border border-slate-700 hover:bg-slate-800 px-2 py-1 text-[10px] text-slate-400 hover:text-rose-400"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. VENDORS TAB */}
      {activeTab === "vendors" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Contracted Vendors & Subcontractors
            </h3>
            <button
              onClick={() => setVendorModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Associate Vendor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {operation.vendors?.map((v: any) => (
              <div key={v.id} className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-white text-xs">{v.vendor?.displayName}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{v.vendor?.vendorCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      {v.role}
                    </span>
                    <button
                      onClick={() => handleUnlinkVendor(v.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs"
                      title="Unlink Vendor"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Estimated Cost:</span>
                  <span className="font-mono text-white">${v.estimatedCost?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TIMELINE TAB */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chronological Audit & Action History</h3>
          <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-4">
            {operation.activities?.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">No historical activity recorded yet.</div>
            ) : (
              operation.activities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="mt-1 flex h-2 w-2 rounded-full bg-blue-400" />
                  <div className="flex-1">
                    <span className="text-white font-medium">{act.description}</span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(act.createdAt).toLocaleString()} • {act.type}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. ISSUES TAB */}
      {activeTab === "issues" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Operational Incidents & Defect Tickets
            </h3>
            <button
              onClick={() => setIssueModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Log Incident
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0c121e] overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Code / Title</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reported By</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Date Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {operation.issues?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No operational issues reported.
                    </td>
                  </tr>
                ) : (
                  operation.issues.map((issue: any) => (
                    <tr key={issue.id} className="hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-medium text-white">
                        <span className="font-mono text-blue-400 text-[11px] block">{issue.issueCode}</span>
                        {issue.title}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                            issue.severity === "CRITICAL"
                              ? "border-rose-800 bg-rose-950/60 text-rose-300"
                              : "border-amber-800 bg-amber-950/60 text-amber-300"
                          }`}
                        >
                          {issue.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px]">
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {issue.reportedBy?.firstName} {issue.reportedBy?.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {issue.assignedTo ? `${issue.assignedTo.firstName} ${issue.assignedTo.lastName}` : "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{new Date(issue.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. DOCUMENTS TAB */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Attached Deliverables & Architectural Blueprints
            </h3>
            <button
              onClick={() => setDocModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Attach Document
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operation.documents?.map((doc: any) => (
              <div key={doc.id} className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-semibold text-white text-xs">{doc.name}</div>
                  <div className="text-[10px] text-slate-400">Category: {doc.category}</div>
                  <div className="text-[9px] text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</div>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. FINANCIAL TAB */}
      {activeTab === "financial" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4">
              <span className="text-[11px] text-slate-500 block">Approved Budget</span>
              <span className="text-lg font-bold text-white font-mono">${operation.approvedBudget?.toLocaleString()}</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4">
              <span className="text-[11px] text-slate-500 block">Actual Costs</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">${operation.actualCost?.toLocaleString()}</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4">
              <span className="text-[11px] text-slate-500 block">Remaining Variance</span>
              <span className="text-lg font-bold text-blue-400 font-mono">
                ${((operation.approvedBudget || 0) - (operation.actualCost || 0)).toLocaleString()}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4">
              <span className="text-[11px] text-slate-500 block">Related Invoices</span>
              <span className="text-lg font-bold text-white font-mono">{operation.invoices?.length || 0}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Related Invoices */}
            <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Related Customer & Vendor Invoices</h4>
              {operation.invoices?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No financial invoices linked to this operation.</p>
              ) : (
                <div className="space-y-2">
                  {operation.invoices?.map((inv: any) => (
                    <div key={inv.id} className="flex justify-between items-center p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs">
                      <div>
                        <span className="font-mono text-blue-400 block">{inv.invoiceNumber}</span>
                        <span className="text-slate-400 text-[10px]">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-white block">${inv.total?.toLocaleString()}</span>
                        <span className="text-[10px] text-emerald-400">{inv.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Expenses */}
            <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Operational Expense Disbursals</h4>
              {operation.expenses?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No operational expenses logged.</p>
              ) : (
                <div className="space-y-2">
                  {operation.expenses?.map((exp: any) => (
                    <div key={exp.id} className="flex justify-between items-center p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs">
                      <div>
                        <span className="font-medium text-white block">{exp.description}</span>
                        <span className="text-slate-400 text-[10px] font-mono">{exp.expenseNumber} • {exp.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-amber-300 block">${exp.amount?.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">{exp.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 10. APPROVALS TAB */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Corporate Approval Requests & Gate Decisions
            </h3>
            <button
              onClick={() => setApprovalModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Request Approval
            </button>
          </div>

          <div className="space-y-3">
            {operation.approvals?.map((appr: any) => (
              <div key={appr.id} className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white text-xs">{appr.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Requested by {appr.requestedBy?.firstName} {appr.requestedBy?.lastName} on{" "}
                    {new Date(appr.createdAt).toLocaleDateString()}
                  </div>
                  {appr.comment && <div className="text-[10px] text-slate-500 mt-1">Decision Note: {appr.comment}</div>}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                      appr.status === "APPROVED"
                        ? "border-emerald-800 bg-emerald-950/60 text-emerald-300"
                        : appr.status === "REJECTED"
                        ? "border-rose-800 bg-rose-950/60 text-rose-300"
                        : "border-slate-700 bg-slate-800 text-slate-300"
                    }`}
                  >
                    {appr.status}
                  </span>

                  {appr.status === "PENDING" && (
                    <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-2">
                      <button
                        onClick={() => handleDecideApproval(appr.id, "APPROVED")}
                        className="rounded bg-emerald-600 hover:bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecideApproval(appr.id, "REJECTED")}
                        className="rounded bg-rose-600 hover:bg-rose-500 px-2 py-1 text-[10px] font-semibold text-white"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: PRE-COMPLETION WARNING CONFIRMATION */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-amber-900/60 bg-[#0f172a] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="h-5 w-5" />
              <span>Completion Readiness Verification</span>
            </div>

            <p className="text-xs text-slate-300">
              The following pre-completion conditions have active warnings. While non-blocking, please confirm that you wish to finalize this operation:
            </p>

            <ul className="space-y-1.5 rounded-lg bg-slate-900/80 p-3 text-xs text-amber-300/90 list-disc list-inside">
              {readinessWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
              >
                Back & Review
              </button>
              <button
                onClick={() => executeTransition(targetStatus, true)}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white"
              >
                Confirm & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateTask} className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-white">
              <span>Create Operational Sub-Task</span>
              <button type="button" onClick={() => setTaskModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Title *</label>
                <input
                  required
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Assignee</label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>
              {operation.tasks?.length > 0 && (
                <div>
                  <label className="text-slate-300 block mb-1">Dependency (Must Complete First)</label>
                  <select
                    value={newTaskDependency}
                    onChange={(e) => setNewTaskDependency(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="">None (Independent Task)</option>
                    {operation.tasks.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTaskModalOpen(false)}
                className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: STAFF TEAM MEMBER */}
      {teamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleAssignTeam} className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-white">
              <span>Assign Personnel</span>
              <button type="button" onClick={() => setTeamModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Employee</label>
                <select
                  value={newTeamEmployeeId}
                  onChange={(e) => setNewTeamEmployeeId(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Role</label>
                <input
                  type="text"
                  value={newTeamRole}
                  onChange={(e) => setNewTeamRole(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Assigned Hours</label>
                <input
                  type="number"
                  value={newTeamHours}
                  onChange={(e) => setNewTeamHours(Number(e.target.value))}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTeamModalOpen(false)}
                className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                Assign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ALLOCATE INVENTORY */}
      {inventoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleAddInventory} className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-white">
              <span>Allocate Inventory</span>
              <button type="button" onClick={() => setInventoryModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Product</label>
                <select
                  value={newInvProductId}
                  onChange={(e) => setNewInvProductId(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Required Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={newInvQty}
                  onChange={(e) => setNewInvQty(Number(e.target.value))}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInventoryModalOpen(false)}
                className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                Allocate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ASSOCIATE VENDOR */}
      {vendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleLinkVendor} className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-white">
              <span>Associate Vendor</span>
              <button type="button" onClick={() => setVendorModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Vendor</label>
                <select
                  value={newVendorId}
                  onChange={(e) => setNewVendorId(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Role / Function</label>
                <input
                  type="text"
                  value={newVendorRole}
                  onChange={(e) => setNewVendorRole(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={newVendorEstCost}
                  onChange={(e) => setNewVendorEstCost(Number(e.target.value))}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVendorModalOpen(false)}
                className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                Associate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: REPORT ISSUE */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateIssue} className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-white">
              <span>Report Operational Incident</span>
              <button type="button" onClick={() => setIssueModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Title *</label>
                <input
                  required
                  type="text"
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Severity</label>
                <select
                  value={newIssueSeverity}
                  onChange={(e) => setNewIssueSeverity(e.target.value as any)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={newIssueDesc}
                  onChange={(e) => setNewIssueDesc(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIssueModalOpen(false)}
                className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
                Submit Incident
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ATTACH DOCUMENT */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleUploadDoc} className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-white">
              <span>Attach Deliverable Document</span>
              <button type="button" onClick={() => setDocModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Document Name *</label>
                <input
                  required
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Category</label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                >
                  <option value="SPECIFICATION">Technical Specification</option>
                  <option value="REPORT">Progress / QA Report</option>
                  <option value="CONTRACT">Vendor / Client Contract</option>
                  <option value="DELIVERABLE">Final Deliverable Artifact</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">File URL / Storage Link</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDocModalOpen(false)}
                className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                Attach
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: REQUEST APPROVAL */}
      {approvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleRequestApproval} className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-white">
              <span>Submit for Executive Approval</span>
              <button type="button" onClick={() => setApprovalModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Approval Request Title *</label>
                <input
                  required
                  type="text"
                  value={newApprovalTitle}
                  onChange={(e) => setNewApprovalTitle(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Description / Justification</label>
                <textarea
                  rows={3}
                  value={newApprovalDesc}
                  onChange={(e) => setNewApprovalDesc(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setApprovalModalOpen(false)}
                className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT OPERATION DETAILS */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleUpdateOperationDetails} className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center text-sm font-semibold text-white border-b border-slate-800 pb-2.5">
              <span>Edit Operation Parameters</span>
              <button type="button" onClick={() => setEditModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Operation Name *</label>
                <input
                  required
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Risk Level</label>
                  <select
                    value={editRiskLevel}
                    onChange={(e) => setEditRiskLevel(e.target.value as any)}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="LOW">Low Risk</option>
                    <option value="MEDIUM">Medium Risk</option>
                    <option value="HIGH">High Risk</option>
                    <option value="CRITICAL">Critical Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Approved Budget ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editBudget}
                    onChange={(e) => setEditBudget(Number(e.target.value))}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editEstCost}
                    onChange={(e) => setEditEstCost(Number(e.target.value))}
                    className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Risk Vulnerability</label>
                <input
                  type="text"
                  value={editRiskDesc}
                  onChange={(e) => setEditRiskDesc(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Mitigation Plan</label>
                <input
                  type="text"
                  value={editMitigation}
                  onChange={(e) => setEditMitigation(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: RECORD INVENTORY USAGE */}
      {usageModalOpen && selectedInvItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleRecordInventoryUsage} className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-white border-b border-slate-800 pb-2">
              <span>Log Inventory Usage</span>
              <button type="button" onClick={() => setUsageModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div><strong className="text-white">{selectedInvItem.product?.name}</strong></div>
              <div className="text-slate-500">Required: {selectedInvItem.requiredQuantity} | Currently Used: {selectedInvItem.usedQuantity || 0}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Total Quantity Consumed</label>
                <input
                  type="number"
                  min="0"
                  max={selectedInvItem.requiredQuantity * 2}
                  value={usedQtyInput}
                  onChange={(e) => setUsedQtyInput(Number(e.target.value))}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Usage Status</label>
                <select
                  value={invStatusInput}
                  onChange={(e) => setInvStatusInput(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="ALLOCATED">Allocated</option>
                  <option value="CONSUMED">Consumed</option>
                  <option value="RETURNED">Returned</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUsageModalOpen(false)}
                className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="rounded bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white">
                Save Usage
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
