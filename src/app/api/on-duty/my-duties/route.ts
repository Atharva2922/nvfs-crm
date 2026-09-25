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

    const duties = await db.onDutyAssignment.findMany({
      where: {
        employeeId: user.employee.id,
        organizationId: user.activeCompany?.id || user.employee.organizationId,
      },
      orderBy: { date: "desc" },
      include: {
        client: {
          select: { name: true, city: true },
        },
      },
    });

    return successResponse(duties);
  } catch (error: any) {
    console.error("[My Duties API Error]:", error);
    return errorResponse("Failed to fetch on-duty assignments", "INTERNAL_ERROR", 500);
  }
}
