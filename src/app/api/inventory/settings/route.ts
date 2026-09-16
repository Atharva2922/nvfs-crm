import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AuditService } from "@/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const settings = await db.systemSetting.findMany({
      where: { category: "INVENTORY" },
    });

    const config: Record<string, string> = {
      DEFAULT_REORDER_LEVEL: "10",
      DEFAULT_LEAD_TIME_DAYS: "7",
      SKU_PREFIX: "SKU",
      ENABLE_LOW_STOCK_NOTIFICATIONS: "true",
      AUTO_GENERATE_SKU: "true",
    };

    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    return successResponse(config);
  } catch (error: any) {
    console.error("[Inventory Settings GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve inventory settings", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      await db.systemSetting.upsert({
        where: { key },
        create: {
          key,
          value: String(value),
          category: "INVENTORY",
          description: `Inventory setting for ${key}`,
        },
        update: {
          value: String(value),
        },
      });
    }

    await AuditService.log({
      actorId: user.id,
      action: "INVENTORY_SETTINGS_UPDATED",
      entity: "SystemSetting",
      entityId: "INVENTORY",
      newValue: body,
    });

    return successResponse({ message: "Inventory settings updated successfully" });
  } catch (error: any) {
    console.error("[Inventory Settings PATCH Error]:", error);
    return errorResponse(error.message || "Failed to update inventory settings", "INTERNAL_ERROR", 400);
  }
}
