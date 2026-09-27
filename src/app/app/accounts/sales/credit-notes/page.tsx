import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function CreditNotesPage() {
  const initialNotes = [
    {
      id: "CN-2026-001",
      customer: "CyberSol Systems",
      invoiceRef: "INV-2026-012",
      date: "2026-03-21",
      amount: "₹18,000",
      balance: "₹0",
      reason: "Discount Adjustment post delivery",
      status: "COMPLETED",
    },
    {
      id: "CN-2026-002",
      customer: "Apex Retail Pvt Ltd",
      invoiceRef: "INV-2026-024",
      date: "2026-03-24",
      amount: "₹12,500",
      balance: "₹12,500",
      reason: "Return of damaged networking switch",
      status: "OPEN",
    },
  ];

  return (
    <AccountsEntityPage
      title="Credit Notes"
      section="Sales"
      description="Issue customer credits for returns, price adjustments, or billing revisions."
      newButtonText="New Credit Note"
      kpis={[
        { label: "Total Credit Issued", value: "₹30,500", sub: "Current fiscal year" },
        { label: "Available Credits", value: "₹12,500", sub: "Open for invoice deduction" },
        { label: "Refunded / Settled", value: "₹18,000", sub: "Fully consumed" },
        { label: "Credit Count", value: "2", sub: "Active records" },
      ]}
      columns={[
        { key: "id", label: "Credit Note #" },
        { key: "customer", label: "Customer" },
        { key: "invoiceRef", label: "Invoice Ref" },
        { key: "date", label: "Date" },
        { key: "reason", label: "Reason / Note" },
        { key: "amount", label: "Credit Amount", align: "right" },
        { key: "balance", label: "Remaining Balance", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialNotes}
    />
  );
}
