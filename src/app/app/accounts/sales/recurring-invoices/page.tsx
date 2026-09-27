import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function RecurringInvoicesPage() {
  const initialProfiles = [
    {
      id: "REC-INV-001",
      customer: "Alpha Cloud Services",
      frequency: "Monthly",
      nextDate: "2026-04-01",
      amount: "₹45,000",
      status: "ACTIVE",
    },
    {
      id: "REC-INV-002",
      customer: "Metro Hospitalities",
      frequency: "Quarterly",
      nextDate: "2026-06-30",
      amount: "₹1,20,000",
      status: "ACTIVE",
    },
    {
      id: "REC-INV-003",
      customer: "Pinnacle Financials",
      frequency: "Monthly",
      nextDate: "2026-04-05",
      amount: "₹65,000",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Recurring Invoices"
      section="Sales"
      description="Automate monthly, quarterly, or yearly retainer and subscription billing schedules."
      newButtonText="New Recurring Profile"
      kpis={[
        { label: "Active Profiles", value: "3", sub: "Automated recurring schedules" },
        { label: "Monthly Recurring (MRR)", value: "₹1,50,000", change: "+12.4%", isPositive: true },
        { label: "Next Scheduled Run", value: "01 Apr 2026", sub: "Auto-generation ready" },
        { label: "Annualized Value", value: "₹18,00,000", sub: "ARR forecast" },
      ]}
      columns={[
        { key: "id", label: "Profile #" },
        { key: "customer", label: "Customer" },
        { key: "frequency", label: "Billing Frequency" },
        { key: "nextDate", label: "Next Invoice Date" },
        { key: "amount", label: "Amount / Cycle", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialProfiles}
    />
  );
}
