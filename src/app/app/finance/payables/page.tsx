"use client";

import { useEffect, useState } from "react";
import { FinanceNav } from "@/modules/finance/components/finance-nav";
import { 
  TrendingDown, 
  Receipt, 
  IndianRupee, 
  Building2, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Package,
  Layers,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface PayablesData {
  totalPayable: number;
  totalExpensePayable: number;
  totalPayrollPayable: number;
  approvedExpenses: Array<{
    id: string;
    expenseNumber: string;
    category: string;
    amount: number;
    currency: string;
    date: string;
    description: string;
    employee: { id: string; firstName: string; lastName: string };
    department: { id: string; name: string; code: string };
  }>;
  pendingPayroll: Array<{
    id: string;
    name: string;
    code: string;
    totalNet: number;
    employeeCount: number;
    status: string;
    startDate: string;
    endDate: string;
  }>;
}

export default function AccountsPayablePage() {
  const [data, setData] = useState<PayablesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expenses" | "payroll" | "vendors">("expenses");

  useEffect(() => {
    async function loadPayables() {
      try {
        setLoading(true);
        const res = await fetch("/api/finance/payables");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load payables:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPayables();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Accounts Payable Foundation</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track short-term corporate liabilities: approved employee expense reimbursements and finalized payroll disbursements.
          </p>
        </div>
      </div>

      {/* Sub-Navigation */}
      <FinanceNav />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Accounts Payable</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-400 tracking-tight">
              ₹{(data?.totalPayable || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">Approved liabilities awaiting settlement</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Approved Expenses</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">
              ₹{(data?.totalExpensePayable || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">
              {data?.approvedExpenses.length || 0} employee reimbursement claims
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Payroll Obligations</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-indigo-400 tracking-tight">
              ₹{(data?.totalPayrollPayable || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">
              {data?.pendingPayroll.length || 0} pending payroll periods
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "expenses"
              ? "bg-zinc-800 text-white font-semibold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Approved Expenses ({data?.approvedExpenses.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("payroll")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "payroll"
              ? "bg-zinc-800 text-white font-semibold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Payroll Obligations ({data?.pendingPayroll.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("vendors")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "vendors"
              ? "bg-zinc-800 text-white font-semibold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Vendor & Purchase Orders (Architecture Slot)
        </button>
      </div>

      {/* Tab 1: Approved Expenses */}
      {activeTab === "expenses" && (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
            <thead className="bg-zinc-950/60 text-xs uppercase font-semibold tracking-wider text-zinc-400">
              <tr>
                <th className="px-6 py-4">Expense #</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    Loading expenses payable...
                  </td>
                </tr>
              ) : (data?.approvedExpenses || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No approved expenses awaiting reimbursement.
                  </td>
                </tr>
              ) : (
                data!.approvedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-white">{exp.expenseNumber}</td>
                    <td className="px-6 py-4">
                      {exp.employee.firstName} {exp.employee.lastName}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{exp.department.name}</td>
                    <td className="px-6 py-4 text-xs">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                        {exp.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-300 max-w-xs truncate">{exp.description}</td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-400">
                      ₹{exp.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href="/app/finance/expenses"
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                      >
                        Disburse <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Payroll Obligations */}
      {activeTab === "payroll" && (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
            <thead className="bg-zinc-950/60 text-xs uppercase font-semibold tracking-wider text-zinc-400">
              <tr>
                <th className="px-6 py-4">Payroll Run</th>
                <th className="px-6 py-4">Cycle</th>
                <th className="px-6 py-4">Employees</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Net Obligation</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    Loading payroll obligations...
                  </td>
                </tr>
              ) : (data?.pendingPayroll || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No pending payroll cycles awaiting disbursement.
                  </td>
                </tr>
              ) : (
                data!.pendingPayroll.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{p.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">{p.code}</td>
                    <td className="px-6 py-4 text-xs">{p.employeeCount} headcount</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      ₹{p.totalNet.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href="/app/finance/payroll"
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        Review Run <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Future Vendor Architecture Slot */}
      {activeTab === "vendors" && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Vendor Invoicing & Purchase Order Reconciliation</h3>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto mt-2 leading-relaxed">
            The Accounts Payable foundation is architected to seamlessly integrate with the upcoming Operations, Vendor & Purchase Order module. In accordance with architectural boundaries, vendor models are reserved for future blocks without duplicating supplier records.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-800/80 border border-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-300">
            <Clock className="h-3.5 w-3.5 text-indigo-400" /> Scheduled for Operations & Procurement Module
          </div>
        </div>
      )}
    </div>
  );
}
