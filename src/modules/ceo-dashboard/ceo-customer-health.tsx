"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileCheck,
  ExternalLink,
  IndianRupee,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CustomerHealthMatrixItem {
  id: string;
  name: string;
  tier: string;
  revenue: number;
  activeDeals: number;
  activeOperations: number;
  openIssues: number;
  outstandingBalance: number;
  activeContracts: number;
}

interface CeoCustomerHealthProps {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  customersWithOpenIssues: number;
  customersWithOverduePayments: number;
  customersWithUpcomingRenewals: number;
  matrix: CustomerHealthMatrixItem[];
}

export function CeoCustomerHealth({
  totalCustomers,
  newCustomers,
  activeCustomers,
  inactiveCustomers,
  customersWithOpenIssues,
  customersWithOverduePayments,
  customersWithUpcomingRenewals,
  matrix,
}: CeoCustomerHealthProps) {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            Customer Health & Account Risk Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Holistic cross-departmental view across billing, active deals, service operations, and open friction points.
          </p>
        </div>

        <Link
          href="/app/crm/clients"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          View Client Directory <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Customer Status Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Total Accounts</span>
          <span className="text-base font-bold text-white block mt-1">{totalCustomers}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Active Accounts</span>
          <span className="text-base font-bold text-emerald-400 block mt-1">{activeCustomers}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400">New This Period</span>
          <span className="text-base font-bold text-blue-400 block mt-1">{newCustomers}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Inactive / Churned</span>
          <span className="text-base font-bold text-slate-400 block mt-1">{inactiveCustomers}</span>
        </div>
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
          <span className="text-[10px] uppercase font-semibold text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-400" /> Open Issues
          </span>
          <span className="text-base font-bold text-amber-300 block mt-1">{customersWithOpenIssues}</span>
        </div>
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3">
          <span className="text-[10px] uppercase font-semibold text-rose-400 flex items-center gap-1">
            <Clock className="h-3 w-3 text-rose-400" /> Overdue Balance
          </span>
          <span className="text-base font-bold text-rose-300 block mt-1">{customersWithOverduePayments}</span>
        </div>
        <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-3">
          <span className="text-[10px] uppercase font-semibold text-purple-400 flex items-center gap-1">
            <FileCheck className="h-3 w-3 text-purple-400" /> Due for Renewal
          </span>
          <span className="text-base font-bold text-purple-300 block mt-1">{customersWithUpcomingRenewals}</span>
        </div>
      </div>

      {/* Customer Health Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase font-semibold text-slate-400">
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-3 text-right">Invoiced Revenue</th>
                <th className="py-3 px-3 text-center">Active Deals</th>
                <th className="py-3 px-3 text-center">Live Operations</th>
                <th className="py-3 px-3 text-center">Open Issues</th>
                <th className="py-3 px-3 text-right">Outstanding Amount</th>
                <th className="py-3 px-3 text-center">Contract Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {matrix.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No customer accounts matching filter criteria.
                  </td>
                </tr>
              ) : (
                matrix.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      <Link href={`/app/crm/clients/${c.id}`} className="hover:text-blue-400 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                        {c.tier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">{formatINR(c.revenue)}</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-mono">{c.activeDeals}</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-mono">{c.activeOperations}</td>
                    <td className="py-3 px-3 text-center">
                      {c.openIssues > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 font-semibold text-[10px]">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {c.openIssues}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {c.outstandingBalance > 0 ? (
                        <span className="text-amber-400 font-semibold">{formatINR(c.outstandingBalance)}</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">Settled</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {c.activeContracts > 0 ? (
                        <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-semibold">
                          Active ({c.activeContracts})
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/app/crm/clients/${c.id}`}
                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        Details <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
