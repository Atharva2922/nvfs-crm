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

    const accounts = await db.account.findMany({
      where: { organizationId: orgId },
      include: {
        journalLines: {
          take: 10,
          orderBy: { journalEntry: { date: "desc" } },
          include: { journalEntry: { select: { entryNumber: true, date: true, reference: true } } },
        },
      },
      orderBy: { code: "asc" },
    });

    return successResponse(accounts);
  } catch (error: any) {
    console.error("[Chart of Accounts GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch chart of accounts", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const orgId = AccountsService.getOrgId(user);

    const body = await req.json();
    const { code, name, type, subcategory, description, balance } = body;

    if (!code || !name || !type || !subcategory) {
      return errorResponse("Code, Name, Type, and Subcategory are required", "BAD_REQUEST", 400);
    }

    const existing = await db.account.findUnique({
      where: { organizationId_code: { organizationId: orgId, code } },
    });
    if (existing) {
      return errorResponse(`Account code ${code} already exists`, "CONFLICT", 409);
    }

    const account = await db.account.create({
      data: {
        organizationId: orgId,
        code,
        name,
        type,
        subcategory,
        description,
        balance: Number(balance) || 0.0,
        currency: "INR",
        isActive: true,
      },
    });

    return successResponse(account, 201);
  } catch (error: any) {
    console.error("[Chart of Accounts POST Error]:", error);
    return errorResponse(error.message || "Failed to create account", "INTERNAL_ERROR", 500);
  }
}
