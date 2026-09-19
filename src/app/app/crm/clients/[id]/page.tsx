"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CrmNav } from "@/modules/crm/components/crm-nav";
import {
  Building,
  Users,
  Briefcase,
  Clock,
  CheckSquare,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Plus,
  ArrowLeft,
  Calendar,
  Send,
  Sparkles,
  ChevronRight,
  Shield,
  Tag,
  X,
  AlertCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Download,
  ExternalLink,
  Archive,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RecordDiscussionWidget } from "@/modules/communications/record-discussion-widget";
import { RecordAISummaryCard } from "@/modules/ai/record-ai-summary-card";

export default function Client360Page() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "contacts" | "opportunities" | "activities" | "tasks" | "proposals" | "documents" | "billing" | "communication"
  >("overview");

  // Employees list for assignment
  const [employees, setEmployees] = useState<any[]>([]);

  // Modals state
  const [logActivityOpen, setLogActivityOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [createDealOpen, setCreateDealOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createProposalOpen, setCreateProposalOpen] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);

  // Proposals & Documents data
  const [proposals, setProposals] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Form: Activity
  const [actType, setActType] = useState<"CALL" | "MEETING" | "EMAIL" | "NOTE" | "PROPOSAL">("NOTE");
  const [actSubject, setActSubject] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [isSubmittingAct, setIsSubmittingAct] = useState(false);

  // Form: Contact
  const [conFirst, setConFirst] = useState("");
  const [conLast, setConLast] = useState("");
  const [conEmail, setConEmail] = useState("");
  const [conPhone, setConPhone] = useState("");
  const [conTitle, setConTitle] = useState("");
  const [conDept, setConDept] = useState("");
  const [conPrimary, setConPrimary] = useState(false);
  const [isSubmittingCon, setIsSubmittingCon] = useState(false);
  const [modalError, setModalError] = useState("");

  // Form: Edit Client
  const [editName, setEditName] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editTaxId, setEditTaxId] = useState("");
  const [editTier, setEditTier] = useState<any>("MID_MARKET");
  const [editStatus, setEditStatus] = useState<any>("ACTIVE");
  const [editOwnerId, setEditOwnerId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editRevenue, setEditRevenue] = useState<number>(0);
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);

  // Form: Create Deal
  const [dealName, setDealName] = useState("");
  const [dealValue, setDealValue] = useState(50000);
  const [dealStage, setDealStage] = useState<any>("DISCOVERY");
  const [dealProb, setDealProb] = useState(25);
  const [dealCloseDate, setDealCloseDate] = useState("");
  const [dealOwnerId, setDealOwnerId] = useState("");
  const [isSubmittingDeal, setIsSubmittingDeal] = useState(false);

  // Form: Create Task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<any>("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Form: Create Proposal
  const [propTitle, setPropTitle] = useState("");
  const [propItems, setPropItems] = useState<Array<{ name: string; quantity: number; unitPrice: number; discountPercent: number; taxPercent: number }>>([
    { name: "Enterprise Solution Deployment", quantity: 1, unitPrice: 50000, discountPercent: 0, taxPercent: 18 },
  ]);
  const [propValidity, setPropValidity] = useState("");
  const [propTerms, setPropTerms] = useState("Standard Net 30 commercial terms.");
  const [isSubmittingProp, setIsSubmittingProp] = useState(false);

  // Form: Upload Document
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docCategory, setDocCategory] = useState<any>("CONTRACT");
  const [docNotes, setDocNotes] = useState("");
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  const fetchClient360 = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm/clients/${clientId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        router.push("/app/crm/clients");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      const json = await res.json();
      if (json.success) setEmployees(json.data.employees);
    } catch {}
  };

  const fetchProposals = async () => {
    try {
      setLoadingProposals(true);
      const res = await fetch(`/api/crm/clients/${clientId}/proposals`);
      const json = await res.json();
      if (json.success) setProposals(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProposals(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await fetch(`/api/crm/clients/${clientId}/documents`);
      const json = await res.json();
      if (json.success) setDocuments(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClient360();
      fetchEmployees();
    }
  }, [clientId]);

  useEffect(() => {
    if (activeTab === "proposals") fetchProposals();
    if (activeTab === "documents") fetchDocuments();
  }, [activeTab]);

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actSubject.trim()) return;

    try {
      setIsSubmittingAct(true);
      const res = await fetch(`/api/crm/clients/${clientId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: actType,
          subject: actSubject,
          description: actDesc || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLogActivityOpen(false);
        setActSubject("");
        setActDesc("");
        fetchClient360();
      }
    } catch {} finally {
      setIsSubmittingAct(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    if (!conFirst.trim() || !conEmail.trim()) {
      setModalError("First name and email are required");
      return;
    }

    try {
      setIsSubmittingCon(true);
      const res = await fetch(`/api/crm/clients/${clientId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: conFirst,
          lastName: conLast || "",
          email: conEmail,
          phone: conPhone || undefined,
          designation: conTitle || undefined,
          department: conDept || undefined,
          isPrimary: conPrimary,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAddContactOpen(false);
        setConFirst("");
        setConLast("");
        setConEmail("");
        setConPhone("");
        setConTitle("");
        setConDept("");
        fetchClient360();
      } else {
        setModalError(json.error?.message || "Failed to add contact");
      }
    } catch (err: any) {
      setModalError(err.message || "An error occurred");
    } finally {
      setIsSubmittingCon(false);
    }
  };

  const openEditClient = () => {
    if (!data?.client) return;
    const c = data.client;
    setEditName(c.name || "");
    setEditIndustry(c.industry || "");
    setEditWebsite(c.website || "");
    setEditPhone(c.phone || "");
    setEditEmail(c.email || "");
    setEditAddress(c.address || "");
    setEditCity(c.city || "");
    setEditState(c.state || "");
    setEditPostalCode(c.postalCode || "");
    setEditTaxId(c.taxId || "");
    setEditTier(c.tier || "MID_MARKET");
    setEditStatus(c.status || "ACTIVE");
    setEditOwnerId(c.ownerId || "");
    setEditNotes(c.notes || "");
    setEditRevenue(c.annualRevenue || 0);
    setEditClientOpen(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingClient(true);
      const res = await fetch(`/api/crm/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          industry: editIndustry || null,
          website: editWebsite || null,
          phone: editPhone || null,
          email: editEmail || null,
          address: editAddress || null,
          city: editCity || null,
          state: editState || null,
          postalCode: editPostalCode || null,
          taxId: editTaxId || null,
          tier: editTier,
          status: editStatus,
          ownerId: editOwnerId || null,
          notes: editNotes || null,
          annualRevenue: Number(editRevenue) || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditClientOpen(false);
        fetchClient360();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingClient(false);
    }
  };

  const handleArchiveClient = async () => {
    if (!confirm("Are you sure you want to deactivate/archive this client account?")) return;
    try {
      const res = await fetch(`/api/crm/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INACTIVE" }),
      });
      const json = await res.json();
      if (json.success) fetchClient360();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to remove this contact?")) return;
    try {
      const res = await fetch(`/api/crm/contacts/${contactId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchClient360();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName.trim()) return;

    try {
      setIsSubmittingDeal(true);
      const res = await fetch("/api/crm/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dealName.trim(),
          clientId,
          value: Number(dealValue),
          stage: dealStage,
          probability: Number(dealProb),
          expectedCloseDate: dealCloseDate ? new Date(dealCloseDate).toISOString() : null,
          ownerId: dealOwnerId || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateDealOpen(false);
        setDealName("");
        fetchClient360();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingDeal(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      setIsSubmittingTask(true);
      const res = await fetch(`/api/crm/clients/${clientId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc || undefined,
          priority: taskPriority,
          dueDate: taskDueDate || null,
          assigneeId: taskAssigneeId || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateTaskOpen(false);
        setTaskTitle("");
        setTaskDesc("");
        fetchClient360();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      const json = await res.json();
      if (json.success) fetchClient360();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle.trim() || propItems.length === 0) return;

    try {
      setIsSubmittingProp(true);
      const res = await fetch(`/api/crm/clients/${clientId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: propTitle.trim(),
          items: propItems,
          validityDate: propValidity || undefined,
          terms: propTerms || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateProposalOpen(false);
        setPropTitle("");
        fetchProposals();
        fetchClient360();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingProp(false);
    }
  };

  const handleUpdateProposalStatus = async (activityId: string, status: any) => {
    try {
      const res = await fetch(`/api/crm/clients/${clientId}/proposals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, status }),
      });
      const json = await res.json();
      if (json.success) fetchProposals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docUrl.trim()) return;

    try {
      setIsSubmittingDoc(true);
      const res = await fetch(`/api/crm/clients/${clientId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: docName.trim(),
          fileUrl: docUrl.trim(),
          category: docCategory,
          notes: docNotes || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setUploadDocOpen(false);
        setDocName("");
        setDocUrl("");
        fetchDocuments();
        fetchClient360();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  const handleDeleteDocument = async (actId: string) => {
    if (!confirm("Are you sure you want to delete this document reference?")) return;
    try {
      const res = await fetch(`/api/crm/clients/${clientId}/documents?activityId=${actId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <CrmNav />
        <div className="p-20 text-center text-xs text-slate-500">
          Loading Customer 360 command center...
        </div>
      </div>
    );
  }

  const { client, stats, billingSnapshot } = data;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CALL":
        return <Phone className="h-3.5 w-3.5 text-blue-400" />;
      case "MEETING":
        return <Calendar className="h-3.5 w-3.5 text-purple-400" />;
      case "EMAIL":
        return <Mail className="h-3.5 w-3.5 text-emerald-400" />;
      case "PROPOSAL":
        return <IndianRupee className="h-3.5 w-3.5 text-amber-400" />;
      case "DOCUMENT":
        return <FileText className="h-3.5 w-3.5 text-sky-400" />;
      case "STATUS_CHANGE":
        return <Sparkles className="h-3.5 w-3.5 text-indigo-400" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <CrmNav />

      {/* Back Link & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/app/crm/clients" className="flex items-center gap-1 hover:text-slate-200 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Clients Directory</span>
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-medium">{client.name}</span>
      </div>

      {/* Customer 360 Profile Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-lg">
              {client.name[0]}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-white">{client.name}</h1>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                  {client.code}
                </span>
                <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">
                  {client.status}
                </span>
                <span className="rounded bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-purple-400 uppercase">
                  {client.tier}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                <span>{client.industry || "Enterprise Account"}</span>
                {client.website && (
                  <a
                    href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:underline"
                  >
                    <Globe className="h-3 w-3" />
                    <span>{client.website.replace("https://", "").replace("http://", "")}</span>
                  </a>
                )}
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {client.email}
                  </span>
                )}
                {client.owner && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Shield className="h-3 w-3 text-indigo-400" />
                    <span>Lead: {client.owner.firstName} {client.owner.lastName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={openEditClient}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5 text-blue-400" />
              <span>Edit Account</span>
            </button>
            <button
              onClick={() => setAddContactOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>Add Contact</span>
            </button>
            <button
              onClick={() => setLogActivityOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Log Touchpoint</span>
            </button>
          </div>
        </div>

        {/* 360 Aggregate Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="rounded-lg border border-slate-800/60 bg-[#0c1322] p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Open Pipeline</span>
            <p className="text-base font-bold text-white mt-0.5">
              ₹{stats.totalPipelineValue.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400">{stats.openDealsCount} active deal(s)</p>
          </div>

          <div className="rounded-lg border border-slate-800/60 bg-[#0c1322] p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Won Revenue</span>
            <p className="text-base font-bold text-emerald-400 mt-0.5">
              ₹{stats.totalWonRevenue.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400">Delivered contracts</p>
          </div>

          <div className="rounded-lg border border-slate-800/60 bg-[#0c1322] p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Contacts Roster</span>
            <p className="text-base font-bold text-white mt-0.5">{stats.totalContacts}</p>
            <p className="text-[10px] text-slate-400">Key stakeholders</p>
          </div>

          <div className="rounded-lg border border-slate-800/60 bg-[#0c1322] p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Interactions</span>
            <p className="text-base font-bold text-indigo-400 mt-0.5">{stats.totalActivities}</p>
            <p className="text-[10px] text-slate-400">Customer touchpoints</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 bg-[#090d16] px-2">
        {[
          { key: "overview", label: "Overview", icon: Building },
          { key: "contacts", label: `Contacts (${stats.totalContacts})`, icon: Users },
          { key: "opportunities", label: `Deals (${client.opportunities.length})`, icon: Briefcase },
          { key: "activities", label: `Timeline (${stats.totalActivities})`, icon: Clock },
          { key: "tasks", label: `Tasks (${client.tasks.length})`, icon: CheckSquare },
          { key: "proposals", label: `Proposals / Quotes`, icon: IndianRupee },
          { key: "documents", label: `Documents`, icon: FileText },
          { key: "billing", label: "Billing & Ledger", icon: IndianRupee },
          { key: "communication", label: "Communication", icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-3.5 py-3 text-xs font-semibold transition-all whitespace-nowrap",
                isActive
                  ? "border-blue-500 text-blue-400 bg-blue-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* AI Executive Record Summary */}
            <RecordAISummaryCard
              recordType="CLIENT"
              recordId={clientId}
              recordTitle={client.name}
            />

            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Corporate Account Specification
                </h3>
                <button
                  onClick={openEditClient}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Legal Name</span>
                  <p className="text-slate-200 font-medium mt-0.5">{client.name}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Account Code</span>
                  <p className="text-slate-200 font-mono mt-0.5">{client.code}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Industry</span>
                  <p className="text-slate-200 font-medium mt-0.5">{client.industry || "General Industry"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Tax / VAT ID</span>
                  <p className="text-slate-200 font-mono mt-0.5">{client.taxId || "Not on file"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Annual Revenue</span>
                  <p className="text-slate-200 font-medium mt-0.5">
                    {client.annualRevenue ? `₹${client.annualRevenue.toLocaleString()}` : "Confidential"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Account Tier</span>
                  <p className="text-slate-200 font-medium mt-0.5">{client.tier}</p>
                </div>
              </div>

              {client.notes && (
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Account Notes</span>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">{client.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                Primary Account Stakeholder
              </h3>
              {client.contacts.find((c: any) => c.isPrimary) || client.contacts[0] ? (
                (() => {
                  const pc = client.contacts.find((c: any) => c.isPrimary) || client.contacts[0];
                  return (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/30 text-xs font-bold text-blue-300">
                          {pc.firstName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white">{pc.firstName} {pc.lastName}</p>
                          <p className="text-[11px] text-slate-400">{pc.designation || "Stakeholder"}</p>
                        </div>
                      </div>
                      <div className="pt-2 text-[11px] text-slate-300 space-y-1">
                        <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-500" /> {pc.email}</p>
                        {pc.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-500" /> {pc.phone}</p>}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-xs text-slate-500">No primary contact designated yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Headquarters Address
              </h3>
              <p className="text-xs text-slate-300">
                {client.address || "1200 Commercial Complex"}
                <br />
                {client.city || "Mumbai"}, {client.state || "MH"} {client.postalCode || "400001"}
                <br />
                {client.country || "India"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Account Lifecycle Actions
              </h3>
              <button
                onClick={handleArchiveClient}
                className="w-full rounded border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Archive className="h-3.5 w-3.5 text-amber-400" />
                <span>Archive / Deactivate Client</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Contacts */}
      {activeTab === "contacts" && (
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#0f172a] px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Account Stakeholders & Contacts
            </h3>
            <button
              onClick={() => setAddContactOpen(true)}
              className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Contact</span>
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-[#0f172a]/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Contact Name</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {client.contacts.map((con: any) => (
                <tr key={con.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">
                    {con.firstName} {con.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{con.designation || "Stakeholder"}</td>
                  <td className="px-4 py-3 text-slate-400">{con.department || "Operations"}</td>
                  <td className="px-4 py-3 text-blue-400">{con.email}</td>
                  <td className="px-4 py-3 text-slate-400">{con.phone || "—"}</td>
                  <td className="px-4 py-3">
                    {con.isPrimary ? (
                      <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                        PRIMARY
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Contact</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteContact(con.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Delete Contact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Opportunities */}
      {activeTab === "opportunities" && (
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#0f172a] px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Active Deals & Contract Opportunities
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCreateDealOpen(true)}
                className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Deal</span>
              </button>
              <Link
                href="/app/crm/opportunities"
                className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors ml-2"
              >
                Open Kanban →
              </Link>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-[#0f172a]/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Opportunity Name</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Contract Value</th>
                <th className="px-4 py-3">Probability</th>
                <th className="px-4 py-3">Expected Close</th>
                <th className="px-4 py-3">Deal Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {client.opportunities.map((opp: any) => (
                <tr key={opp.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{opp.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[9px] font-semibold uppercase",
                        opp.stage === "CLOSED_WON"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : opp.stage === "NEGOTIATION"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      )}
                    >
                      {opp.stage.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-200">
                    ₹{opp.value.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{opp.probability}%</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(opp.expectedCloseDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {opp.owner ? `${opp.owner.firstName} ${opp.owner.lastName}` : "Unassigned"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Activity Timeline */}
      {activeTab === "activities" && (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Customer 360 Activity Feed
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Unified multi-channel customer timeline across meetings, proposals, documents, and notes.
              </p>
            </div>
            <button
              onClick={() => setLogActivityOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Interaction</span>
            </button>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {client.activities.map((act: any) => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-6 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#0f172a] border border-slate-700">
                  {getActivityIcon(act.type)}
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-[#0c1322] p-4 transition-all hover:border-slate-700">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-semibold uppercase text-slate-300">
                        {act.type}
                      </span>
                      <h4 className="font-bold text-white">{act.subject}</h4>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(act.performedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {act.description && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {act.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                    <span>Logged by {act.performedBy.firstName} {act.performedBy.lastName}</span>
                    <span>•</span>
                    <span>{act.performedBy.designation || "Staff"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Tasks */}
      {activeTab === "tasks" && (
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Tasks Assigned for {client.name}
            </h3>
            <button
              onClick={() => setCreateTaskOpen(true)}
              className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Task</span>
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {client.tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active tasks tagged to this client account.
              </div>
            ) : (
              client.tasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{task.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{task.description}</p>
                    <span className="text-[10px] text-slate-500">
                      Assignee: {task.assignee?.firstName ? `${task.assignee.firstName} ${task.assignee.lastName}` : "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 uppercase">
                      {task.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                    </span>
                    {task.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold hover:bg-emerald-600/30"
                      >
                        ✓ Done
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Proposals & Quotations */}
      {activeTab === "proposals" && (
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Client Proposals & Commercial Quotations
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Drafted quotes, line items, taxes, discounts, and approval statuses.
              </p>
            </div>
            <button
              onClick={() => setCreateProposalOpen(true)}
              className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Proposal</span>
            </button>
          </div>

          {loadingProposals ? (
            <div className="p-10 text-center text-xs text-slate-400">Loading proposals...</div>
          ) : proposals.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No commercial proposals or quotations generated yet.
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((prop) => (
                <div key={prop.id} className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400">{prop.proposalNumber}</span>
                        <h4 className="font-bold text-white">{prop.title}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Issued by {prop.performedBy?.firstName} {prop.performedBy?.lastName} on {new Date(prop.performedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={prop.status}
                        onChange={(e) => handleUpdateProposalStatus(prop.id, e.target.value)}
                        className="rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-200 border border-slate-700"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING_APPROVAL">Pending Approval</option>
                        <option value="APPROVED">Approved</option>
                        <option value="SENT">Sent to Client</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ₹{(prop.grandTotal || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <table className="w-full text-left text-xs mb-3">
                    <thead className="bg-slate-900/60 text-[10px] uppercase text-slate-400 font-semibold">
                      <tr>
                        <th className="px-3 py-1.5">Line Item</th>
                        <th className="px-3 py-1.5 text-center">Qty</th>
                        <th className="px-3 py-1.5 text-right">Unit Price</th>
                        <th className="px-3 py-1.5 text-right">Discount</th>
                        <th className="px-3 py-1.5 text-right">Tax</th>
                        <th className="px-3 py-1.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-[11px] text-slate-300">
                      {prop.items.map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5 font-medium text-white">{it.name}</td>
                          <td className="px-3 py-1.5 text-center">{it.quantity}</td>
                          <td className="px-3 py-1.5 text-right">₹{it.unitPrice.toLocaleString()}</td>
                          <td className="px-3 py-1.5 text-right">{it.discountPercent || 0}%</td>
                          <td className="px-3 py-1.5 text-right">{it.taxPercent || 0}%</td>
                          <td className="px-3 py-1.5 text-right font-mono font-bold text-white">₹{it.lineTotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {prop.terms && (
                    <p className="text-[10px] text-slate-500 italic">Terms: {prop.terms}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Customer Documents */}
      {activeTab === "documents" && (
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Customer Documentation & Vault
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Master Service Agreements, NDAs, Quotations, and Compliance Records.
              </p>
            </div>
            <button
              onClick={() => setUploadDocOpen(true)}
              className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          {loadingDocs ? (
            <div className="p-10 text-center text-xs text-slate-400">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No customer documents uploaded for this client account yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f172a] text-[11px] uppercase font-semibold text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Document Title</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Uploaded By</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-medium text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <span>{doc.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-2">
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:underline text-[11px]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Billing & Ledger */}
      {activeTab === "billing" && (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Customer Financial Ledger & Billing History
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time commercial invoices, payment receipts, outstanding balances, and aging status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase border ${
                (billingSnapshot.overdueAmount || 0) > 0
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              }`}>
                {(billingSnapshot.invoicingStatus || "GOOD_STANDING").replace(/_/g, " ")}
              </span>
              <Link
                href="/app/finance/invoices"
                className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                + New Invoice
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="rounded-lg border border-slate-800 bg-[#0c1322] p-3.5">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Total Invoiced</span>
              <p className="text-base font-bold text-white mt-1">₹{(billingSnapshot.totalInvoiced || 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">All issued billing lines</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0c1322] p-3.5">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Total Collected</span>
              <p className="text-base font-bold text-emerald-400 mt-1">₹{(billingSnapshot.totalPaid || 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Remitted payments</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0c1322] p-3.5">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Outstanding AR Balance</span>
              <p className="text-base font-bold text-amber-400 mt-1">₹{(billingSnapshot.outstandingBalance || 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Unsettled commercial balance</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0c1322] p-3.5">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Overdue Delinquency</span>
              <p className={`text-base font-bold mt-1 ${
                (billingSnapshot.overdueAmount || 0) > 0 ? "text-rose-400" : "text-slate-400"
              }`}>
                ₹{(billingSnapshot.overdueAmount || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">Past due payment terms</p>
            </div>
          </div>

          {/* Invoices List */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Client Invoices ({client.invoices?.length || 0})
            </h4>

            {(!client.invoices || client.invoices.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No invoices issued for this client account yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                  <thead className="bg-[#090d16] text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Invoice #</th>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Due Date</th>
                      <th className="px-3.5 py-2.5">Total</th>
                      <th className="px-3.5 py-2.5">Balance</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {client.invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-800/30">
                        <td className="px-3.5 py-2.5 font-mono font-medium text-white">{inv.invoiceNumber}</td>
                        <td className="px-3.5 py-2.5 text-slate-400">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                        <td className="px-3.5 py-2.5 text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="px-3.5 py-2.5 font-mono font-semibold text-white">₹{inv.total.toLocaleString()}</td>
                        <td className="px-3.5 py-2.5 font-mono font-bold text-amber-400">₹{inv.balance.toLocaleString()}</td>
                        <td className="px-3.5 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <Link
                            href={`/app/finance/invoices/${inv.id}`}
                            className="text-blue-400 hover:underline text-[11px]"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Communication & Discussions */}
      {activeTab === "communication" && (
        <RecordDiscussionWidget
          recordType="CLIENT"
          recordId={clientId}
          recordTitle={client.name}
          className="mt-2"
        />
      )}

      {/* Edit Client Modal */}
      {editClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-white">Edit Corporate Account Profile</h3>
              <button onClick={() => setEditClientOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Industry Sector</label>
                  <input
                    type="text"
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tier</label>
                  <select
                    value={editTier}
                    onChange={(e) => setEditTier(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ENTERPRISE">Enterprise</option>
                    <option value="MID_MARKET">Mid-Market</option>
                    <option value="SMB">SMB</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PROSPECT">Prospect</option>
                    <option value="LEAD">Lead</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="CHURNED">Churned</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Account Lead</label>
                  <select
                    value={editOwnerId}
                    onChange={(e) => setEditOwnerId(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Corporate Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditClientOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClient}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmittingClient ? "Saving Changes..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Activity Modal */}
      {logActivityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-semibold text-white">Log Customer Touchpoint</h3>
              </div>
              <button onClick={() => setLogActivityOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLogActivity} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Interaction Type</label>
                <select
                  value={actType}
                  onChange={(e) => setActType(e.target.value as any)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="NOTE">Discussion Note</option>
                  <option value="CALL">Phone Call</option>
                  <option value="MEETING">Video / In-Person Meeting</option>
                  <option value="EMAIL">Email Correspondence</option>
                  <option value="PROPOSAL">Proposal / Quote Transmittal</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solution Discovery Alignment"
                  value={actSubject}
                  onChange={(e) => setActSubject(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Summary</label>
                <textarea
                  rows={3}
                  placeholder="Key topics discussed, client feedback, action items..."
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setLogActivityOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAct}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmittingAct ? "Saving..." : "Record to Timeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {addContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <h3 className="text-sm font-semibold text-white">Add Account Contact</h3>
              </div>
              <button onClick={() => setAddContactOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddContact} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={conFirst}
                    onChange={(e) => setConFirst(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={conLast}
                    onChange={(e) => setConLast(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={conEmail}
                  onChange={(e) => setConEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. VP Operations"
                    value={conTitle}
                    onChange={(e) => setConTitle(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={conPhone}
                    onChange={(e) => setConPhone(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="primaryContact"
                  checked={conPrimary}
                  onChange={(e) => setConPrimary(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="primaryContact" className="text-xs text-slate-300 cursor-pointer">
                  Designate as Primary Account Contact
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddContactOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCon}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmittingCon ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Deal Modal */}
      {createDealOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-white">Create New Deal Opportunity</h3>
              <button onClick={() => setCreateDealOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Platform Licensing"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Contract Value (₹) *</label>
                  <input
                    type="number"
                    required
                    value={dealValue}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Stage</label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="DISCOVERY">Discovery (25%)</option>
                    <option value="PROPOSAL">Proposal (50%)</option>
                    <option value="NEGOTIATION">Negotiation (75%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Expected Close Date</label>
                  <input
                    type="date"
                    value={dealCloseDate}
                    onChange={(e) => setDealCloseDate(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Deal Owner</label>
                  <select
                    value={dealOwnerId}
                    onChange={(e) => setDealOwnerId(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Default (Self)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateDealOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDeal}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmittingDeal ? "Creating..." : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {createTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-white">Create Client Task</h3>
              <button onClick={() => setCreateTaskOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Executive Briefing"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Assignee</label>
                <select
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Assign to Me</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateTaskOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmittingTask ? "Saving..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Proposal Modal */}
      {createProposalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-white">Generate Commercial Proposal / Quotation</h3>
              <button onClick={() => setCreateProposalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Proposal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Services & Deployment Quotation"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-300 uppercase text-[10px]">Quotation Line Items</label>
                  <button
                    type="button"
                    onClick={() => setPropItems([...propItems, { name: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 18 }])}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {propItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-900/60 p-2 rounded-md border border-slate-800">
                      <input
                        type="text"
                        required
                        placeholder="Item / Service Name"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...propItems];
                          updated[idx].name = e.target.value;
                          setPropItems(updated);
                        }}
                        className="col-span-4 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...propItems];
                          updated[idx].quantity = Number(e.target.value);
                          setPropItems(updated);
                        }}
                        className="col-span-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const updated = [...propItems];
                          updated[idx].unitPrice = Number(e.target.value);
                          setPropItems(updated);
                        }}
                        className="col-span-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white text-right"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Disc %"
                        value={item.discountPercent}
                        onChange={(e) => {
                          const updated = [...propItems];
                          updated[idx].discountPercent = Number(e.target.value);
                          setPropItems(updated);
                        }}
                        className="col-span-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white text-right"
                      />
                      <button
                        type="button"
                        onClick={() => setPropItems(propItems.filter((_, i) => i !== idx))}
                        className="col-span-2 text-rose-400 hover:text-rose-300 text-center"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Validity Date</label>
                  <input
                    type="date"
                    value={propValidity}
                    onChange={(e) => setPropValidity(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Terms & Conditions</label>
                  <input
                    type="text"
                    value={propTerms}
                    onChange={(e) => setPropTerms(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateProposalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProp}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmittingProp ? "Generating..." : "Save Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {uploadDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-white">Record Customer Document</h3>
              <button onClick={() => setUploadDocOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Services Agreement 2026"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">File Storage URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://storage.enterprise.corp/docs/msa.pdf"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Document Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="CONTRACT">Contract / Agreement</option>
                  <option value="PROPOSAL">Quotation / Proposal</option>
                  <option value="NDA">NDA</option>
                  <option value="INVOICE">Invoice Receipt</option>
                  <option value="COMPLIANCE">Compliance Certificate</option>
                  <option value="OTHER">Other Reference</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUploadDocOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoc}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmittingDoc ? "Recording..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
