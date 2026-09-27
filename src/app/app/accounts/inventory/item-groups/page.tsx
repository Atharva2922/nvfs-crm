import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function ItemGroupsPage() {
  const initialGroups = [
    {
      id: "GRP-001",
      name: "Hardware & Servers",
      itemsCount: "12 SKUs",
      hsnCode: "84715000",
      taxRate: "18% GST",
      status: "ACTIVE",
    },
    {
      id: "GRP-002",
      name: "Networking Equipment",
      itemsCount: "24 SKUs",
      hsnCode: "85176290",
      taxRate: "18% GST",
      status: "ACTIVE",
    },
    {
      id: "GRP-003",
      name: "Power & Backup",
      itemsCount: "8 SKUs",
      hsnCode: "85044090",
      taxRate: "18% GST",
      status: "ACTIVE",
    },
    {
      id: "GRP-004",
      name: "Storage & Spares",
      itemsCount: "35 SKUs",
      hsnCode: "84717020",
      taxRate: "18% GST",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Item Groups"
      section="Inventory"
      description="Organize merchandise and inventory stock into logical classifications with shared HSN codes and GST schedules."
      newButtonText="New Item Group"
      kpis={[
        { label: "Total Groups", value: "4", sub: "Standard classification" },
        { label: "Total Assigned SKUs", value: "79 Items", isPositive: true },
        { label: "Default GST", value: "18%", sub: "Automated tax rule" },
        { label: "Active Warehouses", value: "2", sub: "Cross-dock ready" },
      ]}
      columns={[
        { key: "name", label: "Group Name" },
        { key: "itemsCount", label: "Associated Items", align: "center" },
        { key: "hsnCode", label: "Default HSN Code" },
        { key: "taxRate", label: "Tax Schedule", align: "center" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialGroups}
    />
  );
}
