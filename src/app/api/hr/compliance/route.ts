import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AuditService } from "@/services/audit.service";
import { z } from "zod";

const createComplianceSchema = z.object({
  item: z.string().min(3, "Item/Title must be at least 3 characters"),
  status: z.enum(["PENDING", "COMPLIANT", "OVERDUE", "UNDER_REVIEW"]).default("COMPLIANT"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
  departmentCode: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const orgId = user.employee.organizationId;

    const where: any = { organizationId: orgId };
    if (status && status !== "ALL") where.status = status;

    const records = await db.complianceRecord.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        responsibleDepartment: { select: { name: true, code: true } },
      },
    });

    const counts = {
      total: records.length,
      compliant: records.filter((r) => r.status === "COMPLIANT").length,
      actionRequired: records.filter((r) => r.status === "OVERDUE").length,
      pendingReview: records.filter((r) => r.status === "PENDING" || r.status === "UNDER_REVIEW").length,
      expired: records.filter((r) => r.status === "OVERDUE").length,
    };

    return successResponse({ records, counts });
  } catch (error: any) {
    console.error("[Compliance GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch compliance records", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const userRole = user.roleCode;
    const isPrivileged = ["SUPER_ADMIN", "ADMIN", "CHAIRPERSON", "CEO"].includes(userRole || "");
    if (!isPrivileged) {
      return errorResponse("Forbidden: Administrator privileges required", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parse = createComplianceSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const orgId = user.employee.organizationId;
    let deptId: string | undefined = undefined;
    if (parse.data.departmentCode) {
      const dept = await db.department.findFirst({
        where: { organizationId: orgId, code: parse.data.departmentCode },
      });
      deptId = dept?.id;
    }

    const record = await db.complianceRecord.create({
      data: {
        organizationId: orgId,
        item: parse.data.item,
        responsibleDepartmentId: deptId,
        dueDate: new Date(parse.data.dueDate),
        status: parse.data.status,
        notes: parse.data.notes || null,
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "COMPLIANCE_RECORD_CREATED",
      entity: "ComplianceRecord",
      entityId: record.id,
      newValue: { item: record.item, status: record.status },
    });

    return successResponse(record, 201);
  } catch (error: any) {
    console.error("[Compliance POST Error]:", error);
    return errorResponse(error.message || "Failed to create compliance record", "BAD_REQUEST", 400);
  }
}
