import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function BankTransfersPage() {
  const initialTransfers = [
    {
      id: "BT-2026-001",
      date: "2026-03-20",
      fromAccount: "HDFC Primary Current A/c",
      toAccount: "ICICI Operational Reserve",
      reference: "TRF-INT-092",
      amount: "₹1,50,000",
      notes: "Quarterly reserve rebalancing",
      status: "COMPLETED",
    },
    {
      id: "BT-2026-002",
      date: "2026-03-15",
      fromAccount: "HDFC Primary Current A/c",
      toAccount: "Main Office Petty Cash",
      reference: "PETTY-REF-03",
      amount: "₹25,000",
      notes: "Petty cash replenishment for March",
      status: "COMPLETED",
    },
  ];

  return (
    <AccountsEntityPage
      title="Fund Transfers"
      section="Banking"
      description="Record internal liquidity rebalancing between corporate bank accounts and cash drawers."
      newButtonText="New Transfer"
      kpis={[
        { label: "Total Transferred", value: "₹1,75,000", sub: "Internal movement" },
        { label: "Completed Transfers", value: "2", isPositive: true },
        { label: "Pending Verification", value: "₹0", sub: "All clear" },
        { label: "GL Posting", value: "Verified", sub: "Balanced Dr./Cr." },
      ]}
      columns={[
        { key: "id", label: "Transfer #" },
        { key: "date", label: "Date" },
        { key: "fromAccount", label: "Source Account" },
        { key: "toAccount", label: "Destination Account" },
        { key: "reference", label: "Reference #" },
        { key: "notes", label: "Purpose" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialTransfers}
    />
  );
}
