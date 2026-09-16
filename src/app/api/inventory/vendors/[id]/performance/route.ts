import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { VendorService } from "@/services/vendor.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const metrics = await VendorService.getVendorPerformance(user, id);
    return successResponse(metrics);
  } catch (error: any) {
    console.error("[Vendor Performance GET Error]:", error);
    return errorResponse(error.message || "Failed to get vendor performance", "INTERNAL_ERROR", 404);
  }
}
