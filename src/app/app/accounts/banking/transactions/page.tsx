import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function BankTransactionsPage() {
  const initialTransactions = [
    {
      id: "TXN-2026-881",
      date: "2026-03-24",
      account: "HDFC Primary Current A/c",
      reference: "NEFT-IN-9812401",
      description: "Payment received from Global Logistics Ltd",
      type: "DEPOSIT",
      amount: "₹1,45,000",
      status: "RECONCILED",
    },
    {
      id: "TXN-2026-882",
      date: "2026-03-23",
      account: "HDFC Primary Current A/c",
      reference: "IMPS-OUT-340192",
      description: "Vendor settlement - Delta Hardware Supplies",
      type: "WITHDRAWAL",
      amount: "₹65,000",
      status: "RECONCILED",
    },
    {
      id: "TXN-2026-883",
      date: "2026-03-22",
      account: "ICICI Operational Reserve",
      reference: "UPI-IN-889102",
      description: "Client Advance payment - Starlight Media",
      type: "DEPOSIT",
      amount: "₹45,000",
      status: "PENDING",
    },
    {
      id: "TXN-2026-884",
      date: "2026-03-21",
      account: "HDFC Primary Current A/c",
      reference: "ACH-DEBIT-5512",
      description: "Direct Debit - AWS Cloud Services",
      type: "WITHDRAWAL",
      amount: "₹18,500",
      status: "RECONCILED",
    },
  ];

  return (
    <AccountsEntityPage
      title="Bank Transactions Feed"
      section="Banking"
      description="Real-time statement transactions imported across all linked corporate and operational accounts."
      newButtonText="Add Transaction"
      kpis={[
        { label: "Total Transactions", value: "4", sub: "Imported feed" },
        { label: "Deposits (Inflow)", value: "₹1,90,000", isPositive: true },
        { label: "Withdrawals (Outflow)", value: "₹83,500", isPositive: false },
        { label: "Unmatched Feeds", value: "1", sub: "Awaiting matching rule" },
      ]}
      columns={[
        { key: "date", label: "Date" },
        { key: "account", label: "Bank Account" },
        { key: "reference", label: "Reference / Cheque #" },
        { key: "description", label: "Description / Party" },
        { key: "type", label: "Type" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "status", label: "Reconciliation" },
      ]}
      initialData={initialTransactions}
    />
  );
}
