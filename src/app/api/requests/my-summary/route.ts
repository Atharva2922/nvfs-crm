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

    const requests = await db.employeeRequest.findMany({
      where: {
        employeeId: user.employee.id,
        organizationId: user.employee.organizationId,
      },
      orderBy: { createdAt: "desc" },
    });

    let pendingCount = 0;
    let approvedCount = 0;

    requests.forEach((r) => {
      if (r.status === "PENDING") pendingCount++;
      if (r.status === "APPROVED") approvedCount++;
    });

    return successResponse({
      pendingCount,
      approvedCount,
      recentRequests: requests.slice(0, 5),
    });
  } catch (error: any) {
    console.error("[Request Summary API Error]:", error);
    return errorResponse("Failed to fetch requests summary", "INTERNAL_ERROR", 500);
  }
}
