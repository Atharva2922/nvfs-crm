import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function InventoryItemsPage() {
  const initialItems = [
    {
      id: "SKU-SVR-01",
      sku: "SKU-SVR-01",
      name: "Dell PowerEdge Rack Server",
      group: "Hardware & Servers",
      stock: "12 Units",
      purchasePrice: "₹1,20,000",
      sellingPrice: "₹1,45,000",
      status: "ACTIVE",
    },
    {
      id: "SKU-NET-24",
      sku: "SKU-NET-24",
      name: "Cisco 24-Port Gigabit Managed Switch",
      group: "Networking Equipment",
      stock: "35 Units",
      purchasePrice: "₹28,000",
      sellingPrice: "₹36,500",
      status: "ACTIVE",
    },
    {
      id: "SKU-UPS-10K",
      sku: "SKU-UPS-10K",
      name: "APC Smart-UPS 10kVA Online",
      group: "Power & Backup",
      stock: "4 Units",
      purchasePrice: "₹95,000",
      sellingPrice: "₹1,18,000",
      status: "ACTIVE",
    },
    {
      id: "SKU-SSD-2TB",
      sku: "SKU-SSD-2TB",
      name: "Samsung Enterprise NVMe SSD 1.92TB",
      group: "Storage & Spares",
      stock: "60 Units",
      purchasePrice: "₹16,500",
      sellingPrice: "₹22,000",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Inventory Items"
      section="Inventory"
      description="Track products, hardware parts, service SKUs, cost prices, and standard selling rates."
      newButtonText="New Item"
      kpis={[
        { label: "Total SKUs", value: "4 Items", sub: "Tracked in stock" },
        { label: "Total Asset Value", value: "₹37,90,000", isPositive: true },
        { label: "Low Stock Alerts", value: "1 Item", sub: "APC 10kVA UPS" },
        { label: "Average Margin", value: "24.6%", isPositive: true },
      ]}
      columns={[
        { key: "sku", label: "SKU" },
        { key: "name", label: "Item Name" },
        { key: "group", label: "Category Group" },
        { key: "stock", label: "In Stock", align: "right" },
        { key: "purchasePrice", label: "Cost Price", align: "right" },
        { key: "sellingPrice", label: "Selling Price", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialItems}
    />
  );
}
