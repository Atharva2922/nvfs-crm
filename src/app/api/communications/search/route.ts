import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CommunicationService } from "@/services/communication.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return successResponse({ results: { messages: [], conversations: [] } });
    }

    const results = await CommunicationService.searchCommunications(
      user,
      query
    );

    return successResponse({ results });
  } catch (error: any) {
    console.error("GET /api/communications/search error:", error);
    return errorResponse(error.message || "Failed to execute search", "INTERNAL_ERROR", 500);
  }
}
