import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ServiceCatalogService } from "@/services/service-catalog.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const status = searchParams.get("status") || undefined;
    const billingUnit = searchParams.get("billingUnit") || undefined;

    const data = await ServiceCatalogService.getServices(user, {
      search,
      categoryId,
      status,
      billingUnit,
    });

    return successResponse(data);
  } catch (error: any) {
    console.error("[Services GET Error]:", error);
    return errorResponse(error.message || "Failed to list services", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (!body.serviceCode || !body.name) {
      return errorResponse("Service Code and Name are required", "VALIDATION_ERROR", 400);
    }

    const service = await ServiceCatalogService.createService(user, body);
    return successResponse(service, 201);
  } catch (error: any) {
    console.error("[Services POST Error]:", error);
    return errorResponse(error.message || "Failed to create service", "INTERNAL_ERROR", 400);
  }
}
