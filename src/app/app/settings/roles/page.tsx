"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  ShieldCheck,
  Check,
  X,
  Lock,
  ArrowLeft,
  Users,
  Settings,
  Shield,
  Layers,
} from "lucide-react";

interface RoleItem {
  id: string;
  code: string;
  name: string;
  level: number;
  description?: string | null;
  rolePermissions: { permissionId: string; permission: { id: string; code: string; module: string; description: string } }[];
  _count: { users: number };
}

interface PermissionItem {
  id: string;
  code: string;
  module: string;
  resource: string;
  action: string;
  description?: string | null;
}

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRolesData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/roles");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load roles");
      }

      setRoles(json.data.roles);
      setAllPermissions(json.data.allPermissions);

      // Default select the first non-superadmin role or superadmin
      if (!selectedRole && json.data.roles.length > 0) {
        setSelectedRole(json.data.roles[0]);
      } else if (selectedRole) {
        const updated = json.data.roles.find((r: RoleItem) => r.id === selectedRole.id);
        if (updated) setSelectedRole(updated);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const handleTogglePermission = async (permissionId: string, currentlyAssigned: boolean) => {
    if (!selectedRole) return;
    if (selectedRole.code === "SUPER_ADMIN") {
      alert("Super Admin permissions cannot be modified. Super Admin has permanent unrestricted access.");
      return;
    }

    try {
      setActionLoading(true);
      const action = currentlyAssigned ? "revoke" : "assign";
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: selectedRole.id,
          permissionId,
          action,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update permission");
      }

      await fetchRolesData();
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading role permissions matrix..." />;
  if (error) return <ErrorState message={error} retry={fetchRolesData} />;

  // Group permissions by module
  const permissionsByModule: Record<string, PermissionItem[]> = {};
  allPermissions.forEach((p) => {
    if (!permissionsByModule[p.module]) {
      permissionsByModule[p.module] = [];
    }
    permissionsByModule[p.module].push(p);
  });

  const isPermissionAssigned = (permId: string) => {
    if (!selectedRole) return false;
    if (selectedRole.code === "SUPER_ADMIN") return true;
    return selectedRole.rolePermissions.some((rp) => rp.permissionId === permId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role & Permission Matrix"
        description="Fine-grained Role-Based Access Control (RBAC) across leadership tiers, C-Suite, department heads, and employees."
        badge={
          <Badge variant="info" size="sm" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            <span>Granular RBAC</span>
          </Badge>
        }
        actions={
          <Link
            href="/app/settings"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Settings</span>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Roles List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              System Roles ({roles.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Ranked by Tier
            </span>
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = selectedRole?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r)}
                  className={`w-full text-left rounded-lg border p-3.5 transition-all shadow-xs ${
                    isSelected
                      ? "border-blue-500 dark:border-blue-500/80 bg-blue-50/80 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-500/40"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {r.name}
                    </span>
                    <Badge variant={r.level >= 80 ? "info" : "outline"} size="sm">
                      Level {r.level}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                    {r.description || "System authority level"}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    <span>Code: {r.code}</span>
                    <span>{r._count.users} Users</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Permissions Matrix for Selected Role */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRole && (
            <>
              {/* Selected Role Header */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {selectedRole.name}
                      </h3>
                      <span className="font-mono text-xs text-purple-700 dark:text-purple-300 font-semibold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/40">
                        {selectedRole.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {selectedRole.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">
                      {selectedRole.code === "SUPER_ADMIN"
                        ? "All (Unrestricted)"
                        : `${selectedRole.rolePermissions.length} Active Permissions`}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Permissions Accordion / Modules */}
              <div className="space-y-4">
                {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                  <Card key={moduleName} className="overflow-hidden">
                    <CardHeader className="py-2.5 px-4 bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            {moduleName} Domain
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {perms.length} Permissions
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {perms.map((perm) => {
                          const assigned = isPermissionAssigned(perm.id);
                          const isSuper = selectedRole.code === "SUPER_ADMIN";

                          return (
                            <div
                              key={perm.id}
                              className="flex items-center justify-between p-3.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                            >
                              <div className="space-y-0.5 max-w-md">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-200">
                                    {perm.code}
                                  </span>
                                  <Badge variant="outline" size="sm" className="text-[9px]">
                                    {perm.action}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                  {perm.description || "Operational permission"}
                                </p>
                              </div>

                              <div>
                                {isSuper ? (
                                  <Badge variant="success" size="sm" className="gap-1">
                                    <Check className="h-3 w-3" />
                                    <span>Granted</span>
                                  </Badge>
                                ) : (
                                  <Button
                                    variant={assigned ? "primary" : "outline"}
                                    size="xs"
                                    disabled={actionLoading}
                                    onClick={() => handleTogglePermission(perm.id, assigned)}
                                    className="gap-1 min-w-20"
                                  >
                                    {assigned ? (
                                      <>
                                        <Check className="h-3 w-3" />
                                        <span>Assigned</span>
                                      </>
                                    ) : (
                                      <>
                                        <X className="h-3 w-3" />
                                        <span>Revoked</span>
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
