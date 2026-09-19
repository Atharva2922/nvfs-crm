import { AuthenticatedUser } from "@/types";
import { RbacService } from "@/services/rbac.service";

export type CRMDateRangePreset =
  | "today"
  | "yesterday"
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export interface CRMDateBoundary {
  gte?: Date;
  lte?: Date;
}

export interface CRMQueryOptions {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CRMPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Parses date range presets or custom ISO dates into exact Date objects.
 * Sets start boundary to 00:00:00.000 and end boundary to 23:59:59.999.
 */
export function parseCrmDateRange(
  preset?: string | null,
  customStart?: string | Date | null,
  customEnd?: string | Date | null
): CRMDateBoundary | undefined {
  const now = new Date();

  const startOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res;
  };

  const endOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(23, 59, 59, 999);
    return res;
  };

  if (preset === "today") {
    return { gte: startOfDay(now), lte: endOfDay(now) };
  }

  if (preset === "yesterday") {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    return { gte: startOfDay(yest), lte: endOfDay(yest) };
  }

  if (preset === "last7Days") {
    const past7 = new Date(now);
    past7.setDate(past7.getDate() - 7);
    return { gte: startOfDay(past7), lte: endOfDay(now) };
  }

  if (preset === "last30Days") {
    const past30 = new Date(now);
    past30.setDate(past30.getDate() - 30);
    return { gte: startOfDay(past30), lte: endOfDay(now) };
  }

  if (preset === "thisMonth") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { gte: startOfDay(firstDay), lte: endOfDay(lastDay) };
  }

  if (preset === "lastMonth") {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return { gte: startOfDay(firstDay), lte: endOfDay(lastDay) };
  }

  if (customStart || customEnd) {
    const boundary: CRMDateBoundary = {};
    if (customStart) {
      const parsed = new Date(customStart);
      if (!isNaN(parsed.getTime())) boundary.gte = startOfDay(parsed);
    }
    if (customEnd) {
      const parsed = new Date(customEnd);
      if (!isNaN(parsed.getTime())) boundary.lte = endOfDay(parsed);
    }
    if (boundary.gte || boundary.lte) return boundary;
  }

  return undefined;
}

/**
 * Parses and validates pagination query parameters from URLSearchParams.
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 10,
  maxLimit: number = 100
): CRMQueryOptions {
  const pageRaw = parseInt(searchParams.get("page") || "1", 10);
  const limitRaw = parseInt(searchParams.get("limit") || String(defaultLimit), 10);

  const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  const limit = isNaN(limitRaw) || limitRaw < 1 ? defaultLimit : Math.min(limitRaw, maxLimit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit,
  };
}

/**
 * Validates and sanitizes sorting parameters against an allowed whitelist of fields.
 */
export function parseSortParams(
  searchParams: URLSearchParams,
  allowedFields: string[],
  defaultSort: string = "createdAt",
  defaultOrder: "asc" | "desc" = "desc"
): { sortBy: string; sortOrder: "asc" | "desc" } {
  const reqSort = searchParams.get("sortBy") || searchParams.get("sort");
  const reqOrder = searchParams.get("sortOrder") || searchParams.get("order");

  const sortBy = reqSort && allowedFields.includes(reqSort) ? reqSort : defaultSort;
  const sortOrder = reqOrder === "asc" || reqOrder === "desc" ? reqOrder : defaultOrder;

  return { sortBy, sortOrder };
}

/**
 * Calculates standard pagination metadata.
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): CRMPaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Helper to determine if an authenticated user has executive CRM privileges.
 */
export function isCrmExecutive(user: AuthenticatedUser): boolean {
  const execRoles = ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "ADMIN", "COO", "CTO", "CFO", "CMO"];
  return execRoles.includes(user.roleCode) || user.roleLevel >= 80;
}

/**
 * Builds Prisma `where` scoping conditions for CRM entities:
 * 1. Enforces tenant boundary (organizationId).
 * 2. Scopes down to SELF, TEAM, or DEPARTMENT depending on role and requested scope.
 */
export async function buildCrmScopeFilter(
  user: AuthenticatedUser,
  options: {
    entityOwnerField?: string;
    requestedScope?: "my" | "department" | "all";
    requestedOwnerId?: string;
  } = {}
): Promise<{ organizationId: string; [key: string]: any }> {
  if (!user.employee) throw new Error("Authenticated user has no employee profile");

  const orgId = user.employee.organizationId;
  const empId = user.employee.id;
  const isExec = isCrmExecutive(user);
  const isDeptHead = user.roleCode === "DEPARTMENT_HEAD";
  const isManager = user.roleCode === "MANAGER";
  const ownerField = options.entityOwnerField || "ownerId";

  const filter: any = { organizationId: orgId };

  // Explicit "my" scope always filters by self
  if (options.requestedScope === "my") {
    filter[ownerField] = empId;
    return filter;
  }

  // Executives have organization-wide visibility by default
  if (isExec) {
    if (options.requestedOwnerId && options.requestedOwnerId !== "ALL") {
      filter[ownerField] = options.requestedOwnerId;
    }
    return filter;
  }

  // Department Heads
  if (isDeptHead) {
    if (options.requestedOwnerId && options.requestedOwnerId !== "ALL") {
      filter[ownerField] = options.requestedOwnerId;
    }
    return filter;
  }

  // Managers (can see self + direct/indirect reports)
  if (isManager) {
    const subordinates = await RbacService.getSubordinateIds(empId);
    const allowedIds = [empId, ...subordinates];

    if (options.requestedOwnerId && allowedIds.includes(options.requestedOwnerId)) {
      filter[ownerField] = options.requestedOwnerId;
    } else {
      filter[ownerField] = { in: allowedIds };
    }
    return filter;
  }

  // Standard Employees are strictly locked to their own records
  filter[ownerField] = empId;
  return filter;
}
