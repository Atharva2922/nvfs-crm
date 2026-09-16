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
        organizationId: user.employee.organizationId,
        employeeId: user.employee.id,
      },
      orderBy: { date: "desc" },
      include: {
        client: { select: { id: true, name: true, city: true } },
      },
    });

    return successResponse(duties);
  } catch (error: any) {
    console.error("[GET OnDuty API Error]:", error);
    return errorResponse("Failed to fetch on-duty assignments", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const { clientId, clientName, location, date, purpose } = body;

    if (!location || !date || !purpose) {
      return errorResponse("Location, date, and purpose are required", "VALIDATION_ERROR", 400);
    }

    const count = await db.onDutyAssignment.count({
      where: { organizationId: user.employee.organizationId },
    });
    const assignmentNumber = `OD-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const newDuty = await db.onDutyAssignment.create({
      data: {
        organizationId: user.employee.organizationId,
        assignmentNumber,
        employeeId: user.employee.id,
        clientId: clientId || null,
        clientName: clientName || null,
        location,
        date: new Date(date),
        purpose,
        status: "ASSIGNED",
      },
    });

    return successResponse(newDuty, 201);
  } catch (error: any) {
    console.error("[POST OnDuty API Error]:", error);
    return errorResponse("Failed to create on-duty assignment", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const { id, action, reportNotes } = body;

    if (!id || !action) {
      return errorResponse("Duty ID and action are required", "VALIDATION_ERROR", 400);
    }

    const duty = await db.onDutyAssignment.findUnique({ where: { id } });
    if (!duty || duty.employeeId !== user.employee.id) {
      return errorResponse("Duty assignment not found or access denied", "FORBIDDEN", 403);
    }

    let updateData: any = {};
    if (action === "START") {
      updateData = { status: "IN_PROGRESS", startedAt: new Date() };
    } else if (action === "COMPLETE") {
      updateData = {
        status: "COMPLETED",
        completedAt: new Date(),
        reportNotes: reportNotes || duty.reportNotes,
      };
    }

    const updated = await db.onDutyAssignment.update({
      where: { id },
      data: updateData,
    });

    return successResponse(updated);
  } catch (error: any) {
    console.error("[PATCH OnDuty API Error]:", error);
    return errorResponse("Failed to update on-duty status", "INTERNAL_ERROR", 500);
  }
}
