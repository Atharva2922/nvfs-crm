import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function CashAccountsPage() {
  const initialCash = [
    {
      id: "CASH-001",
      name: "Main Office Petty Cash",
      custodian: "Office Manager (Suman K)",
      accountCode: "1010",
      limit: "₹50,000",
      balance: "₹42,500",
      status: "ACTIVE",
    },
    {
      id: "CASH-002",
      name: "Branch 2 Cash Drawer",
      custodian: "Cashier (Rajesh P)",
      accountCode: "1010-B",
      limit: "₹25,000",
      balance: "₹18,200",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Cash Accounts & Petty Cash"
      section="Banking"
      description="Manage on-hand cash registers, petty cash disbursements, and physical currency verification."
      newButtonText="New Cash Register"
      kpis={[
        { label: "Total Physical Cash", value: "₹60,700", sub: "2 cash registers" },
        { label: "Petty Cash Limit", value: "₹75,000", sub: "Combined max authorized" },
        { label: "Monthly Cash Inflow", value: "₹15,000", isPositive: true },
        { label: "Cash Disbursed", value: "₹9,300", sub: "Receipts verified" },
      ]}
      columns={[
        { key: "id", label: "Register #" },
        { key: "name", label: "Account Name" },
        { key: "custodian", label: "Custodian / Manager" },
        { key: "accountCode", label: "GL Code" },
        { key: "limit", label: "Imprest Limit", align: "right" },
        { key: "balance", label: "Current Balance", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialCash}
    />
  );
}
