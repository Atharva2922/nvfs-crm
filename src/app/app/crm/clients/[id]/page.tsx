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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Client360Page() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "contacts" | "opportunities" | "activities" | "tasks" | "billing"
  >("overview");

  // Modals
  const [logActivityOpen, setLogActivityOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);

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

  useEffect(() => {
    if (clientId) fetchClient360();
  }, [clientId]);

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

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <CrmNav />
        <div className="p-20 text-center text-xs text-slate-500">
          Loading Customer 360 specification...
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
      case "STATUS_CHANGE":
        return <Sparkles className="h-3.5 w-3.5 text-indigo-400" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <CrmNav />

      {/* Back Link & Header */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/app/crm/clients" className="flex items-center gap-1 hover:text-slate-200 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Clients Directory</span>
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-medium">{client.name}</span>
      </div>

      {/* Customer 360 Header Profile Card */}
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
                    href={client.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:underline"
                  >
                    <Globe className="h-3 w-3" />
                    <span>{client.website.replace("https://", "")}</span>
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

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
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
              <span>Log Activity</span>
            </button>
          </div>
        </div>

        {/* 360 Metrics Row */}
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
            <p className="text-[10px] text-slate-400">Account stakeholders</p>
          </div>

          <div className="rounded-lg border border-slate-800/60 bg-[#0c1322] p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Interactions</span>
            <p className="text-base font-bold text-indigo-400 mt-0.5">{stats.totalActivities}</p>
            <p className="text-[10px] text-slate-400">Timeline events</p>
          </div>
        </div>
      </div>

      {/* 360 Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-800 bg-[#090d16] px-2">
        {[
          { key: "overview", label: "Overview & Corporate Profile", icon: Building },
          { key: "contacts", label: `Contacts (${stats.totalContacts})`, icon: Users },
          { key: "opportunities", label: `Deals & Pipeline (${client.opportunities.length})`, icon: Briefcase },
          { key: "activities", label: `Activity Timeline (${stats.totalActivities})`, icon: Clock },
          { key: "tasks", label: `Tasks (${client.tasks.length})`, icon: CheckSquare },
          { key: "billing", label: "Billing & Ledger", icon: IndianRupee },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all whitespace-nowrap",
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

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
                Corporate Account Details
              </h3>
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
                Primary Contact
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
                          <p className="text-[11px] text-slate-400">{pc.designation}</p>
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
          </div>
        </div>
      )}

      {/* Contacts Tab */}
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
                <th className="px-4 py-3 text-right">Role</th>
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
                  <td className="px-4 py-3 text-right">
                    {con.isPrimary ? (
                      <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                        PRIMARY
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Contact</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Opportunities Tab */}
      {activeTab === "opportunities" && (
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#0f172a] px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Active Deals & Contract Opportunities
            </h3>
            <Link
              href="/app/crm/opportunities"
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Open Kanban Pipeline →
            </Link>
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

      {/* Activity Timeline Tab */}
      {activeTab === "activities" && (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Customer 360 Activity Feed
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every customer touchpoint across phone calls, video meetings, proposals, and status adjustments.
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
                {/* Node Dot */}
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
                    <span>{act.performedBy.designation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Associated Tasks Tab */}
      {activeTab === "tasks" && (
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Tasks Assigned for {client.name}
            </h3>
            <Link
              href="/app/tasks"
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Open Tasks Hub →
            </Link>
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
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {task.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Billing & Ledger Tab */}
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

          {/* Payments List */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Recorded Payment Remittances ({client.payments?.length || 0})
            </h4>

            {(!client.payments || client.payments.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No payment remittances recorded yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                  <thead className="bg-[#090d16] text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Reference</th>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Method</th>
                      <th className="px-3.5 py-2.5">Amount</th>
                      <th className="px-3.5 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {client.payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-800/30">
                        <td className="px-3.5 py-2.5 font-mono font-medium text-white">{p.paymentReference}</td>
                        <td className="px-3.5 py-2.5 text-slate-400">{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td className="px-3.5 py-2.5">{p.paymentMethod.replace(/_/g, " ")}</td>
                        <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-400">+₹{p.amount.toLocaleString()}</td>
                        <td className="px-3.5 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                          }`}>
                            {p.status}
                          </span>
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

      {/* Log Activity Modal */}
      {logActivityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-semibold text-white">Log Customer 360 Interaction</h3>
              </div>
              <button
                onClick={() => setLogActivityOpen(false)}
                className="text-slate-400 hover:text-white"
              >
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
                  <option value="NOTE">General Discussion Note</option>
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
                  placeholder="e.g. Q4 Executive Budget Alignment Call"
                  value={actSubject}
                  onChange={(e) => setActSubject(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Interaction Summary</label>
                <textarea
                  rows={3}
                  placeholder="Detailed notes on topics discussed, client feedback, or agreed action items..."
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
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
              <button
                onClick={() => setAddContactOpen(false)}
                className="text-slate-400 hover:text-white"
              >
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
    </div>
  );
}
