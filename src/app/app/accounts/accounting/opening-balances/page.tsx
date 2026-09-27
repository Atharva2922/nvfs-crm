import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function OpeningBalancesPage() {
  const initialBalances = [
    {
      id: "OB-1010",
      code: "1010",
      account: "Petty Cash Drawer",
      type: "Asset",
      debit: "₹50,000",
      credit: "—",
      status: "LOCKED",
    },
    {
      id: "OB-1020",
      code: "1020",
      account: "HDFC Primary Current A/c",
      type: "Asset",
      debit: "₹12,45,000",
      credit: "—",
      status: "LOCKED",
    },
    {
      id: "OB-1030",
      code: "1030",
      account: "Accounts Receivable (Opening)",
      type: "Asset",
      debit: "₹3,80,000",
      credit: "—",
      status: "LOCKED",
    },
    {
      id: "OB-2010",
      code: "2010",
      account: "Accounts Payable (Opening)",
      type: "Liability",
      debit: "—",
      credit: "₹2,10,000",
      status: "LOCKED",
    },
    {
      id: "OB-3010",
      code: "3010",
      account: "Owner's Equity / Capital",
      type: "Equity",
      debit: "—",
      credit: "₹14,65,000",
      status: "LOCKED",
    },
  ];

  return (
    <AccountsEntityPage
      title="Opening Balances"
      section="Accounting"
      description="Financial baseline figures migrated from prior accounting software into the double-entry ledger."
      newButtonText="Edit Opening Balances"
      kpis={[
        { label: "Total Opening Debits", value: "₹16,75,000", sub: "Assets base" },
        { label: "Total Opening Credits", value: "₹16,75,000", sub: "Liabilities & Equity" },
        { label: "Migration Status", value: "Balanced (₹0 Net Diff)", isPositive: true },
        { label: "Fiscal Baseline", value: "01 Apr 2025", sub: "FY 2025-26 Kickoff" },
      ]}
      columns={[
        { key: "code", label: "Account Code" },
        { key: "account", label: "Account Name" },
        { key: "type", label: "Classification" },
        { key: "debit", label: "Debit (Dr)", align: "right" },
        { key: "credit", label: "Credit (Cr)", align: "right" },
        { key: "status", label: "Lock Status" },
      ]}
      initialData={initialBalances}
    />
  );
}
