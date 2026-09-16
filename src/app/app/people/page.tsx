"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, Building, User, Search } from "lucide-react";

interface PersonItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  designation: string;
  departmentName?: string | null;
  managerName?: string | null;
  avatarUrl?: string | null;
  workMode: string;
}

export default function CompanyPeoplePage() {
  const [people, setPeople] = useState<PersonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "MY_TEAM" | "MY_DEPT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchPeople() {
      try {
        setLoading(true);
        const res = await fetch("/api/employees");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setPeople(
              json.data.map((e: any) => ({
                id: e.id,
                employeeNumber: e.employeeNumber,
                firstName: e.firstName,
                lastName: e.lastName,
                email: e.email,
                phone: e.phone,
                designation: e.designation,
                departmentName: e.department?.name,
                managerName: e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : "N/A",
                avatarUrl: e.avatarUrl,
                workMode: e.workMode,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPeople();
  }, []);

  const filteredPeople = people.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.designation.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Company Directory"
        description="Connect and collaborate with authorized colleagues across the enterprise."
        badge={
          <Badge variant="gold" size="sm" className="gap-1">
            <Users className="h-3 w-3 text-amber-500" />
            <span>People & Teams</span>
          </Badge>
        }
      />

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Organization Directory
          </button>
          <button
            onClick={() => setActiveTab("MY_TEAM")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "MY_TEAM"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            My Team
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search colleagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading directory...</div>
      ) : filteredPeople.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">No colleagues found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((person) => (
            <div
              key={person.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs flex items-start gap-3.5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-bold text-base shadow-sm">
                {person.firstName[0]}
                {person.lastName[0]}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {person.firstName} {person.lastName}
                  </h4>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {person.workMode}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                  {person.designation}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building className="h-3 w-3 text-slate-400" />
                    <span>{person.departmentName || "General"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 text-blue-500" />
                    <a href={`mailto:${person.email}`} className="hover:underline truncate">
                      {person.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
