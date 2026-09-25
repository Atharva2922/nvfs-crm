import { getCurrentUser } from "@/lib/auth";
import { SettingsService } from "@/services/settings.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const health = await SettingsService.getSystemHealth();
    return successResponse(health);
  } catch (error: any) {
    console.error("[System Health Error]:", error);
    return errorResponse(error.message || "Failed to retrieve system health telemetry", "INTERNAL_ERROR", 500);
  }
}
