import React from "react";
import { AccountsEntityPage } from "@/modules/accounts/components/accounts-entity-page";

export default function GSTConfigPage() {
  const initialConfigs = [
    {
      id: "GST-PARAM-01",
      param: "Primary Company GSTIN",
      value: "27AAACN0123M1Z5",
      type: "Tax Registration",
      state: "Maharashtra (27)",
      status: "ACTIVE",
    },
    {
      id: "GST-PARAM-02",
      param: "GST Filing Composition",
      value: "Regular Taxpayer (Monthly / GSTR-1 & 3B)",
      type: "Filing Scheme",
      state: "All India",
      status: "ACTIVE",
    },
    {
      id: "GST-PARAM-03",
      param: "Place of Supply Default",
      value: "Origin State (Intra-state CGST + SGST)",
      type: "Tax Rule",
      state: "Maharashtra",
      status: "ACTIVE",
    },
    {
      id: "GST-PARAM-04",
      param: "Default HSN Code for IT Services",
      value: "998314 (IT Design & Development Services)",
      type: "Classification",
      state: "Universal",
      status: "ACTIVE",
    },
    {
      id: "GST-PARAM-05",
      param: "E-Invoicing Threshold Check",
      value: "Mandatory QR Code enabled on B2B invoices",
      type: "Compliance",
      state: "Active",
      status: "ACTIVE",
    },
  ];

  return (
    <AccountsEntityPage
      title="GST Configuration"
      section="Tax / GST"
      description="Manage statutory Indian GST credentials, filing frequency, default state jurisdiction, and e-invoicing settings."
      newButtonText="Update GST Settings"
      kpis={[
        { label: "GSTIN Status", value: "Verified", isPositive: true },
        { label: "Registration State", value: "Maharashtra (27)", sub: "State Code: 27" },
        { label: "Filing Frequency", value: "Monthly", sub: "GSTR-1 & GSTR-3B" },
        { label: "HSN / SAC Code", value: "998314", sub: "IT Design Services" },
      ]}
      columns={[
        { key: "param", label: "Configuration Parameter" },
        { key: "value", label: "Value / Value Setting" },
        { key: "type", label: "Configuration Type" },
        { key: "state", label: "Jurisdiction" },
        { key: "status", label: "Compliance Status" },
      ]}
      initialData={initialConfigs}
    />
  );
}
