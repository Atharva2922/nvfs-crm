"use client";

import React, { useState, useEffect } from "react";
import { Percent, Printer, Loader2, ArrowLeft, ShieldCheck, FileText, Receipt } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AccountsTaxReportsPage() {
  const [taxData, setTaxData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts/reports?type=TAX")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTaxData(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val: number) => `₹${Math.round(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/app/accounts/reports"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Reports Hub</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Percent className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              GST / Tax Compliance Reports
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            GSTR-1 Outward Supplies, GSTR-2 Input Tax Credit (ITC), and GSTR-3B Monthly Tax Liability.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Tax Summary</span>
        </button>
      </div>

      {loading || !taxData ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500 mb-2" />
          <span>Computing GST Tax Liabilities...</span>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* GSTR-3B Net Liability Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  GSTR-3B Net Settlement
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">Estimated Net GST Payable</h2>
              <p className="text-xs text-slate-400">
                Calculated as Outward Output GST minus Verified Inward Input Tax Credit (ITC).
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {formatCurrency(taxData.gstr3bLiability.totalNetPayable)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                CGST: {formatCurrency(taxData.gstr3bLiability.cgstPayable)} • SGST:{" "}
                {formatCurrency(taxData.gstr3bLiability.sgstPayable)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GSTR-1: Outward Supplies */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                <FileText className="h-4 w-4" />
                <span>GSTR-1 Outward Client Supplies</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Invoices Issued</span>
                  <span className="font-mono font-bold text-slate-200">
                    {taxData.gstr1Summary.invoicesCount}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Total Taxable Turnover</span>
                  <span className="font-mono font-bold text-slate-200">
                    {formatCurrency(taxData.gstr1Summary.totalTaxableValue)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Central GST (CGST)</span>
                  <span className="font-mono">{formatCurrency(taxData.gstr1Summary.cgst)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-400">
                  <span>State GST (SGST)</span>
                  <span className="font-mono">{formatCurrency(taxData.gstr1Summary.sgst)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                  <span>Total Output Tax Collected</span>
                  <span className="font-mono text-blue-400">{formatCurrency(taxData.gstr1Summary.totalTax)}</span>
                </div>
              </div>
            </div>

            {/* GSTR-2: Inward Input Tax Credit */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101c] p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                <Receipt className="h-4 w-4" />
                <span>GSTR-2 Inward Input Tax Credit</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Vendor Bills Processed</span>
                  <span className="font-mono font-bold text-slate-200">
                    {taxData.gstr2Summary.billsCount}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Total Procurement Value</span>
                  <span className="font-mono font-bold text-slate-200">
                    {formatCurrency(taxData.gstr2Summary.totalTaxableValue)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Input CGST Claimable</span>
                  <span className="font-mono">{formatCurrency(taxData.gstr2Summary.cgst)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Input SGST Claimable</span>
                  <span className="font-mono">{formatCurrency(taxData.gstr2Summary.sgst)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                  <span>Total Input Tax Credit (ITC)</span>
                  <span className="font-mono text-amber-400">
                    {formatCurrency(taxData.gstr2Summary.totalInputTaxCredit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
