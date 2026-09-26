"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, CalendarCheck, Plus, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export interface LeaveBalanceItem {
  code: string;
  name: string;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
}

interface LeaveBalanceWidgetProps {
  initialBalances?: LeaveBalanceItem[];
}

export function LeaveBalanceWidget({ initialBalances }: LeaveBalanceWidgetProps = {}) {
  const { role, isSuperAdmin, isExecutive } = useAuth();
  const isExecutiveOrAdmin =
    isSuperAdmin ||
    isExecutive ||
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "CEO" ||
    role === "CHAIRPERSON";

  const [balances, setBalances] = useState<LeaveBalanceItem[]>(initialBalances || []);
  const [loading, setLoading] = useState(!initialBalances && !isExecutiveOrAdmin);

  useEffect(() => {
    if (initialBalances || isExecutiveOrAdmin) return;
    async function fetchBalances() {
      try {
        setLoading(true);
        const res = await fetch("/api/hr/leave/my-balances");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setBalances(Array.isArray(json.data) ? json.data : []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch leave balances:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBalances();
  }, [initialBalances, isExecutiveOrAdmin]);

  if (isExecutiveOrAdmin) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Leave Management</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Workforce approvals & policies</p>
            </div>
          </div>
          <Link
            href="/app/hr/leaves"
            className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
          >
            Review <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Executive Authority
            </span>
            <p className="text-xs text-slate-300 font-medium">Leave Approvals & Policy Quotas</p>
          </div>
          <Link
            href="/app/hr/leaves"
            className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
          >
            Open Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Leave Balance</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Available annual leaves</p>
          </div>
        </div>
        <Link
          href="/app/hr/leaves"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-amber-400 hover:underline"
        >
          Apply <Plus className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading leave data...</div>
      ) : !Array.isArray(balances) || balances.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          No leave policies assigned
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {balances.slice(0, 3).map((item) => (
            <div
              key={item.code}
              className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center border border-slate-100 dark:border-slate-800"
            >
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                {item.code}
              </span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {item.remaining}
              </p>
              <span className="text-[9px] text-slate-400">/ {item.allocated} days</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
