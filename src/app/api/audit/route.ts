import { NextRequest } from "next/server";
import { AuditService } from "@/services/audit.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);
    const entity = searchParams.get("entity") || undefined;

    const logs = await AuditService.getLogs(limit, entity);
    return successResponse(logs);
  } catch (error) {
    console.error("[Audit Fetch Error]:", error);
    return errorResponse(
      "Failed to retrieve audit trail",
      "INTERNAL_ERROR",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
