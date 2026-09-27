import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function SalesOrdersPage() {
  const initialOrders = [
    {
      id: "SO-2026-001",
      customer: "Apex Retail Pvt Ltd",
      date: "2026-03-15",
      deliveryDate: "2026-03-30",
      amount: "₹2,80,000",
      invoicedStatus: "PARTIALLY_INVOICED",
      status: "APPROVED",
    },
    {
      id: "SO-2026-002",
      customer: "Zenith Infotech",
      date: "2026-03-18",
      deliveryDate: "2026-04-05",
      amount: "₹5,40,000",
      invoicedStatus: "NOT_INVOICED",
      status: "ACTIVE",
    },
    {
      id: "SO-2026-003",
      customer: "Omega Horizon Solutions",
      date: "2026-03-22",
      deliveryDate: "2026-04-10",
      amount: "₹1,95,000",
      invoicedStatus: "FULLY_INVOICED",
      status: "COMPLETED",
    },
  ];

  return (
    <AccountsEntityPage
      title="Sales Orders"
      section="Sales"
      description="Confirmed customer orders awaiting fulfillment and final sales invoicing."
      newButtonText="New Sales Order"
      kpis={[
        { label: "Total Booked", value: "₹10,15,000", sub: "All active orders" },
        { label: "To Be Invoiced", value: "₹5,40,000", sub: "Ready for billing" },
        { label: "Partially Invoiced", value: "₹2,80,000", change: "+1 order" },
        { label: "Completed", value: "₹1,95,000", sub: "Fully billed" },
      ]}
      columns={[
        { key: "id", label: "SO Number" },
        { key: "customer", label: "Customer" },
        { key: "date", label: "Order Date" },
        { key: "deliveryDate", label: "Expected Delivery" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "status", label: "Order Status" },
      ]}
      initialData={initialOrders}
    />
  );
}
