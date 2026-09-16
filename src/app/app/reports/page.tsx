import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";

export default function ReportsModulePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Cockpit & Cross-Functional Analytics"
        description="Unified corporate business intelligence designed for Chairperson, CEO, CFO, CTO, and CMO oversight."
      />
      <EmptyState
        icon={BarChart3}
        title="Executive Analytics Scheduled for Block 8"
        description="This module is part of the planned architectural roadmap. Reports will query live data across all business domains with role-based metric scoping."
      />
    </div>
  );
}
