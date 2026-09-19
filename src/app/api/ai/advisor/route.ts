import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AIService } from "@/services/ai/ai.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const advice = await AIService.getExecutiveAdvice(user);

    return successResponse({ advice }, 200);
  } catch (error: any) {
    console.error("GET /api/ai/advisor error:", error);
    return errorResponse(error.message || "Failed to load executive advice", "INTERNAL_ERROR", 500);
  }
}
