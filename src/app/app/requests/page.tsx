"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Building2,
  Search,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Briefcase,
  Layers,
} from "lucide-react";

interface RequestItem {
  id: string;
  requestNumber: string;
  category: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  employee?: {
    firstName: string;
    lastName: string;
    designation?: string;
  };
}

interface PartnerEmployee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  designation: string;
  department: string;
  workMode: string;
  location: string;
  avatarUrl: string | null;
  isFree: boolean;
  busyReason: string | null;
  workload: {
    activeTasksCount: number;
    activeOpsCount: number;
    activeOnDutyCount: number;
    isBorrowed: boolean;
  };
}

interface PartnerCompanyInfo {
  id: string;
  name: string;
  code: string;
  primaryColor: string | null;
}

interface DesignatedApprover {
  role: string;
  roleTitle: string;
  name: string;
  employeeId: string | null;
  userId: string | null;
  email: string | null;
}

interface OutgoingBorrowRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  requester: string;
  approver: string | null;
  targetEmployeeName: string;
  targetEmployeeDesignation: string;
  targetOrganizationName: string;
  targetOrganizationId?: string | null;
  requesterOrganizationId?: string | null;
  durationDays: number;
  startDate?: string;
  endDate?: string;
  priority: string;
  ceoName?: string;
  hrName?: string;
  managerName?: string;
  designatedApprovers?: DesignatedApprover[];
  acceptedBy?: { name: string; role?: string } | null;
}

interface IncomingBorrowRequest {
  id: string;
  employeeRequestId: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  decisionDate: string | null;
  comment: string | null;
  requesterName: string;
  requesterDesignation: string;
  requesterOrgName: string;
  requesterOrganizationId?: string | null;
  targetOrganizationId?: string | null;
  targetEmployeeName: string;
  targetEmployeeDesignation: string;
  targetEmployeeDepartment?: string;
  durationDays: number;
  startDate?: string;
  endDate?: string;
  priority: string;
  workScope: string;
  ceoName?: string;
  hrName?: string;
  managerName?: string;
  designatedApprovers?: DesignatedApprover[];
  acceptedBy?: { name: string; role?: string } | null;
  canApprove?: boolean;
}

