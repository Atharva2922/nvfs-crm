"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Building2,
  UserCheck,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonaUser {
  id: string;
  email: string;
  isActive: boolean;
  role: {
    id: string;
    code: string;
    name: string;
    level: number;
  };
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
    organization?: {
      id: string;
      code: string;
      name: string;
      primaryColor?: string;
    } | null;
    department?: {
      id: string;
      code: string;
      name: string;
    } | null;
    manager?: {
      id: string;
      firstName: string;
      lastName: string;
      designation: string;
    } | null;
  } | null;
}

interface RoleOption {
  id: string;
  code: string;
  name: string;
  level: number;
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-500 border-red-500/30",
  ADMIN: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  CHAIRPERSON: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  CEO: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  HR: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  COO: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  CFO: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  CIO: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  CTO: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  CMO: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  DEPARTMENT_HEAD: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  MANAGER: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  TEAM_LEAD: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  EMPLOYEE: "bg-slate-500/10 text-slate-300 border-slate-700/50",
};

export function PersonaRoleAssignmentPanel() {
  const [users, setUsers] = useState<PersonaUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users || []);
        setRoles(data.data.roles || []);
      }
    } catch (e: any) {
      showToast(e.message || "Failed to load personas", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    setSavingUserId(userId);
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ROLE",
          userId,
          roleId: newRoleId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update persona role");
      }

      const assignedRole = roles.find((r) => r.id === newRoleId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId && assignedRole
            ? { ...u, role: { ...u.role, ...assignedRole } }
            : u
        )
      );

      showToast(`Role successfully updated to ${assignedRole?.name || "new role"}`);
    } catch (e: any) {
      showToast(e.message || "Failed to update role", "error");
    } finally {
      setSavingUserId(null);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.employee?.firstName || ""} ${u.employee?.lastName || ""}`.toLowerCase();
    const email = u.email.toLowerCase();
    const designation = (u.employee?.designation || "").toLowerCase();
    const s = search.toLowerCase();

    const matchesSearch = fullName.includes(s) || email.includes(s) || designation.includes(s) || u.role.code.toLowerCase().includes(s);
    const orgCode = u.employee?.organization?.code || "PLATFORM";
    const matchesOrg = selectedOrg === "ALL" || orgCode === selectedOrg;
    const matchesRole = selectedRoleFilter === "ALL" || u.role.code === selectedRoleFilter;

    return matchesSearch && matchesOrg && matchesRole;
  });

  const orgs = Array.from(
    new Set(users.map((u) => u.employee?.organization?.code).filter(Boolean))
  ) as string[];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-sm overflow-hidden space-y-0">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold shadow-xl border animate-in slide-in-from-bottom-3",
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-300 border-rose-500/40"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <UserCheck className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Persona Role Governance & Assignment Center
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Super Admin can assign roles to each persona and oversee all data across the platform with global read-only protection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              <Lock className="h-3 w-3" />
              <span>Read-Only Audit Protection Active</span>
            </div>
          </div>
        </div>

        {/* Visual Architecture Chain Banner */}
        <div className="mt-4 p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300 overflow-x-auto">
          <span className="font-bold text-red-400">Super Admin</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="font-bold text-purple-400">Admin</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="font-bold text-blue-400">CEO</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="font-bold text-emerald-400">HR</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="font-bold text-cyan-400">COO / CFO / CIO / CMO</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="font-bold text-slate-400">Operations / Finance / Int&apos;l / Marketing Teams</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search persona by name, email, role, or title..."
            className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Company filter */}
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Companies</option>
            {orgs.map((o) => (
              <option key={o} value={o}>
                Company: {o}
              </option>
            ))}
          </select>

          {/* Role filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Persona Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.code}>
                {r.name} ({r.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Persona Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-3 px-4">Persona / Account</th>
              <th className="py-3 px-4">Organization</th>
              <th className="py-3 px-4">Department & Reporting Line</th>
              <th className="py-3 px-4">Current Role Level</th>
              <th className="py-3 px-4 text-right">Assign Persona Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                  <span>Loading personas and roles...</span>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No personas match your search query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSaving = savingUserId === u.id;
                const emp = u.employee;
                const orgCode = emp?.organization?.code || "PLATFORM";
                const roleBadgeClass = ROLE_COLORS[u.role.code] || "bg-slate-800 text-slate-300 border-slate-700";

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    {/* Persona / Account */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                          {(emp?.firstName?.[0] || u.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{emp ? `${emp.firstName} ${emp.lastName}` : u.email.split("@")[0]}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Organization */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium bg-slate-900/60 border-slate-700 text-slate-300">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <span>{orgCode}</span>
                      </div>
                    </td>

                    {/* Department & Reporting Line */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {emp?.designation || "Direct Platform Access"}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>Dept: {emp?.department?.name || "General"}</span>
                          {emp?.manager && (
                            <>
                              <span>•</span>
                              <span>Reports to: {emp.manager.firstName} {emp.manager.lastName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Current Role Level */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider",
                            roleBadgeClass
                          )}
                        >
                          {u.role.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Lvl {u.role.level}
                        </span>
                      </div>
                    </td>

                    {/* Assign Role Dropdown */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                        <select
                          disabled={isSaving}
                          value={u.role.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.code}) - L{r.level}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
