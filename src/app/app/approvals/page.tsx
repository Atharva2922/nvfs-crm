import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ApprovalEngineService } from "@/services/approval-engine.service";
import { ApprovalCenterView } from "@/modules/approvals/approval-center-view";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const approvals = await ApprovalEngineService.list(user);

  const formatted = approvals.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    status: a.status,
    entityType: a.entityType,
    createdAt: a.createdAt.toISOString(),
    metadata: a.metadata,
    requestedBy: a.requestedBy,
    approver: a.approver,
  }));

  return <ApprovalCenterView initialApprovals={formatted} />;
}
