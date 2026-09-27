import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function GSTTransactionsPage() {
  const initialTxns = [
    {
      id: "GST-TXN-001",
      date: "2026-03-24",
      docNo: "INV-2026-001",
      party: "Global Logistics Ltd",
      gstin: "27AAACG9812A1ZZ",
      supplyType: "Intra-State (B2B)",
      taxable: "₹1,22,881",
      cgst: "₹11,059",
      sgst: "₹11,059",
      igst: "₹0",
      totalTax: "₹22,118",
      status: "ACTIVE",
    },
    {
      id: "GST-TXN-002",
      date: "2026-03-23",
      docNo: "BILL-2026-001",
      party: "Delta Hardware Supplies",
      gstin: "27BBBPS1122C1ZU",
      supplyType: "Intra-State ITC",
      taxable: "₹55,084",
      cgst: "₹4,958",
      sgst: "₹4,958",
      igst: "₹0",
      totalTax: "₹9,916",
      status: "ACTIVE",
    },
    {
      id: "GST-TXN-003",
      date: "2026-03-22",
      docNo: "INV-2026-002",
      party: "Starlight Media",
      gstin: "29AADCS5544K1ZF",
      supplyType: "Inter-State (Karnataka)",
      taxable: "₹69,915",
      cgst: "₹0",
      sgst: "₹0",
      igst: "₹12,585",
      totalTax: "₹12,585",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="GST Transactions"
      section="Tax / GST"
      description="Itemized CGST, SGST, and IGST tax entries generated from all sales invoices, vendor bills, and credit notes."
      newButtonText="Recompute Taxes"
      kpis={[
        { label: "Total Taxable Turnover", value: "₹2,47,880", sub: "Current month" },
        { label: "Output CGST + SGST", value: "₹22,118", sub: "Collected on sales" },
        { label: "Output IGST", value: "₹12,585", sub: "Inter-state sales" },
        { label: "Input Tax Credit (ITC)", value: "₹9,916", isPositive: true },
      ]}
      columns={[
        { key: "date", label: "Date" },
        { key: "docNo", label: "Doc #" },
        { key: "party", label: "Customer / Vendor" },
        { key: "gstin", label: "Party GSTIN" },
        { key: "supplyType", label: "Supply Type" },
        { key: "taxable", label: "Taxable Value", align: "right" },
        { key: "cgst", label: "CGST", align: "right" },
        { key: "sgst", label: "SGST", align: "right" },
        { key: "igst", label: "IGST", align: "right" },
        { key: "totalTax", label: "Total Tax", align: "right" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialTxns}
    />
  );
}
