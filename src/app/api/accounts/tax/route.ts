import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountsService } from "@/services/accounts.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const orgId = AccountsService.getOrgId(user);

    const [rates, settings] = await Promise.all([
      db.taxRate.findMany({
        where: { organizationId: orgId },
        orderBy: { rate: "asc" },
      }),
      db.accountingSetting.findUnique({
        where: { organizationId: orgId },
      }),
    ]);

    return successResponse({ rates, settings });
  } catch (error: any) {
    console.error("[Accounts Tax GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch tax configuration", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const orgId = AccountsService.getOrgId(user);

    const body = await req.json();
    const { name, code, rate, type, cgst, sgst, igst, isDefault } = body;

    if (!name || !code || rate === undefined) {
      return errorResponse("Tax Name, Code, and Rate are required", "BAD_REQUEST", 400);
    }

    const taxRate = await db.taxRate.create({
      data: {
        organizationId: orgId,
        name,
        code,
        rate: Number(rate),
        type: type || "GST",
        cgst: Number(cgst) || 0,
        sgst: Number(sgst) || 0,
        igst: Number(igst) || 0,
        isDefault: Boolean(isDefault),
        isActive: true,
      },
    });

    return successResponse(taxRate, 201);
  } catch (error: any) {
    console.error("[Accounts Tax POST Error]:", error);
    return errorResponse(error.message || "Failed to create tax rate", "INTERNAL_ERROR", 500);
  }
}
