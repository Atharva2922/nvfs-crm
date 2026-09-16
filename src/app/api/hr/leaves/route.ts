import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LeaveService } from "@/services/leave.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createLeaveSchema = z.object({
  leavePolicyCode: z.string().min(1, "Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(3, "Please provide a valid reason (min 3 chars)"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "my"; // "my" | "team" | "all"
    const currentYear = new Date().getFullYear();

    // 1. My Leaves scope
    if (scope === "my" && user.employee) {
      const [balances, myRequests] = await Promise.all([
        db.leaveBalance.findMany({
          where: { employeeId: user.employee.id, year: currentYear },
          include: { leavePolicy: true },
        }),
        db.leaveRequest.findMany({
          where: { employeeId: user.employee.id },
          orderBy: { createdAt: "desc" },
          include: {
            leavePolicy: true,
            approvedBy: {
              select: { firstName: true, lastName: true, designation: true },
            },
          },
        }),
      ]);

      return successResponse({ balances, requests: myRequests });
    }

    // 2. Team Approvals scope (for Managers / Dept Heads)
    if (scope === "team" && user.employee) {
      const teamRequests = await db.leaveRequest.findMany({
        where: {
          employee: {
            managerId: user.employee.id,
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeNumber: true,
              designation: true,
              department: { select: { name: true } },
            },
          },
          leavePolicy: true,
        },
      });

      return successResponse({ requests: teamRequests });
    }

    // 3. All Organization scope (HR, CEO, Super Admin)
    const allRequests = await db.leaveRequest.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeNumber: true,
            designation: true,
            department: { select: { name: true } },
          },
        },
        leavePolicy: true,
        approvedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const policies = await db.leavePolicy.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: { select: { leaveRequests: true } },
      },
    });

    return successResponse({ requests: allRequests, policies });
  } catch (error: any) {
    console.error("[Leaves GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve leaves", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized: Active employee profile required to request leaves", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const parse = createLeaveSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const request = await LeaveService.createLeaveRequest({
      employeeId: user.employee.id,
      leavePolicyCode: parse.data.leavePolicyCode,
      startDate: parse.data.startDate,
      endDate: parse.data.endDate,
      reason: parse.data.reason,
    });

    return successResponse(request, 201);
  } catch (error: any) {
    console.error("[Leave Request Creation Error]:", error);
    return errorResponse(error.message || "Failed to create leave request", "BAD_REQUEST", 400);
  }
}
