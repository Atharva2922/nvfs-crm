import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function SalesReportPage() {
  const initialSalesData = [
    {
      id: "REP-S01",
      customer: "Global Logistics Ltd",
      invoicesCount: "6",
      grossSales: "₹18,50,000",
      discounts: "₹50,000",
      taxes: "₹3,24,000",
      netSales: "₹21,24,000",
      collectionRate: "92%",
      status: "ACTIVE",
    },
    {
      id: "REP-S02",
      customer: "Starlight Media",
      invoicesCount: "4",
      grossSales: "₹9,80,000",
      discounts: "₹20,000",
      taxes: "₹1,72,800",
      netSales: "₹11,32,800",
      collectionRate: "85%",
      status: "ACTIVE",
    },
    {
      id: "REP-S03",
      customer: "Apex Retail Pvt Ltd",
      invoicesCount: "3",
      grossSales: "₹6,40,000",
      discounts: "₹0",
      taxes: "₹1,15,200",
      netSales: "₹7,55,200",
      collectionRate: "100%",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Sales By Customer Report"
      section="Reports"
      description="In-depth analysis of sales revenue, discounts, tax collections, and payment realization ratios."
      newButtonText="Generate Custom Range"
      kpis={[
        { label: "Total Billed Sales", value: "₹40,12,000", isPositive: true },
        { label: "Average Realization", value: "91.8%", change: "+4.2%", isPositive: true },
        { label: "Total Customers Billed", value: "3 Clients", sub: "Enterprise tier" },
        { label: "Top Customer Share", value: "52.9%", sub: "Global Logistics Ltd" },
      ]}
      columns={[
        { key: "customer", label: "Customer Name" },
        { key: "invoicesCount", label: "Invoices", align: "center" },
        { key: "grossSales", label: "Gross Sales", align: "right" },
        { key: "discounts", label: "Discounts", align: "right" },
        { key: "taxes", label: "GST / Taxes", align: "right" },
        { key: "netSales", label: "Net Invoiced", align: "right" },
        { key: "collectionRate", label: "Collection %", align: "right" },
      ]}
      initialData={initialSalesData}
    />
  );
}
