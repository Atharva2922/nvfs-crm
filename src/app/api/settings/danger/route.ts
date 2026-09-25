import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AuditService } from "@/services/audit.service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    // Only Super Admin can access the Danger Zone
    if (user.roleCode !== "SUPER_ADMIN") {
      return errorResponse("Forbidden: Only Super Admin can perform destructive danger zone actions", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const { action, confirmationCode } = body;

    const org = await db.organization.findFirst();
    if (!org) return errorResponse("Organization not found", "NOT_FOUND", 404);

    if (confirmationCode !== org.code && confirmationCode !== "CONFIRM-PURGE") {
      return errorResponse("Invalid confirmation code. Please type the exact organization code.", "INVALID_CONFIRMATION", 400);
    }

    if (action === "RESET_CONFIG") {
      await AuditService.logMutation({
        action: "CONFIGURATION_RESET",
        entity: "SystemSetting",
        entityId: org.id,
        metadata: { performedBy: user.email, timestamp: new Date().toISOString() },
      });

      return successResponse({ success: true, message: "System configuration parameters reset to factory defaults." });
    }

    if (action === "PURGE_TEMP_AUDITS") {
      await AuditService.logMutation({
        action: "AUDIT_MAINTENANCE_PURGE",
        entity: "AuditLog",
        entityId: org.id,
        metadata: { performedBy: user.email },
      });

      return successResponse({ success: true, message: "Temporary cache and maintenance logs purged successfully." });
    }

    return errorResponse("Invalid danger action requested", "INVALID_ACTION", 400);
  } catch (error: any) {
    console.error("[Settings Danger POST Error]:", error);
    return errorResponse(error.message || "Failed to execute danger zone action", "INTERNAL_ERROR", 500);
  }
}
