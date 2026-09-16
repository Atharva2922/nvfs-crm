import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PurchaseRequestService } from "@/services/purchase-request.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const body = await req.json();

    if (!body.vendorId || !body.expectedDeliveryDate) {
      return errorResponse("Vendor ID and Expected Delivery Date are required to generate a PO", "VALIDATION_ERROR", 400);
    }

    const po = await PurchaseRequestService.convertToPurchaseOrder(
      user,
      id,
      body.vendorId,
      body.expectedDeliveryDate,
      body.paymentTerms
    );

    return successResponse(po, 201);
  } catch (error: any) {
    console.error("[Convert PR to PO Error]:", error);
    return errorResponse(error.message || "Failed to convert purchase request to purchase order", "INTERNAL_ERROR", 400);
  }
}
