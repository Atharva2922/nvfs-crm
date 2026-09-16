import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";333
import { AuditService } from "@/services/audit.service";

export async function GET() {
  try {
    const settings = await db.systemSetting.findMany({
      orderBy: { category: "asc" },
    });
    return successResponse(settings);
  } catch (error) {
    console.error("[Settings Fetch Error]:", error);
    return errorResponse("Failed to fetch settings", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || typeof value === "undefined") {
      return errorResponse("Key and value are required", "INVALID_INPUT", 400);
    }

    const previous = await db.systemSetting.findUnique({ where: { key } });

    const updated = await db.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value), category: "GENERAL" },
    });

    await AuditService.logMutation({
      action: "SYSTEM_SETTING_UPDATED",
      entity: "SystemSetting",
      entityId: key,
      previousValue: previous ? { value: previous.value } : null,
      newValue: { value: String(value) },
      metadata: { source: "settings_api" },
    });

    return successResponse(updated);
  } catch (error) {
    console.error("[Settings Update Error]:", error);
    return errorResponse("Failed to update setting", "INTERNAL_ERROR", 500);
  }
}
