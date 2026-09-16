import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { InventoryService } from "@/services/inventory.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || undefined;
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const type = searchParams.get("type") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;

    const data = await InventoryService.getMovements(user, { productId, warehouseId, type, limit });
    return successResponse(data);
  } catch (error: any) {
    console.error("[Movements GET Error]:", error);
    return errorResponse(error.message || "Failed to list stock movements", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const actionType = body.type; // "STOCK_IN" or "STOCK_OUT"

    if (actionType === "STOCK_IN") {
      const res = await InventoryService.stockIn(user, body);
      return successResponse(res, 201);
    } else if (actionType === "STOCK_OUT") {
      const res = await InventoryService.stockOut(user, body);
      return successResponse(res, 201);
    } else {
      return errorResponse("Invalid action type. Expected STOCK_IN or STOCK_OUT", "VALIDATION_ERROR", 400);
    }
  } catch (error: any) {
    console.error("[Movements POST Error]:", error);
    return errorResponse(error.message || "Failed to execute stock movement", "INTERNAL_ERROR", 400);
  }
}
