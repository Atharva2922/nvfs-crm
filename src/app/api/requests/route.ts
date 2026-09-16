import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthorizedScope } from "@/lib/scope-guard";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const scopeParam = searchParams.get("scope") || "SELF";
    const scopeFilter = await getAuthorizedScope(user, "hr.request");

    let whereClause: any = {
      organizationId: user.employee.organizationId,
    };

    if (scopeParam === "TEAM" && scopeFilter.subordinateIds) {
      whereClause.employeeId = { in: scopeFilter.subordinateIds };
    } else if (scopeParam === "DEPARTMENT" && scopeFilter.departmentId) {
      whereClause.departmentId = scopeFilter.departmentId;
    } else if (scopeFilter.scope === "SELF") {
      whereClause.employeeId = user.employee.id;
    }

    const requests = await db.employeeRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
    });

    return successResponse(requests);
  } catch (error: any) {
    console.error("[GET Requests API Error]:", error);
    return errorResponse("Failed to fetch requests", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const { category, title, description, metadata, attachmentUrl } = body;

    if (!category || !title || !description) {
      return errorResponse("Category, title, and description are required", "VALIDATION_ERROR", 400);
    }

    const reqCount = await db.employeeRequest.count({
      where: { organizationId: user.employee.organizationId },
    });
    const requestNumber = `REQ-${new Date().getFullYear()}-${String(reqCount + 1).padStart(4, "0")}`;

    const newRequest = await db.employeeRequest.create({
      data: {
        organizationId: user.employee.organizationId,
        requestNumber,
        category,
        title,
        description,
        employeeId: user.employee.id,
        departmentId: user.employee.departmentId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        attachmentUrl: attachmentUrl || null,
        status: "PENDING",
      },
    });

    return successResponse(newRequest, 201);
  } catch (error: any) {
    console.error("[POST Request API Error]:", error);
    return errorResponse("Failed to submit request", "INTERNAL_ERROR", 500);
  }
}
