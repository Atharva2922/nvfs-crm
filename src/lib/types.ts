export type SystemRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CEO"
  | "CHAIRPERSON"
  | "CTO"
  | "CMO"
  | "CFO"
  | "COO"
  | "HR"
  | "DEPARTMENT_HEAD"
  | "MANAGER"
  | "TEAM_LEAD"
  | "EMPLOYEE";

export const SYSTEM_ROLES: Record<SystemRole, { label: string; level: number; description: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    level: 100,
    description: "Full platform-level administration across all companies, security, and global settings",
  },
  CHAIRPERSON: {
    label: "Chairperson",
    level: 95,
    description: "Board level executive oversight, audit, high-level governance, and strategic reporting",
  },
  CEO: {
    label: "Chief Executive Officer",
    level: 90,
    description: "Executive operational and strategic leadership across company departments and financials",
  },
  COO: {
    label: "Chief Operating Officer",
    level: 85,
    description: "Executive oversight of operations, service delivery, SLAs, resource allocation, and processes",
  },
  CFO: {
    label: "Chief Financial Officer",
    level: 85,
    description: "Executive oversight of finance, payroll, invoices, budgets, and treasury",
  },
  CTO: {
    label: "Chief Technology Officer",
    level: 85,
    description: "Executive oversight of technology, engineering operations, cloud infrastructure, and DevOps",
  },
  CMO: {
    label: "Chief Marketing Officer",
    level: 85,
    description: "Executive oversight of CRM, marketing leads, growth pipeline, campaigns, and brand",
  },
  HR: {
    label: "Chief Human Resources Officer",
    level: 80,
    description: "Executive oversight of company employees, recruitment, onboarding, leave, and policies",
  },
  ADMIN: {
    label: "Company Admin",
    level: 70,
    description: "Management of company users, roles, departments, teams, workflows, and company settings",
  },
  DEPARTMENT_HEAD: {
    label: "Department Head",
    level: 50,
    description: "Management of department team members, departmental approvals, tasks, and budgets",
  },
  MANAGER: {
    label: "Department Manager",
    level: 40,
    description: "Line management of team members, project deliverables, and operational workflows",
  },
  TEAM_LEAD: {
    label: "Team Lead",
    level: 25,
    description: "Operational leadership of team members, work assignments, and direct peer reviews",
  },
  EMPLOYEE: {
    label: "Employee",
    level: 10,
    description: "Self-service workspace for personal tasks, projects, calendar, leaves, and documents",
  },
};

export type UserStatus = "ACTIVE" | "SUSPENDED" | "INVITED" | "INACTIVE";

export type AuditAction =
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "COMPANY_SWITCH"
  | "COMPANY_CREATED"
  | "COMPANY_UPDATED"
  | "COMPANY_SUSPENDED"
  | "COMPANY_ACTIVATED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_SUSPENDED"
  | "USER_DELETED"
  | "ROLE_CHANGED"
  | "PERMISSION_CHANGED"
  | "DEPARTMENT_CREATED"
  | "DEPARTMENT_UPDATED"
  | "TEAM_CREATED"
  | "TEAM_UPDATED"
  | "EMPLOYEE_ONBOARDED"
  | "EMPLOYEE_UPDATED"
  | "CUSTOMER_CREATED"
  | "CUSTOMER_UPDATED"
  | "DEAL_CREATED"
  | "DEAL_APPROVED"
  | "INVOICE_CREATED"
  | "INVOICE_APPROVED"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_GRANTED"
  | "APPROVAL_REJECTED"
  | "DOCUMENT_DOWNLOADED"
  | "EXPORT_PERFORMED"
  | "COMPANY_SETTING_UPDATED"
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
  companyId?: string;
  companyName?: string;
  avatarUrl?: string | null;
  departmentName?: string | null;
  designation?: string | null;
}
