import { AuthenticatedUser } from "@/types";
import { db } from "@/lib/db";
import { RbacService } from "@/services/rbac.service";

export type DataScope = "SELF" | "TEAM" | "DEPARTMENT" | "ORGANIZATION";

export interface ScopeFilter {
  scope: DataScope;
  employeeId?: string;
  departmentId?: string;
  subordinateIds?: string[];
  organizationId: string;
}

/**
 * Resolves data scope for an authenticated user based on role level & permissions.
 */
export async function getAuthorizedScope(
  user: AuthenticatedUser,
  permissionCode?: string
): Promise<ScopeFilter> {
  const orgId = user.employee?.organizationId || "";

  // Super Admin, CEO, Chairperson have full Organization scope
  if (user.roleLevel >= 90 || ["SUPER_ADMIN", "CHAIRPERSON", "CEO"].includes(user.roleCode)) {
    return { scope: "ORGANIZATION", organizationId: orgId };
  }

  // HR Admin / Finance Admin with explicit company-wide permission
  if (permissionCode && user.permissions.includes(permissionCode + ".all")) {
    return { scope: "ORGANIZATION", organizationId: orgId };
  }

  // Department Head (roleLevel >= 50)
  if (user.roleLevel >= 50 || user.roleCode === "DEPARTMENT_HEAD") {
    return {
      scope: "DEPARTMENT",
      departmentId: user.employee?.departmentId || undefined,
      organizationId: orgId,
    };
  }

  // Manager (roleLevel >= 30)
  if (user.roleLevel >= 30 || user.roleCode === "MANAGER") {
    let subordinateIds: string[] = [];
    if (user.employee?.id) {
      subordinateIds = await RbacService.getSubordinateIds(user.employee.id);
      subordinateIds.push(user.employee.id); // Manager includes themselves
    }
    return {
      scope: "TEAM",
      subordinateIds,
      employeeId: user.employee?.id,
      organizationId: orgId,
    };
  }

  // Normal Employee (SELF scope)
  return {
    scope: "SELF",
    employeeId: user.employee?.id || "",
    organizationId: orgId,
  };
}

/**
 * Enforces ownership or role authorization for accessing an employee's private records (e.g. payslips, salary, expenses).
 * Returns true if allowed, false if forbidden.
 */
export async function canAccessEmployeeData(
  actor: AuthenticatedUser,
  targetEmployeeId: string
): Promise<boolean> {
  if (!actor || !actor.employee) return false;

  // Accessing own record is always allowed
  if (actor.employee.id === targetEmployeeId) {
    return true;
  }

  // Organization-wide roles
  if (actor.roleLevel >= 80 || ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO"].includes(actor.roleCode)) {
    return true;
  }

  // Check Department Head
  if (actor.roleCode === "DEPARTMENT_HEAD" && actor.employee.departmentId) {
    const target = await db.employee.findUnique({
      where: { id: targetEmployeeId },
      select: { departmentId: true },
    });
    if (target && target.departmentId === actor.employee.departmentId) {
      return true;
    }
  }

  // Check Manager Tree
  if (actor.roleLevel >= 30 || actor.roleCode === "MANAGER") {
    const subs = await RbacService.getSubordinateIds(actor.employee.id);
    if (subs.includes(targetEmployeeId)) {
      return true;
    }
  }

  return false;
}
