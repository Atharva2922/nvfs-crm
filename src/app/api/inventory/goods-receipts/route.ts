import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GoodsReceiptService } from "@/services/goods-receipt.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const purchaseOrderId = searchParams.get("purchaseOrderId") || undefined;
    const vendorId = searchParams.get("vendorId") || undefined;
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await GoodsReceiptService.getGoodsReceipts(user, {
      purchaseOrderId,
      vendorId,
      warehouseId,
      status,
      search,
    });

    return successResponse(data);
  } catch (error: any) {
    console.error("[Goods Receipts GET Error]:", error);
    return errorResponse(error.message || "Failed to list goods receipts", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (!body.purchaseOrderId || !body.warehouseId || !body.items || body.items.length === 0) {
      return errorResponse("Purchase Order, Destination Warehouse, and at least one Line Item are required", "VALIDATION_ERROR", 400);
    }

    const gr = await GoodsReceiptService.createGoodsReceipt(user, body);
    return successResponse(gr, 201);
  } catch (error: any) {
    console.error("[Goods Receipts POST Error]:", error);
    return errorResponse(error.message || "Failed to create goods receipt", "INTERNAL_ERROR", 400);
  }
}
