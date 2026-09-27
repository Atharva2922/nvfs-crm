import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function EmployeeExpensesPage() {
  const initialExpenses = [
    {
      id: "EXP-EMP-001",
      employee: "Aarav Sharma",
      department: "Engineering",
      category: "Software Tools & Licenses",
      date: "2026-03-22",
      amount: "₹7,499",
      receipt: "Uploaded (PDF)",
      status: "APPROVED",
    },
    {
      id: "EXP-EMP-002",
      employee: "Priya Patel",
      department: "Sales",
      category: "Client Meeting & Dinner",
      date: "2026-03-24",
      amount: "₹4,250",
      receipt: "Uploaded (JPG)",
      status: "PENDING",
    },
    {
      id: "EXP-EMP-003",
      employee: "Vikram Malhotra",
      department: "Operations",
      category: "Inter-city Cab & Tolls",
      date: "2026-03-25",
      amount: "₹2,800",
      receipt: "Uploaded (PDF)",
      status: "REIMBURSED",
    },
  ];

  return (
    <AccountsEntityPage
      title="Employee Expenses"
      section="Expenses"
      description="Manage out-of-pocket employee expense claims, bill receipts, and team reimbursement requests."
      newButtonText="Submit Expense Claim"
      kpis={[
        { label: "Claims This Month", value: "₹14,549", sub: "3 submitted" },
        { label: "Approved Claims", value: "₹7,499", isPositive: true },
        { label: "Pending Approval", value: "₹4,250", sub: "Requires manager review" },
        { label: "Reimbursed", value: "₹2,800", sub: "Settled to bank" },
      ]}
      columns={[
        { key: "id", label: "Claim ID" },
        { key: "employee", label: "Employee Name" },
        { key: "department", label: "Department" },
        { key: "category", label: "Expense Category" },
        { key: "date", label: "Date" },
        { key: "receipt", label: "Receipt Attachment" },
        { key: "amount", label: "Claim Amount", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialExpenses}
    />
  );
}
