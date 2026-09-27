"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calendar,
  DollarSign,
  Percent,
  FileText,
  Hash,
  CreditCard,
  Shield,
  History,
  Save,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("block text-xs font-medium text-slate-700 dark:text-slate-300", className)} {...props}>
      {children}
    </label>
  );
}

interface AccountsSettingsViewProps {
  activeTab: string;
}

export function AccountsSettingsView({ activeTab }: AccountsSettingsViewProps) {
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: "organization", label: "Organization", icon: Building2, href: "/app/accounts/settings/organization" },
    { id: "financial-year", label: "Financial Year", icon: Calendar, href: "/app/accounts/settings/financial-year" },
    { id: "currency", label: "Currency", icon: DollarSign, href: "/app/accounts/settings/currency" },
    { id: "taxes", label: "Taxes & GST", icon: Percent, href: "/app/accounts/settings/taxes" },
    { id: "invoices", label: "Invoices & Numbering", icon: FileText, href: "/app/accounts/settings/invoices" },
    { id: "payment-terms", label: "Payment Terms", icon: CreditCard, href: "/app/accounts/settings/payment-terms" },
    { id: "permissions", label: "Permissions", icon: Shield, href: "/app/accounts/settings/permissions" },
    { id: "audit-logs", label: "Audit Logs", icon: History, href: "/app/accounts/settings/audit-logs" },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
          <Link href="/app/accounts" className="hover:text-emerald-600 transition-colors">
            Accounts
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span>Settings</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold capitalize">
            {activeTab.replace(/-/g, " ")}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Accounting & Books Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure multi-company fiscal years, currency formats, GST compliance, invoice sequences, and audit logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Setting Content Body */}
        <div className="md:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          {activeTab === "organization" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Company Financial Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Legal Legal Entity Name</Label>
                  <Input defaultValue="Apex Technologies Private Limited" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Trade Brand Name</Label>
                  <Input defaultValue="Apex Tech CRM" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Corporate Identification Number (CIN)</Label>
                  <Input defaultValue="U72900MH2021PTC359812" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">PAN (Permanent Account Number)</Label>
                  <Input defaultValue="AAACN0123M" className="h-9 text-xs" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Registered Office Address</Label>
                  <Input defaultValue="Unit 402, Pinnacle Business Park, Andheri East, Mumbai, MH - 400069" className="h-9 text-xs" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "financial-year" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Fiscal Period Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Active Financial Year</Label>
                  <Input defaultValue="FY 2025-26" className="h-9 text-xs font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fiscal Year Cycle</Label>
                  <Input defaultValue="April 01 — March 31 (Indian Standard)" readOnly className="h-9 text-xs bg-slate-50 dark:bg-slate-950" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Current Accounting Period</Label>
                  <Input defaultValue="Q4 (January - March 2026)" readOnly className="h-9 text-xs bg-slate-50 dark:bg-slate-950" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Books Closing Date</Label>
                  <Input defaultValue="31 March 2026" className="h-9 text-xs" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "currency" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Base Currency & Number Formatting</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Functional Currency</Label>
                  <Input defaultValue="INR (Indian Rupee)" className="h-9 text-xs font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Currency Symbol</Label>
                  <Input defaultValue="₹" className="h-9 text-xs font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Number Grouping Format</Label>
                  <Input defaultValue="Indian Lakhs/Crores (12,50,000.00)" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Decimal Precision</Label>
                  <Input defaultValue="2 Decimals (0.00)" className="h-9 text-xs" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "taxes" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">GST Compliance & Tax Rules</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary GSTIN</Label>
                  <Input defaultValue="27AAACN0123M1Z5" className="h-9 text-xs font-mono font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">State / Province</Label>
                  <Input defaultValue="Maharashtra (Code: 27)" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Default Tax Rate</Label>
                  <Input defaultValue="GST 18% (CGST 9% + SGST 9%)" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">E-Way Bill Generation</Label>
                  <Input defaultValue="Auto-trigger for invoices > ₹50,000" className="h-9 text-xs" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Invoice Prefixes & Auto-Numbering</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Sales Invoice Prefix</Label>
                  <Input defaultValue="INV-2026-" className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Next Invoice Sequence</Label>
                  <Input defaultValue="0014" className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Vendor Bill Prefix</Label>
                  <Input defaultValue="BILL-2026-" className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Credit Note Prefix</Label>
                  <Input defaultValue="CN-2026-" className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Journal Entry Prefix</Label>
                  <Input defaultValue="JV-2026-" className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Standard Payment Terms</Label>
                  <Input defaultValue="Net 30 Days" className="h-9 text-xs" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment-terms" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Payment Terms & Gateway Channels</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Default Credit Period</Label>
                  <Input defaultValue="30 Days" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Late Payment Interest Rate</Label>
                  <Input defaultValue="18% per annum" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Accepted Payment Methods</Label>
                  <Input defaultValue="NEFT/RTGS, IMPS, UPI, Corporate Credit Card, Cheque" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary Deposit Account</Label>
                  <Input defaultValue="HDFC Bank - A/c *4092" className="h-9 text-xs" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Accounts RBAC Granular Matrix</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                  <div>
                    <div className="text-xs font-semibold">Chief Financial Officer (CFO) & Super Admin</div>
                    <div className="text-[11px] text-slate-500">Unrestricted ledger write, bank authorization, and audit log access</div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">Full Access</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                  <div>
                    <div className="text-xs font-semibold">Senior Accountant</div>
                    <div className="text-[11px] text-slate-500">Invoice creation, payment posting, manual journals, and statements</div>
                  </div>
                  <span className="text-xs font-bold text-blue-600">Operator</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                  <div>
                    <div className="text-xs font-semibold">Statutory Auditor</div>
                    <div className="text-[11px] text-slate-500">Read-only general ledger, trial balance, and tax reconciliation views</div>
                  </div>
                  <span className="text-xs font-bold text-slate-600">Read-Only</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audit-logs" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Accounting Tamper-Resistant Audit Trail</h2>
              <div className="space-y-2 text-xs">
                {[
                  { time: "Today 12:44 PM", user: "Admin (CFO)", action: "Posted Journal JV-2026-004", details: "Dr. 1020 (₹1,45,000) / Cr. 1030 (₹1,45,000)" },
                  { time: "Today 11:15 AM", user: "Finance Lead", action: "Approved Vendor Bill BILL-2026-001", details: "₹65,000 to Delta Hardware Supplies" },
                  { time: "Yesterday 04:30 PM", user: "Admin (CEO)", action: "Exported Trial Balance", details: "Format: PDF, Verification: Balanced" },
                ].map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{log.details}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-slate-700 dark:text-slate-300">{log.user}</div>
                      <div className="text-[10px] text-slate-400">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Settings saved successfully to company database
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono">
                Organization Scoped: Active Company
              </span>
            )}
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
