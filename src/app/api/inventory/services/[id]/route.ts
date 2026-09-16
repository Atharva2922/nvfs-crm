import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ServiceCatalogService } from "@/services/service-catalog.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const service = await ServiceCatalogService.getServiceById(id, user);
    if (!service) return errorResponse("Service not found", "NOT_FOUND", 404);

    return successResponse(service);
  } catch (error: any) {
    console.error("[Service GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve service", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();

    const service = await ServiceCatalogService.updateService(id, user, body);
    return successResponse(service);
  } catch (error: any) {
    console.error("[Service PATCH Error]:", error);
    return errorResponse(error.message || "Failed to update service", "INTERNAL_ERROR", 400);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const service = await ServiceCatalogService.deleteService(id, user);
    return successResponse(service);
  } catch (error: any) {
    console.error("[Service DELETE Error]:", error);
    return errorResponse(error.message || "Failed to delete service", "INTERNAL_ERROR", 400);
  }
}
