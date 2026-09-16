"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Shield,
  Clock,
  UserCheck,
  Users,
  Activity,
  UserX,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/employees/${id}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to load employee details");
        }

        setEmployeeData(json.data.employee);
        setActivityLogs(json.data.activityLogs || []);
      } catch (err: any) {
        setError(err.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading employee profile..." />;
  }

  if (error || !employeeData) {
    return (
      <div className="space-y-4">
        <Link
          href="/app/hr/employees"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Employee Directory</span>
        </Link>
        <ErrorState
          title="Employee Profile Unavailable"
          message={error || "Profile could not be found."}
        />
      </div>
    );
  }

  const emp = employeeData;

  const PROFILE_TABS = [
    { id: "overview", label: "Overview", icon: Users },
    { id: "organization", label: "Organization & Reporting", icon: Building },
    { id: "employment", label: "Employment & System Access", icon: Shield },
    { id: "activity", label: "Audit & Activity Log", icon: Activity, count: activityLogs.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/app/hr/employees"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Employee Directory</span>
      </Link>

      {/* Profile Header Card */}
      <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar
              name={`${emp.firstName} ${emp.lastName}`}
              size="lg"
              className="h-16 w-16 text-lg border-2 border-slate-700"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {emp.firstName} {emp.lastName}
                </h1>
                <Badge
                  variant={emp.employmentStatus === "ACTIVE" ? "success" : "warning"}
                  size="sm"
                >
                  {emp.employmentStatus}
                </Badge>
                <span className="font-mono text-xs text-blue-400 font-semibold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                  {emp.employeeNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {emp.designation} • {emp.department?.name || "Corporate"}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <span>{emp.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>{emp.location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300 border border-slate-700">
              Work Mode: {emp.workMode}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={PROFILE_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Personal & Contact Profile</CardTitle>
              <CardDescription>Core identity and communication details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Full Legal Name</span>
                <span className="font-medium text-slate-100">{emp.firstName} {emp.lastName}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Official Email</span>
                <span className="font-mono text-blue-400">{emp.email}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Phone Number</span>
                <span className="text-slate-200">{emp.phone || "Not on file"}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Emergency Contact</span>
                <span className="text-slate-200">{emp.emergencyContact || "None listed"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Location & Work Setup</CardTitle>
              <CardDescription>Operational premises and schedule modality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Primary Office Location</span>
                <span className="text-slate-200">{emp.location}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Work Mode</span>
                <span className="font-medium text-slate-100">{emp.workMode}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Hire / Effective Date</span>
                <span className="font-mono text-slate-200">{formatDate(emp.hireDate)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Corporate Entity</span>
                <span className="text-slate-200">{emp.organization?.name}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: ORGANIZATION & REPORTING */}
      {activeTab === "organization" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Department Assignment</CardTitle>
                <CardDescription>Corporate structural unit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded bg-slate-900/60 border border-slate-800">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100 text-sm">
                      {emp.department?.name || "Unassigned"}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Department Code: {emp.department?.code}
                    </span>
                  </div>
                  <Badge variant="outline" size="sm">
                    {emp.department?.code}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {emp.department?.description || "Corporate strategic division"}
                </p>
              </CardContent>
            </Card>

            {/* Direct Line Manager Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Direct Line Manager</CardTitle>
                <CardDescription>Immediate supervisor in hierarchy tree</CardDescription>
              </CardHeader>
              <CardContent>
                {emp.manager ? (
                  <div className="flex items-center justify-between p-3 rounded bg-slate-900/60 border border-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={`${emp.manager.firstName} ${emp.manager.lastName}`}
                        size="md"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-100">
                          {emp.manager.firstName} {emp.manager.lastName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {emp.manager.designation}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {emp.manager.email}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/app/hr/employees/${emp.manager.id}`}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300"
                    >
                      View Profile →
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 rounded bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    This executive reports directly to the Chairperson / Board of Directors.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Direct Reports Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Direct Reports</CardTitle>
                  <CardDescription>
                    Employees directly reporting to {emp.firstName} {emp.lastName} ({emp.directReports?.length || 0} total)
                  </CardDescription>
                </div>
                <Badge variant="outline" size="sm">
                  Hierarchy Subordinates
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {emp.directReports && emp.directReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Profile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emp.directReports.map((report: any) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-mono text-xs font-semibold text-blue-400">
                          {report.employeeNumber}
                        </TableCell>
                        <TableCell className="font-medium text-slate-200">
                          {report.firstName} {report.lastName}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {report.department?.name || "—"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {report.designation}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success" size="sm">
                            {report.employmentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/app/hr/employees/${report.id}`}
                            className="text-xs font-medium text-blue-400 hover:text-blue-300"
                          >
                            Open →
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  No direct reports registered under this employee in the reporting hierarchy.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: EMPLOYMENT & SYSTEM ACCESS */}
      {activeTab === "employment" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Employment Parameters</CardTitle>
              <CardDescription>Corporate classification & contract lifecycle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Employee Identifier</span>
                <span className="font-mono font-semibold text-blue-400">{emp.employeeNumber}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Employment Type</span>
                <span className="font-medium text-slate-200">{emp.employmentType}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Employment Status</span>
                <Badge variant={emp.employmentStatus === "ACTIVE" ? "success" : "warning"} size="sm">
                  {emp.employmentStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Joining Date</span>
                <span className="font-mono text-slate-200">{formatDate(emp.hireDate)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Platform System Access</CardTitle>
              <CardDescription>Single source of truth credentials binding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {emp.user ? (
                <>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">System Account Status</span>
                    <Badge variant={emp.user.isActive ? "success" : "danger"} size="sm">
                      {emp.user.isActive ? "Active Portal Access" : "Suspended"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Assigned System Role</span>
                    <span className="font-semibold text-purple-400 font-mono">
                      {emp.user.role.name} ({emp.user.role.code})
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Role Authority Level</span>
                    <span className="font-mono text-slate-200">
                      Tier {emp.user.role.level} / 100
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Last Authentication</span>
                    <span className="font-mono text-slate-400">
                      {emp.user.lastLoginAt ? formatDateTime(emp.user.lastLoginAt) : "Never logged in"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 rounded bg-slate-900/40 border border-dashed border-slate-800">
                  <UserX className="h-8 w-8 text-slate-500" />
                  <span className="font-medium text-slate-300">No Portal Login Provisioned</span>
                  <p className="text-slate-500 text-[11px] max-w-xs leading-relaxed">
                    This employee does not possess a system user account. Employee records remain autonomous from system login credentials.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: AUDIT ACTIVITY */}
      {activeTab === "activity" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Audit & Mutation Trail</CardTitle>
            <CardDescription>
              Immutable record of changes, status updates, and logins involving this employee
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Timestamp</TableHead>
                  <TableHead>Event Action</TableHead>
                  <TableHead>Triggered By</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Change Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-500">
                      No audit events recorded for this employee profile.
                    </TableCell>
                  </TableRow>
                ) : (
                  activityLogs.map((log) => {
                    let parsedNew = null;
                    if (log.newValue) {
                      try {
                        parsedNew = JSON.parse(log.newValue);
                      } catch {
                        parsedNew = log.newValue;
                      }
                    }

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="info" size="sm">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">
                          {log.actor?.employee
                            ? `${log.actor.employee.firstName} ${log.actor.employee.lastName}`
                            : log.actor?.email || "System"}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-slate-400">
                          {log.ipAddress || "Internal"}
                        </TableCell>
                        <TableCell>
                          {parsedNew ? (
                            <pre className="max-w-xs truncate rounded bg-slate-950/80 p-1 font-mono text-[10px] text-slate-300 border border-slate-800">
                              {typeof parsedNew === "object"
                                ? JSON.stringify(parsedNew)
                                : parsedNew}
                            </pre>
                          ) : (
                            <span className="text-[11px] text-slate-600">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
