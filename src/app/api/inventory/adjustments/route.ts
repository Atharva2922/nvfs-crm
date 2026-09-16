import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { InventoryService } from "@/services/inventory.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const status = searchParams.get("status") || undefined;

    const data = await InventoryService.getAdjustments(user, { warehouseId, status });
    return successResponse(data);
  } catch (error: any) {
    console.error("[Adjustments GET Error]:", error);
    return errorResponse(error.message || "Failed to list adjustments", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (!body.warehouseId || !body.items || body.items.length === 0) {
      return errorResponse("warehouseId and items array are required", "VALIDATION_ERROR", 400);
    }

    const adjustment = await InventoryService.createAdjustment(user, body);
    return successResponse(adjustment, 201);
  } catch (error: any) {
    console.error("[Adjustments POST Error]:", error);
    return errorResponse(error.message || "Failed to create adjustment", "INTERNAL_ERROR", 400);
  }
}
