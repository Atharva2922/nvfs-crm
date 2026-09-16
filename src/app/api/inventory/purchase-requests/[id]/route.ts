import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PurchaseRequestService } from "@/services/purchase-request.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const pr = await PurchaseRequestService.getPurchaseRequestById(user, id);
    return successResponse(pr);
  } catch (error: any) {
    console.error("[Purchase Request GET Error]:", error);
    return errorResponse(error.message || "Failed to get purchase request", "INTERNAL_ERROR", 404);
  }
}
