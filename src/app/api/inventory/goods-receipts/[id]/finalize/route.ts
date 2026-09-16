import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GoodsReceiptService } from "@/services/goods-receipt.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const finalized = await GoodsReceiptService.finalizeGoodsReceipt(user, id);
    return successResponse(finalized);
  } catch (error: any) {
    console.error("[Goods Receipt Finalize Error]:", error);
    return errorResponse(error.message || "Failed to finalize goods receipt", "INTERNAL_ERROR", 400);
  }
}
