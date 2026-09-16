import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PurchaseOrderService } from "@/services/purchase-order.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const vendorId = searchParams.get("vendorId") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await PurchaseOrderService.getPurchaseOrders(user, {
      status,
      vendorId,
      search,
    });

    return successResponse(data);
  } catch (error: any) {
    console.error("[Purchase Orders GET Error]:", error);
    return errorResponse(error.message || "Failed to list purchase orders", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (!body.vendorId || !body.expectedDeliveryDate || !body.items || body.items.length === 0) {
      return errorResponse("Vendor, Expected Delivery Date, and at least one Line Item are required", "VALIDATION_ERROR", 400);
    }

    const po = await PurchaseOrderService.createPurchaseOrder(user, body);
    return successResponse(po, 201);
  } catch (error: any) {
    console.error("[Purchase Orders POST Error]:", error);
    return errorResponse(error.message || "Failed to create purchase order", "INTERNAL_ERROR", 400);
  }
}
