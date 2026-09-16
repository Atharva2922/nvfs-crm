import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { AuditService } from "@/services/audit.service";
import { z } from "zod";

const createDeadlineSchema = z.object({
  title: z.string().min(2, "Title is required"),
  deadlineType: z.string().default("FILING_DEADLINE"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.string().default("MEDIUM"),
  contractId: z.string().optional(),
  caseId: z.string().optional(),
  complianceId: z.string().optional(),
  ownerId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_READ)) {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const orgId = user.employee.organizationId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const contractId = searchParams.get("contractId") || undefined;
    const caseId = searchParams.get("caseId") || undefined;
    const complianceId = searchParams.get("complianceId") || undefined;

    const where: any = { organizationId: orgId };
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (contractId) where.contractId = contractId;
    if (caseId) where.caseId = caseId;
    if (complianceId) where.complianceId = complianceId;

    const deadlines = await db.legalDeadline.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, designation: true } },
        contract: { select: { id: true, contractNumber: true, title: true } },
        case: { select: { id: true, caseNumber: true, title: true } },
        compliance: { select: { id: true, code: true, title: true } },
      },
    });

    return successResponse(deadlines);
  } catch (error: any) {
    console.error("GET /api/legal/deadlines error:", error);
    return errorResponse(error.message || "Failed to load deadlines", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_WRITE) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_CREATE)) {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validated = createDeadlineSchema.parse(body);
    const orgId = user.employee.organizationId;

    const deadline = await db.legalDeadline.create({
      data: {
        organizationId: orgId,
        title: validated.title,
        deadlineType: validated.deadlineType,
        dueDate: new Date(validated.dueDate),
        priority: validated.priority,
        status: "UPCOMING",
        contractId: validated.contractId || null,
        caseId: validated.caseId || null,
        complianceId: validated.complianceId || null,
        ownerId: validated.ownerId || user.employee.id,
        notes: validated.notes || null,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "LEGAL_DEADLINE_CREATED",
      entity: "LegalDeadline",
      entityId: deadline.id,
      newValue: { title: deadline.title, dueDate: deadline.dueDate },
    });

    return successResponse(deadline, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed", "VALIDATION_ERROR", 400, (error as any).errors || error.issues);
    }
    console.error("POST /api/legal/deadlines error:", error);
    return errorResponse(error.message || "Failed to create deadline", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const { id, status, dueDate, notes } = body;
    if (!id) return errorResponse("Deadline ID is required", "BAD_REQUEST", 400);

    const orgId = user.employee.organizationId;
    const existing = await db.legalDeadline.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) return errorResponse("Deadline not found", "NOT_FOUND", 404);

    const updated = await db.legalDeadline.update({
      where: { id },
      data: {
        ...(status !== undefined && {
          status,
          completedAt: status === "COMPLETED" ? new Date() : null,
        }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(notes !== undefined && { notes }),
      },
    });

    return successResponse(updated);
  } catch (error: any) {
    console.error("PATCH /api/legal/deadlines error:", error);
    return errorResponse(error.message || "Failed to update deadline", "INTERNAL_ERROR", 500);
  }
}
