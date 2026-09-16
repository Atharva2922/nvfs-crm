import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { InventoryService } from "@/services/inventory.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const data = await InventoryService.getOverviewKpis(user);
    return successResponse(data);
  } catch (error: any) {
    console.error("[Inventory Overview GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve inventory overview", "INTERNAL_ERROR", 500);
  }
}
