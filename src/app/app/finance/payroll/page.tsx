"use client";

import { useEffect, useState, useTransition } from "react";
import { FinanceNav } from "@/modules/finance/components/finance-nav";
import { 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Users, 
  FileCheck, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface FinalizedPayrollPeriod {
  id: string;
  code: string;
  name: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  isPostedToLedger: boolean;
  postedTransactionNumber?: string | null;
}

export default function FinancePayrollIntegrationPage() {
  const [periods, setPeriods] = useState<FinalizedPayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/finance/payroll");
      if (res.ok) {
        const json = await res.json();
        setPeriods(json.data.periods);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handlePostToLedger = async (periodId: string) => {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/finance/payroll/${periodId}/post`, {
          method: "POST",
        });

        if (res.ok) {
          const json = await res.json();
          setMessage({
            type: "success",
            text: `Successfully posted payroll run to financial ledger under transaction ${json.data.transactionNumber}!`,
          });
          fetchPeriods();
        } else {
          const json = await res.json();
          setMessage({ type: "error", text: json.error?.message || "Failed to post payroll to ledger" });
        }
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "Network error" });
      }
    });
  };

  const totalDisbursed = periods.reduce((sum, p) => sum + p.totalNet, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Payroll Financial Integration</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Reconcile finalized HR payroll runs and post approved disbursements to the centralized corporate ledger.
          </p>
        </div>
        <Link
          href="/app/payroll/periods"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors self-start sm:self-auto"
        >
          <Calendar className="h-4 w-4" />
          View HR Payroll Cycles
        </Link>
      </div>

      {/* Sub-Navigation */}
      <FinanceNav />

      {/* Overview Banner */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Decoupled Payroll Consumption</h3>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-xl leading-relaxed">
              In accordance with enterprise segregation of duties, Finance does not alter HR salary formulas. Instead, Finance consumes authorized, approved payroll periods and records the net disbursement as an immutable ledger outflow.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-zinc-400 uppercase tracking-wider block">Total Disbursed Net</span>
          <span className="text-2xl font-bold text-white block mt-0.5">${totalDisbursed.toLocaleString()}</span>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-xs flex items-center gap-2 border ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-rose-500/10 border-rose-500/30 text-rose-400"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Finalized Payroll Periods Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-950/60 text-xs uppercase font-semibold tracking-wider text-zinc-400">
            <tr>
              <th className="px-6 py-4">Payroll Run</th>
              <th className="px-6 py-4">Cycle</th>
              <th className="px-6 py-4">Headcount</th>
              <th className="px-6 py-4">Gross Cost</th>
              <th className="px-6 py-4">Deductions</th>
              <th className="px-6 py-4">Net Disbursed</th>
              <th className="px-6 py-4">Ledger Status</th>
              <th className="px-6 py-4 text-right">Ledger Posting</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  Loading finalized payroll runs...
                </td>
              </tr>
            ) : periods.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  No approved or processed payroll periods available.
                </td>
              </tr>
            ) : (
              periods.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{p.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400">{p.code}</td>
                  <td className="px-6 py-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{p.employeeCount} staff</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                    ${p.totalGross.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-rose-400">
                    -${p.totalDeductions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    ${p.totalNet.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {p.isPostedToLedger ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Posted ({p.postedTransactionNumber})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                        <Clock className="h-3 w-3" /> Ready to Post
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.isPostedToLedger ? (
                      <Link
                        href="/app/finance/transactions"
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
                      >
                        View in Ledger <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handlePostToLedger(p.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                      >
                        <FileCheck className="h-3.5 w-3.5" /> Post to Ledger
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
