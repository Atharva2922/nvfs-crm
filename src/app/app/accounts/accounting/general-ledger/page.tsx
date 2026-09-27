import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function GeneralLedgerPage() {
  const initialLedger = [
    {
      id: "GL-001",
      date: "2026-03-24",
      account: "1020 - HDFC Primary Current A/c",
      reference: "PMT-2026-001",
      party: "Global Logistics Ltd",
      debit: "₹1,45,000",
      credit: "—",
      balance: "₹14,50,000 Dr",
      status: "POSTED",
    },
    {
      id: "GL-002",
      date: "2026-03-24",
      account: "1030 - Accounts Receivable",
      reference: "PMT-2026-001",
      party: "Global Logistics Ltd",
      debit: "—",
      credit: "₹1,45,000",
      balance: "₹3,40,000 Dr",
      status: "POSTED",
    },
    {
      id: "GL-003",
      date: "2026-03-22",
      account: "2010 - Accounts Payable",
      reference: "BILL-2026-001",
      party: "Delta Hardware Supplies",
      debit: "—",
      credit: "₹65,000",
      balance: "₹1,85,000 Cr",
      status: "POSTED",
    },
    {
      id: "GL-004",
      date: "2026-03-22",
      account: "6050 - IT & Infrastructure",
      reference: "BILL-2026-001",
      party: "Delta Hardware Supplies",
      debit: "₹65,000",
      credit: "—",
      balance: "₹1,25,000 Dr",
      status: "POSTED",
    },
  ];

  return (
    <AccountsEntityPage
      title="General Ledger"
      section="Accounting"
      description="Complete chronological record of all posted financial debits, credits, and running account balances."
      newButtonText="New Manual Journal"
      kpis={[
        { label: "Total Ledger Debits", value: "₹21,00,000", sub: "Balanced double entry" },
        { label: "Total Ledger Credits", value: "₹21,00,000", sub: "Variance: ₹0" },
        { label: "Active GL Accounts", value: "18 Accounts", isPositive: true },
        { label: "Audit Status", value: "Balanced & Verified", isPositive: true },
      ]}
      columns={[
        { key: "date", label: "Date" },
        { key: "account", label: "Account" },
        { key: "reference", label: "Reference" },
        { key: "party", label: "Contact / Party" },
        { key: "debit", label: "Debit (Dr)", align: "right" },
        { key: "credit", label: "Credit (Cr)", align: "right" },
        { key: "balance", label: "Running Balance", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialLedger}
    />
  );
}
