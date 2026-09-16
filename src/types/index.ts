export type SystemRoleCode =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CHAIRPERSON"
  | "CEO"
  | "CTO"
  | "CMO"
  | "CFO"
  | "DEPARTMENT_HEAD"
  | "MANAGER"
  | "EMPLOYEE";

export interface SystemRole {
  id: string;
  code: SystemRoleCode;
  name: string;
  level: number;
  description?: string | null;
}

export interface PermissionDefinition {
  id: string;
  code: string;
  module: string;
  resource: string;
  action: string;
  description?: string | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roleCode: SystemRoleCode;
  roleName: string;
  roleLevel: number;
  isActive: boolean;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    designation: string;
    departmentName?: string | null;
    departmentId?: string | null;
    organizationName: string;
    organizationId: string;
    managerId?: string | null;
    workMode?: string;
    location?: string;
    employmentType?: string;
  } | null;
  permissions: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    totalCount?: number;
  };
}

export type EmploymentType = "FULL_TIME" | "CONTRACT" | "PART_TIME" | "INTERN";
export type EmploymentStatus = "ACTIVE" | "PROBATION" | "ON_LEAVE" | "TERMINATED";
export type WorkMode = "ON_SITE" | "REMOTE" | "HYBRID";
