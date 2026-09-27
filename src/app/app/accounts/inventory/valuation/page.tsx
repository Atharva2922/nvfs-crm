import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function InventoryValuationPage() {
  const initialValuation = [
    {
      id: "VAL-001",
      sku: "SKU-SVR-01",
      item: "Dell PowerEdge Rack Server",
      method: "FIFO (First In First Out)",
      qtyOnHand: "10 Units",
      unitCost: "₹1,20,000",
      assetValue: "₹12,00,000",
      status: "ACTIVE",
    },
    {
      id: "VAL-002",
      sku: "SKU-NET-24",
      item: "Cisco 24-Port Gigabit Managed Switch",
      method: "FIFO",
      qtyOnHand: "35 Units",
      unitCost: "₹28,000",
      assetValue: "₹9,80,000",
      status: "ACTIVE",
    },
    {
      id: "VAL-003",
      sku: "SKU-UPS-10K",
      item: "APC Smart-UPS 10kVA Online",
      method: "FIFO",
      qtyOnHand: "4 Units",
      unitCost: "₹95,000",
      assetValue: "₹3,80,000",
      status: "ACTIVE",
    },
    {
      id: "VAL-004",
      sku: "SKU-SSD-2TB",
      item: "Samsung Enterprise NVMe SSD 1.92TB",
      method: "FIFO",
      qtyOnHand: "60 Units",
      unitCost: "₹16,500",
      assetValue: "₹9,90,000",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Inventory Valuation Summary"
      section="Inventory"
      description="Stock valuation based on FIFO / Weighted Average Cost, integrated directly into Balance Sheet Current Assets."
      newButtonText="Recalculate Valuation"
      kpis={[
        { label: "Total Inventory Asset", value: "₹35,50,000", isPositive: true },
        { label: "Costing Method", value: "FIFO Standard", sub: "Compliant with AS-2 / Ind AS 2" },
        { label: "Balance Sheet GL (1040)", value: "₹35,50,000", sub: "Reconciled with GL" },
        { label: "Total Physical Units", value: "109 Units", sub: "Across all locations" },
      ]}
      columns={[
        { key: "sku", label: "SKU Code" },
        { key: "item", label: "Item Description" },
        { key: "method", label: "Valuation Method" },
        { key: "qtyOnHand", label: "Quantity on Hand", align: "right" },
        { key: "unitCost", label: "Unit Cost", align: "right" },
        { key: "assetValue", label: "Total Asset Value", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialValuation}
    />
  );
}
