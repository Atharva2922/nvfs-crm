"use client";

import React from "react";
import Link from "next/link";
import { Calendar, IndianRupee, FileText, Briefcase, FileCheck, CheckSquare, PlusCircle } from "lucide-react";

interface QuickActionsWidgetProps {
  permissions?: string[];
  roleLevel?: number;
}

export function QuickActionsWidget({ permissions = [], roleLevel = 10 }: QuickActionsWidgetProps) {
  const actions = [
    {
      title: "Apply Leave",
      href: "/app/hr/leaves",
      icon: Calendar,
      color: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    },
    {
      title: "Submit Expense",
      href: "/app/expenses",
      icon: IndianRupee,
      color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    {
      title: "Create Request",
      href: "/app/requests",
      icon: FileText,
      color: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    },
    {
      title: "Start On-Duty",
      href: "/app/on-duty",
      icon: Briefcase,
      color: "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    },
    ...(roleLevel >= 50 || permissions.includes("hr.employee.manage")
      ? [
          {
            title: "Assign Jobs",
            href: "/app/dashboard/hr",
            icon: CheckSquare,
            color: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          },
        ]
      : [
          {
            title: "View My Payslips",
            href: "/app/payroll/my-payslips",
            icon: FileCheck,
            color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          },
        ]),
  ];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              href={act.href}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all hover:scale-[1.02] ${act.color}`}
            >
              <Icon className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-semibold">{act.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
