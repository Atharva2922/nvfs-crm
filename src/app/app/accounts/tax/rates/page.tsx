import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function TaxRatesPage() {
  const initialRates = [
    {
      id: "TAX-18",
      name: "GST 18% (Standard Rate)",
      rate: "18.00%",
      type: "CGST (9%) + SGST (9%)",
      applicableTo: "Goods & Commercial Services",
      status: "ACTIVE",
    },
    {
      id: "TAX-18-IGST",
      name: "IGST 18% (Inter-state)",
      rate: "18.00%",
      type: "Integrated GST (18%)",
      applicableTo: "Inter-state Sales & Purchases",
      status: "ACTIVE",
    },
    {
      id: "TAX-12",
      name: "GST 12% (Concessional)",
      rate: "12.00%",
      type: "CGST (6%) + SGST (6%)",
      applicableTo: "Specified IT Hardware / Services",
      status: "ACTIVE",
    },
    {
      id: "TAX-5",
      name: "GST 5% (Low Rate)",
      rate: "5.00%",
      type: "CGST (2.5%) + SGST (2.5%)",
      applicableTo: "Basic Essentials / Transport",
      status: "ACTIVE",
    },
    {
      id: "TAX-28",
      name: "GST 28% (Luxury Rate)",
      rate: "28.00%",
      type: "CGST (14%) + SGST (14%)",
      applicableTo: "High-end Electronics & Luxury items",
      status: "ACTIVE",
    },
    {
      id: "TAX-0",
      name: "GST 0% (Exempt / Nil Rated)",
      rate: "0.00%",
      type: "Nil Rated",
      applicableTo: "Export of Services / SEZ Supply",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="Tax & GST Rates"
      section="Tax / GST"
      description="Configure Goods & Services Tax (GST) schedules, HSN/SAC mappings, and dual CGST/SGST/IGST tax rates."
      newButtonText="New Tax Rate"
      kpis={[
        { label: "Active Tax Schedules", value: "6", sub: "Standard Indian GST" },
        { label: "Default Invoice Rate", value: "18% GST", isPositive: true },
        { label: "Inter-State IGST", value: "Enabled", sub: "Automatic location mapping" },
        { label: "Reverse Charge (RCM)", value: "Supported", sub: "Section 9(3) / 9(4)" },
      ]}
      columns={[
        { key: "name", label: "Tax Schedule Name" },
        { key: "rate", label: "Rate (%)", align: "right" },
        { key: "type", label: "Component Breakdown" },
        { key: "applicableTo", label: "Applicability" },
        { key: "status", label: "Status" },
      ]}
      initialData={initialRates}
    />
  );
}
