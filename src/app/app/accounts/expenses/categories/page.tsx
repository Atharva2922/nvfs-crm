import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function ExpenseCategoriesPage() {
  const initialCategories = [
    {
      id: "CAT-6010",
      code: "6010",
      name: "Salaries & Wages",
      type: "Operating Expense",
      taxDeductible: "Yes",
      status: "ACTIVE",
    },
    {
      id: "CAT-6020",
      code: "6020",
      name: "Rent & Lease Expense",
      type: "Facility Expense",
      taxDeductible: "Yes",
      status: "ACTIVE",
    },
    {
      id: "CAT-6030",
      code: "6030",
      name: "Electricity & Utilities",
      type: "Operating Expense",
      taxDeductible: "Yes",
      status: "ACTIVE",
    },
    {
      id: "CAT-6040",
      code: "6040",
      name: "Sales & Marketing",
      type: "Commercial Expense",
      taxDeductible: "Yes",
      status: "ACTIVE",
    },
    {
      id: "CAT-6050",
      code: "6050",
      name: "Software & Cloud Subscriptions",
      type: "IT & Infrastructure",
      taxDeductible: "Yes",
      status: "ACTIVE",
    },
    {
      id: "CAT-6060",
      code: "6060",
      name: "Travel & Entertainment",
      type: "Employee Expense",
      taxDeductible: "Yes",
      status: "ACTIVE",
    },
    {
      id: "CAT-6070",
      code: "6070",
      name: "Office Supplies & Printing",
      type: "Administrative",
      taxDeductible: "Yes",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Expense Categories"
      section="Expenses"
      description="Categorize your operational, administrative, and payroll expenses mapped directly to the Chart of Accounts."
      newButtonText="New Category"
      kpis={[
        { label: "Total Categories", value: "7", sub: "Standard COA mapped" },
        { label: "Active Categories", value: "7", sub: "All available" },
        { label: "Tax Deductible", value: "100%", isPositive: true },
        { label: "Ledger Linked", value: "Verified", sub: "Double-entry integrated" },
      ]}
      columns={[
        { key: "code", label: "Account Code" },
        { key: "name", label: "Category Name" },
        { key: "type", label: "Category Type" },
        { key: "taxDeductible", label: "Tax Deductible" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialCategories}
    />
  );
}
