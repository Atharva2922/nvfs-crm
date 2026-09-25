export type SystemRoleCode =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CHAIRPERSON"
  | "CEO"
  | "CTO"
  | "CIO"
  | "CMO"
  | "CFO"
  | "COO"
  | "HR"
  | "DEPARTMENT_HEAD"
  | "MANAGER"
  | "TEAM_LEAD"
  | "EMPLOYEE";

export type DataScopeCode =
  | "SELF"
  | "TEAM"
  | "DEPARTMENT"
  | "BUSINESS_UNIT"
  | "COMPANY"
  | "GLOBAL";

export type PermissionAction =
  | "VIEW"
  | "CREATE"
  | "EDIT"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "ASSIGN"
  | "EXPORT"
  | "DOWNLOAD"
  | "SHARE"
  | "MANAGE";

export interface SystemRole {
  id: string;
  code: SystemRoleCode;
  name: string;
  level: number;
  dataScope?: DataScopeCode;
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

export interface CompanySummary {
  id: string;
  companyId?: string;
  name: string;
  companyName?: string;
  code: string;
  companyCode?: string;
  legalName?: string | null;
  logo?: string | null;
  favicon?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  industry?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  fiscalYear?: string;
  status?: string;
}

export interface UserCompanyMembershipSummary {
  id: string;
  companyId: string;
  companyName: string;
  companyCode: string;
  logo?: string | null;
  primaryColor: string;
  roleCode?: SystemRoleCode | null;
  roleName?: string | null;
  isPrimary: boolean;
  status: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roleCode: SystemRoleCode;
  roleName: string;
  roleLevel: number;
  dataScope: DataScopeCode;
  isActive: boolean;
  activeCompany: CompanySummary | null;
  memberships: UserCompanyMembershipSummary[];
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    designation: string;
    departmentName?: string | null;
    departmentCode?: string | null;
    departmentId?: string | null;
    teamName?: string | null;
    teamId?: string | null;
    organizationName: string;
    organizationId: string;
    companyId?: string;
    companyName?: string;
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
