import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now();
    const [org, userCount, employeeCount, deptCount, auditCount, roleCount, permCount] =
      await Promise.all([
        db.organization.findFirst({ select: { name: true, code: true } }),
        db.user.count(),
        db.employee.count(),
        db.department.count(),
        db.auditLog.count(),
        db.role.count(),
        db.permission.count(),
      ]);
    const latencyMs = Date.now() - startTime;

    return successResponse({
      status: "OPERATIONAL",
      block: "BLOCK_0_PROJECT_FOUNDATION_AND_ARCHITECTURE",
      version: "0.1.0-foundation",
      organization: org,
      database: {
        connected: true,
        latencyMs,
        counts: {
          users: userCount,
          employees: employeeCount,
          departments: deptCount,
          roles: roleCount,
          permissions: permCount,
          auditLogs: auditCount,
        },
      },
      system: {
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
      },
    });
  } catch (error) {
    console.error("[Health Check Error]:", error);
    return errorResponse(
      "Database health check failed",
      "SERVICE_UNAVAILABLE",
      503,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
