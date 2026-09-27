import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function StockAdjustmentsPage() {
  const initialAdjustments = [
    {
      id: "ADJ-2026-001",
      date: "2026-03-21",
      item: "Dell PowerEdge Rack Server",
      warehouse: "Mumbai Central Distribution Warehouse",
      type: "QUANTITY_INCREASE",
      qtyDiff: "+1",
      reason: "Physical count surplus found during audit",
      adjustedBy: "Warehouse Auditor",
      status: "APPROVED",
    },
    {
      id: "ADJ-2026-002",
      date: "2026-03-18",
      item: "Samsung Enterprise NVMe SSD 1.92TB",
      warehouse: "Pune Tech Depot",
      type: "VALUE_WRITE_OFF",
      qtyDiff: "-2",
      reason: "Defective units returned to OEM for replacement",
      adjustedBy: "Inventory Lead",
      status: "APPROVED",
    },
  ];

  return (
    <AccountsEntityPage
      title="Stock Adjustments"
      section="Inventory"
      description="Post inventory write-offs, physical count discrepancies, and scrap adjustments directly into the General Ledger."
      newButtonText="New Adjustment"
      kpis={[
        { label: "Adjustments This Month", value: "2", sub: "Audited entries" },
        { label: "Net Value Variance", value: "-₹33,000", isPositive: false },
        { label: "GL Posting", value: "Verified", sub: "Dr. Scrap / Cr. Inventory" },
        { label: "Audit Signoff", value: "Completed", isPositive: true },
      ]}
      columns={[
        { key: "id", label: "Adjustment #" },
        { key: "date", label: "Date" },
        { key: "item", label: "Item Adjusted" },
        { key: "warehouse", label: "Warehouse" },
        { key: "qtyDiff", label: "Qty Adjusted", align: "right" },
        { key: "reason", label: "Reason & Notes" },
        { key: "adjustedBy", label: "Authorized By" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialAdjustments}
    />
  );
}
