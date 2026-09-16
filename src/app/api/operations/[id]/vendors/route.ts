import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OperationService } from "@/services/operation.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const linkVendorSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  purchaseOrderId: z.string().optional(),
  role: z.string().optional(),
  estimatedCost: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();
    const validated = linkVendorSchema.parse(body);

    const record = await OperationService.linkVendor(user, id, validated);
    return successResponse(record, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Vendor Link Error]:", error);
    return errorResponse(error.message || "Failed to link vendor", "INTERNAL_ERROR", 500);
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
    const { searchParams } = new URL(req.url);
    const vendorRecordId = searchParams.get("vendorRecordId");
    if (!vendorRecordId) return errorResponse("Vendor record ID required", "BAD_REQUEST", 400);

    const result = await OperationService.unlinkVendor(user, id, vendorRecordId);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Vendor Unlink Error]:", error);
    return errorResponse(error.message || "Failed to unlink vendor", "INTERNAL_ERROR", 500);
  }
}
