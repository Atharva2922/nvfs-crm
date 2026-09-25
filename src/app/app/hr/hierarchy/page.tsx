import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { HrNav } from "@/modules/hr/components/hr-nav";
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  Users,
  ArrowDown,
  ArrowRight,
  ChevronDown,
  Lock,
  Briefcase,
  CheckCircle2,
  Workflow,
  Sparkles,
  Award,
  Layers,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface HierarchyNodeProps {
  roleCode: string;
  roleTitle: string;
  levelBadge: string;
  badgeColor: string;
  responsibilities: string;
  orderFlowText?: string;
  employees: Array<{
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
    department?: { name: string; code: string } | null;
    workEmail?: string | null;
  }>;
}

function NodeCard({
  roleCode,
  roleTitle,
  levelBadge,
  badgeColor,
  responsibilities,
  orderFlowText,
  employees,
}: HierarchyNodeProps) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-[#0f172a]/90 backdrop-blur p-4 shadow-lg hover:border-blue-500/50 transition-all flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wider",
              badgeColor
            )}
          >
            {roleCode}
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
            {levelBadge}
          </span>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white tracking-tight">{roleTitle}</h4>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{responsibilities}</p>
        </div>

        {orderFlowText && (
          <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-900/40 text-[10px] text-blue-300 font-mono">
            {orderFlowText}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Active Persona ({employees.length})
        </span>
        {employees.length === 0 ? (
          <div className="text-[11px] text-slate-500 italic">No persona currently assigned</div>
        ) : (
          employees.slice(0, 2).map((emp) => (
            <div key={emp.id} className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                {emp.firstName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {emp.firstName} {emp.lastName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{emp.designation}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default async function HierarchyArchitecturePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const currentOrgId = currentUser.employee?.organizationId;

  // Fetch all organizations, departments, and employees in current organization
  const [currentOrg, employees, roles] = await Promise.all([
    db.organization.findUnique({
      where: { id: currentOrgId || "" },
      include: { departments: true },
    }),
    db.employee.findMany({
      where: currentOrgId ? { organizationId: currentOrgId } : {},
      include: {
        department: true,
        user: { select: { role: true } },
      },
    }),
    db.role.findMany({ orderBy: { level: "desc" } }),
  ]);

  // Group employees by role and department
  const getEmpsByRole = (code: string) =>
    employees.filter((e) => e.user?.role?.code === code);

  const getEmpsByDept = (deptCode: string) =>
    employees.filter(
      (e) =>
        e.department?.code === deptCode &&
        !["SUPER_ADMIN", "ADMIN", "CEO", "HR", "COO", "CFO", "CIO", "CTO", "CMO"].includes(
          e.user?.role?.code || ""
        )
    );

  const superAdminEmps = getEmpsByRole("SUPER_ADMIN");
  const adminEmps = getEmpsByRole("ADMIN");
  const ceoEmps = getEmpsByRole("CEO");
  const hrEmps = getEmpsByRole("HR");
  const cooEmps = getEmpsByRole("COO");
  const cfoEmps = getEmpsByRole("CFO");
  const cioEmps = [...getEmpsByRole("CIO"), ...getEmpsByRole("CTO")];
  const cmoEmps = getEmpsByRole("CMO");

  const opsTeamEmps = getEmpsByDept("OPS");
  const finTeamEmps = getEmpsByDept("FIN");
  const intlTeamEmps = [...getEmpsByDept("INTL"), ...getEmpsByDept("ENG"), ...getEmpsByDept("SW")];
  const mktTeamEmps = [...getEmpsByDept("MKT"), ...getEmpsByDept("CRM")];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="CRM Corporate Architecture & Order Delegation Hierarchy"
        description="Authoritative enterprise reporting hierarchy: Super Admin > Admin > CEO > HR > CXOs > Functional Teams."
      />

      <HrNav />

      {/* Architecture Explanation Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1222] p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Workflow className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Six-Tier Corporate Hierarchy & Delegation Engine
              </h3>
              <p className="text-xs text-slate-400">
                Operating within: <strong className="text-blue-300">{currentOrg?.name || "Corporate Platform"}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Total Workforce:</span>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-400">
              {employees.length} Personnel
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="flex items-start gap-2">
            <span className="font-bold text-red-400">Tier 1 & 2:</span>
            <span className="text-[11px] text-slate-400">
              Super Admin assigns roles and has global read-only audit. Admin oversees and controls CXOs.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-blue-400">Tier 3 & 4:</span>
            <span className="text-[11px] text-slate-400">
              CEO gives corporate orders to HR. HR dispatches operational tasks to domain CXOs.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-cyan-400">Tier 5 & 6:</span>
            <span className="text-[11px] text-slate-400">
              Respected CXOs (COO, CFO, CIO, CMO) delegate and get work done through their dedicated teams.
            </span>
          </div>
        </div>
      </div>

      {/* Visual Hierarchy Tree */}
      <div className="space-y-4">
        {/* Level 1: Super Admin */}
        <div className="max-w-md mx-auto">
          <NodeCard
            roleCode="SUPER_ADMIN"
            roleTitle="Super Administrator"
            levelBadge="Level 100 • Platform Governance"
            badgeColor="bg-red-500/10 text-red-400 border-red-500/30"
            responsibilities="Global read-only data oversight. Direct role assignment authority for all personas."
            orderFlowText="🛡️ Sees all data across tenants • Cannot modify operational data"
            employees={superAdminEmps}
          />
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-slate-700" />
            <ArrowDown className="h-4 w-4 text-purple-400" />
          </div>
        </div>

        {/* Level 2: Admin */}
        <div className="max-w-md mx-auto">
          <NodeCard
            roleCode="ADMIN"
            roleTitle="Platform Administrator"
            levelBadge="Level 90 • Executive Controller"
            badgeColor="bg-purple-500/10 text-purple-400 border-purple-500/30"
            responsibilities="Reports to Super Admin. Controls, provisions, and directs executive CXOs."
            orderFlowText="⚡ Oversees executive layer • Directs CEO and CXOs"
            employees={adminEmps}
          />
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-slate-700" />
            <ArrowDown className="h-4 w-4 text-blue-400" />
          </div>
        </div>

        {/* Level 3: CEO */}
        <div className="max-w-md mx-auto">
          <NodeCard
            roleCode="CEO"
            roleTitle="Chief Executive Officer"
            levelBadge="Level 85 • Executive Head"
            badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/30"
            responsibilities="Company leadership. Dispatches high-level corporate directives and orders directly to HR."
            orderFlowText="🎯 Gives direct orders & objectives to HR"
            employees={ceoEmps}
          />
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-slate-700" />
            <ArrowDown className="h-4 w-4 text-emerald-400" />
          </div>
        </div>

        {/* Level 4: HR */}
        <div className="max-w-md mx-auto">
          <NodeCard
            roleCode="HR"
            roleTitle="Chief Human Resources Officer"
            levelBadge="Level 80 • Operational Dispatcher"
            badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            responsibilities="Direct report to CEO. Dispatches and assigns operational tasks and orders to the domain CXOs."
            orderFlowText="⚡ Dispatches tasks to COO, CFO, CIO, CMO"
            employees={hrEmps}
          />
        </div>

        {/* Connector to CXOs */}
        <div className="flex flex-col items-center my-2">
          <div className="w-0.5 h-6 bg-slate-700" />
          <div className="w-full max-w-4xl border-t border-slate-700 relative">
            <div className="absolute left-1/4 -top-1 w-2 h-2 bg-blue-500 rounded-full" />
            <div className="absolute left-1/2 -top-1 w-2 h-2 bg-blue-500 rounded-full" />
            <div className="absolute left-3/4 -top-1 w-2 h-2 bg-blue-500 rounded-full" />
          </div>
          <div className="w-0.5 h-4 bg-slate-700" />
        </div>

        {/* Level 5: Respected Domain CXOs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* COO */}
          <div className="space-y-4">
            <NodeCard
              roleCode="COO"
              roleTitle="Chief Operating Officer"
              levelBadge="Level 75"
              badgeColor="bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
              responsibilities="Directs operations and supply chain. Receives orders from HR."
              orderFlowText="⚙️ Delegates to Operations Team"
              employees={cooEmps}
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-cyan-400" />
            </div>
            {/* Operations Team */}
            <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-300">Operations Team</span>
                <span className="text-[10px] font-mono bg-cyan-900/40 text-cyan-300 px-1.5 py-0.5 rounded">
                  {opsTeamEmps.length} Staff
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Executes logistics, facility operations, resource planning, and physical workflow tasks.
              </p>
              <div className="space-y-1 pt-1">
                {opsTeamEmps.slice(0, 2).map((s) => (
                  <div key={s.id} className="text-[11px] text-slate-300 truncate">
                    • {s.firstName} {s.lastName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CFO */}
          <div className="space-y-4">
            <NodeCard
              roleCode="CFO"
              roleTitle="Chief Financial Officer"
              levelBadge="Level 75"
              badgeColor="bg-teal-500/10 text-teal-400 border-teal-500/30"
              responsibilities="Directs treasury, audit, and finances. Receives orders from HR."
              orderFlowText="💰 Delegates to Finance Team"
              employees={cfoEmps}
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-teal-400" />
            </div>
            {/* Finance Team */}
            <div className="rounded-xl border border-teal-900/40 bg-teal-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-300">Finance Team</span>
                <span className="text-[10px] font-mono bg-teal-900/40 text-teal-300 px-1.5 py-0.5 rounded">
                  {finTeamEmps.length} Staff
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Executes accounting, payments, invoices, disbursements, and financial audits.
              </p>
              <div className="space-y-1 pt-1">
                {finTeamEmps.slice(0, 2).map((s) => (
                  <div key={s.id} className="text-[11px] text-slate-300 truncate">
                    • {s.firstName} {s.lastName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CIO */}
          <div className="space-y-4">
            <NodeCard
              roleCode="CIO"
              roleTitle="Chief Information Officer"
              levelBadge="Level 75"
              badgeColor="bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
              responsibilities="Directs technology, international affairs, and IT infrastructure."
              orderFlowText="🌐 Delegates to Int'l Affairs Team"
              employees={cioEmps}
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-indigo-400" />
            </div>
            {/* International Affairs Team */}
            <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-300">International Affairs Team</span>
                <span className="text-[10px] font-mono bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded">
                  {intlTeamEmps.length} Staff
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Executes international relations, cross-border technology partnerships, and digital systems.
              </p>
              <div className="space-y-1 pt-1">
                {intlTeamEmps.slice(0, 2).map((s) => (
                  <div key={s.id} className="text-[11px] text-slate-300 truncate">
                    • {s.firstName} {s.lastName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CMO */}
          <div className="space-y-4">
            <NodeCard
              roleCode="CMO"
              roleTitle="Chief Marketing Officer"
              levelBadge="Level 75"
              badgeColor="bg-pink-500/10 text-pink-400 border-pink-500/30"
              responsibilities="Directs market growth, commercial accounts, and brand reach."
              orderFlowText="📈 Delegates to Marketing Team"
              employees={cmoEmps}
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-pink-400" />
            </div>
            {/* Marketing Team */}
            <div className="rounded-xl border border-pink-900/40 bg-pink-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-pink-300">Marketing Team</span>
                <span className="text-[10px] font-mono bg-pink-900/40 text-pink-300 px-1.5 py-0.5 rounded">
                  {mktTeamEmps.length} Staff
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Executes sales pipeline campaigns, customer engagement, commercial outreach, and marketing growth.
              </p>
              <div className="space-y-1 pt-1">
                {mktTeamEmps.slice(0, 2).map((s) => (
                  <div key={s.id} className="text-[11px] text-slate-300 truncate">
                    • {s.firstName} {s.lastName}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
