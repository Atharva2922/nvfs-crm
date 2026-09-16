export interface ModuleManifest {
  name: string;
  code: string;
  block: number;
  description: string;
  status: "FOUNDATION" | "READY_TO_BUILD" | "PLANNED";
}

export const MODULE_REGISTRY: Record<string, ModuleManifest> = {
  auth: {
    name: "Authentication & Identity",
    code: "auth",
    block: 0,
    description: "Session management, credentials, and user state",
    status: "FOUNDATION",
  },
  organization: {
    name: "Organization & Departments",
    code: "organization",
    block: 0,
    description: "Multi-department structure, governance, and business units",
    status: "FOUNDATION",
  },
  employees: {
    name: "Employees Master",
    code: "employees",
    block: 2,
    description: "Single source of truth for company personnel and reporting lines",
    status: "READY_TO_BUILD",
  },
  hr: {
    name: "HR, Leaves & Attendance",
    code: "hr",
    block: 2,
    description: "Attendance records, leave approvals, and work days",
    status: "READY_TO_BUILD",
  },
  crm: {
    name: "CRM & Sales Pipeline",
    code: "crm",
    block: 3,
    description: "Clients, contacts, leads, and deal opportunities",
    status: "PLANNED",
  },
  operations: {
    name: "Operations & Projects",
    code: "operations",
    block: 4,
    description: "Tasks, delivery milestones, and cross-border missions",
    status: "PLANNED",
  },
  finance: {
    name: "Finance, Billing & Payroll",
    code: "finance",
    block: 5,
    description: "Invoicing, purchase orders, payments, and payroll",
    status: "PLANNED",
  },
  inventory: {
    name: "Products & Inventory",
    code: "inventory",
    block: 6,
    description: "Stock management, SKUs, and vendor procurement",
    status: "PLANNED",
  },
  legal: {
    name: "Legal & Policies",
    code: "legal",
    block: 7,
    description: "Contracts, NDAs, statutory compliance, and sign-offs",
    status: "PLANNED",
  },
  reports: {
    name: "Executive Cockpit & Analytics",
    code: "reports",
    block: 8,
    description: "Cross-functional reporting for C-Suite",
    status: "PLANNED",
  },
  notifications: {
    name: "Notification Dispatch",
    code: "notifications",
    block: 1,
    description: "In-app alerts, approval requests, and events",
    status: "PLANNED",
  },
  audit: {
    name: "Audit & Compliance Logging",
    code: "audit",
    block: 0,
    description: "Immutable mutation trails and security logging",
    status: "FOUNDATION",
  },
};
