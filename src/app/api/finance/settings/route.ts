import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AuditService } from "@/services/audit.service";

const DEFAULT_SETTINGS: Record<string, string> = {
  FINANCE_BASE_CURRENCY: "INR",
  FINANCE_SUPPORTED_CURRENCIES: "INR,USD,EUR,GBP",
  FINANCE_DEFAULT_PAYMENT_TERMS: "Net 30. Standard commercial terms apply.",
  FINANCE_DEFAULT_TAX_RATE: "10",
  FINANCE_INVOICE_PREFIX: "INV",
};

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const keys = Object.keys(DEFAULT_SETTINGS);
    const existing = await db.systemSetting.findMany({
      where: { key: { in: keys } },
    });

    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const s of existing) {
      settingsMap[s.key] = s.value;
    }

    return successResponse({
      baseCurrency: settingsMap.FINANCE_BASE_CURRENCY,
      supportedCurrencies: settingsMap.FINANCE_SUPPORTED_CURRENCIES.split(",").map((c) => c.trim()),
      defaultPaymentTerms: settingsMap.FINANCE_DEFAULT_PAYMENT_TERMS,
      defaultTaxRate: parseFloat(settingsMap.FINANCE_DEFAULT_TAX_RATE) || 0,
      invoicePrefix: settingsMap.FINANCE_INVOICE_PREFIX,
    });
  } catch (error: any) {
    console.error("[Finance Settings GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve finance settings", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const execRoles = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "ADMIN"];
    if (!execRoles.includes(user.roleCode) && !user.permissions.includes("finance.manage")) {
      return errorResponse("Forbidden: Only CFO or executive administrators can update financial settings", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const updates: Record<string, string> = {};

    if (body.baseCurrency) updates.FINANCE_BASE_CURRENCY = body.baseCurrency;
    if (body.supportedCurrencies) {
      updates.FINANCE_SUPPORTED_CURRENCIES = Array.isArray(body.supportedCurrencies)
        ? body.supportedCurrencies.join(",")
        : body.supportedCurrencies;
    }
    if (body.defaultPaymentTerms) updates.FINANCE_DEFAULT_PAYMENT_TERMS = body.defaultPaymentTerms;
    if (body.defaultTaxRate !== undefined) updates.FINANCE_DEFAULT_TAX_RATE = String(body.defaultTaxRate);
    if (body.invoicePrefix) updates.FINANCE_INVOICE_PREFIX = body.invoicePrefix;

    for (const [key, value] of Object.entries(updates)) {
      await db.systemSetting.upsert({
        where: { key },
        update: { value, category: "FINANCE" },
        create: { key, value, category: "FINANCE", description: "Finance configuration setting" },
      });
    }

    await AuditService.log({
      actorId: user.id,
      action: "FINANCE_SETTINGS_UPDATED",
      entity: "SystemSetting",
      entityId: "FINANCE",
      newValue: updates,
    });

    return successResponse({ updated: true, settings: updates });
  } catch (error: any) {
    console.error("[Finance Settings PATCH Error]:", error);
    return errorResponse(error.message || "Failed to update financial settings", "INTERNAL_ERROR", 500);
  }
}
