import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const currentOrgId = user.activeCompany?.id || user.employee.organizationId;

    const [requests, incomingStaffRequestsCount] = await Promise.all([
      db.employeeRequest.findMany({
        where: {
          employeeId: user.employee.id,
          organizationId: currentOrgId,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.approvalRequest.count({
        where: {
          organizationId: currentOrgId,
          entityType: "CROSS_COMPANY_RESOURCE",
          status: "PENDING",
        },
      }),
    ]);

    let pendingCount = 0;
    let approvedCount = 0;

    requests.forEach((r) => {
      if (r.status === "PENDING") pendingCount++;
      if (r.status === "APPROVED") approvedCount++;
    });

    return successResponse({
      pendingCount,
      approvedCount,
      incomingStaffRequestsCount,
      recentRequests: requests,
    });
  } catch (error: any) {
    console.error("[Request Summary API Error]:", error);
    return errorResponse("Failed to fetch requests summary", "INTERNAL_ERROR", 500);
  }
}
