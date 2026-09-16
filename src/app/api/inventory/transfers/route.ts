import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { InventoryService } from "@/services/inventory.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (!body.productId || !body.sourceWarehouseId || !body.destinationWarehouseId || !body.quantity) {
      return errorResponse(
        "productId, sourceWarehouseId, destinationWarehouseId, and quantity are required",
        "VALIDATION_ERROR",
        400
      );
    }

    const res = await InventoryService.transferStock(user, body);
    return successResponse(res, 201);
  } catch (error: any) {
    console.error("[Transfer POST Error]:", error);
    return errorResponse(error.message || "Failed to execute stock transfer", "INTERNAL_ERROR", 400);
  }
}
