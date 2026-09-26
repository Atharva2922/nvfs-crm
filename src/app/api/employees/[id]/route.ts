import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AuditService } from "@/services/audit.service";
import { RbacService } from "@/services/rbac.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;

    // Check hierarchical access
    const allowed = await RbacService.canAccessEmployee(user, id);
    if (!allowed) {
      return errorResponse("Forbidden: You do not have permission to view this employee", "FORBIDDEN", 403);
    }

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        organization: true,
        department: true,
        manager: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            designation: true,
            email: true,
          },
        },
        directReports: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            designation: true,
            employmentStatus: true,
            department: { select: { name: true } },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            lastLoginAt: true,
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                level: true,
              },
            },
          },
        },
        profile: true,
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!employee) {
      return errorResponse("Employee not found", "NOT_FOUND", 404);
    }

    // Retrieve activity audit logs for this employee
    const activityLogs = await db.auditLog.findMany({
      where: {
        OR: [
          { entity: "Employee", entityId: employee.id },
          { actorId: employee.userId || undefined },
        ],
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return successResponse({ employee, activityLogs });
  } catch (error) {
    console.error("[Employee GET ID Error]:", error);
    return errorResponse("Failed to fetch employee details", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const hasPermission = await RbacService.hasPermission(user.id, "employees.employee.update");
    if (!hasPermission) {
      return errorResponse("Forbidden: Missing employees.employee.update permission", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();

    const previous = await db.employee.findUnique({ where: { id } });
    if (!previous) {
      return errorResponse("Employee not found", "NOT_FOUND", 404);
    }

    const updated = await db.employee.update({
      where: { id },
      data: {
        designation: body.designation ?? previous.designation,
        departmentId: body.departmentId ?? previous.departmentId,
        managerId: body.managerId !== undefined ? body.managerId : previous.managerId,
        employmentStatus: body.employmentStatus ?? previous.employmentStatus,
        workMode: body.workMode ?? previous.workMode,
        location: body.location ?? previous.location,
        emergencyContact: body.emergencyContact !== undefined ? body.emergencyContact : previous.emergencyContact,
        phone: body.phone !== undefined ? body.phone : previous.phone,
      },
      include: {
        department: true,
        manager: true,
      },
    });

    // Record mutation audit diff
    await AuditService.logMutation({
      actorId: user.id,
      action: "EMPLOYEE_UPDATED",
      entity: "Employee",
      entityId: updated.id,
      previousValue: {
        designation: previous.designation,
        departmentId: previous.departmentId,
        employmentStatus: previous.employmentStatus,
        workMode: previous.workMode,
      },
      newValue: {
        designation: updated.designation,
        departmentId: updated.departmentId,
        employmentStatus: updated.employmentStatus,
        workMode: updated.workMode,
      },
      metadata: { source: "employee_patch" },
    });

    return successResponse(updated);
  } catch (error) {
    console.error("[Employee PATCH Error]:", error);
    return errorResponse("Failed to update employee", "INTERNAL_ERROR", 500);
  }
}
