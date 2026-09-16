import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { VendorService } from "@/services/vendor.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const vendor = await VendorService.getVendorById(user, id);
    return successResponse(vendor);
  } catch (error: any) {
    console.error("[Vendor GET Error]:", error);
    return errorResponse(error.message || "Failed to get vendor", "INTERNAL_ERROR", 404);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const body = await req.json();
    const updated = await VendorService.updateVendor(user, id, body);
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Vendor PATCH Error]:", error);
    return errorResponse(error.message || "Failed to update vendor", "INTERNAL_ERROR", 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    const updated = await VendorService.updateVendor(user, id, { status: "INACTIVE" });
    return successResponse({ message: "Vendor deactivated successfully", vendor: updated });
  } catch (error: any) {
    console.error("[Vendor DELETE Error]:", error);
    return errorResponse(error.message || "Failed to deactivate vendor", "INTERNAL_ERROR", 400);
  }
}
