"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  Users,
  Lock,
  Unlock,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Permission {
  id: string;
  code: string;
  module: string;
  resource: string;
  action: string;
  description?: string | null;
}

interface Role {
  id: string;
  code: string;
  name: string;
  level: number;
  description?: string | null;
  _count: { users: number };
  rolePermissions: { permission: Permission }[];
}

interface ToastMsg {
  id: string;
  type: "success" | "error";
  text: string;
}

const MODULE_COLORS: Record<string, string> = {
  employees: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  hr: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  finance: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  payroll: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  inventory: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  audit: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  settings: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  organization: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

function moduleColor(mod: string) {
  return MODULE_COLORS[mod] ?? "bg-slate-500/10 text-slate-500 border-slate-500/20";
}

export function RolePermissionsPanel() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const addToast = (type: "success" | "error", text: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const fetchData = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/roles");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed");
      const fetchedRoles: Role[] = json.data.roles;
      setRoles(fetchedRoles);
      setAllPermissions(json.data.allPermissions);
      if (!selectedRoleId && fetchedRoles.length > 0) {
        setSelectedRoleId(fetchedRoles[0].id);
      }
      // Default expand all modules
      const mods = [...new Set(json.data.allPermissions.map((p: Permission) => p.module))] as string[];
      setExpandedModules(Object.fromEntries(mods.map((m) => [m, true])));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const grantedIds = new Set(selectedRole?.rolePermissions.map((rp) => rp.permission.id) ?? []);

  const togglePermission = async (permissionId: string, currentlyGranted: boolean) => {
    if (!selectedRoleId) return;
    const key = `${selectedRoleId}_${permissionId}`;
    setLoadingMap((prev) => ({ ...prev, [key]: true }));

    // Optimistic update
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRoleId) return r;
        if (currentlyGranted) {
          return {
            ...r,
            rolePermissions: r.rolePermissions.filter((rp) => rp.permission.id !== permissionId),
          };
        } else {
          const perm = allPermissions.find((p) => p.id === permissionId)!;
          return {
            ...r,
            rolePermissions: [...r.rolePermissions, { permission: perm }],
          };
        }
      })
    );

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: selectedRoleId,
          permissionId,
          action: currentlyGranted ? "revoke" : "assign",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Request failed");
      addToast("success", currentlyGranted ? "Permission revoked" : "Permission granted");
    } catch (e: any) {
      // Revert optimistic update
      fetchData();
      addToast("error", e.message || "Failed to update permission");
    } finally {
      setLoadingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Group permissions by module
  const groupedPermissions = allPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const modules = Object.keys(groupedPermissions).sort();

  const toggleModule = (mod: string) =>
    setExpandedModules((prev) => ({ ...prev, [mod]: !prev[mod] }));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Role Permissions Manager
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Toggle permissions for each role — changes apply instantly
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={fetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", fetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="m-4 flex items-center gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {fetching && !roles.length ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading roles & permissions...</span>
        </div>
      ) : (
        <div className="flex min-h-[520px]">
          {/* Role Sidebar */}
          <div className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 p-3 space-y-1 overflow-y-auto">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Roles ({roles.length})
            </p>
            {roles.map((role) => {
              const isSelected = role.id === selectedRoleId;
              const grantCount = role.rolePermissions.length;
              const totalCount = allPermissions.length;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2.5 transition-all group",
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold truncate">{role.name}</span>
                    {role._count.users > 0 && (
                      <span
                        className={cn(
                          "flex items-center gap-0.5 text-[9px] font-medium shrink-0",
                          isSelected ? "text-indigo-200" : "text-slate-400"
                        )}
                      >
                        <Users className="h-2.5 w-2.5" />
                        {role._count.users}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="flex-1 h-1 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isSelected ? "bg-white/60" : "bg-indigo-500"
                        )}
                        style={{ width: `${totalCount > 0 ? (grantCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-mono tabular-nums shrink-0",
                        isSelected ? "text-indigo-200" : "text-slate-400"
                      )}
                    >
                      {grantCount}/{totalCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Permission Matrix */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedRole && (
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedRole.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedRole.description ?? `Level ${selectedRole.level} role`}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {grantedIds.size} granted
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    {allPermissions.length - grantedIds.size} denied
                  </span>
                </div>
              </div>
            )}

            {modules.map((mod) => {
              const perms = groupedPermissions[mod];
              const grantedInModule = perms.filter((p) => grantedIds.has(p.id)).length;
              const expanded = expandedModules[mod] ?? true;

              return (
                <div
                  key={mod}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  {/* Module header */}
                  <button
                    onClick={() => toggleModule(mod)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          moduleColor(mod)
                        )}
                      >
                        {mod}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {grantedInModule} / {perms.length} granted
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-slate-400 transition-transform",
                        expanded ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </button>

                  {/* Permission rows */}
                  {expanded && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {perms.map((perm) => {
                        const granted = grantedIds.has(perm.id);
                        const key = `${selectedRoleId}_${perm.id}`;
                        const loading = loadingMap[key];

                        return (
                          <div
                            key={perm.id}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                          >
                            <div className="min-w-0 flex-1 mr-4">
                              <div className="flex items-center gap-1.5">
                                <code className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {perm.code}
                                </code>
                              </div>
                              {perm.description && (
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                  {perm.description}
                                </p>
                              )}
                            </div>

                            {/* Toggle */}
                            <button
                              id={`perm-toggle-${perm.id}`}
                              onClick={() => togglePermission(perm.id, granted)}
                              disabled={loading || selectedRole?.code === "SUPER_ADMIN"}
                              title={
                                selectedRole?.code === "SUPER_ADMIN"
                                  ? "Super Admin always has all permissions"
                                  : granted
                                  ? "Click to revoke"
                                  : "Click to grant"
                              }
                              className={cn(
                                "relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-all duration-200 focus:outline-none",
                                granted
                                  ? "bg-emerald-500 border-emerald-600"
                                  : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600",
                                loading && "opacity-60 cursor-wait",
                                selectedRole?.code === "SUPER_ADMIN" && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <span
                                className={cn(
                                  "absolute flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-200",
                                  granted ? "left-5" : "left-0.5"
                                )}
                              >
                                {loading ? (
                                  <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-400" />
                                ) : granted ? (
                                  <Check className="h-2.5 w-2.5 text-emerald-500" />
                                ) : (
                                  <X className="h-2.5 w-2.5 text-slate-400" />
                                )}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-200",
              t.type === "success"
                ? "bg-emerald-950/90 border-emerald-800 text-emerald-300"
                : "bg-rose-950/90 border-rose-800 text-rose-300"
            )}
          >
            {t.type === "success" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
