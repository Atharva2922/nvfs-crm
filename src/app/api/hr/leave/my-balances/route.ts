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

    const currentYear = new Date().getFullYear();

    // Fetch existing balances or seed default balances from LeavePolicy
    let balances = await db.leaveBalance.findMany({
      where: {
        employeeId: user.employee.id,
        year: currentYear,
      },
      include: {
        leavePolicy: true,
      },
    });

    if (balances.length === 0) {
      // Seed balances from organization policies
      const policies = await db.leavePolicy.findMany({
        where: { organizationId: user.employee.organizationId },
      });

      if (policies.length > 0) {
        await Promise.all(
          policies.map((p) =>
            db.leaveBalance.upsert({
              where: {
                employeeId_leavePolicyId_year: {
                  employeeId: user.employee!.id,
                  leavePolicyId: p.id,
                  year: currentYear,
                },
              },
              create: {
                employeeId: user.employee!.id,
                leavePolicyId: p.id,
                year: currentYear,
                allocated: p.annualAllowance,
                used: 0,
                pending: 0,
                remaining: p.annualAllowance,
              },
              update: {},
            })
          )
        );

        balances = await db.leaveBalance.findMany({
          where: {
            employeeId: user.employee.id,
            year: currentYear,
          },
          include: {
            leavePolicy: true,
          },
        });
      }
    }

    const formatted = balances.map((b) => ({
      id: b.id,
      code: b.leavePolicy.code,
      name: b.leavePolicy.name,
      allocated: b.allocated,
      used: b.used,
      pending: b.pending,
      remaining: b.remaining,
    }));

    return successResponse(formatted);
  } catch (error: any) {
    console.error("[My Leave Balances API Error]:", error);
    return errorResponse("Failed to fetch leave balances", "INTERNAL_ERROR", 500);
  }
}
