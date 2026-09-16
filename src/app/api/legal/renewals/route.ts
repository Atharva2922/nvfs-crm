import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_READ)) {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const orgId = user.employee.organizationId;
    const now = new Date();
    const d30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [horizon30, horizon60, horizon90, renewalHistory] = await Promise.all([
      db.legalContract.findMany({
        where: {
          organizationId: orgId,
          status: { in: ["ACTIVE", "EXPIRING_SOON"] },
          expiryDate: { gte: now, lte: d30 },
        },
        include: {
          client: { select: { id: true, name: true } },
          vendor: { select: { id: true, displayName: true } },
          legalOwner: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { expiryDate: "asc" },
      }),
      db.legalContract.findMany({
        where: {
          organizationId: orgId,
          status: { in: ["ACTIVE", "EXPIRING_SOON"] },
          expiryDate: { gt: d30, lte: d60 },
        },
        include: {
          client: { select: { id: true, name: true } },
          vendor: { select: { id: true, displayName: true } },
          legalOwner: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { expiryDate: "asc" },
      }),
      db.legalContract.findMany({
        where: {
          organizationId: orgId,
          status: { in: ["ACTIVE", "EXPIRING_SOON"] },
          expiryDate: { gt: d60, lte: d90 },
        },
        include: {
          client: { select: { id: true, name: true } },
          vendor: { select: { id: true, displayName: true } },
          legalOwner: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { expiryDate: "asc" },
      }),
      db.legalRenewal.findMany({
        where: {
          contract: { organizationId: orgId },
        },
        include: {
          contract: { select: { id: true, contractNumber: true, title: true } },
          initiatedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const normalizeContract = (c: any) => ({
      ...c,
      endDate: c.expiryDate,
      value: c.contractValue,
      autoRenew: c.renewalType === "AUTOMATIC",
      renewalNoticeDays: c.noticePeriodDays,
      owner: c.legalOwner,
    });

    const mappedHistory = renewalHistory.map((ren: any) => ({
      ...ren,
      renewedAt: ren.completedAt || ren.createdAt,
      renewedBy: ren.initiatedBy,
      newEndDate: ren.newExpiryDate,
    }));

    return successResponse({
      horizon30: horizon30.map(normalizeContract),
      horizon60: horizon60.map(normalizeContract),
      horizon90: horizon90.map(normalizeContract),
      counts: {
        within30Days: horizon30.length,
        within60Days: horizon60.length,
        within90Days: horizon90.length,
      },
      renewalHistory: mappedHistory,
    });
  } catch (error: any) {
    console.error("GET /api/legal/renewals error:", error);
    return errorResponse(error.message || "Failed to load renewal horizons", "INTERNAL_ERROR", 500);
  }
}
