import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GoodsReceiptService } from "@/services/goods-receipt.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const gr = await GoodsReceiptService.getGoodsReceiptById(user, id);
    return successResponse(gr);
  } catch (error: any) {
    console.error("[Goods Receipt GET Error]:", error);
    return errorResponse(error.message || "Failed to get goods receipt", "INTERNAL_ERROR", 404);
  }
}
