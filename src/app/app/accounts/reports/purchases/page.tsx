import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function PurchaseReportPage() {
  const initialPurchases = [
    {
      id: "REP-P01",
      vendor: "Delta Hardware Supplies",
      billsCount: "5",
      billedAmount: "₹8,40,000",
      paidAmount: "₹6,55,000",
      outstanding: "₹1,85,000",
      status: "ACTIVE",
    },
    {
      id: "REP-P02",
      vendor: "Sigma Web Infrastructure",
      billsCount: "3",
      billedAmount: "₹3,90,000",
      paidAmount: "₹3,90,000",
      outstanding: "₹0",
      status: "ACTIVE",
    },
    {
      id: "REP-P03",
      vendor: "Apex Office Parks",
      billsCount: "3",
      billedAmount: "₹3,60,000",
      paidAmount: "₹3,60,000",
      outstanding: "₹0",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Purchases By Vendor Report"
      section="Reports"
      description="Consolidated vendor procurement breakdown, disbursement records, and outstanding payable ratios."
      newButtonText="Generate Custom Range"
      kpis={[
        { label: "Total Purchases", value: "₹15,90,000", sub: "11 bills recorded" },
        { label: "Total Paid", value: "₹14,05,000", isPositive: true },
        { label: "Payables Outstanding", value: "₹1,85,000", isPositive: false },
        { label: "Active Suppliers", value: "3 Vendors", sub: "Key supply partners" },
      ]}
      columns={[
        { key: "vendor", label: "Vendor Name" },
        { key: "billsCount", label: "Bills Count", align: "center" },
        { key: "billedAmount", label: "Total Billed", align: "right" },
        { key: "paidAmount", label: "Paid Out", align: "right" },
        { key: "outstanding", label: "Balance Due", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialPurchases}
    />
  );
}
