import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OperationService } from "@/services/operation.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const addInventorySchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().optional(),
  requiredQuantity: z.number().min(0.01),
  unitCost: z.number().optional(),
  notes: z.string().optional(),
});

const updateUsageSchema = z.object({
  itemId: z.string().min(1),
  allocatedQuantity: z.number().optional(),
  usedQuantity: z.number().optional(),
  status: z.enum(["PLANNED", "ALLOCATED", "CONSUMED", "RETURNED"]).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();
    const validated = addInventorySchema.parse(body);

    const item = await OperationService.addInventoryItem(user, id, validated);
    return successResponse(item, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Inventory Add Error]:", error);
    return errorResponse(error.message || "Failed to add inventory item", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();
    const validated = updateUsageSchema.parse(body);

    const updated = await OperationService.updateInventoryUsage(user, id, validated.itemId, validated);
    return successResponse(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Inventory Usage Error]:", error);
    return errorResponse(error.message || "Failed to update inventory usage", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return errorResponse("Item ID required", "BAD_REQUEST", 400);

    const result = await OperationService.removeInventoryItem(user, id, itemId);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Inventory Remove Error]:", error);
    return errorResponse(error.message || "Failed to remove inventory item", "INTERNAL_ERROR", 500);
  }
}
