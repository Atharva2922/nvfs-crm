import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LegalCaseService } from "@/services/legal-case.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { z } from "zod";

const createCaseSchema = z.object({
  title: z.string().min(2, "Title is required"),
  caseType: z.string().optional(),
  courtName: z.string().optional(),
  courtCaseNumber: z.string().optional(),
  jurisdiction: z.string().optional(),
  judgeName: z.string().optional(),
  opposingParty: z.string().optional(),
  opposingCounsel: z.string().optional(),
  assignedLawyerId: z.string().optional(),
  externalCounselId: z.string().optional(),
  claimAmount: z.number().optional(),
  exposureAmount: z.number().optional(),
  settlementAmount: z.number().optional(),
  currency: z.string().optional(),
  filingDate: z.string().optional(),
  expectedResolutionDate: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  summary: z.string().optional(),
  strategy: z.string().optional(),
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
    const caseType = searchParams.get("caseType") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const assignedLawyerId = searchParams.get("assignedLawyerId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const result = await LegalCaseService.getCases(
      user,
      {
        search,
        status,
        caseType,
        priority,
        internalOwnerId: assignedLawyerId,
      },
      page,
      limit
    );

    return successResponse(result);
  } catch (error: any) {
    console.error("GET /api/legal/cases error:", error);
    return errorResponse(error.message || "Failed to load cases", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_CASES_MANAGE) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_CREATE)) {
      return errorResponse("Forbidden: Insufficient permissions to create legal cases", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validated = createCaseSchema.parse(body);

    const legalCase = await LegalCaseService.createCase(user, {
      title: validated.title,
      caseType: validated.caseType,
      description: validated.summary || validated.strategy,
      priority: validated.priority,
      status: validated.status,
      internalOwnerId: validated.assignedLawyerId || user.employee.id,
      externalCounselId: validated.externalCounselId,
      opposingParty: validated.opposingParty,
      opposingCounsel: validated.opposingCounsel,
      courtJurisdiction: validated.jurisdiction || validated.courtName,
      judgeOrArbitrator: validated.judgeName,
      targetResolutionDate: validated.expectedResolutionDate,
      estimatedFinancialExposure: validated.exposureAmount ?? validated.claimAmount ?? 0,
      notes: validated.notes,
    } as any);
    return successResponse(legalCase, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed", "VALIDATION_ERROR", 400, (error as any).errors || error.issues);
    }
    console.error("POST /api/legal/cases error:", error);
    return errorResponse(error.message || "Failed to create case", "INTERNAL_ERROR", 500);
  }
}
