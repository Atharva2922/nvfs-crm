import { AuthenticatedUser, DataScopeCode } from "@/types";
import { db } from "@/lib/db";
import { RbacService } from "@/services/rbac.service";

export type DataScope = DataScopeCode | "ORGANIZATION";

export interface ScopeFilter {
  scope: DataScope;
  employeeId?: string;
  departmentId?: string;
  teamId?: string;
  subordinateIds?: string[];
  organizationId: string;
  companyId: string;
}

export class TenantIsolationError extends Error {
  statusCode: number;
  constructor(message: string = "Forbidden: Cross-company access is strictly prohibited") {
    super(message);
    this.name = "TenantIsolationError";
    this.statusCode = 403;
  }
}

/**
 * Validates that an authenticated user's active company matches the requested resource's companyId.
 * Super Admin platform access is permitted. Cross-company access for regular users throws 403.
 */
export function enforceCompanyIsolation(
  user: AuthenticatedUser | null | undefined,
  resourceCompanyId?: string | null
): boolean {
  if (!user) {
    throw new TenantIsolationError("Unauthenticated: Please log in to access this resource");
  }

  // Super Admin can access all platform resources
  if (user.roleCode === "SUPER_ADMIN" || user.dataScope === "GLOBAL") {
    return true;
  }

  if (!resourceCompanyId) {
    return true;
  }

  const activeCompanyId = user.activeCompany?.id || user.employee?.organizationId;

  if (activeCompanyId && activeCompanyId !== resourceCompanyId) {
    throw new TenantIsolationError(
      `Forbidden: Access denied. Resource belongs to organization '${resourceCompanyId}', but user is authenticated under '${activeCompanyId}'`
    );
  }

  return true;
}

/**
 * Resolves granular data scope for an authenticated user based on role level, company, and permissions.
 */
export async function getAuthorizedScope(
  user: AuthenticatedUser,
  permissionCode?: string
): Promise<ScopeFilter> {
  const companyId = user.activeCompany?.id || user.employee?.organizationId || "";

  // 1. Super Admin has GLOBAL scope across the platform
  if (user.roleCode === "SUPER_ADMIN" || user.roleLevel >= 100) {
    return {
      scope: "GLOBAL",
      organizationId: companyId,
      companyId,
    };
  }

  // 2. Executive Leadership & Company Admin have COMPANY scope
  const companyWideRoles = [
    "CHAIRPERSON",
    "CEO",
    "COO",
    "CFO",
    "CTO",
    "CMO",
    "HR",
    "ADMIN",
  ];

  if (
    user.roleLevel >= 70 ||
    companyWideRoles.includes(user.roleCode) ||
    user.dataScope === "COMPANY" ||
    user.dataScope === "BUSINESS_UNIT"
  ) {
    return {
      scope: "COMPANY",
      organizationId: companyId,
      companyId,
    };
  }

  // Explicit company-wide permission flag
  if (permissionCode && user.permissions.includes(permissionCode + ".all")) {
    return {
      scope: "COMPANY",
      organizationId: companyId,
      companyId,
    };
  }

  // 3. Department Head (scope: DEPARTMENT)
  if (
    user.roleLevel >= 50 ||
    user.roleCode === "DEPARTMENT_HEAD" ||
    user.dataScope === "DEPARTMENT"
  ) {
    return {
      scope: "DEPARTMENT",
      departmentId: user.employee?.departmentId || undefined,
      organizationId: companyId,
      companyId,
    };
  }

  // 4. Managers & Team Leads (scope: TEAM)
  if (
    user.roleLevel >= 25 ||
    user.roleCode === "MANAGER" ||
    user.roleCode === "TEAM_LEAD" ||
    user.dataScope === "TEAM"
  ) {
    let subordinateIds: string[] = [];
    if (user.employee?.id) {
      subordinateIds = await RbacService.getSubordinateIds(user.employee.id);
      subordinateIds.push(user.employee.id);
    }
    return {
      scope: "TEAM",
      subordinateIds,
      teamId: user.employee?.teamId || undefined,
      departmentId: user.employee?.departmentId || undefined,
      employeeId: user.employee?.id,
      organizationId: companyId,
      companyId,
    };
  }

  // 5. Normal Employee (scope: SELF)
  return {
    scope: "SELF",
    employeeId: user.employee?.id || "",
    organizationId: companyId,
    companyId,
  };
}

/**
 * Builds a Prisma `where` filter combining strict tenant boundary and data scope.
 */
export async function getScopedWhereClause(
  user: AuthenticatedUser,
  options: {
    ownerField?: string;
    departmentField?: string;
    teamField?: string;
    permissionCode?: string;
  } = {}
): Promise<Record<string, any>> {
  const scopeFilter = await getAuthorizedScope(user, options.permissionCode);
  const where: Record<string, any> = {};

  // Tenant Boundary (organizationId / companyId)
  if (scopeFilter.scope !== "GLOBAL" || scopeFilter.companyId) {
    where.organizationId = scopeFilter.companyId;
  }

  const ownerField = options.ownerField || "ownerId";
  const departmentField = options.departmentField || "departmentId";
  const teamField = options.teamField || "teamId";

  switch (scopeFilter.scope) {
    case "GLOBAL":
    case "COMPANY":
    case "ORGANIZATION":
      // Company-wide: No restriction within the company
      break;

    case "DEPARTMENT":
      if (scopeFilter.departmentId) {
        where[departmentField] = scopeFilter.departmentId;
      }
      break;

    case "TEAM":
      if (scopeFilter.subordinateIds && scopeFilter.subordinateIds.length > 0) {
        where[ownerField] = { in: scopeFilter.subordinateIds };
      } else if (scopeFilter.teamId) {
        where[teamField] = scopeFilter.teamId;
      } else if (scopeFilter.employeeId) {
        where[ownerField] = scopeFilter.employeeId;
      }
      break;

    case "SELF":
    default:
      if (scopeFilter.employeeId) {
        where[ownerField] = scopeFilter.employeeId;
      }
      break;
  }

  return where;
}

/**
 * Enforces ownership or role authorization for accessing an employee's private records.
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

  // Check same-company isolation first
  const target = await db.employee.findUnique({
    where: { id: targetEmployeeId },
    select: { organizationId: true, departmentId: true, teamId: true },
  });

  if (!target) return false;

  // Cross-company access is blocked for non-super-admins
  if (actor.roleCode !== "SUPER_ADMIN" && target.organizationId !== (actor.activeCompany?.id || actor.employee.organizationId)) {
    return false;
  }

  // Executive roles can access all employees in their company
  if (
    actor.roleLevel >= 70 ||
    ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "COO", "HR", "ADMIN"].includes(actor.roleCode)
  ) {
    return true;
  }

  // Department Head
  if (actor.roleCode === "DEPARTMENT_HEAD" && actor.employee.departmentId) {
    if (target.departmentId === actor.employee.departmentId) {
      return true;
    }
  }

  // Manager or Team Lead
  if (actor.roleLevel >= 25 || actor.roleCode === "MANAGER" || actor.roleCode === "TEAM_LEAD") {
    const subs = await RbacService.getSubordinateIds(actor.employee.id);
    if (subs.includes(targetEmployeeId)) {
      return true;
    }
  }

  return false;
}
