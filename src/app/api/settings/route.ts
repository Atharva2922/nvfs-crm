import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { SettingsService } from "@/services/settings.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const data = await SettingsService.getAllSettings();
    return successResponse(data);
  } catch (error: any) {
    console.error("[Settings GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch settings", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    // Administrative permissions check
    const isExecutiveOrAdmin = [
      "SUPER_ADMIN",
      "ADMIN",
      "CEO",
      "CHAIRPERSON",
      "CTO",
      "CFO",
      "CMO",
      "DEPARTMENT_HEAD",
    ].includes(user.roleCode);

    const body = await req.json();
    const { updates, category, organization } = body;

    // Organization details update if provided and authorized
    if (organization && isExecutiveOrAdmin) {
      const currentOrg = await db.organization.findFirst();
      if (currentOrg) {
        await db.organization.update({
          where: { id: currentOrg.id },
          data: {
            name: organization.name || currentOrg.name,
            currency: organization.currency || currentOrg.currency,
            timezone: organization.timezone || currentOrg.timezone,
            fiscalYear: organization.fiscalYearStart || organization.fiscalYear || currentOrg.fiscalYear,
          },
        });
      }
    }

    if (updates && typeof updates === "object") {
      const result = await SettingsService.updateSettings(user, updates, category || "GENERAL");
      return successResponse(result);
    }

    return successResponse({ success: true });
  } catch (error: any) {
    console.error("[Settings PATCH Error]:", error);
    return errorResponse(error.message || "Failed to update settings", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const { key, value, category } = body;

    if (!key || typeof value === "undefined") {
      return errorResponse("Key and value are required", "INVALID_INPUT", 400);
    }

    const result = await SettingsService.updateSettings(user, { [key]: value }, category || "GENERAL");
    return successResponse(result);
  } catch (error: any) {
    console.error("[Settings POST Error]:", error);
    return errorResponse(error.message || "Failed to update setting", "INTERNAL_ERROR", 500);
  }
}
