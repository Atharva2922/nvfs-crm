import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OperationService } from "@/services/operation.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const results = await OperationService.search(user, query);
    return successResponse(results);
  } catch (error: any) {
    console.error("[Operations Search GET Error]:", error);
    return errorResponse(error.message || "Search failed", "INTERNAL_ERROR", 500);
  }
}
