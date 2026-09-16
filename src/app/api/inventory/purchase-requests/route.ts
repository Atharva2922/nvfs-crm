import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PurchaseRequestService } from "@/services/purchase-request.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await PurchaseRequestService.getPurchaseRequests(user, {
      status,
      departmentId,
      priority,
      search,
    });

    return successResponse(data);
  } catch (error: any) {
    console.error("[Purchase Requests GET Error]:", error);
    return errorResponse(error.message || "Failed to list purchase requests", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (!body.reason || !body.requiredDate || !body.items || body.items.length === 0) {
      return errorResponse("Reason, Required Date, and at least one Item are required", "VALIDATION_ERROR", 400);
    }

    const pr = await PurchaseRequestService.createPurchaseRequest(user, body);
    return successResponse(pr, 201);
  } catch (error: any) {
    console.error("[Purchase Requests POST Error]:", error);
    return errorResponse(error.message || "Failed to create purchase request", "INTERNAL_ERROR", 400);
  }
}
