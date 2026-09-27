import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function EstimatesPage() {
  const initialEstimates = [
    {
      id: "EST-2026-001",
      customer: "Global Logistics Ltd",
      date: "2026-03-20",
      expiryDate: "2026-04-19",
      amount: "₹1,45,000",
      status: "SENT",
    },
    {
      id: "EST-2026-002",
      customer: "Starlight Media",
      date: "2026-03-22",
      expiryDate: "2026-04-21",
      amount: "₹82,500",
      status: "ACCEPTED",
    },
    {
      id: "EST-2026-003",
      customer: "CyberSol Systems",
      date: "2026-03-25",
      expiryDate: "2026-04-24",
      amount: "₹3,20,000",
      status: "DRAFT",
    },
  ];

  return (
    <AccountsEntityPage
      title="Estimates / Quotations"
      section="Sales"
      description="Create and track commercial proposals and quotes before issuing sales orders."
      newButtonText="New Estimate"
      kpis={[
        { label: "Total Estimates", value: "₹5,47,500", sub: "3 quotations issued" },
        { label: "Accepted", value: "₹82,500", change: "15%", isPositive: true },
        { label: "Pending Approval", value: "₹1,45,000", sub: "Awaiting customer signoff" },
        { label: "Drafts", value: "₹3,20,000", sub: "Unsent" },
      ]}
      columns={[
        { key: "id", label: "Estimate #" },
        { key: "customer", label: "Customer" },
        { key: "date", label: "Date" },
        { key: "expiryDate", label: "Expiry Date" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialEstimates}
    />
  );
}
