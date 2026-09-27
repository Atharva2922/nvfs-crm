import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function RecurringBillsPage() {
  const initialProfiles = [
    {
      id: "REC-BILL-001",
      vendor: "Sigma Web Infrastructure",
      profileName: "AWS Cloud Infrastructure Hosting",
      frequency: "Monthly",
      nextRun: "2026-04-01",
      amount: "₹65,000",
      status: "ACTIVE",
    },
    {
      id: "REC-BILL-002",
      vendor: "Apex Office Parks",
      profileName: "Corporate Office Commercial Lease",
      frequency: "Monthly",
      nextRun: "2026-04-05",
      amount: "₹1,20,000",
      status: "ACTIVE",
    },
    {
      id: "REC-BILL-003",
      vendor: "SpeedNet Broadband",
      profileName: "Dedicated Leased Line Internet",
      frequency: "Monthly",
      nextRun: "2026-04-10",
      amount: "₹14,500",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Recurring Bills"
      section="Purchases"
      description="Automate repetitive vendor expenses such as office rent, cloud services, and ISP bills."
      newButtonText="New Recurring Bill"
      kpis={[
        { label: "Active Recurring Bills", value: "3", sub: "Monthly payables" },
        { label: "Monthly Outflow", value: "₹1,99,500", sub: "Predictable commitments" },
        { label: "Next Scheduled Bill", value: "01 Apr 2026", sub: "Sigma Web Infra" },
        { label: "Annual Commitments", value: "₹23,94,000", sub: "Yearly expenditure" },
      ]}
      columns={[
        { key: "id", label: "Profile #" },
        { key: "vendor", label: "Vendor" },
        { key: "profileName", label: "Description / Service" },
        { key: "frequency", label: "Frequency" },
        { key: "nextRun", label: "Next Bill Date" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialProfiles}
    />
  );
}
