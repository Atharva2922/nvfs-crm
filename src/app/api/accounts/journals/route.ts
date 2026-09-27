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

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    const where: any = { organizationId: orgId };
    if (accountId) {
      where.lines = { some: { accountId } };
    }

    const journals = await db.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true, type: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return successResponse(journals);
  } catch (error: any) {
    console.error("[Accounts Journals GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch journals", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const journal = await AccountsService.createJournalEntry(user, body);
    return successResponse(journal, 201);
  } catch (error: any) {
    console.error("[Accounts Journals POST Error]:", error);
    return errorResponse(error.message || "Failed to post journal entry", "BAD_REQUEST", 400);
  }
}
