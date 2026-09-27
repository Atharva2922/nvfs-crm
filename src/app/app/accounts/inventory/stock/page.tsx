import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function StockTrackingPage() {
  const initialStock = [
    {
      id: "STK-001",
      item: "Dell PowerEdge Rack Server",
      sku: "SKU-SVR-01",
      warehouse: "Mumbai Central Warehouse",
      available: 8,
      reserved: 2,
      onOrder: 5,
      totalValue: "₹12,00,000",
      status: "IN_STOCK",
    },
    {
      id: "STK-002",
      item: "Cisco 24-Port Gigabit Managed Switch",
      sku: "SKU-NET-24",
      warehouse: "Pune Tech Depot",
      available: 28,
      reserved: 7,
      onOrder: 15,
      totalValue: "₹9,80,000",
      status: "IN_STOCK",
    },
    {
      id: "STK-003",
      item: "APC Smart-UPS 10kVA Online",
      sku: "SKU-UPS-10K",
      warehouse: "Mumbai Central Warehouse",
      available: 2,
      reserved: 2,
      onOrder: 4,
      totalValue: "₹3,80,000",
      status: "LOW_STOCK",
    },
    {
      id: "STK-004",
      item: "Samsung Enterprise NVMe SSD 1.92TB",
      sku: "SKU-SSD-2TB",
      warehouse: "Mumbai Central Warehouse",
      available: 52,
      reserved: 8,
      onOrder: 20,
      totalValue: "₹9,90,000",
      status: "IN_STOCK",
    },
  ];

  return (
    <AccountsEntityPage
      title="Stock Summary & Locations"
      section="Inventory"
      description="Live physical quantity counts, reserved commitments for sales orders, and pipeline reorders."
      newButtonText="Stock Adjustment"
      kpis={[
        { label: "Total Asset Value", value: "₹35,50,000", sub: "At cost basis" },
        { label: "Available Quantity", value: "90 Units", isPositive: true },
        { label: "Committed to Orders", value: "19 Units", sub: "Reserved" },
        { label: "Incoming Shipments", value: "44 Units", sub: "Pending PO delivery" },
      ]}
      columns={[
        { key: "item", label: "Item Name" },
        { key: "sku", label: "SKU" },
        { key: "warehouse", label: "Warehouse Location" },
        { key: "available", label: "Available", align: "right" },
        { key: "reserved", label: "Committed", align: "right" },
        { key: "onOrder", label: "In Transit", align: "right" },
        { key: "totalValue", label: "Valuation", align: "right" },
        { key: "status", label: "Stock Health" },
      ]}
      initialData={initialStock}
    />
  );
}
