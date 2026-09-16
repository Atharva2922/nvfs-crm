import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { WarehouseService } from "@/services/warehouse.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const warehouse = await WarehouseService.getWarehouseById(id, user.employee.organizationId);
    if (!warehouse) return errorResponse("Warehouse not found", "NOT_FOUND", 404);

    return successResponse(warehouse);
  } catch (error: any) {
    console.error("[Warehouse GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve warehouse", "INTERNAL_ERROR", 500);
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

    const warehouse = await WarehouseService.updateWarehouse(id, user, body);
    return successResponse(warehouse);
  } catch (error: any) {
    console.error("[Warehouse PATCH Error]:", error);
    return errorResponse(error.message || "Failed to update warehouse", "INTERNAL_ERROR", 400);
  }
}
