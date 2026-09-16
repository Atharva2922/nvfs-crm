export type SystemRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CEO"
  | "CHAIRPERSON"
  | "CTO"
  | "CMO"
  | "CFO"
  | "HEAD_OF_DEPARTMENT"
  | "EMPLOYEE";

export const SYSTEM_ROLES: Record<SystemRole, { label: string; level: number; description: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    level: 100,
    description: "Full unchecked administrative control over all system domains and security",
  },
  CHAIRPERSON: {
    label: "Chairperson",
    level: 95,
    description: "Board level executive oversight, audit, high-level governance, and strategic reporting",
  },
  CEO: {
    label: "Chief Executive Officer",
    level: 90,
    description: "Executive operational and strategic leadership across all departments and financials",
  },
  CFO: {
    label: "Chief Financial Officer",
    level: 85,
    description: "Executive oversight of finance, payroll, invoices, purchase orders, and audit",
  },
  CTO: {
    label: "Chief Technology Officer",
    level: 85,
    description: "Executive oversight of technology, engineering operations, infrastructure, and audit",
  },
  CMO: {
    label: "Chief Marketing Officer",
    level: 85,
    description: "Executive oversight of CRM, marketing leads, opportunities, and campaigns",
  },
  ADMIN: {
    label: "Platform Admin",
    level: 70,
    description: "Operational management of users, departments, permissions, and settings",
  },
  HEAD_OF_DEPARTMENT: {
    label: "Department Head / Manager",
    level: 50,
    description: "Management of department team members, approvals, tasks, and attendance",
  },
  EMPLOYEE: {
    label: "Employee",
    level: 10,
    description: "Self-service access to personal attendance, leaves, tasks, and basic directory",
  },
};

export type UserStatus = "ACTIVE" | "SUSPENDED" | "INVITED" | "INACTIVE";

export type AuditAction =
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_SUSPENDED"
  | "ROLE_CHANGED"
  | "DEPARTMENT_CREATED"
  | "DEPARTMENT_UPDATED"
  | "EMPLOYEE_ONBOARDED"
  | "EMPLOYEE_UPDATED"
  | "SYSTEM_SETTING_UPDATED";

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

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: SystemRole;
  status: UserStatus;
  avatarUrl?: string | null;
  departmentName?: string | null;
  designation?: string | null;
}
