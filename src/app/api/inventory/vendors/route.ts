import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { VendorService } from "@/services/vendor.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const vendorType = searchParams.get("vendorType") || undefined;
    const country = searchParams.get("country") || undefined;

    const data = await VendorService.getVendors(user, {
      search,
      status,
      vendorType,
      country,
    });

    return successResponse(data);
  } catch (error: any) {
    console.error("[Vendors GET Error]:", error);
    return errorResponse(error.message || "Failed to list vendors", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (!body.legalName || !body.displayName || !body.email) {
      return errorResponse("Legal Name, Display Name, and Email are required", "VALIDATION_ERROR", 400);
    }

    const vendor = await VendorService.createVendor(user, body);
    return successResponse(vendor, 201);
  } catch (error: any) {
    console.error("[Vendors POST Error]:", error);
    return errorResponse(error.message || "Failed to create vendor", "INTERNAL_ERROR", 400);
  }
}
