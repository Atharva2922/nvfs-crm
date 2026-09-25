import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyManagementView } from "@/modules/super-admin/company-management-view";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuperAdminCompaniesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Enforce Super Admin only
  if (user.roleCode !== "SUPER_ADMIN" && user.roleLevel < 100) {
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-950/40">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Access Restricted
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Company management is restricted to Platform Super Administrators.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/app/overview"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Company Workspace
          </Link>
        </div>
      </div>
    );
  }

  const companies = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          departments: true,
          employees: true,
          clients: true,
          tasks: true,
          invoices: true,
          memberships: true,
        },
      },
    },
  });

  const formattedCompanies = companies.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    legalName: c.legalName,
    primaryColor: c.primaryColor || "#2563eb",
    secondaryColor: c.secondaryColor || "#1e40af",
    industry: c.industry,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    stats: {
      usersCount: c._count.employees + c._count.memberships,
      activeUsersCount: c._count.employees,
      departmentsCount: c._count.departments,
      clientsCount: c._count.clients,
      tasksCount: c._count.tasks,
      invoicesCount: c._count.invoices,
    },
  }));

  return <CompanyManagementView initialCompanies={formattedCompanies} />;
}
