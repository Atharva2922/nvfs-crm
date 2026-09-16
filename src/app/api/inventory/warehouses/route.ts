import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { WarehouseService } from "@/services/warehouse.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const data = await WarehouseService.getWarehouses(user.employee.organizationId);
    return successResponse(data);
  } catch (error: any) {
    console.error("[Warehouses GET Error]:", error);
    return errorResponse(error.message || "Failed to list warehouses", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (!body.code || !body.name) {
      return errorResponse("Code and Name are required", "VALIDATION_ERROR", 400);
    }

    const warehouse = await WarehouseService.createWarehouse(user, body);
    return successResponse(warehouse, 201);
  } catch (error: any) {
    console.error("[Warehouses POST Error]:", error);
    return errorResponse(error.message || "Failed to create warehouse", "INTERNAL_ERROR", 400);
  }
}
