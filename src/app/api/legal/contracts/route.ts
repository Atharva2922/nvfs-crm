import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LegalContractService } from "@/services/legal-contract.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { z } from "zod";

const createContractSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  contractType: z.string().optional(),
  departmentId: z.string().optional(),
  legalOwnerId: z.string().optional(),
  businessOwnerId: z.string().optional(),
  partyType: z.string().optional(),
  clientId: z.string().optional(),
  vendorId: z.string().optional(),
  employeeId: z.string().optional(),
  externalPartyName: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  renewalDate: z.string().optional(),
  renewalType: z.string().optional(),
  noticePeriodDays: z.number().optional(),
  contractValue: z.number().optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
  paymentTerms: z.string().optional(),
  status: z.string().optional(),
  riskLevel: z.string().optional(),
  internalNotes: z.string().optional(),
  notes: z.string().optional(),
  autoRenew: z.boolean().optional(),
  renewalTermMonths: z.number().optional(),
  renewalNoticeDays: z.number().optional(),
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
    const contractType = searchParams.get("contractType") || undefined;
    const clientId = searchParams.get("clientId") || undefined;
    const vendorId = searchParams.get("vendorId") || undefined;
    const legalOwnerId = searchParams.get("legalOwnerId") || undefined;
    const expiryHorizon = searchParams.get("expiryHorizon") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const result = await LegalContractService.listContracts(
      user,
      {
        search,
        status: status !== "ALL" ? status : undefined,
        contractType: contractType !== "ALL" ? contractType : undefined,
        clientId,
        vendorId,
        legalOwnerId,
        expiryHorizon: expiryHorizon as any,
      },
      page,
      limit
    );

    return successResponse({
      contracts: result.items,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("GET /api/legal/contracts error:", error);
    return errorResponse(error.message || "Failed to load contracts", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (
      !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_CREATE) &&
      !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_WRITE)
    ) {
      return errorResponse("Forbidden: Insufficient permissions to create contracts", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validated = createContractSchema.parse(body);

    const effectiveDate = validated.effectiveDate || validated.startDate || new Date().toISOString();
    const expiryDate =
      validated.expiryDate ||
      validated.endDate ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const contract = await LegalContractService.create(user, {
      title: validated.title,
      description: validated.description,
      contractType: validated.contractType,
      departmentId: validated.departmentId,
      legalOwnerId: validated.legalOwnerId || user.employee.id,
      businessOwnerId: validated.businessOwnerId,
      partyType: validated.partyType,
      clientId: validated.clientId,
      vendorId: validated.vendorId,
      employeeId: validated.employeeId,
      externalPartyName: validated.externalPartyName,
      effectiveDate,
      expiryDate,
      renewalType: validated.autoRenew ? "AUTOMATIC" : validated.renewalType || "MANUAL",
      noticePeriodDays: validated.renewalNoticeDays || validated.noticePeriodDays || 30,
      contractValue: validated.contractValue !== undefined ? validated.contractValue : validated.value || 0,
      currency: validated.currency || "INR",
      paymentTerms: validated.paymentTerms,
      riskLevel: validated.riskLevel || "LOW",
      internalNotes: validated.internalNotes || validated.notes,
    });

    return successResponse(contract, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed", "VALIDATION_ERROR", 400, (error as any).errors || error.issues);
    }
    console.error("POST /api/legal/contracts error:", error);
    return errorResponse(error.message || "Failed to create contract", "INTERNAL_ERROR", 500);
  }
}
