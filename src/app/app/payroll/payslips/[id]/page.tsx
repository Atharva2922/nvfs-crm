import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PayrollService } from "@/services/payroll.service";
import { PayslipViewer } from "@/modules/payroll/components/payslip-viewer";

export const dynamic = "force-dynamic";

export default async function PayslipDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !user.employee) return notFound();

  try {
    const payslip = await PayrollService.getPayslip(id, user);
    return <PayslipViewer payslip={payslip} />;
  } catch (error: any) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-slate-400">
          {error.message || "You do not have permission to inspect this confidential payslip."}
        </p>
        <Link
          href="/app/payroll/my-payslips"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded text-xs"
        >
          Back to My Payslips
        </Link>
      </div>
    );
  }
}
