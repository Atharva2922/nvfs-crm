import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function VendorCreditsPage() {
  const initialCredits = [
    {
      id: "VC-2026-001",
      vendor: "Delta Hardware Supplies",
      billRef: "BILL-2026-004",
      date: "2026-03-22",
      amount: "₹15,000",
      balance: "₹15,000",
      reason: "Credit memo for damaged shipment goods",
      status: "OPEN",
    },
    {
      id: "VC-2026-002",
      vendor: "Sigma Web Infrastructure",
      billRef: "BILL-2026-001",
      date: "2026-03-10",
      amount: "₹6,800",
      balance: "₹0",
      reason: "SLA downtime rebate credit",
      status: "COMPLETED",
    },
  ];

  return (
    <AccountsEntityPage
      title="Vendor Credits"
      section="Purchases"
      description="Track vendor credit memos, rebates, and return allowances to offset future bills."
      newButtonText="New Vendor Credit"
      kpis={[
        { label: "Total Vendor Credits", value: "₹21,800", sub: "All time recorded" },
        { label: "Available to Offset", value: "₹15,000", sub: "Open vendor credit" },
        { label: "Applied to Bills", value: "₹6,800", sub: "Settled against payables" },
        { label: "Open Credits", value: "1", sub: "Delta Hardware Supplies" },
      ]}
      columns={[
        { key: "id", label: "Credit Memo #" },
        { key: "vendor", label: "Vendor" },
        { key: "billRef", label: "Bill Reference" },
        { key: "date", label: "Date" },
        { key: "reason", label: "Reason / Memo" },
        { key: "amount", label: "Total Credit", align: "right" },
        { key: "balance", label: "Remaining Balance", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialCredits}
    />
  );
}
