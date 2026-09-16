'use client';

import React, { useState, useEffect } from 'react';
import { OperationsNav } from '@/modules/operations/components/operations-nav';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ArrowUpRight,
  PieChart,
  Activity,
  Download,
  ShieldAlert,
} from 'lucide-react';

interface ReportData {
  performance: {
    total: number;
    completed: number;
    delayed: number;
    cancelled: number;
    averageCompletionDays: number;
  };
  financials: {
    estimatedCost: number;
    budget: number;
    actualCost: number;
    variance: number;
  };
  departmentIssues: Record<string, { open: number; resolved: number }>;
}

export default function OperationsReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      setLoading(true);
      const res = await fetch('/api/operations/reports');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load operations reports:', err);
    } finally {
      setLoading(false);
    }
  }

  const exportCSV = () => {
    if (!data) return;
    const lines = [
      'Report Category,Metric,Value',
      `Performance,Total Operations,${data.performance.total}`,
      `Performance,Completed Operations,${data.performance.completed}`,
      `Performance,Delayed Operations,${data.performance.delayed}`,
      `Performance,Cancelled Operations,${data.performance.cancelled}`,
      `Performance,Average Duration (Days),${data.performance.averageCompletionDays}`,
      `Financials,Total Estimated Cost,${data.financials.estimatedCost}`,
      `Financials,Approved Budget,${data.financials.budget}`,
      `Financials,Actual Spend,${data.financials.actualCost}`,
      `Financials,Variance,${data.financials.variance}`,
    ];

    Object.entries(data.departmentIssues).forEach(([dept, issues]) => {
      lines.push(`Department Issues,${dept} (Open),${issues.open}`);
      lines.push(`Department Issues,${dept} (Resolved),${issues.resolved}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operations-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const perf = data?.performance;
  const fin = data?.financials;
  const issues = data?.departmentIssues || {};

  const completionRate = perf && perf.total > 0 ? Math.round((perf.completed / perf.total) * 100) : 0;
  const delayRate = perf && perf.total > 0 ? Math.round((perf.delayed / perf.total) * 100) : 0;
  const budgetUtilization =
    fin && fin.budget > 0 ? Math.min(100, Math.round((fin.actualCost / fin.budget) * 100)) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <OperationsNav />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">Operations Executive Analytics</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Audit & Reports
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Cross-functional execution performance, budget variances, delivery velocity, and departmental risk analysis.
            </p>
          </div>

          <button
            onClick={exportCSV}
            disabled={!data || loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Executive Report (CSV)
          </button>
        </div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Calculating operational intelligence...</p>
          </div>
        ) : !data ? (
          <div className="py-24 text-center text-slate-400">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
            <p className="text-base font-medium text-slate-300">Unable to generate reports</p>
            <p className="text-sm mt-1">Please ensure you have an active employee profile and organizations assigned.</p>
          </div>
        ) : (
          <>
            {/* Top Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Operations */}
              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Total Initiatives</p>
                  <p className="text-2xl font-bold text-white mt-1">{perf?.total || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Across all departments</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Completion Success Rate</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{completionRate}%</p>
                  <p className="text-xs text-slate-500 mt-1">{perf?.completed || 0} successfully delivered</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              {/* Delay Rate */}
              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Overdue / Delayed Rate</p>
                  <p className={`text-2xl font-bold mt-1 ${delayRate > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {delayRate}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{perf?.delayed || 0} operations behind schedule</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              {/* Average Duration */}
              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Avg Lifecycle Duration</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">{perf?.averageCompletionDays || 0} Days</p>
                  <p className="text-xs text-slate-500 mt-1">Start to completion date</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Financial Intelligence & Budget Variance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Financial Variance Overview */}
              <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 p-6 rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <IndianRupee className="w-5 h-5 text-emerald-400" />
                      Financial Performance & Budget Variance
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Comparing initial estimation, approved corporate budgets, and actual accumulated expenditure.
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      fin && fin.variance >= 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {fin && fin.variance >= 0 ? 'Under Budget' : 'Budget Deficit'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-slate-400">Estimated Cost</p>
                    <p className="text-xl font-bold text-slate-200 mt-1">
                      ${(fin?.estimatedCost || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Initial planning projection</p>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-slate-400">Approved Budget</p>
                    <p className="text-xl font-bold text-indigo-300 mt-1">
                      ${(fin?.budget || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Allocated financial ceiling</p>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-slate-400">Actual Cost Incurred</p>
                    <p className="text-xl font-bold text-amber-300 mt-1">
                      ${(fin?.actualCost || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Executed invoices & expenses</p>
                  </div>
                </div>

                {/* Visual Variance Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Budget Consumed</span>
                    <span className="font-semibold text-white">
                      {budgetUtilization}% of ${(fin?.budget || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(100, budgetUtilization)}%` }}
                      className={`h-full rounded-full transition-all ${
                        budgetUtilization > 90
                          ? 'bg-rose-500'
                          : budgetUtilization > 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>$0</span>
                    <span>
                      Net Variance: ${(fin?.variance || 0).toLocaleString()}{' '}
                      {fin && fin.variance >= 0 ? 'Remaining' : 'Overrun'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-indigo-400" />
                    Operational Status Mix
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Execution pipeline distribution</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> Completed
                      </span>
                      <span className="font-semibold text-slate-200">{perf?.completed || 0}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${perf && perf.total > 0 ? (perf.completed / perf.total) * 100 : 0}%`,
                        }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-rose-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span> Delayed / Overdue
                      </span>
                      <span className="font-semibold text-slate-200">{perf?.delayed || 0}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${perf && perf.total > 0 ? (perf.delayed / perf.total) * 100 : 0}%`,
                        }}
                        className="h-full bg-rose-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span> Cancelled
                      </span>
                      <span className="font-semibold text-slate-200">{perf?.cancelled || 0}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${perf && perf.total > 0 ? (perf.cancelled / perf.total) * 100 : 0}%`,
                        }}
                        className="h-full bg-slate-600 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/40 rounded-xl text-xs text-slate-400 border border-slate-800">
                  <p className="font-medium text-slate-300">Target Efficiency:</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Operations should maintain an overdue rate &lt; 10% and budget variance &gt;= 0.
                  </p>
                </div>
              </div>
            </div>

            {/* Department Risk & Issue Breakdown */}
            <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Departmental Risk & Incident Triage Analysis
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Breakdown of active incidents, blockers, and resolution efficiency per functional department.
                </p>
              </div>

              {Object.keys(issues).length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No issues or incidents logged across operational departments.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {Object.entries(issues).map(([dept, count]) => {
                    const totalDeptIssues = count.open + count.resolved;
                    const resRate = totalDeptIssues > 0 ? Math.round((count.resolved / totalDeptIssues) * 100) : 100;
                    return (
                      <div
                        key={dept}
                        className="bg-slate-800/40 border border-slate-800/80 p-4 rounded-xl space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-200">{dept}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                            {totalDeptIssues} Total
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                            <p className="text-[10px] uppercase font-bold text-rose-400">Open Blockers</p>
                            <p className="text-base font-bold mt-0.5">{count.open}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                            <p className="text-[10px] uppercase font-bold text-emerald-400">Resolved</p>
                            <p className="text-base font-bold mt-0.5">{count.resolved}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Resolution Rate</span>
                            <span className="font-medium text-slate-200">{resRate}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${resRate}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
