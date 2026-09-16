import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ComplianceService } from "@/services/compliance.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { z } from "zod";

const createComplianceSchema = z.object({
  title: z.string().min(2, "Title is required"),
  code: z.string().optional(),
  regulation: z.string().min(1, "Regulation is required"),
  jurisdiction: z.string().optional(),
  departmentId: z.string().optional(),
  ownerId: z.string().optional(),
  frequency: z.string().optional(),
  lastCompletedDate: z.string().optional(),
  nextDueDate: z.string().min(1, "Next due date is required"),
  riskLevel: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_READ)) {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const regulation = searchParams.get("regulation") || undefined;
    const frequency = searchParams.get("frequency") || undefined;
    const riskLevel = searchParams.get("riskLevel") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const ownerId = searchParams.get("ownerId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const result = await ComplianceService.listCompliance(
      user,
      { search, status, regulation, frequency, riskLevel, departmentId, ownerId },
      page,
      limit
    );

    return successResponse(result);
  } catch (error: any) {
    console.error("GET /api/legal/compliance error:", error);
    return errorResponse(error.message || "Failed to load compliance obligations", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_COMPLIANCE_MANAGE) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_CREATE)) {
      return errorResponse("Forbidden: Insufficient permissions to create compliance obligation", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validated = createComplianceSchema.parse(body);

    const compliance = await ComplianceService.create(user, {
      ...validated,
      ownerId: validated.ownerId || user.employee.id,
      nextDueDate: new Date(validated.nextDueDate),
    });

    return successResponse(compliance, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed", "VALIDATION_ERROR", 400, (error as any).errors || error.issues);
    }
    console.error("POST /api/legal/compliance error:", error);
    return errorResponse(error.message || "Failed to create compliance obligation", "INTERNAL_ERROR", 500);
  }
}