export default function RequestCenterPage() {
  const { activeCompany, user: currentUser } = useAuth();
  const activeCompanyId =
    activeCompany?.id || currentUser?.activeCompany?.id || currentUser?.employee?.organizationId;

  // Main tab: "CROSS_COMPANY" | "GENERAL"
  const [activeTab, setActiveTab] = useState<"CROSS_COMPANY" | "GENERAL">("CROSS_COMPANY");
  // Subtab for cross-company: "BROWSE" | "OUTGOING" | "INCOMING"
  const [crossSubTab, setCrossSubTab] = useState<"BROWSE" | "OUTGOING" | "INCOMING">("BROWSE");

  // General requests state
  const [generalRequests, setGeneralRequests] = useState<RequestItem[]>([]);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [generalFormData, setGeneralFormData] = useState({
    category: "LEAVE",
    title: "",
    description: "",
  });
  const [submittingGeneral, setSubmittingGeneral] = useState(false);

  // Cross-company state
  const [partnerCompany, setPartnerCompany] = useState<PartnerCompanyInfo | null>(null);
  const [partnerEmployees, setPartnerEmployees] = useState<PartnerEmployee[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingBorrowRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingBorrowRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Search and availability filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FREE" | "BUSY">("ALL");

  // Borrow Employee Modal state
  const [selectedFreeEmployee, setSelectedFreeEmployee] = useState<PartnerEmployee | null>(null);
  const [borrowFormData, setBorrowFormData] = useState({
    title: "",
    description: "",
    durationDays: 3,
    priority: "NORMAL",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [submittingBorrow, setSubmittingBorrow] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);
  const [borrowSuccess, setBorrowSuccess] = useState<string | null>(null);

  // Decision Modal state (Approve / Reject incoming request)
  const [decisionModal, setDecisionModal] = useState<{
    request: IncomingBorrowRequest | null;
    decision: "APPROVED" | "REJECTED";
    comment: string;
  } | null>(null);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Handle URL query parameters on mount (e.g. ?tab=cross-company&subtab=incoming)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const subtabParam = params.get("subtab");

      if (tabParam === "general") {
        setActiveTab("GENERAL");
      } else {
        setActiveTab("CROSS_COMPANY");
      }

      if (subtabParam === "incoming") {
        setCrossSubTab("INCOMING");
      } else if (subtabParam === "outgoing") {
        setCrossSubTab("OUTGOING");
      }
    }
  }, []);

  // Fetch partner availability
  const fetchAvailability = useCallback(async () => {
    try {
      setLoadingAvailability(true);
      const url = activeCompanyId
        ? `/api/resources/cross-company/availability?organizationId=${encodeURIComponent(activeCompanyId)}`
        : "/api/resources/cross-company/availability";
      const res = await fetch(url, {
        headers: activeCompanyId ? { "x-company-id": activeCompanyId } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setPartnerCompany(json.data.partnerCompany);
          setPartnerEmployees(json.data.employees || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch partner availability:", err);
    } finally {
      setLoadingAvailability(false);
    }
  }, [activeCompanyId]);

  // Fetch cross-company borrow requests (incoming and outgoing)
  const fetchBorrowRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const url = activeCompanyId
        ? `/api/resources/cross-company/requests?organizationId=${encodeURIComponent(activeCompanyId)}`
        : "/api/resources/cross-company/requests";
      const res = await fetch(url, {
        headers: activeCompanyId ? { "x-company-id": activeCompanyId } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOutgoingRequests(json.data.outgoing || []);
          setIncomingRequests(json.data.incoming || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch borrow requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  }, [activeCompanyId]);

  // Fetch general tickets
  const fetchGeneralRequests = useCallback(async () => {
    try {
      setLoadingGeneral(true);
      const res = await fetch("/api/requests", {
        headers: activeCompanyId ? { "x-company-id": activeCompanyId } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setGeneralRequests(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch general requests:", err);
    } finally {
      setLoadingGeneral(false);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    fetchAvailability();
    fetchBorrowRequests();
    fetchGeneralRequests();
  }, [fetchAvailability, fetchBorrowRequests, fetchGeneralRequests]);

  // Strictly filter out leadership, main executives, managers, and structural architecture personas
  const isLeadership = (emp: PartnerEmployee) => {
    const email = (emp.email || "").toLowerCase();
    if (email.endsWith(".internal")) return true;

    const des = (emp.designation || "").toLowerCase();
    return (
      des.includes("chief") ||
      des.includes("ceo") ||
      des.includes("cto") ||
      des.includes("cio") ||
      des.includes("cfo") ||
      des.includes("coo") ||
      des.includes("cmo") ||
      des.includes("administrator") ||
      des.includes("admin") ||
      des.includes("chairperson") ||
      des.includes("director") ||
      des.includes("human resources") ||
      des.includes("head") ||
      des.includes("vp") ||
      des.includes("vice president") ||
      des.includes("manager") ||
      des.includes("lead") ||
      des.includes("controller") ||
      des.includes("officer") ||
      des.includes("supervisor")
    );
  };

  const eligibleStaff = useMemo(() => {
    return partnerEmployees.filter((emp) => !isLeadership(emp));
  }, [partnerEmployees]);

  // Filtered partner staff employees (excluding leadership/executives)
  const filteredEmployees = useMemo(() => {
    return eligibleStaff.filter((emp) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "FREE") return emp.isFree;
      if (statusFilter === "BUSY") return !emp.isFree;
      return true;
    });
  }, [eligibleStaff, searchQuery, statusFilter]);

  const freeCount = useMemo(() => eligibleStaff.filter((e) => e.isFree).length, [eligibleStaff]);
  const busyCount = useMemo(() => eligibleStaff.filter((e) => !e.isFree).length, [eligibleStaff]);

  // Filtered outgoing and incoming borrow requests with strict multi-tenant boundary checks
  const filteredIncomingRequests = useMemo(() => {
    return incomingRequests.filter((req) => {
      // If our active company was the requester, this is NEVER an incoming request to us!
      if (activeCompanyId && req.requesterOrganizationId === activeCompanyId) {
        return false;
      }
      // If the target organization is specified and it's not us, it's not an incoming request to us
      if (activeCompanyId && req.targetOrganizationId && req.targetOrganizationId !== activeCompanyId) {
        return false;
      }
      return true;
    });
  }, [incomingRequests, activeCompanyId]);

  const filteredOutgoingRequests = useMemo(() => {
    return outgoingRequests.filter((req) => {
      // If our active company was the lending target, it's not our outgoing borrow request
      if (activeCompanyId && req.targetOrganizationId && req.targetOrganizationId === activeCompanyId) {
        return false;
      }
      return true;
    });
  }, [outgoingRequests, activeCompanyId]);

  const pendingIncomingCount = useMemo(
    () => filteredIncomingRequests.filter((r) => r.status === "PENDING").length,
    [filteredIncomingRequests]
  );

  // Submit General Ticket
  const handleSubmitGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalFormData.title || !generalFormData.description) return;
    try {
      setSubmittingGeneral(true);
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(activeCompanyId ? { "x-company-id": activeCompanyId } : {}),
        },
        body: JSON.stringify({
          ...generalFormData,
          organizationId: activeCompanyId,
        }),
      });
      if (res.ok) {
        setShowGeneralModal(false);
        setGeneralFormData({ category: "LEAVE", title: "", description: "" });
        await fetchGeneralRequests();
      }
    } catch (err) {
      console.error("Submit general request failed:", err);
    } finally {
      setSubmittingGeneral(false);
    }
  };

  // Submit Cross-Company Borrow Request
  const handleOpenBorrowModal = (employee: PartnerEmployee) => {
    if (!employee.isFree) return; // Strict front-end prevention
    setSelectedFreeEmployee(employee);
    setBorrowFormData({
      title: `Project Assistance: ${employee.designation}`,
      description: "",
      durationDays: 3,
      priority: "NORMAL",
      startDate: new Date().toISOString().split("T")[0],
    });
    setBorrowError(null);
  };

  const handleSubmitBorrowRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFreeEmployee) return;

    if (!selectedFreeEmployee.isFree) {
      setBorrowError("This employee is currently busy and cannot be requested.");
      return;
    }

    try {
      setSubmittingBorrow(true);
      setBorrowError(null);

      const res = await fetch("/api/resources/cross-company/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(activeCompanyId ? { "x-company-id": activeCompanyId } : {}),
        },
        body: JSON.stringify({
          targetEmployeeId: selectedFreeEmployee.id,
          title: borrowFormData.title,
          description: borrowFormData.description,
          durationDays: borrowFormData.durationDays,
          startDate: borrowFormData.startDate,
          priority: borrowFormData.priority,
          organizationId: activeCompanyId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to submit staff borrow request");
      }

      // Success
      setBorrowSuccess(
        `Staff request for ${selectedFreeEmployee.fullName} submitted successfully! Awaiting approval from ${partnerCompany?.name || "partner company"} leadership.`
      );
      setSelectedFreeEmployee(null);

      // Refresh data
      await Promise.all([fetchAvailability(), fetchBorrowRequests()]);

      // Switch to Outgoing view to see the submitted request
      setCrossSubTab("OUTGOING");

      setTimeout(() => setBorrowSuccess(null), 6000);
    } catch (err: any) {
      setBorrowError(err.message || "Failed to submit borrow request");
    } finally {
      setSubmittingBorrow(false);
    }
  };

  // Decide incoming borrow request (Approve / Reject)
  const handleProcessDecision = async () => {
    if (!decisionModal?.request) return;

    try {
      setSubmittingDecision(true);
      const res = await fetch(`/api/resources/cross-company/requests/${decisionModal.request.id}/decide`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(activeCompanyId ? { "x-company-id": activeCompanyId } : {}),
        },
        body: JSON.stringify({
          decision: decisionModal.decision,
          comment: decisionModal.comment,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to process decision");
      }

      setDecisionModal(null);
      await Promise.all([fetchAvailability(), fetchBorrowRequests()]);
    } catch (err: any) {
      alert(err.message || "Decision failed");
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Central Request Center"
        description="Cross-company employee borrowing workflow & self-service corporate ticketing."
        badge={
          <Badge variant="gold" size="sm" className="gap-1">
            <Users className="h-3 w-3 text-amber-500" />
            <span>Multi-Company Staff Protocol</span>
          </Badge>
        }
        actions={
          activeTab === "GENERAL" ? (
            <button
              onClick={() => setShowGeneralModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Ticket
            </button>
          ) : (
            <button
              onClick={() => {
                setCrossSubTab("BROWSE");
                setStatusFilter("FREE");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Users className="h-4 w-4" /> Browse Free Staff
            </button>
          )
        }
      />

      {/* Success Notification Alert */}
      {borrowSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{borrowSuccess}</span>
          </div>
          <button
            onClick={() => setBorrowSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Primary Module Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("CROSS_COMPANY")}
          className={`pb-3 flex items-center gap-2 transition-all relative ${
            activeTab === "CROSS_COMPANY"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Cross-Company Staff Sharing</span>
          {pendingIncomingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white animate-pulse">
              {pendingIncomingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("GENERAL")}
          className={`pb-3 flex items-center gap-2 transition-all ${
            activeTab === "GENERAL"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>General Service Requests & Tickets</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {generalRequests.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: CROSS-COMPANY STAFF SHARING MODULE */}
      {/* ========================================================================= */}
      {activeTab === "CROSS_COMPANY" && (
        <div className="space-y-6">
          {/* Subtabs: Browse Partner Staff | Outgoing Requests | Incoming Requests */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/80 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCrossSubTab("BROWSE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  crossSubTab === "BROWSE"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Available Partner Staff ({freeCount} Free)
              </button>

              <button
                onClick={() => setCrossSubTab("OUTGOING")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  crossSubTab === "OUTGOING"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Outgoing Requests ({filteredOutgoingRequests.length})
              </button>

              <button
                onClick={() => setCrossSubTab("INCOMING")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  crossSubTab === "INCOMING"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <span>Incoming Borrow Requests</span>
                {pendingIncomingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500 text-white">
                    {pendingIncomingCount}
                  </span>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 px-2 font-medium flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              <span>Partner:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {partnerCompany?.name || "Loading..."}
              </strong>
            </div>
          </div>

          {/* 1. SUBTAB: BROWSE PARTNER STAFF */}
          {crossSubTab === "BROWSE" && (
            <div className="space-y-4">
              {/* Informative Guidance Banner */}
              <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-gradient-to-r from-sky-50/70 via-blue-50/40 to-white dark:from-sky-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Real-Time Partner Resource Pool
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      When your internal employees are at maximum capacity, you can borrow talent from{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {partnerCompany?.name || "Partner Company"}
                      </strong>
                      . The system verifies real-time active workloads:{" "}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        only free personnel can be selected.
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{freeCount} Free to Request</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span>{busyCount} Busy / Occupied</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, role or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      statusFilter === "ALL"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    All Staff ({eligibleStaff.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("FREE")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                      statusFilter === "FREE"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" /> Free Only ({freeCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("BUSY")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                      statusFilter === "BUSY"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    <Clock className="h-3 w-3" /> Busy ({busyCount})
                  </button>
                </div>
              </div>

              {/* Employee Cards Grid */}
              {loadingAvailability ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  Scanning partner company employee workloads...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-8">
                  <Users className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No partner employees matched your criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                        emp.isFree
                          ? "border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-emerald-400"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-75"
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Card Header with Status Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-xs ${
                                emp.isFree
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {emp.firstName[0]}
                              {emp.lastName[0]}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                {emp.fullName}
                              </h4>
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                                {emp.designation}
                              </p>
                            </div>
                          </div>

                          {emp.isFree ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="h-2.5 w-2.5" /> FREE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <Clock className="h-2.5 w-2.5" /> BUSY
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="text-[11px] space-y-1 text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Department:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {emp.department}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Work Mode:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {emp.workMode} • {emp.location}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-slate-400">Live Workload:</span>
                            {emp.isFree ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                                0 Tasks • Available Now
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-medium text-[10px] truncate max-w-[150px]">
                                {emp.busyReason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                        {emp.isFree ? (
                          <button
                            onClick={() => handleOpenBorrowModal(emp)}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            <Users className="h-3.5 w-3.5" /> Request Employee
                          </button>
                        ) : (
                          <button
                            disabled
                            title={`Cannot request: ${emp.busyReason}`}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold cursor-not-allowed border border-slate-200 dark:border-slate-700"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Unavailable (Busy)
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. SUBTAB: OUTGOING BORROW REQUESTS */}
          {crossSubTab === "OUTGOING" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Requests Submitted by Your Company to Borrow Partner Staff
                </h3>
                <button
                  onClick={() => {
                    setCrossSubTab("BROWSE");
                    setStatusFilter("FREE");
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Request Another Employee
                </button>
              </div>

              {loadingRequests ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading outgoing requests...</div>
              ) : filteredOutgoingRequests.length === 0 ? (
                <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-8">
                  <Users className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    No outgoing staff requests submitted yet.
                  </p>
                  <button
                    onClick={() => {
                      setCrossSubTab("BROWSE");
                      setStatusFilter("FREE");
                    }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    Browse Free Partner Staff
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                      <tr>
                        <th className="px-4 py-3">Request #</th>
                        <th className="px-4 py-3">Target Employee</th>
                        <th className="px-4 py-3">Work Title & Scope</th>
                        <th className="px-4 py-3">Sent to Approvers (CEO • HR • Manager)</th>
                        <th className="px-4 py-3">Duration & Period</th>
                        <th className="px-4 py-3">Approval & Assignment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredOutgoingRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {req.requestNumber}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {req.targetEmployeeName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {req.targetEmployeeDesignation} • {req.targetOrganizationName}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                              {req.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {req.description}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px]">
                            <div className="space-y-0.5">
                              <div>
                                <span className="text-slate-400 font-medium">CEO:</span>{" "}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {req.ceoName || "CEO"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium">HR:</span>{" "}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {req.hrName || "HR"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium">Manager:</span>{" "}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {req.managerName || "Manager"}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 italic block mt-1">
                              ⚡ Any 1 can approve
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <div>{req.durationDays} day(s)</div>
                            {req.startDate && req.endDate && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                req.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : req.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {req.status === "APPROVED" ? "APPROVED & ASSIGNED" : req.status}
                            </span>
                            {req.status === "APPROVED" && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
                                Authorized by: {req.acceptedBy?.name || req.approver || "Authorized Leader"}
                              </span>
                            )}
                            {req.rejectionReason && (
                              <span className="text-[10px] text-rose-600 block mt-0.5 max-w-xs truncate">
                                Note: {req.rejectionReason}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. SUBTAB: INCOMING BORROW REQUESTS */}
          {crossSubTab === "INCOMING" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Incoming Requests from Partner Company Wanting to Borrow Our Staff
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    As an authorized corporate officer, you can review, approve, or decline temporary assignments.
                  </p>
                </div>
              </div>

              {loadingRequests ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading incoming requests...</div>
              ) : filteredIncomingRequests.length === 0 ? (
                <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-8">
                  <ShieldCheck className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No incoming staff loan requests pending.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredIncomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Requested by {req.requesterOrgName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              req.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : req.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {req.status === "APPROVED" ? "APPROVED & ASSIGNED" : req.status}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Borrow Request for:{" "}
                            <span className="text-blue-600 dark:text-blue-400">
                              {req.targetEmployeeName} ({req.targetEmployeeDesignation})
                            </span>
                          </h4>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                            {req.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                            {req.workScope}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <span>
                            Duration: <strong>{req.durationDays} days</strong>
                          </span>
                          {req.startDate && req.endDate && (
                            <span className="font-mono">
                              Period: <strong>{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</strong>
                            </span>
                          )}
                          <span>
                            Requester: <strong>{req.requesterName}</strong>
                          </span>
                          {req.comment && (
                            <span className="italic text-slate-600 dark:text-slate-400">
                              Decision Note: &ldquo;{req.comment}&rdquo;
                            </span>
                          )}
                        </div>

                        {/* Designated Approvers Box: CEO, HR, Manager */}
                        <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              Designated Lending Approvers (CEO • HR • Direct Manager)
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                              ⚡ Any 1 approval assigns the employee
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                            <div className="p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                                CEO
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {req.ceoName || "Chief Executive Officer"}
                              </span>
                            </div>
                            <div className="p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                                HR Officer
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {req.hrName || "Human Resources Officer"}
                              </span>
                            </div>
                            <div className="p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                                Direct Manager
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {req.managerName || "Direct Reporting Manager"}
                              </span>
                            </div>
                          </div>

                          {/* Approval Status & Assignment details */}
                          {req.status === "APPROVED" && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                  Active Assignment: Seconded to {req.requesterOrgName} until{" "}
                                  {req.endDate ? new Date(req.endDate).toLocaleDateString() : `${req.durationDays} days`}
                                </span>
                              </div>
                              <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                Authorized by: <strong>{req.acceptedBy?.name || "Corporate Officer"}</strong>{" "}
                                {req.acceptedBy?.role ? `(${req.acceptedBy.role})` : ""}
                              </span>
                            </div>
                          )}

                          {req.status === "REJECTED" && (
                            <div className="flex items-center gap-2 p-2 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400">
                              <XCircle className="h-4 w-4 shrink-0" />
                              <span>Request declined. Staff member remains with internal team.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Decision Action Buttons */}
                      {req.status === "PENDING" && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                          {req.canApprove !== false ? (
                            <>
                              <button
                                onClick={() =>
                                  setDecisionModal({
                                    request: req,
                                    decision: "APPROVED",
                                    comment: "Approved for temporary cross-company assignment.",
                                  })
                                }
                                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve & Assign Staff
                              </button>
                              <button
                                onClick={() =>
                                  setDecisionModal({
                                    request: req,
                                    decision: "REJECTED",
                                    comment: "Unable to release employee due to internal operational priorities.",
                                  })
                                }
                                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
                              >
                                <X className="h-3.5 w-3.5" /> Decline
                              </button>
                            </>
                          ) : (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                              Awaiting decision by CEO, HR, or Direct Manager
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: GENERAL TICKETING & SERVICE REQUESTS */}
      {/* ========================================================================= */}
      {activeTab === "GENERAL" && (
        <div className="space-y-4">
          {loadingGeneral ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading service requests...</div>
          ) : generalRequests.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-8">
              <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No Service Requests Submitted
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                You currently have no open or past internal requests.
              </p>
              <button
                onClick={() => setShowGeneralModal(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                Create First Ticket
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Request #</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Title & Subject</th>
                    <th className="px-4 py-3">Submitted Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {generalRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {req.requestNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {req.category === "CROSS_COMPANY_RESOURCE" ? "STAFF BORROW" : req.category}
                      </td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-medium max-w-md truncate">
                        {req.title}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {new Date(req.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : req.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: BORROW FREE EMPLOYEE REQUEST MODAL */}
      {/* ========================================================================= */}
      {selectedFreeEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Request Partner Employee
                </h3>
              </div>
              <button
                onClick={() => setSelectedFreeEmployee(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target Employee Summary Card */}
            <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                  {selectedFreeEmployee.firstName[0]}
                  {selectedFreeEmployee.lastName[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    {selectedFreeEmployee.fullName}
                  </h4>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300">
                    {selectedFreeEmployee.designation} • {selectedFreeEmployee.department}
                  </p>
                  <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400 font-mono">
                    Company: {partnerCompany?.name}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                Verified Free
              </span>
            </div>

            {/* Cross-Company Protocol Notice */}
            <div className="p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Cross-Company Authorization Protocol
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300/90 leading-relaxed">
                This request will automatically be routed to the <strong>CEO</strong>, <strong>HR</strong>, and the <strong>Direct Reporting Manager</strong> of {partnerCompany?.name}. When <strong>any one of them accepts</strong>, {selectedFreeEmployee.fullName} will immediately be assigned to your company for the requested duration.
              </p>
            </div>

            {borrowError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{borrowError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitBorrowRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Work Scope / Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urgent Assistance with Clinical Platform Integration"
                  value={borrowFormData.title}
                  onChange={(e) => setBorrowFormData({ ...borrowFormData, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description of Deliverables & Requirements <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the exact deliverables and project milestones required from this employee..."
                  value={borrowFormData.description}
                  onChange={(e) =>
                    setBorrowFormData({ ...borrowFormData, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={borrowFormData.durationDays}
                    onChange={(e) =>
                      setBorrowFormData({
                        ...borrowFormData,
                        durationDays: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={borrowFormData.startDate}
                    onChange={(e) =>
                      setBorrowFormData({ ...borrowFormData, startDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={borrowFormData.priority}
                    onChange={(e) =>
                      setBorrowFormData({ ...borrowFormData, priority: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent / Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedFreeEmployee(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBorrow}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingBorrow ? "Submitting..." : "Submit Staff Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DECISION MODAL (APPROVE / REJECT INCOMING REQUEST) */}
      {/* ========================================================================= */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {decisionModal.decision === "APPROVED" ? "Authorize & Assign Staff Loan" : "Decline Staff Loan"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {decisionModal.decision === "APPROVED"
                ? `As an authorized authority (CEO, HR, or Direct Manager), you are approving the loan. ${decisionModal.request?.targetEmployeeName} will immediately be assigned to ${decisionModal.request?.requesterOrgName} for ${decisionModal.request?.durationDays} days (${decisionModal.request?.startDate ? new Date(decisionModal.request.startDate).toLocaleDateString() : "Starting today"} to ${decisionModal.request?.endDate ? new Date(decisionModal.request.endDate).toLocaleDateString() : "End of period"}).`
                : `Decline staff request from ${decisionModal.request?.requesterOrgName}. The employee will remain assigned exclusively to your organization.`}
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Executive Note / Reason
              </label>
              <textarea
                rows={3}
                value={decisionModal.comment}
                onChange={(e) =>
                  setDecisionModal({ ...decisionModal, comment: e.target.value })
                }
                placeholder="Optional executive comments..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={handleProcessDecision}
                className={`px-4 py-2 rounded-lg text-white font-semibold text-xs transition-colors disabled:opacity-50 ${
                  decisionModal.decision === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submittingDecision
                  ? "Processing..."
                  : decisionModal.decision === "APPROVED"
                  ? "Confirm & Assign"
                  : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE GENERAL TICKET MODAL */}
      {/* ========================================================================= */}
      {showGeneralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                New Internal Service Ticket
              </h3>
              <button
                onClick={() => setShowGeneralModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitGeneral} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={generalFormData.category}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "CROSS_COMPANY_RESOURCE") {
                      setShowGeneralModal(false);
                      setActiveTab("CROSS_COMPANY");
                      setCrossSubTab("BROWSE");
                    } else {
                      setGeneralFormData({ ...generalFormData, category: val });
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="LEAVE">Leave Request</option>
                  <option value="ATTENDANCE_CORRECTION">Attendance Correction</option>
                  <option value="ON_DUTY">On-Duty Request</option>
                  <option value="EXPENSE">Expense Request</option>
                  <option value="HR_DOCUMENT">HR Document Request</option>
                  <option value="IT_SUPPORT">IT Support Request</option>
                  <option value="CROSS_COMPANY_RESOURCE">
                    🌟 Cross-Company Staff Borrowing
                  </option>
                  <option value="OTHER">Other Service Request</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title / Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leave Request for Family Vacation"
                  value={generalFormData.title}
                  onChange={(e) =>
                    setGeneralFormData({ ...generalFormData, title: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Details
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide full details of your request..."
                  value={generalFormData.description}
                  onChange={(e) =>
                    setGeneralFormData({ ...generalFormData, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowGeneralModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGeneral}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {submittingGeneral ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
