import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function PurchaseOrdersPage() {
  const initialPOs = [
    {
      id: "PO-2026-001",
      vendor: "Delta Hardware Supplies",
      orderDate: "2026-03-16",
      expectedDate: "2026-03-29",
      amount: "₹1,85,000",
      status: "ISSUED",
    },
    {
      id: "PO-2026-002",
      vendor: "Sigma Web Infrastructure",
      orderDate: "2026-03-20",
      expectedDate: "2026-04-02",
      amount: "₹72,000",
      status: "BILLED",
    },
    {
      id: "PO-2026-003",
      vendor: "Prime Stationeries & Supplies",
      orderDate: "2026-03-24",
      expectedDate: "2026-03-31",
      amount: "₹34,500",
      status: "DRAFT",
    },
  ];

  return (
    <AccountsEntityPage
      title="Purchase Orders"
      section="Purchases"
      description="Formal purchase requests placed with vendors prior to billing and inventory receipts."
      newButtonText="New Purchase Order"
      kpis={[
        { label: "Total PO Value", value: "₹2,91,500", sub: "3 purchase orders" },
        { label: "Billed POs", value: "₹72,000", sub: "Converted to bill" },
        { label: "Awaiting Delivery", value: "₹1,85,000", sub: "Dispatched by vendor" },
        { label: "Drafts", value: "₹34,500", sub: "Pending manager approval" },
      ]}
      columns={[
        { key: "id", label: "PO Number" },
        { key: "vendor", label: "Vendor" },
        { key: "orderDate", label: "Order Date" },
        { key: "expectedDate", label: "Expected Delivery" },
        { key: "amount", label: "Total Amount", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialPOs}
    />
  );
}
