import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { VendorService } from "@/services/vendor.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const body = await req.json();

    if (!body.productId || body.purchasePrice === undefined) {
      return errorResponse("Product ID and Purchase Price are required", "VALIDATION_ERROR", 400);
    }

    const record = await VendorService.addOrUpdateProduct(user, id, body);
    return successResponse(record, 201);
  } catch (error: any) {
    console.error("[Vendor Product POST Error]:", error);
    return errorResponse(error.message || "Failed to link product to vendor", "INTERNAL_ERROR", 400);
  }
}
