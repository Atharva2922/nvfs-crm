import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { InvoiceService } from "@/services/invoice.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const receivables = await InvoiceService.getReceivables(user);
    return successResponse(receivables);
  } catch (error: any) {
    console.error("[Receivables GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve receivables schedule", "INTERNAL_ERROR", 500);
  }
}
