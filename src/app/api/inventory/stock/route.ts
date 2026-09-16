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
    const search = searchParams.get("search") || undefined;

    const data = await InventoryService.getStockMatrix(user, { warehouseId, search });
    return successResponse(data);
  } catch (error: any) {
    console.error("[Inventory Stock GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve stock matrix", "INTERNAL_ERROR", 500);
  }
}
