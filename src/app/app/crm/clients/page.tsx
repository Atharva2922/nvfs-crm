"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CrmNav } from "@/modules/crm/components/crm-nav";
import {
  Building,
  Plus,
  Search,
  Filter,
  Users,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Globe,
  Phone,
  Mail,
  X,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ClientListItem {
  id: string;
  code: string;
  name: string;
  industry?: string | null;
  status: string;
  tier: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
  } | null;
  _count: {
    contacts: number;
    opportunities: number;
    activities: number;
    tasks: number;
  };
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
}

export default function ClientsDirectoryPage() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState<"ENTERPRISE" | "MID_MARKET" | "SMB">("MID_MARKET");
  const [ownerId, setOwnerId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (tierFilter !== "ALL") params.set("tier", tierFilter);

      const res = await fetch(`/api/crm/clients?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setClients(data.data.clients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=50");
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data.employees);
      }
    } catch {}
  };

  useEffect(() => {
    fetchClients();
  }, [searchTerm, statusFilter, tierFilter]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError("Company name is required");
      return;
    }

    try {
      setIsCreating(true);
      const res = await fetch("/api/crm/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          industry: industry || undefined,
          website: website || undefined,
          email: email || undefined,
          phone: phone || undefined,
          tier,
          ownerId: ownerId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error?.message || "Failed to create client");
        return;
      }

      setCreateModalOpen(false);
      setName("");
      setIndustry("");
      setWebsite("");
      setEmail("");
      setPhone("");
      fetchClients();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">Active</span>;
      case "PROSPECT":
        return <span className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400 uppercase">Prospect</span>;
      case "LEAD":
        return <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 uppercase">Lead</span>;
      case "CHURNED":
        return <span className="rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold text-rose-400 uppercase">Churned</span>;
      default:
        return <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 uppercase">{status}</span>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "ENTERPRISE":
        return <span className="rounded bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-400 uppercase">Enterprise</span>;
      case "MID_MARKET":
        return <span className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400 uppercase">Mid-Market</span>;
      default:
        return <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 uppercase">SMB</span>;
    }
  };

  return (
    <div className="space-y-6">
      <CrmNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Corporate Client Accounts"
          description="Client directory, account management, multi-stakeholder contacts, and Customer 360 overviews."
        />
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-lg border border-slate-800 bg-[#0f172a]/90 p-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">Active Clients</option>
            <option value="PROSPECT">Prospects</option>
            <option value="LEAD">Leads</option>
            <option value="INACTIVE">Inactive</option>
            <option value="CHURNED">Churned</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Account Tiers</option>
            <option value="ENTERPRISE">Enterprise Tier</option>
            <option value="MID_MARKET">Mid-Market Tier</option>
            <option value="SMB">SMB Tier</option>
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search company, code, industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-full rounded-md border border-slate-800 bg-slate-900 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0c1322] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">Loading client directory...</div>
        ) : clients.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500">No client accounts found matching criteria.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-[#0f172a] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Client Account</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Account Lead</th>
                <th className="px-4 py-3 text-center">Contacts</th>
                <th className="px-4 py-3 text-center">Deals</th>
                <th className="px-4 py-3 text-right">Customer 360</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link href={`/app/crm/clients/${c.id}`} className="group flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {c.name}
                        </span>
                        <span className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                          {c.code}
                        </span>
                      </div>
                      {c.website && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Globe className="h-2.5 w-2.5" />
                          {c.website.replace("https://", "")}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                  <td className="px-4 py-3">{getTierBadge(c.tier)}</td>
                  <td className="px-4 py-3 text-slate-300">{c.industry || "General"}</td>
                  <td className="px-4 py-3">
                    {c.owner ? (
                      <span className="text-slate-200 font-medium">
                        {c.owner.firstName} {c.owner.lastName}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                      {c._count.contacts}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-blue-950 px-2 py-0.5 text-[11px] font-mono text-blue-300 border border-blue-800/50">
                      {c._count.opportunities}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/crm/clients/${c.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:bg-slate-700 transition-colors"
                    >
                      <span>360 Profile</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Client Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-semibold text-white">Create Corporate Client Account</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Cybernetics Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Industry</label>
                  <input
                    type="text"
                    placeholder="e.g. Technology, Healthcare"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Account Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ENTERPRISE">Enterprise Tier</option>
                    <option value="MID_MARKET">Mid-Market Tier</option>
                    <option value="SMB">SMB Tier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="info@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Primary Phone</label>
                  <input
                    type="tel"
                    placeholder="+1-800-..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Account Owner</label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Current User</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
