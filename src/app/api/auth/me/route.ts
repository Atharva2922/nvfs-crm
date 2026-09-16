import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }
    return successResponse(user);
  } catch (error: any) {
    console.error("[Auth ME API Error]:", error);
    return errorResponse("Failed to fetch session user profile", "INTERNAL_ERROR", 500);
  }
}
