"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search } from "@/components/ui/search";
import { Pagination } from "@/components/ui/pagination";
import { Drawer } from "@/components/ui/drawer";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users,
  UserPlus,
  Network,
  Filter,
  Building,
  Briefcase,
  ExternalLink,
  Lock,
  Crown,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { HrNav } from "@/modules/hr/components/hr-nav";

// Roles classified as Leadership/Executive
const LEADERSHIP_ROLE_CODES = new Set([
  "SUPER_ADMIN", "ADMIN", "CHAIRPERSON", "CEO", "COO", "CFO", "CTO", "CMO", "HR",
]);

const LEADERSHIP_ROLE_COLORS: Record<string, string> = {
  CEO: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  COO: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  CFO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CTO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CMO: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  HR: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  CHAIRPERSON: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  ADMIN: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  SUPER_ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
};

function getRoleColor(code: string) {
  return LEADERSHIP_ROLE_COLORS[code] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

interface EmployeeItem {
  id: string;
  organizationId?: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  designation: string;
  employmentType: string;
  employmentStatus: string;
  workMode: string;
  location: string;
  hireDate: string;
  department?: { id: string; name: string; code: string } | null;
  manager?: { id: string; firstName: string; lastName: string; designation: string } | null;
  user?: { id: string; role: { code: string; name: string } } | null;
  organization?: { id: string; name: string; code: string } | null;
  onboardingStatus?: string;
  profileCompletion?: number;
}

import { useAuth } from "@/components/providers/auth-provider";

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // New Employee Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    designation: "",
    departmentId: "",
    managerId: "",
    employmentType: "FULL_TIME",
    workMode: "ON_SITE",
    location: "Headquarters (Mumbai)",
    emergencyContact: "",
    createSystemAccount: true,
    loginPassword: "",
    roleCode: "EMPLOYEE",
    immediateActive: false,
  });

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: "200", // fetch all so we can split client-side
        search,
        departmentId: selectedDept,
        status: selectedStatus,
      });

      if (currentUser?.activeCompany?.id) {
        params.set("organizationId", currentUser.activeCompany.id);
      }

      const res = await fetch(`/api/employees?${params.toString()}`, {
        headers: currentUser?.activeCompany?.id
          ? { "x-company-id": currentUser.activeCompany.id }
          : {},
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load directory");
      }

      setEmployees(json.data || []);
      setTotalPages(json.meta?.totalPages || 1);
      setTotalRecords(json.meta?.totalCount || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load directory");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDept, selectedStatus, currentUser?.activeCompany?.id]);

  // Isolate strictly by active company
  const currentOrgId = currentUser?.activeCompany?.id;
  const scopedEmployees = currentOrgId
    ? employees.filter((e) => !e.organizationId || e.organizationId === currentOrgId)
    : employees;

  // Split into leadership and staff
  const leadershipList = scopedEmployees.filter(
    (e) => LEADERSHIP_ROLE_CODES.has(e.user?.role?.code || "")
  );
  const staffList = scopedEmployees.filter(
    (e) => !LEADERSHIP_ROLE_CODES.has(e.user?.role?.code || "")
  );
  const displayedStaff = staffList.slice((page - 1) * 10, page * 10);
  const staffTotalPages = Math.max(1, Math.ceil(staffList.length / 10));

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Load department options scoped strictly to active company
  useEffect(() => {
    async function loadDepartments() {
      try {
        const companyParam = currentUser?.activeCompany?.id
          ? `?organizationId=${currentUser.activeCompany.id}`
          : "";
        const res = await fetch(`/api/hr/departments${companyParam}`, {
          headers: currentUser?.activeCompany?.id
            ? { "x-company-id": currentUser.activeCompany.id }
            : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setDepartments(json.data.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name })));
          }
        }
      } catch (err) {
        console.error("Failed to load departments:", err);
      }
    }
    loadDepartments();
  }, [currentUser?.activeCompany?.id]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUser?.activeCompany?.id ? { "x-company-id": currentUser.activeCompany.id } : {}),
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create employee");
      }

      const createdEmp = json.data;
      setIsDrawerOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        designation: "",
        departmentId: "",
        managerId: "",
        employmentType: "FULL_TIME",
        workMode: "ON_SITE",
        location: "Headquarters (Mumbai)",
        emergencyContact: "",
        createSystemAccount: true,
        loginPassword: "",
        roleCode: "EMPLOYEE",
        immediateActive: false,
      });

      if (createdEmp?.id) {
        window.location.href = `/app/hr/employees/${createdEmp.id}`;
      } else {
        fetchEmployees();
      }
    } catch (err: any) {
      setCreateError(err.message || "Error creating employee");
    } finally {
      setCreateLoading(false);
    }
  };

  if (currentUser && (currentUser.roleCode === "EMPLOYEE" || (currentUser.roleLevel || 10) < 30)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Employee Directory"
          description="Centralized personnel master records."
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
              You are signed in as <span className="font-semibold text-blue-600 dark:text-blue-400">{currentUser.roleName || "Staff Employee"}</span>. Standard staff accounts do not have permission to view full corporate directory lists or onboard personnel.
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        description="Centralized personnel master records, organizational assignments, and reporting lines."
        badge={
          <Badge variant="info" size="sm" className="gap-1">
            <Users className="h-3 w-3" />
            <span>Personnel Master</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/app/hr/organization"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Network className="h-3.5 w-3.5 text-blue-400" />
              <span>Org Hierarchy Tree</span>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsDrawerOpen(true)}
              className="gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Employee</span>
            </Button>
          </div>
        }
      />

      <HrNav />

      {/* ── Leadership & Executive Panel ── */}
      {leadershipList.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-amber-500/20 bg-amber-950/20">
            <Crown className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-300">Leadership &amp; Executive Directory</h2>
            <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              {leadershipList.length} members
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
            {leadershipList.map((emp) => {
              const roleCode = emp.user?.role?.code || "";
              const roleName = emp.user?.role?.name || emp.designation;
              const colorClass = getRoleColor(roleCode);
              return (
                <Link
                  key={emp.id}
                  href={`/app/hr/employees/${emp.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/60 p-3 hover:border-amber-500/40 hover:bg-amber-950/20 transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/20 text-sm font-bold text-amber-300">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider mt-0.5 ${colorClass}`}>
                      {roleCode || "EXEC"}
                    </span>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{emp.department?.name || "Executive Office"}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-slate-600 group-hover:text-amber-400 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Staff Employees</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">{staffList.length}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1 md:justify-end">
          <div className="w-full md:w-80">
            <Search
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by name, email, employee ID..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Filter className="h-3 w-3" />
              <span>Filters:</span>
            </div>

            <div className="w-40">
              <Select
                options={[
                  { label: "All Departments", value: "ALL" },
                  ...departments.map((d) => ({ label: d.name, value: d.id })),
                ]}
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="w-32">
              <Select
                options={[
                  { label: "All Statuses", value: "ALL" },
                  { label: "Active", value: "ACTIVE" },
                  { label: "Probation", value: "PROBATION" },
                  { label: "On Leave", value: "ON_LEAVE" },
                  { label: "Terminated", value: "TERMINATED" },
                ]}
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Staff Employee Records Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState message="Loading corporate directory..." />
          ) : error ? (
            <ErrorState message={error} retry={fetchEmployees} />
          ) : staffList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No staff employees found"
              description="No staff personnel records matched your search or filter."
              action={{
                label: "Reset Filters",
                onClick: () => {
                  setSearch("");
                  setSelectedDept("ALL");
                  setSelectedStatus("ALL");
                  setPage(1);
                },
              }}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Employee ID</TableHead>
                    <TableHead>Employee Name & Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation & System Role</TableHead>
                    <TableHead>Reporting Line</TableHead>
                    <TableHead>Work Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedStaff.map((emp) => (
                    <TableRow key={emp.id} className="cursor-pointer group">
                      <TableCell className="font-mono text-xs font-semibold text-blue-400">
                        {emp.employeeNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={`${emp.firstName} ${emp.lastName}`}
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-100 group-hover:text-blue-400 transition-colors">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {emp.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building className="h-3 w-3 text-slate-500" />
                          <span>{emp.department?.name || "Unassigned"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-slate-200">{emp.designation}</span>
                          <span className="text-[10px] font-mono text-purple-400">
                            {emp.user?.role?.name || "No System Account"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {emp.manager ? (
                          <div className="flex flex-col text-[11px]">
                            <span className="text-slate-300 font-medium">
                              {emp.manager.firstName} {emp.manager.lastName}
                            </span>
                            <span className="text-slate-500">
                              {emp.manager.designation}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Top Leadership
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                          {emp.workMode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            variant={
                              emp.employmentStatus === "ACTIVE"
                                ? "success"
                                : emp.onboardingStatus === "PENDING_APPROVAL"
                                ? "warning"
                                : "default"
                            }
                            size="sm"
                          >
                            {emp.employmentStatus === "ACTIVE"
                              ? "ACTIVE"
                              : emp.onboardingStatus === "PENDING_APPROVAL"
                              ? "PENDING APPROVAL"
                              : emp.onboardingStatus === "PENDING_VERIFICATION"
                              ? "DOCS PENDING"
                              : `PROFILE ${emp.profileCompletion || 20}%`}
                          </Badge>
                          {emp.employmentStatus !== "ACTIVE" && (
                            <span className="text-[10px] text-amber-400 font-mono">
                              Onboarding: {emp.profileCompletion || 20}%
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/app/hr/employees/${emp.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 transition-colors whitespace-nowrap"
                          title="Complete Profile & View Dossier"
                        >
                          <span>{emp.employmentStatus === "ACTIVE" ? "Dossier" : "Complete Profile"}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={page}
                totalPages={staffTotalPages}
                totalRecords={staffList.length}
                pageSize={10}
                onPageChange={(p) => setPage(p)}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Onboard New Employee"
        description="Establish corporate identity, reporting line, and CRM login credentials."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDrawerOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateSubmit}
              isLoading={createLoading}
            >
              Create Employee Profile
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Onboarding Lifecycle Roadmap Card */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-300">
              <span>Employee Onboarding Pipeline</span>
              <span className="text-[10px] font-mono bg-blue-900/60 px-2 py-0.5 rounded text-blue-200 border border-blue-700/50">
                10-Section Dossier
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 overflow-x-auto pb-1">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-medium shrink-0">1. Basic Account</span>
              <span className="text-slate-500">→</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">2. Complete Profile</span>
              <span className="text-slate-500">→</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">3. Doc Verification</span>
              <span className="text-slate-500">→</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">4. HR Approval</span>
              <span className="text-slate-500">→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 shrink-0">Active</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Creating this account will initialize the official employee master record and redirect to the 10-section dossier for complete verification.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="e.g. Atharv"
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="e.g. Narawade"
              required
            />
          </div>

          <Input
            label="Corporate Email Address (Used for Login)"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="atharvnarawade@gmail.com"
            required
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+917249271897"
          />

          <Input
            label="Official Designation"
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            placeholder="e.g. Software Engineer / Lead Architect"
            required
          />

          <Select
            label="Department"
            options={[
              { label: "Select Department", value: "" },
              ...departments.map((d) => ({ label: d.name, value: d.id })),
            ]}
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            required
          />

          {/* CRM System Account & Credentials Assignment Section */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 dark:bg-blue-950/30 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.createSystemAccount}
                  onChange={(e) =>
                    setFormData({ ...formData, createSystemAccount: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Grant CRM Portal System Account (Enable Portal Sign-In)
                </span>
              </label>
            </div>

            {formData.createSystemAccount && (
              <div className="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <Input
                    label="CRM Login Password"
                    type="password"
                    value={formData.loginPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, loginPassword: e.target.value })
                    }
                    placeholder="Set custom password (default: Enterprise@2026)"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    The employee will log into CRM using Corporate Email and this assigned password.
                  </p>
                </div>

                <Select
                  label="Assigned System RBAC Role"
                  options={[
                    { label: "Staff Employee (EMPLOYEE)", value: "EMPLOYEE" },
                    { label: "Line Manager (MANAGER)", value: "MANAGER" },
                    { label: "Department Head (DEPARTMENT_HEAD)", value: "DEPARTMENT_HEAD" },
                    { label: "Chief Human Resources Officer (HR)", value: "HR" },
                    { label: "Platform Administrator (ADMIN)", value: "ADMIN" },
                    { label: "Chief Operating Officer (COO)", value: "COO" },
                    { label: "Chief Marketing Officer (CMO)", value: "CMO" },
                    { label: "Chief Technology Officer (CTO)", value: "CTO" },
                    { label: "Chief Financial Officer (CFO)", value: "CFO" },
                    { label: "Chief Executive Officer (CEO)", value: "CEO" },
                    { label: "Super Admin (SUPER_ADMIN)", value: "SUPER_ADMIN" },
                  ]}
                  value={formData.roleCode}
                  onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                />
              </div>
            )}
          </div>

          <Select
            label="Direct Line Manager"
            options={[
              { label: "None (Reports to Board / C-Suite)", value: "" },
              ...scopedEmployees.map((e) => ({
                label: `${e.firstName} ${e.lastName} (${e.designation})`,
                value: e.id,
              })),
            ]}
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Employment Type"
              options={[
                { label: "Full-Time", value: "FULL_TIME" },
                { label: "Contract", value: "CONTRACT" },
                { label: "Part-Time", value: "PART_TIME" },
                { label: "Intern", value: "INTERN" },
              ]}
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
            />
            <Select
              label="Work Mode"
              options={[
                { label: "On-Site", value: "ON_SITE" },
                { label: "Remote", value: "REMOTE" },
                { label: "Hybrid", value: "HYBRID" },
              ]}
              value={formData.workMode}
              onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
            />
          </div>

          <Input
            label="Work Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />

          <Input
            label="Emergency Contact"
            value={formData.emergencyContact}
            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
            placeholder="Contact Name (+1-555-0000)"
          />
        </form>
      </Drawer>
    </div>
  );
}
