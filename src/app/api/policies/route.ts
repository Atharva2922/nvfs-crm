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

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const policies = await db.hrPolicy.findMany({
      where: {
        organizationId: user.employee.organizationId,
        OR: [
          { departmentId: user.employee.departmentId },
          { departmentId: null }, // Org wide policy
        ],
      },
      orderBy: { effectiveDate: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        content: true,
        effectiveDate: true,
        version: true,
        isMandatory: true,
      },
    });

    return successResponse(policies);
  } catch (error: any) {
    console.error("[GET Policies API Error]:", error);
    return errorResponse("Failed to fetch policies", "INTERNAL_ERROR", 500);
  }
}
