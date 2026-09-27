import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function ReimbursementsPage() {
  const initialReimbursements = [
    {
      id: "RMB-2026-001",
      employee: "Vikram Malhotra",
      expenseRef: "EXP-EMP-003",
      paymentMethod: "NEFT Bank Transfer",
      account: "HDFC Primary Current A/c",
      processedDate: "2026-03-26",
      amount: "₹2,800",
      status: "COMPLETED",
    },
    {
      id: "RMB-2026-002",
      employee: "Aarav Sharma",
      expenseRef: "EXP-EMP-001",
      paymentMethod: "UPI Settlement",
      account: "HDFC Primary Current A/c",
      processedDate: "Pending Batch",
      amount: "₹7,499",
      status: "PENDING",
    },
  ];

  return (
    <AccountsEntityPage
      title="Employee Reimbursements"
      section="Expenses"
      description="Track payouts made to staff for approved out-of-pocket operational and travel expenses."
      newButtonText="Process Payout"
      kpis={[
        { label: "Total Reimbursed", value: "₹2,800", sub: "Disbursed via bank transfer" },
        { label: "Pending Payout", value: "₹7,499", sub: "Approved & queueing" },
        { label: "Eligible Claims", value: "1", sub: "Ready for batch disbursement" },
        { label: "Average Settlement Time", value: "1.8 Days", isPositive: true },
      ]}
      columns={[
        { key: "id", label: "Payout ID" },
        { key: "employee", label: "Employee" },
        { key: "expenseRef", label: "Expense Ref" },
        { key: "paymentMethod", label: "Disbursement Mode" },
        { key: "account", label: "Disbursed From" },
        { key: "processedDate", label: "Date / Run" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialReimbursements}
    />
  );
}
