import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ReminderEngineService } from "@/services/reminder-engine.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Authenticate either via logged-in user or secret CRON header
    const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;
    if (!user && !isCronAuthorized) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const orgId = user?.employee?.organizationId;
    const result = await ReminderEngineService.processReminders(orgId);

    return successResponse(result);
  } catch (error: any) {
    console.error("[Reminder Process Route Error]:", error);
    return errorResponse(error.message || "Failed to execute reminder engine", "REMINDER_PROCESS_FAILED", 500);
  }
}
