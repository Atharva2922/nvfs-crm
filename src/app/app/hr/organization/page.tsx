import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Network,
  Users,
  Building,
  ArrowDown,
  ArrowRight,
  Shield,
  ChevronRight,
  Lock,
} from "lucide-react";

import { HrNav } from "@/modules/hr/components/hr-nav";

export const dynamic = "force-dynamic";

export default async function OrganizationHierarchyPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.roleCode === "EMPLOYEE" || (currentUser.roleLevel || 10) < 30) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organization Hierarchy & Reporting Tree"
          description="Database-driven corporate structure."
        />
        <HrNav />
        <Card className="p-8 text-center space-y-4 max-w-xl mx-auto border-rose-500/30">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Access Restricted to Management
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              You are signed in as <span className="font-semibold text-blue-600 dark:text-blue-400">{currentUser?.roleName || "Staff Employee"}</span>. Standard staff accounts do not have permission to inspect organizational hierarchy trees.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/app/hr"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm"
            >
              <span>Go to My Personal HR Portal</span>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const [org, topLeaders, allEmployees] = await Promise.all([
    db.organization.findFirst({
      include: {
        departments: {
          include: {
            _count: { select: { employees: true } },
          },
        },
      },
    }),
    db.employee.findMany({
      where: { managerId: null },
      include: {
        department: true,
        user: { select: { role: true } },
        directReports: {
          include: {
            department: true,
            user: { select: { role: true } },
            directReports: {
              include: {
                department: true,
                user: { select: { role: true } },
                directReports: {
                  include: {
                    department: true,
                    user: { select: { role: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.employee.findMany({
      select: { id: true, designation: true, employmentStatus: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Hierarchy & Reporting Tree"
        description="Database-driven corporate structure, executive line management, and departmental spans of control."
        badge={
          <Badge variant="info" size="sm" className="gap-1">
            <Network className="h-3 w-3" />
            <span>Relational Hierarchy</span>
          </Badge>
        }
        actions={
          <Link
            href="/app/hr/employees"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span>Employee Directory</span>
          </Link>
        }
      />

      <HrNav />

      {/* Organization Boundary Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-slate-800 bg-[#0f172a] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{org?.name}</h3>
            <p className="text-xs text-slate-400 font-mono">
              Corporate Code: {org?.code} • {org?.departments.length} Operational Departments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm">
            {allEmployees.length} Total Personnel
          </Badge>
          <span className="text-xs text-slate-500 font-mono">
            {org?.currency} Base
          </span>
        </div>
      </div>

      {/* Visual Hierarchy Tree */}
      <div className="space-y-6">
        {topLeaders.map((leader) => (
          <div key={leader.id} className="space-y-4">
            {/* Level 1: Board / Chairperson */}
            <div className="flex justify-center">
              <div className="w-full max-w-md rounded-lg border-2 border-indigo-500/50 bg-[#0f172a] p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    Level 1: Board Leadership
                  </span>
                  <Badge variant="info" size="sm">
                    {leader.user?.role?.name || "Board Level"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar
                    name={`${leader.firstName} ${leader.lastName}`}
                    size="md"
                    className="border border-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/app/hr/employees/${leader.id}`}
                      className="text-sm font-bold text-white hover:text-blue-400 transition-colors truncate block"
                    >
                      {leader.firstName} {leader.lastName}
                    </Link>
                    <p className="text-xs text-slate-300 truncate">
                      {leader.designation}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500">
                      {leader.employeeNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Down Connector */}
            {leader.directReports.length > 0 && (
              <div className="flex justify-center">
                <div className="h-6 w-0.5 bg-slate-700" />
              </div>
            )}

            {/* Level 2: CEO & Direct Reports */}
            {leader.directReports.map((ceo) => (
              <div key={ceo.id} className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-full max-w-md rounded-lg border-2 border-blue-500/60 bg-[#0f172a] p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold">
                        Level 2: Chief Executive Officer
                      </span>
                      <Badge variant="success" size="sm">
                        Executive Suite
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={`${ceo.firstName} ${ceo.lastName}`}
                        size="md"
                        className="border border-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/app/hr/employees/${ceo.id}`}
                          className="text-sm font-bold text-white hover:text-blue-400 transition-colors truncate block"
                        >
                          {ceo.firstName} {ceo.lastName}
                        </Link>
                        <p className="text-xs text-slate-300 truncate">
                          {ceo.designation}
                        </p>
                        <span className="text-[10px] font-mono text-slate-500">
                          {ceo.employeeNumber}
                        </span>
                      </div>
                      <Badge variant="outline" size="sm">
                        {ceo.directReports.length} Direct Reports
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Level 3: Department Heads & CXO Suite */}
                {ceo.directReports.length > 0 && (
                  <>
                    <div className="flex justify-center">
                      <div className="h-6 w-0.5 bg-slate-700" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      {ceo.directReports.map((cxo) => (
                        <div
                          key={cxo.id}
                          className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5 space-y-2.5 hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-purple-400 font-medium">
                              {cxo.user?.role?.name || "Management"}
                            </span>
                            <Badge variant="outline" size="sm">
                              {cxo.department?.code || "CORP"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <Avatar
                              name={`${cxo.firstName} ${cxo.lastName}`}
                              size="sm"
                            />
                            <div className="truncate">
                              <Link
                                href={`/app/hr/employees/${cxo.id}`}
                                className="text-xs font-semibold text-white hover:text-blue-400 transition-colors block truncate"
                              >
                                {cxo.firstName} {cxo.lastName}
                              </Link>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {cxo.designation}
                              </span>
                            </div>
                          </div>

                          {/* Level 4: Subordinates under this CXO */}
                          {cxo.directReports.length > 0 ? (
                            <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                              <span className="text-[10px] font-mono text-slate-500 block">
                                Direct Reports ({cxo.directReports.length}):
                              </span>
                              {cxo.directReports.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/app/hr/employees/${sub.id}`}
                                  className="flex items-center justify-between rounded p-1 text-[11px] text-slate-300 hover:bg-slate-800/60 transition-colors"
                                >
                                  <span className="truncate">{sub.firstName} {sub.lastName}</span>
                                  <span className="text-[9px] font-mono text-blue-400">
                                    {sub.employeeNumber}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-600 italic pt-1">
                              No direct reports
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
