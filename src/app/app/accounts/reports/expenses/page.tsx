import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function ExpenseReportPage() {
  const initialExpenseReport = [
    {
      id: "EXP-R01",
      category: "Salaries & Wages",
      code: "6010",
      budget: "₹6,00,000",
      spent: "₹5,40,000",
      variance: "+₹60,000 (Favorable)",
      pctBudget: "90%",
      status: "ACTIVE",
    },
    {
      id: "EXP-R02",
      category: "Rent & Lease Expense",
      code: "6020",
      budget: "₹1,20,000",
      spent: "₹1,20,000",
      variance: "₹0",
      pctBudget: "100%",
      status: "ACTIVE",
    },
    {
      id: "EXP-R03",
      category: "Software & Cloud Subscriptions",
      code: "6050",
      budget: "₹75,000",
      spent: "₹65,000",
      variance: "+₹10,000 (Favorable)",
      pctBudget: "86.6%",
      status: "ACTIVE",
    },
    {
      id: "EXP-R04",
      category: "Sales & Marketing",
      code: "6040",
      budget: "₹80,000",
      spent: "₹92,000",
      variance: "-₹12,000 (Unfavorable)",
      pctBudget: "115%",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Expense & Budget Variance Report"
      section="Reports"
      description="Detailed breakdown of operational spending against quarterly budgets across departmental accounts."
      newButtonText="Export PDF Statement"
      kpis={[
        { label: "Total Spend YTD", value: "₹8,17,000", sub: "Operational OPEX" },
        { label: "Budget Utilization", value: "93.4%", isPositive: true },
        { label: "Favorable Variance", value: "+₹58,000", isPositive: true },
        { label: "Largest OPEX Head", value: "Salaries (66%)", sub: "Payroll" },
      ]}
      columns={[
        { key: "category", label: "Expense Head" },
        { key: "code", label: "GL Code" },
        { key: "budget", label: "Quarterly Budget", align: "right" },
        { key: "spent", label: "Actual Spend", align: "right" },
        { key: "variance", label: "Variance", align: "right" },
        { key: "pctBudget", label: "% Consumed", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialExpenseReport}
    />
  );
}
