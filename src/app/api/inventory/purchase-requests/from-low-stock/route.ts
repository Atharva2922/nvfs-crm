import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PurchaseRequestService } from "@/services/purchase-request.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (!body.productId) {
      return errorResponse("Product ID is required", "VALIDATION_ERROR", 400);
    }

    const pr = await PurchaseRequestService.createFromLowStock(
      user,
      body.productId,
      body.quantity ? Number(body.quantity) : undefined,
      body.requiredDate
    );

    return successResponse(pr, 201);
  } catch (error: any) {
    console.error("[PR from Low Stock Error]:", error);
    return errorResponse(error.message || "Failed to create PR from low stock", "INTERNAL_ERROR", 400);
  }
}
