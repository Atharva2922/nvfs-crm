"use client";

import React from "react";
import Link from "next/link";
import {
  UserPlus,
  Layers,
  FileText,
  CheckSquare,
  BarChart3,
  Users,
  IndianRupee,
  Scale,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";

export function CeoQuickActions() {
  const actions = [
    { title: "Create Client", href: "/app/crm/clients", icon: UserPlus, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { title: "Create Operation", href: "/app/operations/new", icon: Layers, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { title: "Draft Contract", href: "/app/legal/contracts/new", icon: Scale, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { title: "Submit PO / Request", href: "/app/inventory/purchase-orders", icon: FileText, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { title: "Assign Task", href: "/app/tasks", icon: CheckSquare, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
    { title: "Executive Cockpit", href: "/app/reports", icon: BarChart3, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
    { title: "Organization Tree", href: "/app/hr/organization", icon: Users, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
    { title: "Corporate Treasury", href: "/app/finance", icon: IndianRupee, color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <PlusCircle className="h-4 w-4 text-blue-400" />
          Executive Quick Actions & Gateway
        </h3>
        <span className="text-[11px] text-slate-500">Instant routing into core modules</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <Link
              key={i}
              href={act.href}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50 transition-all text-center group"
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center mb-1.5 border group-hover:scale-110 transition-transform ${act.color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 group-hover:text-white leading-tight">
                {act.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
