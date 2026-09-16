"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  RefreshCw,
  FileText,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Calendar,
} from "lucide-react";

export default function LegalReportsPage() {
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<"ALL" | "CONTRACTS" | "CASES" | "COMPLIANCE" | "RISKS">("ALL");

  useEffect(() => {
    fetchReport();
  }, [category]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/legal/reports?category=${category}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    let csvContent = "data:text/csv;charset=utf-8,";

    if (category === "ALL" || category === "CONTRACTS") {
      csvContent += "=== CONTRACTS ===\n";
      csvContent += "Contract Number,Title,Type,Value,Currency,Start Date,End Date,Status\n";
      reportData.contracts?.forEach((c: any) => {
        csvContent += `"${c.contractNumber}","${c.title}","${c.contractType}",${c.value || 0},"${c.currency}","${c.startDate}","${c.endDate || ""}","${c.status}"\n`;
      });
      csvContent += "\n";
    }

    if (category === "ALL" || category === "CASES") {
      csvContent += "=== LITIGATION CASES ===\n";
      csvContent += "Case Number,Title,Type,Court,Claim Amount,Exposure Amount,Priority,Status\n";
      reportData.cases?.forEach((cs: any) => {
        csvContent += `"${cs.caseNumber}","${cs.title}","${cs.caseType}","${cs.courtName || ""}",${cs.claimAmount || 0},${cs.exposureAmount || 0},"${cs.priority}","${cs.status}"\n`;
      });
      csvContent += "\n";
    }

    if (category === "ALL" || category === "COMPLIANCE") {
      csvContent += "=== STATUTORY COMPLIANCE ===\n";
      csvContent += "Code,Title,Regulation,Frequency,Next Due Date,Risk Level,Status\n";
      reportData.compliances?.forEach((cmp: any) => {
        csvContent += `"${cmp.code}","${cmp.title}","${cmp.regulation}","${cmp.frequency}","${cmp.nextDueDate}","${cmp.riskLevel}","${cmp.status}"\n`;
      });
      csvContent += "\n";
    }

    if (category === "ALL" || category === "RISKS") {
      csvContent += "=== RISK REGISTER ===\n";
      csvContent += "Risk Code,Title,Probability,Impact,Risk Score,Risk Level,Status\n";
      reportData.risks?.forEach((r: any) => {
        csvContent += `"${r.riskCode}","${r.title}",${r.probability},${r.impact},${r.riskScore},"${r.riskLevel}","${r.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `legal_report_${category.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `legal_report_${category.toLowerCase()}_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (val?: number | null, curr = "INR") => {
    if (val === undefined || val === null) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader
          title="Executive Legal Analytics & Export"
          description="Consolidated governance reports, liability audits, contractual obligations, and multi-format export."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Download className="h-4 w-4 text-blue-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <LegalNav />

      {/* Category Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-2 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setCategory("ALL")}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            category === "ALL" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Comprehensive Audit (All)
        </button>
        <button
          onClick={() => setCategory("CONTRACTS")}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            category === "CONTRACTS" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Contracts & Value
        </button>
        <button
          onClick={() => setCategory("CASES")}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            category === "CASES" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Litigation Exposure
        </button>
        <button
          onClick={() => setCategory("COMPLIANCE")}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            category === "COMPLIANCE" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Compliance Obligations
        </button>
        <button
          onClick={() => setCategory("RISKS")}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            category === "RISKS" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Risk Register
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Contracts Section */}
          {(category === "ALL" || category === "CONTRACTS") && (
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-400" />
                  Contract Portfolio ({reportData.contracts?.length || 0} Records)
                </h3>
                <span className="text-xs text-slate-400">
                  Total Value: {formatCurrency(reportData.contracts?.reduce((a: number, c: any) => a + (c.value || 0), 0))}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Value</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportData.contracts?.slice(0, 10).map((c: any) => (
                      <tr key={c.id}>
                        <td className="py-2 px-3 font-mono text-amber-400">{c.contractNumber}</td>
                        <td className="py-2 px-3 text-slate-200 font-medium">{c.title}</td>
                        <td className="py-2 px-3 text-slate-400">{c.contractType}</td>
                        <td className="py-2 px-3 text-slate-200">{formatCurrency(c.value, c.currency)}</td>
                        <td className="py-2 px-3 text-slate-300">{c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Litigation Section */}
          {(category === "ALL" || category === "CASES") && (
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Scale className="h-4 w-4 text-purple-400" />
                  Litigation & Disputes ({reportData.cases?.length || 0} Records)
                </h3>
                <span className="text-xs text-rose-400 font-medium">
                  Total Exposure: {formatCurrency(reportData.cases?.reduce((a: number, cs: any) => a + (cs.exposureAmount || cs.claimAmount || 0), 0))}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Case Code</th>
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Court</th>
                      <th className="py-2 px-3">Exposure</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportData.cases?.slice(0, 10).map((cs: any) => (
                      <tr key={cs.id}>
                        <td className="py-2 px-3 font-mono text-purple-400">{cs.caseNumber}</td>
                        <td className="py-2 px-3 text-slate-200 font-medium">{cs.title}</td>
                        <td className="py-2 px-3 text-slate-400">{cs.courtName || "Arbitration"}</td>
                        <td className="py-2 px-3 text-rose-400 font-bold">{formatCurrency(cs.exposureAmount || cs.claimAmount, cs.currency)}</td>
                        <td className="py-2 px-3 text-slate-300">{cs.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compliance Section */}
          {(category === "ALL" || category === "COMPLIANCE") && (
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Statutory Obligations ({reportData.compliances?.length || 0} Records)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Regulation</th>
                      <th className="py-2 px-3">Next Due</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportData.compliances?.slice(0, 10).map((cmp: any) => (
                      <tr key={cmp.id}>
                        <td className="py-2 px-3 font-mono text-emerald-400">{cmp.code}</td>
                        <td className="py-2 px-3 text-slate-200 font-medium">{cmp.title}</td>
                        <td className="py-2 px-3 text-slate-400">{cmp.regulation}</td>
                        <td className="py-2 px-3 text-slate-300">{new Date(cmp.nextDueDate).toLocaleDateString()}</td>
                        <td className="py-2 px-3 text-slate-300">{cmp.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Risk Register Section */}
          {(category === "ALL" || category === "RISKS") && (
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  Risk Register ({reportData.risks?.length || 0} Records)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Risk Code</th>
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Score</th>
                      <th className="py-2 px-3">Severity</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportData.risks?.slice(0, 10).map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-2 px-3 font-mono text-rose-400">{r.riskCode}</td>
                        <td className="py-2 px-3 text-slate-200 font-medium">{r.title}</td>
                        <td className="py-2 px-3 font-bold text-white">{r.riskScore}</td>
                        <td className="py-2 px-3 text-slate-300">{r.riskLevel}</td>
                        <td className="py-2 px-3 text-slate-300">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
