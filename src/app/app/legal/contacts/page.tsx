"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  BookOpen,
  Search,
  RefreshCw,
  Plus,
  Mail,
  Phone,
  Building2,
  Scale,
  X,
  UserCheck,
} from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactType, setContactType] = useState("EXTERNAL_COUNSEL");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [search, typeFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "ALL") params.set("contactType", typeFilter);

      const res = await fetch(`/api/legal/contacts?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setContacts(json.data);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/legal/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          firmName: firmName || undefined,
          role: role || undefined,
          email: email.trim(),
          phone: phone || undefined,
          contactType,
          notes: notes || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setName("");
        setFirmName("");
        setRole("");
        setEmail("");
        setPhone("");
        setNotes("");
        fetchContacts();
      } else {
        alert(json.error?.message || "Failed to create contact");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create contact");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <PageHeader
          title="External Legal Directory"
          description="Retained law firms, external lead counsel, specialized litigators, regulatory liaisons, and arbitration authorities."
        />
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Legal Contact</span>
        </button>
      </div>

      <LegalNav />

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search counsel by name, firm, role, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-amber-500/50 focus:outline-none w-full sm:w-auto"
        >
          <option value="ALL">All Types</option>
          <option value="EXTERNAL_COUNSEL">External Counsel</option>
          <option value="LAW_FIRM">Law Firm</option>
          <option value="REGULATOR">Regulator</option>
          <option value="GOVERNMENT">Government Agency</option>
          <option value="ARBITRATOR">Arbitrator / Mediator</option>
          <option value="NOTARY">Notary</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Directory Cards Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-2 rounded-xl border border-slate-800 bg-[#0d131f]">
          <BookOpen className="mx-auto h-8 w-8 text-slate-600" />
          <p className="text-sm font-semibold">No legal contacts found</p>
          <p className="text-xs text-slate-500">Register external law firms or retained counsel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{c.name}</h4>
                  <p className="text-xs text-amber-400 font-medium mt-0.5">{c.role || "Legal Counsel"}</p>
                </div>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                  {c.contactType.replace("_", " ")}
                </span>
              </div>

              {c.firmName && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>{c.firmName}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-blue-400" />
                  <a href={`mailto:${c.email}`} className="hover:underline text-slate-300">
                    {c.email}
                  </a>
                </div>
                {c.phone && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{c.phone}</span>
                  </div>
                )}
              </div>

              {c._count?.cases > 0 && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-purple-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5" />
                    {c._count.cases} Active Cases Assigned
                  </span>
                  <Link href="/app/legal/cases" className="hover:underline text-[11px]">
                    View Cases →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d131f] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-400" />
                Add External Legal Contact
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Contact / Lawyer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Zane, Esq."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Firm / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Pearson Hardman LLP"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Role / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Litigation Partner"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rachel@pearson.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Category</label>
                <select
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                >
                  <option value="EXTERNAL_COUNSEL">External Counsel</option>
                  <option value="LAW_FIRM">Law Firm</option>
                  <option value="REGULATOR">Regulator</option>
                  <option value="GOVERNMENT">Government Agency</option>
                  <option value="ARBITRATOR">Arbitrator / Mediator</option>
                  <option value="NOTARY">Notary</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-amber-600 px-4 py-1.5 text-white font-medium hover:bg-amber-500 disabled:opacity-50"
                >
                  {creating ? "Saving..." : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
