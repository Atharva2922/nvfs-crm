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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;

    const roleCode = (user.roleCode || "").toUpperCase();
    const roleLevel = user.roleLevel ?? 10;
    const isExecutive =
      ["SUPER_ADMIN", "ADMIN", "CHAIRPERSON", "CEO", "COO", "CFO", "CIO", "CTO", "CMO", "CHRO", "HR", "DIRECTOR", "VP", "PRESIDENT"].includes(roleCode) ||
      roleLevel >= 40 ||
      (await RbacService.hasPermission(user.id, "employees.employee.delete"));

    if (!isExecutive) {
      return errorResponse(
        "Forbidden: Only corporate executives and management can delete employees",
        "FORBIDDEN",
        403
      );
    }

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        user: {
          include: { role: true },
        },
      },
    });

    if (!employee) {
      return errorResponse("Employee not found", "NOT_FOUND", 404);
    }

    // Prevent deleting oneself
    if (user.employee?.id === id || (employee.userId && user.id === employee.userId)) {
      return errorResponse("You cannot delete your own employee record", "FORBIDDEN", 400);
    }

    // Protect Super Admin accounts from being deleted
    if (employee.user?.role?.code === "SUPER_ADMIN") {
      return errorResponse("Super Administrator accounts cannot be deleted", "FORBIDDEN", 403);
    }

    // Clean up dependent / relational records in a safe transaction
    await db.$transaction(async (tx) => {
      // 1. Unlink manager references on other employees
      await tx.employee.updateMany({
        where: { managerId: id },
        data: { managerId: null },
      });

      // 2. Unlink department manager & team leader
      await tx.department.updateMany({
        where: { managerId: id },
        data: { managerId: null },
      });
      await tx.team.updateMany({
        where: { leaderId: id },
        data: { leaderId: null },
      });

      // 3. Tasks assigned or created
      await tx.taskComment.deleteMany({ where: { authorId: id } }).catch(() => {});
      await tx.task.updateMany({ where: { assigneeId: id }, data: { assigneeId: null } }).catch(() => {});
      await tx.task.deleteMany({ where: { creatorId: id } }).catch(() => {});

      // 4. CRM ownership unlinking & activities
      await tx.crmActivity.deleteMany({ where: { performedById: id } }).catch(() => {});
      await tx.client.updateMany({ where: { ownerId: id }, data: { ownerId: null } }).catch(() => {});
      await tx.lead.updateMany({ where: { ownerId: id }, data: { ownerId: null } }).catch(() => {});
      await tx.opportunity.updateMany({ where: { ownerId: id }, data: { ownerId: null } }).catch(() => {});

      // 5. Communications & Calendar
      await tx.conversationParticipant.deleteMany({ where: { employeeId: id } }).catch(() => {});
      await tx.message.deleteMany({ where: { senderId: id } }).catch(() => {});
      await tx.conversation.deleteMany({ where: { createdById: id } }).catch(() => {});
      await tx.calendarEvent.deleteMany({ where: { creatorId: id } }).catch(() => {});
      await tx.announcementRead.deleteMany({ where: { employeeId: id } }).catch(() => {});
      await tx.announcement.deleteMany({ where: { authorId: id } }).catch(() => {});

      // 6. Operations & Requests
      await tx.operationEmployee.deleteMany({ where: { employeeId: id } }).catch(() => {});
      await tx.employeeRequest.deleteMany({ where: { employeeId: id } }).catch(() => {});
      await tx.onDutyAssignment.deleteMany({ where: { employeeId: id } }).catch(() => {});
      await tx.approvalRequest.deleteMany({ where: { requestedById: id } }).catch(() => {});
      await tx.approvalRequest.updateMany({ where: { approverId: id }, data: { approverId: null } }).catch(() => {});

      // 7. Finance & Expenses
      await tx.expense.deleteMany({ where: { employeeId: id } }).catch(() => {});

      // 8. HR records
      await tx.attendanceRecord.deleteMany({ where: { employeeId: id } }).catch(() => {});
      await tx.leaveRequest.deleteMany({ where: { employeeId: id } }).catch(() => {});
      await tx.leaveBalance.deleteMany({ where: { employeeId: id } }).catch(() => {});
      await tx.employeeSalaryStructure.deleteMany({ where: { employeeId: id } }).catch(() => {});
      await tx.payrollEntry.deleteMany({ where: { employeeId: id } }).catch(() => {});
      await tx.employeeDocument.deleteMany({ where: { employeeId: id } }).catch(() => {});
      await tx.employeeProfile.deleteMany({ where: { employeeId: id } }).catch(() => {});

      // 9. Delete the employee record
      await tx.employee.delete({ where: { id } });

      // 10. Delete associated user account if one exists
      if (employee.userId) {
        await tx.userCompanyMembership.deleteMany({ where: { userId: employee.userId } }).catch(() => {});
        await tx.userSetting.deleteMany({ where: { userId: employee.userId } }).catch(() => {});
        await tx.dashboardPreference.deleteMany({ where: { userId: employee.userId } }).catch(() => {});
        await tx.auditLog.updateMany({ where: { actorId: employee.userId }, data: { actorId: null } }).catch(() => {});
        await tx.user.delete({ where: { id: employee.userId } }).catch(() => {});
      }
    });

    // Audit log
    await AuditService.logMutation({
      actorId: user.id,
      action: "EMPLOYEE_DELETED",
      entity: "Employee",
      entityId: id,
      previousValue: {
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        designation: employee.designation,
      },
      newValue: null,
      metadata: { deletedBy: user.email, role: roleCode },
    });

    return successResponse({
      message: `Employee ${employee.firstName} ${employee.lastName} (${employee.employeeNumber}) deleted successfully`,
    });
  } catch (error) {
    console.error("[Employee DELETE Error]:", error);
    return errorResponse("Failed to delete employee", "INTERNAL_ERROR", 500);
  }
}
