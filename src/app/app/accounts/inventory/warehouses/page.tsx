import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function WarehousesPage() {
  const initialWarehouses = [
    {
      id: "WH-BOM-01",
      code: "WH-BOM",
      name: "Mumbai Central Distribution Warehouse",
      location: "Bhiwandi Logistics Hub, Maharashtra",
      manager: "Sunil Kadam",
      itemsTracked: "142 SKUs",
      status: "ACTIVE",
    },
    {
      id: "WH-PNQ-02",
      code: "WH-PNQ",
      name: "Pune Tech Depot",
      location: "Hinjawadi Phase 2, Pune, Maharashtra",
      manager: "Kavita Rao",
      itemsTracked: "58 SKUs",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Warehouses & Depots"
      section="Inventory"
      description="Manage storage facilities, multi-location distribution hubs, and intra-warehouse transfers."
      newButtonText="New Warehouse"
      kpis={[
        { label: "Active Warehouses", value: "2", sub: "Operational hubs" },
        { label: "Combined Capacity Utilization", value: "68%", isPositive: true },
        { label: "Total Tracked Items", value: "200 SKUs", sub: "Distributed inventory" },
        { label: "Warehouse Audits", value: "Current", sub: "Q1 Verified" },
      ]}
      columns={[
        { key: "code", label: "Warehouse Code" },
        { key: "name", label: "Facility Name" },
        { key: "location", label: "Physical Address" },
        { key: "manager", label: "Facility In-Charge" },
        { key: "itemsTracked", label: "SKUs Stored", align: "center" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialWarehouses}
    />
  );
}
