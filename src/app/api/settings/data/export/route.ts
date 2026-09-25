import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AuditService } from "@/services/audit.service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const isAuthorized = ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "CFO"].includes(user.roleCode);
    if (!isAuthorized) {
      return errorResponse("Forbidden: Insufficient privileges for data export", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const { module, format = "JSON" } = body;

    let payload: any = {};

    if (!module || module === "ALL") {
      const [clients, leads, opportunities, tasks, invoices, employees, products, vendors] = await Promise.all([
        db.client.findMany({ take: 100 }),
        db.lead.findMany({ take: 100 }),
        db.opportunity.findMany({ take: 100 }),
        db.task.findMany({ take: 100 }),
        db.invoice.findMany({ take: 100 }),
        db.employee.findMany({ take: 100 }),
        db.product.findMany({ take: 100 }),
        db.vendor.findMany({ take: 100 }),
      ]);

      payload = { clients, leads, opportunities, tasks, invoices, employees, products, vendors };
    } else if (module === "CRM") {
      const [clients, leads, opportunities] = await Promise.all([
        db.client.findMany({ take: 200 }),
        db.lead.findMany({ take: 200 }),
        db.opportunity.findMany({ take: 200 }),
      ]);
      payload = { clients, leads, opportunities };
    } else if (module === "FINANCE") {
      const [invoices, payments, expenses] = await Promise.all([
        db.invoice.findMany({ take: 200 }),
        db.payment.findMany({ take: 200 }),
        db.expense.findMany({ take: 200 }),
      ]);
      payload = { invoices, payments, expenses };
    }

    await AuditService.logMutation({
      action: "DATA_EXPORT_GENERATED",
      entity: "DataManagement",
      entityId: module || "ALL",
      metadata: { format, exportedBy: user.email },
    });

    return successResponse({
      module: module || "ALL",
      format,
      recordCount: Object.values(payload).reduce((acc: number, cur: any) => acc + (cur?.length || 0), 0),
      exportedAt: new Date().toISOString(),
      data: payload,
    });
  } catch (error: any) {
    console.error("[Settings Export Error]:", error);
    return errorResponse(error.message || "Failed to generate data export", "INTERNAL_ERROR", 500);
  }
}
