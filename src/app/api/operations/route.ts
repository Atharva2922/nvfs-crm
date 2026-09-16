import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OperationService } from "@/services/operation.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { z } from "zod";

const createOperationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  operationType: z.string().optional(),
  departmentId: z.string().min(1, "Department is required"),
  ownerId: z.string().min(1, "Owner is required"),
  clientId: z.string().optional(),
  opportunityId: z.string().optional(),
  projectName: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["PLANNING", "SCHEDULED", "IN_PROGRESS", "QUALITY_REVIEW", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  riskDescription: z.string().optional(),
  mitigationPlan: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  expectedCompletionDate: z.string().min(1, "Expected completion date is required"),
  estimatedHours: z.number().optional(),
  estimatedCost: z.number().optional(),
  approvedBudget: z.number().optional(),
  internalNotes: z.string().optional(),
  attachments: z.string().optional(),
  teamMembers: z.array(
    z.object({
      employeeId: z.string(),
      role: z.string().optional(),
      assignedHours: z.number().optional(),
    })
  ).optional(),
  inventoryItems: z.array(
    z.object({
      productId: z.string(),
      warehouseId: z.string().optional(),
      requiredQuantity: z.number().min(0.01),
      unitCost: z.number().optional(),
    })
  ).optional(),
  vendors: z.array(
    z.object({
      vendorId: z.string(),
      purchaseOrderId: z.string().optional(),
      role: z.string().optional(),
      estimatedCost: z.number().optional(),
    })
  ).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const filters = {
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      riskLevel: searchParams.get("riskLevel") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    const data = await OperationService.list(user, filters, page, limit);
    return successResponse(data);
  } catch (error: any) {
    console.error("[Operations GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve operations", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (
      !hasPermission(user.roleCode as any, PERMISSIONS.OPERATIONS_WRITE) &&
      !hasPermission(user.roleCode as any, PERMISSIONS.OPERATIONS_CREATE)
    ) {
      return errorResponse("Forbidden: Insufficient permissions to create operations", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validated = createOperationSchema.parse(body);

    const operation = await OperationService.create(user, validated);
    return successResponse(operation, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Operations POST Error]:", error);
    return errorResponse(error.message || "Failed to create operation", "INTERNAL_ERROR", 500);
  }
}
