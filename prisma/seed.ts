import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CRM + NFVS Block 2 (HR Core, Work Days, Holidays, Leaves, Attendance, Policies & Compliance)...");

  // 1. Clear database cleanly
  await prisma.inventoryAdjustmentItem.deleteMany();
  await prisma.inventoryAdjustment.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.service.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.crmActivity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.client.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.payrollEntry.deleteMany();
  await prisma.payrollPeriod.deleteMany();
  await prisma.employeeSalaryStructure.deleteMany();
  await prisma.salaryStructureItem.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.salaryComponent.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leavePolicy.deleteMany();
  await prisma.complianceRecord.deleteMany();
  await prisma.hrPolicy.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.workDayConfig.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 2. Organization Boundary
  const org = await prisma.organization.create({
    data: {
      name: "CRM + NFVS Enterprise Group",
      code: "NFVS-CORP",
      legalName: "NFVS Global Technologies Inc.",
      currency: "USD",
      timezone: "America/New_York",
    },
  });
  console.log(`Created Organization: ${org.name} (${org.code})`);

  // 3. System Settings
  await prisma.systemSetting.createMany({
    data: [
      {
        key: "PLATFORM_NAME",
        value: "CRM + NFVS Enterprise",
        category: "BRANDING",
        description: "Official name of the unified business management system",
      },
      {
        key: "DEFAULT_CURRENCY",
        value: "USD",
        category: "GENERAL",
        description: "System base currency for finance and payroll calculations",
      },
      {
        key: "AUDIT_LOG_RETENTION_DAYS",
        value: "365",
        category: "SECURITY",
        description: "Mandatory compliance retention duration for security audit trails",
      },
      {
        key: "DEFAULT_WORK_START_TIME",
        value: "09:00",
        category: "HR",
        description: "Standard morning work start time for attendance",
      },
      {
        key: "DEFAULT_WORK_END_TIME",
        value: "18:00",
        category: "HR",
        description: "Standard evening work end time for attendance",
      },
    ],
  });

  // 4. Work Days Configuration (Mon-Fri Working, Sat-Sun Weekends)
  const daysOfWeek = [
    { dayOfWeek: 0, dayName: "Sunday", isWorkingDay: false, expectedHours: 0 },
    { dayOfWeek: 1, dayName: "Monday", isWorkingDay: true, expectedHours: 8 },
    { dayOfWeek: 2, dayName: "Tuesday", isWorkingDay: true, expectedHours: 8 },
    { dayOfWeek: 3, dayName: "Wednesday", isWorkingDay: true, expectedHours: 8 },
    { dayOfWeek: 4, dayName: "Thursday", isWorkingDay: true, expectedHours: 8 },
    { dayOfWeek: 5, dayName: "Friday", isWorkingDay: true, expectedHours: 8 },
    { dayOfWeek: 6, dayName: "Saturday", isWorkingDay: false, expectedHours: 0 },
  ];

  for (const day of daysOfWeek) {
    await prisma.workDayConfig.create({
      data: {
        organizationId: org.id,
        dayOfWeek: day.dayOfWeek,
        dayName: day.dayName,
        isWorkingDay: day.isWorkingDay,
        workStartTime: "09:00",
        workEndTime: "18:00",
        expectedHours: day.expectedHours,
      },
    });
  }
  console.log("Configured company Work Days (Mon-Fri active).");

  // 5. 2026 Company Holidays
  const holidaysData = [
    { name: "New Year's Day", date: new Date("2026-01-01T00:00:00Z"), description: "Federal New Year Celebration", isRecurring: true },
    { name: "Memorial Day", date: new Date("2026-05-25T00:00:00Z"), description: "National Memorial Observance", isRecurring: true },
    { name: "Independence Day", date: new Date("2026-07-03T00:00:00Z"), description: "US Independence Holiday Observance", isRecurring: true },
    { name: "Labor Day", date: new Date("2026-09-07T00:00:00Z"), description: "National Labor Observance", isRecurring: true },
    { name: "Thanksgiving Day", date: new Date("2026-11-26T00:00:00Z"), description: "Thanksgiving National Holiday", isRecurring: true },
    { name: "Christmas Day", date: new Date("2026-12-25T00:00:00Z"), description: "Christmas Holiday Observance", isRecurring: true },
  ];

  for (const h of holidaysData) {
    await prisma.holiday.create({
      data: {
        organizationId: org.id,
        name: h.name,
        date: h.date,
        description: h.description,
        isRecurring: h.isRecurring,
        year: 2026,
      },
    });
  }
  console.log(`Created ${holidaysData.length} company holidays.`);

  // 6. Distinct Roles
  const rolesData = [
    { code: "SUPER_ADMIN", name: "Super Admin", level: 100, description: "Full unrestricted administrative access" },
    { code: "CHAIRPERSON", name: "Chairperson of the Board", level: 95, description: "Strategic governance and executive board audit oversight" },
    { code: "CEO", name: "Chief Executive Officer", level: 90, description: "Executive leadership across all enterprise departments" },
    { code: "CTO", name: "Chief Technology Officer", level: 85, description: "Technology operations, engineering architecture, and IT assets" },
    { code: "CFO", name: "Chief Financial Officer", level: 85, description: "Financial management, invoices, treasury, and payroll" },
    { code: "CMO", name: "Chief Marketing Officer", level: 85, description: "Customer relationships, enterprise pipeline, and market growth" },
    { code: "ADMIN", name: "Platform Administrator", level: 80, description: "Operational user and department management" },
    { code: "DEPARTMENT_HEAD", name: "Department Head", level: 50, description: "Departmental operations, employee leaves, and team management" },
    { code: "MANAGER", name: "Line Manager", level: 30, description: "Team task delegation and performance management" },
    { code: "EMPLOYEE", name: "Staff Employee", level: 10, description: "Individual contributor self-service" },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of rolesData) {
    const created = await prisma.role.create({ data: r });
    roleMap[r.code] = created.id;
  }

  // 7. Granular Permissions (module.resource.action)
  const permissionsData = [
    { code: "employees.employee.read", module: "employees", resource: "employee", action: "read", description: "View employee profiles" },
    { code: "employees.employee.create", module: "employees", resource: "employee", action: "create", description: "Onboard new employees" },
    { code: "employees.employee.update", module: "employees", resource: "employee", action: "update", description: "Update employee profiles" },
    { code: "employees.employee.delete", module: "employees", resource: "employee", action: "delete", description: "Terminate employee records" },
    { code: "organization.department.read", module: "organization", resource: "department", action: "read", description: "View departments" },
    { code: "organization.department.manage", module: "organization", resource: "department", action: "manage", description: "Create and edit departments" },

    // HR Core
    { code: "hr.leave.read", module: "hr", resource: "leave", action: "read", description: "View leave requests and balances" },
    { code: "hr.leave.create", module: "hr", resource: "leave", action: "create", description: "Submit leave requests" },
    { code: "hr.leave.approve", module: "hr", resource: "leave", action: "approve", description: "Approve or reject leaves" },
    { code: "hr.attendance.read", module: "hr", resource: "attendance", action: "read", description: "View attendance records" },
    { code: "hr.attendance.record", module: "hr", resource: "attendance", action: "record", description: "Record daily check-in/out" },
    { code: "hr.workdays.manage", module: "hr", resource: "workdays", action: "manage", description: "Configure work days and holidays" },
    { code: "hr.policies.read", module: "hr", resource: "policies", action: "read", description: "View company HR policies" },
    { code: "hr.policies.manage", module: "hr", resource: "policies", action: "manage", description: "Publish and update HR policies" },
    { code: "hr.compliance.read", module: "hr", resource: "compliance", action: "read", description: "View compliance records" },
    { code: "hr.compliance.manage", module: "hr", resource: "compliance", action: "manage", description: "Manage compliance filings" },

    // Audits & Settings
    { code: "audit.log.read", module: "audit", resource: "log", action: "read", description: "Inspect system audit trails" },
    { code: "settings.roles.manage", module: "settings", resource: "roles", action: "manage", description: "Manage roles & permissions" },
    { code: "settings.general.manage", module: "settings", resource: "general", action: "manage", description: "Update system settings" },

    // Payroll Permissions
    { code: "payroll.structure.read", module: "payroll", resource: "structure", action: "read", description: "View salary structures and components" },
    { code: "payroll.structure.manage", module: "payroll", resource: "structure", action: "manage", description: "Configure salary structures and formulas" },
    { code: "payroll.salary.read", module: "payroll", resource: "salary", action: "read", description: "View all employee salary allocations" },
    { code: "payroll.salary.manage", module: "payroll", resource: "salary", action: "manage", description: "Assign and modify employee salary packages" },
    { code: "payroll.period.manage", module: "payroll", resource: "period", action: "manage", description: "Execute, review, approve and process payroll runs" },
    { code: "payroll.payslip.read_own", module: "payroll", resource: "payslip", action: "read_own", description: "View personal issued payslips" },

    // Finance Permissions
    { code: "finance.read", module: "finance", resource: "overview", action: "read", description: "View financial dashboard, KPIs, and reports" },
    { code: "finance.manage", module: "finance", resource: "overview", action: "manage", description: "Manage financial settings and chart of accounts" },
    { code: "invoice.read", module: "finance", resource: "invoice", action: "read", description: "View customer invoices and receivables" },
    { code: "invoice.create", module: "finance", resource: "invoice", action: "create", description: "Create draft invoices" },
    { code: "invoice.update", module: "finance", resource: "invoice", action: "update", description: "Update draft invoices" },
    { code: "invoice.approve", module: "finance", resource: "invoice", action: "approve", description: "Approve or reject customer invoices" },
    { code: "invoice.cancel", module: "finance", resource: "invoice", action: "cancel", description: "Cancel customer invoices" },
    { code: "payment.read", module: "finance", resource: "payment", action: "read", description: "View payment records" },
    { code: "payment.create", module: "finance", resource: "payment", action: "create", description: "Record incoming client payments" },
    { code: "payment.reverse", module: "finance", resource: "payment", action: "reverse", description: "Reverse payment transactions" },
    { code: "expense.read", module: "finance", resource: "expense", action: "read", description: "View corporate expenses" },
    { code: "expense.create", module: "finance", resource: "expense", action: "create", description: "Submit expense reimbursement claims" },
    { code: "expense.approve", module: "finance", resource: "expense", action: "approve", description: "Review and approve expense claims" },
    { code: "expense.reject", module: "finance", resource: "expense", action: "reject", description: "Reject expense claims" },
    { code: "payroll.post", module: "finance", resource: "payroll", action: "post", description: "Post finalized payroll runs to financial ledger" },

    // Products, Services & Inventory Permissions (Block 7)
    { code: "products.read", module: "inventory", resource: "product", action: "read", description: "View products master" },
    { code: "products.create", module: "inventory", resource: "product", action: "create", description: "Create product records" },
    { code: "products.update", module: "inventory", resource: "product", action: "update", description: "Update product records" },
    { code: "products.delete", module: "inventory", resource: "product", action: "delete", description: "Archive or delete products" },
    { code: "products.cost.read", module: "inventory", resource: "product", action: "read_cost", description: "View sensitive product cost price and valuations" },

    { code: "services.read", module: "inventory", resource: "service", action: "read", description: "View services catalog" },
    { code: "services.create", module: "inventory", resource: "service", action: "create", description: "Create billable service offerings" },
    { code: "services.update", module: "inventory", resource: "service", action: "update", description: "Update service offerings" },
    { code: "services.delete", module: "inventory", resource: "service", action: "delete", description: "Archive service offerings" },

    { code: "inventory.read", module: "inventory", resource: "stock", action: "read", description: "View location stock balances and movements" },
    { code: "inventory.adjust", module: "inventory", resource: "stock", action: "adjust", description: "Submit stock count adjustments" },
    { code: "inventory.transfer", module: "inventory", resource: "stock", action: "transfer", description: "Transfer stock between warehouses" },
    { code: "inventory.adjust.approve", module: "inventory", resource: "stock", action: "approve_adjustment", description: "Authorize and execute inventory adjustments" },

    { code: "warehouses.read", module: "inventory", resource: "warehouse", action: "read", description: "View warehouse locations" },
    { code: "warehouses.create", module: "inventory", resource: "warehouse", action: "create", description: "Create warehouse locations" },
    { code: "warehouses.update", module: "inventory", resource: "warehouse", action: "update", description: "Manage warehouse locations" },
  ];

  const permMap: Record<string, string> = {};
  for (const p of permissionsData) {
    const created = await prisma.permission.create({ data: p });
    permMap[p.code] = created.id;
  }

  // Map all permissions to Super Admin & Chairperson
  for (const pCode of Object.keys(permMap)) {
    await prisma.rolePermission.create({
      data: { roleId: roleMap["SUPER_ADMIN"], permissionId: permMap[pCode] },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleMap["CHAIRPERSON"], permissionId: permMap[pCode] },
    });
  }

  // CEO gets all HR, Payroll, and high-level Finance & Inventory permissions
  const ceoPerms = [
    "employees.employee.read", "employees.employee.create", "employees.employee.update",
    "organization.department.read", "hr.leave.read", "hr.leave.approve",
    "hr.attendance.read", "hr.workdays.manage", "hr.policies.read", "hr.policies.manage",
    "hr.compliance.read", "hr.compliance.manage", "audit.log.read",
    "payroll.structure.read", "payroll.structure.manage", "payroll.salary.read",
    "payroll.salary.manage", "payroll.period.manage", "payroll.payslip.read_own",
    "finance.read", "invoice.read", "invoice.approve", "payment.read", "expense.read", "expense.approve", "payroll.post",
    "products.read", "products.create", "products.update", "products.cost.read",
    "services.read", "services.create", "services.update",
    "inventory.read", "inventory.adjust.approve", "warehouses.read"
  ];
  for (const p of ceoPerms) {
    if (permMap[p]) await prisma.rolePermission.create({ data: { roleId: roleMap["CEO"], permissionId: permMap[p] } });
  }

  // CFO gets full Finance, Payroll, Inventory Valuation, and HR read permissions
  const cfoPerms = [
    "employees.employee.read", "organization.department.read", "hr.leave.read",
    "hr.attendance.read", "hr.policies.read", "audit.log.read",
    "payroll.structure.read", "payroll.structure.manage", "payroll.salary.read",
    "payroll.salary.manage", "payroll.period.manage", "payroll.payslip.read_own",
    "finance.read", "finance.manage", "invoice.read", "invoice.create", "invoice.update",
    "invoice.approve", "invoice.cancel", "payment.read", "payment.create", "payment.reverse",
    "expense.read", "expense.create", "expense.approve", "expense.reject", "payroll.post",
    "products.read", "products.cost.read", "services.read", "inventory.read", "warehouses.read"
  ];
  for (const p of cfoPerms) {
    if (permMap[p]) await prisma.rolePermission.create({ data: { roleId: roleMap["CFO"], permissionId: permMap[p] } });
  }

  // Department Head & Manager HR permissions, Expense review & Inventory operations
  const deptHeadPerms = [
    "employees.employee.read", "organization.department.read",
    "hr.leave.read", "hr.leave.approve", "hr.attendance.read", "hr.policies.read",
    "payroll.payslip.read_own", "expense.read", "expense.create", "expense.approve",
    "products.read", "products.create", "products.update", "services.read",
    "inventory.read", "inventory.adjust", "inventory.transfer", "inventory.adjust.approve",
    "warehouses.read", "warehouses.create", "warehouses.update"
  ];
  for (const p of deptHeadPerms) {
    if (permMap[p]) await prisma.rolePermission.create({ data: { roleId: roleMap["DEPARTMENT_HEAD"], permissionId: permMap[p] } });
    if (permMap[p]) await prisma.rolePermission.create({ data: { roleId: roleMap["MANAGER"], permissionId: permMap[p] } });
  }

  // Employee standard permissions (Own payslips, submit expenses, product & warehouse read)
  const employeePerms = [
    "hr.leave.read", "hr.leave.create", "hr.attendance.read", "hr.attendance.record", "hr.policies.read",
    "payroll.payslip.read_own", "expense.read", "expense.create",
    "products.read", "services.read", "inventory.read", "warehouses.read"
  ];
  for (const p of employeePerms) {
    if (permMap[p]) await prisma.rolePermission.create({ data: { roleId: roleMap["EMPLOYEE"], permissionId: permMap[p] } });
  }

  // 8. Configurable Leave Policies (Company Specification)
  // CL: 12 annual, Max 2 per month
  // EL: 3 annual
  // ML: 3 annual
  // LWP: 0 annual (unpaid)
  // C-Off: 0 base (accrued)
  // HDW: Holiday Working
  const leavePoliciesData = [
    {
      code: "CL",
      name: "Casual Leave",
      annualAllowance: 12,
      monthlyLimit: 2, // Maximum 2 CL per month policy
      carryForward: false,
      requiresApproval: true,
      requiresDocumentation: false,
      description: "Planned personal casual leave. Maximum of 2 days allowed per calendar month.",
    },
    {
      code: "EL",
      name: "Emergency Leave",
      annualAllowance: 3,
      monthlyLimit: null,
      carryForward: false,
      requiresApproval: true,
      requiresDocumentation: false,
      description: "Unplanned emergency leave for personal exigencies.",
    },
    {
      code: "ML",
      name: "Medical Leave",
      annualAllowance: 3,
      monthlyLimit: null,
      carryForward: false,
      requiresApproval: true,
      requiresDocumentation: true,
      description: "Medical or sick leave. Medical documentation required if exceeding 2 consecutive days.",
    },
    {
      code: "LWP",
      name: "Leave Without Pay",
      annualAllowance: 0,
      monthlyLimit: null,
      carryForward: false,
      requiresApproval: true,
      requiresDocumentation: false,
      description: "Unpaid leave granted under special approval after exhausting paid balances.",
    },
    {
      code: "C_OFF",
      name: "Compensatory Off",
      annualAllowance: 0,
      monthlyLimit: null,
      carryForward: false,
      requiresApproval: true,
      requiresDocumentation: false,
      description: "Compensatory time off earned by working on designated weekends or company holidays.",
    },
    {
      code: "HDW",
      name: "Holiday Working",
      annualAllowance: 0,
      monthlyLimit: null,
      carryForward: false,
      requiresApproval: true,
      requiresDocumentation: false,
      description: "Recorded work performed on public holidays, accruing compensatory off.",
    },
  ];

  const leavePolicyMap: Record<string, string> = {};
  for (const lp of leavePoliciesData) {
    const created = await prisma.leavePolicy.create({
      data: {
        organizationId: org.id,
        code: lp.code,
        name: lp.name,
        annualAllowance: lp.annualAllowance,
        monthlyLimit: lp.monthlyLimit,
        carryForward: lp.carryForward,
        requiresApproval: lp.requiresApproval,
        requiresDocumentation: lp.requiresDocumentation,
        description: lp.description,
      },
    });
    leavePolicyMap[lp.code] = created.id;
  }
  console.log(`Created ${leavePoliciesData.length} configurable Leave Policies (including 12 CL, 3 EL, 3 ML, 2 CL/mo limit).`);

  // 9. Departments
  const departmentsData = [
    { name: "Executive Leadership", code: "EXEC", description: "Governance, executive strategy, and corporate vision" },
    { name: "Software Department & IT", code: "SW", description: "Software development, web applications, and IT systems" },
    { name: "Technology & Engineering", code: "ENG", description: "Cloud infrastructure, systems architecture, and cybersecurity" },
    { name: "Product & UX Design", code: "PROD", description: "Product roadmap, user experience, and feature design" },
    { name: "Human Resources", code: "HR", description: "People operations, talent acquisition, leaves, and workplace culture" },
    { name: "Finance & Treasury", code: "FIN", description: "Financial reporting, treasury, tax compliance, and payroll" },
    { name: "Commercial & Sales", code: "CRM", description: "Enterprise client relations, deals, and market growth" },
    { name: "Operations & Logistics", code: "OPS", description: "Execution delivery, missions, and international relations" },
    { name: "Legal & Compliance", code: "LEG", description: "Corporate contracts, statutory governance, and regulatory filings" },
    { name: "Quality Assurance & Testing", code: "QA", description: "Software QA, automated testing, and release validation" },
    { name: "Customer Support & Success", code: "CS", description: "Client onboarding, technical support, and account management" },
    { name: "Marketing & Growth", code: "MKT", description: "Brand marketing, lead generation, and public relations" },
    { name: "Research & Development", code: "RND", description: "Innovation research, AI models, and technology prototypes" },
  ];

  const deptMap: Record<string, string> = {};
  for (const d of departmentsData) {
    const created = await prisma.department.create({
      data: {
        organizationId: org.id,
        name: d.name,
        code: d.code,
        description: d.description,
      },
    });
    deptMap[d.code] = created.id;
  }

  // 10. Users & Hierarchical Employees
  const passwordHash = await bcrypt.hash("Enterprise@2026", 10);

  // A. Super Admin (Marcus Vance)
  const superAdminUser = await prisma.user.create({
    data: { email: "superadmin@nfvs.internal", passwordHash, roleId: roleMap["SUPER_ADMIN"], isActive: true },
  });
  const superAdminEmp = await prisma.employee.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["EXEC"],
      userId: superAdminUser.id,
      employeeNumber: "NFVS-0001",
      firstName: "Marcus",
      lastName: "Vance",
      email: "superadmin@nfvs.internal",
      phone: "+1-555-0101",
      designation: "Principal Enterprise Architect & Super Admin",
      employmentType: "FULL_TIME",
      employmentStatus: "ACTIVE",
      workMode: "HYBRID",
      location: "Headquarters (New York)",
      emergencyContact: "Eleanor Vance (+1-555-9101)",
      hireDate: new Date("2024-01-01"),
      baseSalary: 220000,
    },
  });

  // B. Chairperson (Arthur Pendelton)
  const chairUser = await prisma.user.create({
    data: { email: "chairperson@nfvs.internal", passwordHash, roleId: roleMap["CHAIRPERSON"], isActive: true },
  });
  const chairEmp = await prisma.employee.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["EXEC"],
      userId: chairUser.id,
      managerId: null,
      employeeNumber: "NFVS-0002",
      firstName: "Arthur",
      lastName: "Pendelton",
      email: "chairperson@nfvs.internal",
      phone: "+1-555-0102",
      designation: "Chairperson of the Board",
      employmentType: "FULL_TIME",
      employmentStatus: "ACTIVE",
      workMode: "HYBRID",
      location: "Headquarters (New York)",
      emergencyContact: "Margaret Pendelton (+1-555-9102)",
      hireDate: new Date("2024-01-01"),
      baseSalary: 350000,
    },
  });

  // C. CEO (Elena Rostova) - Reports to Chairperson
  const ceoUser = await prisma.user.create({
    data: { email: "ceo@nfvs.internal", passwordHash, roleId: roleMap["CEO"], isActive: true },
  });
  const ceoEmp = await prisma.employee.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["EXEC"],
      userId: ceoUser.id,
      managerId: chairEmp.id,
      employeeNumber: "NFVS-0003",
      firstName: "Elena",
      lastName: "Rostova",
      email: "ceo@nfvs.internal",
      phone: "+1-555-0103",
      designation: "Chief Executive Officer",
      employmentType: "FULL_TIME",
      employmentStatus: "ACTIVE",
      workMode: "ON_SITE",
      location: "Headquarters (New York)",
      emergencyContact: "Sergei Rostov (+1-555-9103)",
      hireDate: new Date("2024-01-01"),
      baseSalary: 320000,
    },
  });

  // D. CTO (David Chen) - Reports to CEO
  const ctoUser = await prisma.user.create({
    data: { email: "cto@nfvs.internal", passwordHash, roleId: roleMap["CTO"], isActive: true },
  });
  const ctoEmp = await prisma.employee.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["ENG"],
      userId: ctoUser.id,
      managerId: ceoEmp.id,
      employeeNumber: "NFVS-0004",
      firstName: "David",
      lastName: "Chen",
      email: "cto@nfvs.internal",
      phone: "+1-555-0104",
      designation: "Chief Technology Officer",
      employmentType: "FULL_TIME",
      employmentStatus: "ACTIVE",
      workMode: "HYBRID",
      location: "San Francisco Engineering Hub",
      emergencyContact: "Lily Chen (+1-555-9104)",
      hireDate: new Date("2024-01-10"),
      baseSalary: 260000,
    },
  });

  // E. CFO (Sophia Sterling) - Reports to CEO
  const cfoUser = await prisma.user.create({
    data: { email: "cfo@nfvs.internal", passwordHash, roleId: roleMap["CFO"], isActive: true },
  });
  const cfoEmp = await prisma.employee.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["FIN"],
      userId: cfoUser.id,
      managerId: ceoEmp.id,
      employeeNumber: "NFVS-0005",
      firstName: "Sophia",
      lastName: "Sterling",
      email: "cfo@nfvs.internal",
      phone: "+1-555-0105",
      designation: "Chief Financial Officer",
      employmentType: "FULL_TIME",
      employmentStatus: "ACTIVE",
      workMode: "ON_SITE",
      location: "Headquarters (New York)",
      emergencyContact: "William Sterling (+1-555-9105)",
      hireDate: new Date("2024-01-10"),
      baseSalary: 260000,
    },
  });

  // F. CMO (Julian Rivera) - Reports to CEO
  const cmoUser = await prisma.user.create({
    data: { email: "cmo@nfvs.internal", passwordHash, roleId: roleMap["CMO"], isActive: true },
  });
  const cmoEmp = await prisma.employee.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["CRM"],
      userId: cmoUser.id,
      managerId: ceoEmp.id,
      employeeNumber: "NFVS-0006",
      firstName: "Julian",
      lastName: "Rivera",
      email: "cmo@nfvs.internal",
      phone: "+1-555-0106",
      designation: "Chief Marketing Officer",
      employmentType: "FULL_TIME",
      employmentStatus: "ACTIVE",
      workMode: "HYBRID",
      location: "Chicago Office",
      emergencyContact: "Isabella Rivera (+1-555-9106)",
      hireDate: new Date("2024-01-15"),
      baseSalary: 240000,
    },
  });

  // G. HR Head (Beatrice Dubois) - Reports to CEO
  const hrHeadUser = await prisma.user.create({
    data: { email: "hr.head@nfvs.internal", passwordHash, roleId: roleMap["DEPARTMENT_HEAD"], isActive: true },
  });
  const hrHeadEmp = await prisma.employee.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["HR"],
      userId: hrHeadUser.id,
      managerId: ceoEmp.id,
      employeeNumber: "NFVS-0007",
      firstName: "Beatrice",
      lastName: "Dubois",
      email: "hr.head@nfvs.internal",
      phone: "+1-555-0107",
      designation: "Head of People & Human Resources",
      employmentType: "FULL_TIME",
      employmentStatus: "ACTIVE",
      workMode: "ON_SITE",
      location: "Headquarters (New York)",
      emergencyContact: "Antoine Dubois (+1-555-9107)",
      hireDate: new Date("2024-01-15"),
      baseSalary: 175000,
    },
  });

  // H. Staff Engineer (Alex Mercer) - Reports to CTO David Chen
  const engUser = await prisma.user.create({
    data: { email: "alex.mercer@nfvs.internal", passwordHash, roleId: roleMap["EMPLOYEE"], isActive: true },
  });
  const engEmp = await prisma.employee.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["ENG"],
      userId: engUser.id,
      managerId: ctoEmp.id,
      employeeNumber: "NFVS-0008",
      firstName: "Alex",
      lastName: "Mercer",
      email: "alex.mercer@nfvs.internal",
      phone: "+1-555-0108",
      designation: "Senior Staff Systems Engineer",
      employmentType: "FULL_TIME",
      employmentStatus: "ACTIVE",
      workMode: "REMOTE",
      location: "Austin Engineering Hub",
      emergencyContact: "Clara Mercer (+1-555-9108)",
      hireDate: new Date("2024-02-01"),
      baseSalary: 160000,
    },
  });

  // I. Contractor (James Morrison) - No portal login user
  const contractorEmp = await prisma.employee.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["OPS"],
      userId: null,
      managerId: ceoEmp.id,
      employeeNumber: "NFVS-0009",
      firstName: "James",
      lastName: "Morrison",
      email: "james.morrison.contractor@nfvs.external",
      phone: "+1-555-0109",
      designation: "Field Logistics Operations Specialist",
      employmentType: "CONTRACT",
      employmentStatus: "ACTIVE",
      workMode: "ON_SITE",
      location: "Frankfurt Operations Center",
      emergencyContact: "Rachel Morrison (+49-555-9109)",
      hireDate: new Date("2024-03-01"),
      baseSalary: 95000,
    },
  });

  const allEmployees = [
    superAdminEmp, chairEmp, ceoEmp, ctoEmp, cfoEmp, cmoEmp, hrHeadEmp, engEmp, contractorEmp
  ];

  // 11. Allocate Leave Balances for 2026
  // Allocates 12 CL, 3 EL, 3 ML for full-time employees
  for (const emp of allEmployees) {
    // CL
    await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        leavePolicyId: leavePolicyMap["CL"],
        year: 2026,
        allocated: 12,
        used: 0,
        pending: 0,
        remaining: 12,
      },
    });

    // EL
    await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        leavePolicyId: leavePolicyMap["EL"],
        year: 2026,
        allocated: 3,
        used: 0,
        pending: 0,
        remaining: 3,
      },
    });

    // ML
    await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        leavePolicyId: leavePolicyMap["ML"],
        year: 2026,
        allocated: 3,
        used: 0,
        pending: 0,
        remaining: 3,
      },
    });
  }
  console.log(`Allocated 2026 Leave Balances (12 CL, 3 EL, 3 ML) for all ${allEmployees.length} employees.`);

  // 12. Seed Sample Attendance Records for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < allEmployees.length; i++) {
    const emp = allEmployees[i];
    // Check-in timestamp at 08:55 AM
    const checkIn = new Date(today);
    checkIn.setHours(8, 55 + (i % 5), 0, 0);

    await prisma.attendanceRecord.create({
      data: {
        employeeId: emp.id,
        date: today,
        status: i === 7 ? "PRESENT" : "PRESENT",
        checkInTime: checkIn,
        workMode: emp.workMode,
        remarks: "Automated morning badge entry",
      },
    });
  }
  console.log(`Seeded today's attendance logs for all employees.`);

  // 13. HR Policies Repository
  const hrPoliciesData = [
    {
      title: "Workplace Hours, Attendance & Remote Flexibility Policy",
      category: "LEAVE_ATTENDANCE",
      version: "2.1",
      effectiveDate: new Date("2026-01-01"),
      isMandatory: true,
      content:
        "Standard core working hours are 09:00 to 18:00 Monday through Friday. Employees with approved Hybrid or Remote status must check in via the CRM + NFVS portal by 09:15 AM local time. Missing consecutive check-ins without manager notification requires incident logging.",
    },
    {
      title: "Annual Leave & Casual Leave (CL) Regulations",
      category: "LEAVE_ATTENDANCE",
      version: "3.0",
      effectiveDate: new Date("2026-01-01"),
      isMandatory: true,
      content:
        "Full-time employees receive 18 total paid annual leaves: 12 Casual Leaves (CL), 3 Emergency Leaves (EL), and 3 Medical Leaves (ML). In accordance with corporate operational standards, a strict maximum of 2 Casual Leaves (CL) may be taken in any single calendar month.",
    },
    {
      title: "Equal Opportunity, Workplace Ethics & Anti-Harassment",
      category: "CONDUCT",
      version: "1.5",
      effectiveDate: new Date("2025-06-01"),
      isMandatory: true,
      content:
        "NFVS Global maintains a zero-tolerance policy regarding discrimination, harassment, or retaliation of any kind. All personnel are required to complete mandatory annual training and report non-compliance.",
    },
  ];

  for (const pol of hrPoliciesData) {
    await prisma.hrPolicy.create({
      data: {
        organizationId: org.id,
        title: pol.title,
        category: pol.category,
        version: pol.version,
        effectiveDate: pol.effectiveDate,
        isMandatory: pol.isMandatory,
        content: pol.content,
      },
    });
  }
  console.log(`Seeded ${hrPoliciesData.length} corporate HR policies.`);

  // 14. Statutory Compliance Records
  const complianceData = [
    {
      item: "Annual EEO-1 Corporate Component Filing",
      responsibleDepartmentId: deptMap["HR"],
      dueDate: new Date("2026-05-31"),
      status: "PENDING",
      notes: "Mandatory statutory workforce demographic reporting to the Equal Employment Opportunity Commission.",
    },
    {
      item: "OSHA Annual Workplace Safety & Facilities Audit",
      responsibleDepartmentId: deptMap["OPS"],
      dueDate: new Date("2026-08-15"),
      status: "COMPLIANT",
      notes: "Verification of ergonomic standards, emergency exits, and medical kit inventory across all facilities.",
    },
    {
      item: "SOC 2 Type II Annual Security & Access Control Review",
      responsibleDepartmentId: deptMap["ENG"],
      dueDate: new Date("2026-10-31"),
      status: "PENDING",
      notes: "Third-party audit of RBAC authorization, password hashing, and immutable audit trails.",
    },
    {
      item: "Corporate Statutory Tax Filing & Withholding Audit",
      responsibleDepartmentId: deptMap["FIN"],
      dueDate: new Date("2026-04-15"),
      status: "COMPLIANT",
      notes: "Federal and state payroll withholding reconciliations.",
    },
  ];

  for (const comp of complianceData) {
    await prisma.complianceRecord.create({
      data: {
        organizationId: org.id,
        item: comp.item,
        responsibleDepartmentId: comp.responsibleDepartmentId,
        dueDate: comp.dueDate,
        status: comp.status,
        notes: comp.notes,
      },
    });
  }
  console.log(`Seeded ${complianceData.length} statutory compliance records.`);

  // ==========================================
  // 15. SALARY & PAYROLL FOUNDATION (BLOCK 3)
  // ==========================================

  // 15A. Salary Components
  const componentsData = [
    { code: "BASIC", name: "Basic Salary", type: "EARNING", calcType: "FIXED", defaultValue: 0, isTaxable: true, isStatutory: false, isMandatory: true, description: "Base compensation component" },
    { code: "HRA", name: "House Rent Allowance", type: "EARNING", calcType: "PERCENTAGE_OF_BASIC", defaultValue: 40, isTaxable: true, isStatutory: false, isMandatory: false, description: "Housing assistance allowance (40% of Basic)" },
    { code: "TA", name: "Transport Allowance", type: "EARNING", calcType: "FIXED", defaultValue: 500, isTaxable: true, isStatutory: false, isMandatory: false, description: "Monthly commute allowance" },
    { code: "DA", name: "Dearness Allowance", type: "EARNING", calcType: "PERCENTAGE_OF_BASIC", defaultValue: 15, isTaxable: true, isStatutory: false, isMandatory: false, description: "Cost of living adjustment (15% of Basic)" },
    { code: "SPECIAL", name: "Special Executive Allowance", type: "EARNING", calcType: "FIXED", defaultValue: 1000, isTaxable: true, isStatutory: false, isMandatory: false, description: "Role-specific special allowance" },
    { code: "BONUS", name: "Performance Incentive / Bonus", type: "EARNING", calcType: "FIXED", defaultValue: 0, isTaxable: true, isStatutory: false, isMandatory: false, description: "Discretionary performance bonuses" },
    { code: "PF", name: "Provident Fund Contribution", type: "DEDUCTION", calcType: "PERCENTAGE_OF_BASIC", defaultValue: 12, isTaxable: false, isStatutory: true, isMandatory: true, description: "Mandatory employee retirement contribution (12% of Basic)" },
    { code: "TAX", name: "Income Tax / TDS Withholding", type: "DEDUCTION", calcType: "PERCENTAGE_OF_GROSS", defaultValue: 10, isTaxable: false, isStatutory: true, isMandatory: true, description: "Statutory payroll tax withholding (10% of Gross)" },
  ];

  const compMap: Record<string, string> = {};
  for (const c of componentsData) {
    const created = await prisma.salaryComponent.create({
      data: {
        organizationId: org.id,
        code: c.code,
        name: c.name,
        type: c.type,
        calcType: c.calcType,
        defaultValue: c.defaultValue,
        isTaxable: c.isTaxable,
        isStatutory: c.isStatutory,
        isMandatory: c.isMandatory,
        description: c.description,
      },
    });
    compMap[c.code] = created.id;
  }
  console.log(`Seeded ${componentsData.length} configurable Salary Components.`);

  // 15B. Salary Structure Templates
  const execStructure = await prisma.salaryStructure.create({
    data: {
      organizationId: org.id,
      name: "Executive Leadership Compensation Structure",
      description: "Comprehensive package for C-Suite and executive officers: High HRA, Special Allowance & TA.",
      currency: "USD",
      items: {
        create: [
          { componentId: compMap["BASIC"], calcType: "FIXED", value: 0, order: 1 },
          { componentId: compMap["HRA"], calcType: "PERCENTAGE_OF_BASIC", value: 50, order: 2 },
          { componentId: compMap["DA"], calcType: "PERCENTAGE_OF_BASIC", value: 20, order: 3 },
          { componentId: compMap["SPECIAL"], calcType: "FIXED", value: 2500, order: 4 },
          { componentId: compMap["TA"], calcType: "FIXED", value: 1000, order: 5 },
          { componentId: compMap["PF"], calcType: "PERCENTAGE_OF_BASIC", value: 12, order: 6 },
          { componentId: compMap["TAX"], calcType: "PERCENTAGE_OF_GROSS", value: 15, order: 7 },
        ],
      },
    },
  });

  const engStructure = await prisma.salaryStructure.create({
    data: {
      organizationId: org.id,
      name: "Engineering & Technical Architecture Structure",
      description: "Standard technical workforce structure: Competitive HRA and Transport benefits.",
      currency: "USD",
      items: {
        create: [
          { componentId: compMap["BASIC"], calcType: "FIXED", value: 0, order: 1 },
          { componentId: compMap["HRA"], calcType: "PERCENTAGE_OF_BASIC", value: 40, order: 2 },
          { componentId: compMap["DA"], calcType: "PERCENTAGE_OF_BASIC", value: 15, order: 3 },
          { componentId: compMap["SPECIAL"], calcType: "FIXED", value: 1000, order: 4 },
          { componentId: compMap["TA"], calcType: "FIXED", value: 500, order: 5 },
          { componentId: compMap["PF"], calcType: "PERCENTAGE_OF_BASIC", value: 12, order: 6 },
          { componentId: compMap["TAX"], calcType: "PERCENTAGE_OF_GROSS", value: 10, order: 7 },
        ],
      },
    },
  });

  const corpStructure = await prisma.salaryStructure.create({
    data: {
      organizationId: org.id,
      name: "General Corporate & Support Operations Structure",
      description: "Standard operational staff structure.",
      currency: "USD",
      items: {
        create: [
          { componentId: compMap["BASIC"], calcType: "FIXED", value: 0, order: 1 },
          { componentId: compMap["HRA"], calcType: "PERCENTAGE_OF_BASIC", value: 35, order: 2 },
          { componentId: compMap["DA"], calcType: "PERCENTAGE_OF_BASIC", value: 10, order: 3 },
          { componentId: compMap["TA"], calcType: "FIXED", value: 300, order: 4 },
          { componentId: compMap["PF"], calcType: "PERCENTAGE_OF_BASIC", value: 12, order: 5 },
          { componentId: compMap["TAX"], calcType: "PERCENTAGE_OF_GROSS", value: 8, order: 6 },
        ],
      },
    },
  });
  console.log("Seeded 3 dynamic Salary Structure templates.");

  // 15C. Employee Salary Structure Assignments
  // Base monthly salary = annual / 12
  const empSalaryConfigs = [
    { emp: superAdminEmp, structure: execStructure, monthlyBase: 18333.33, bank: "Chase Commercial Bank", mask: "•••• •••• 4091", tax: "TAX-US-001" },
    { emp: chairEmp, structure: execStructure, monthlyBase: 29166.67, bank: "JPMorgan Private Bank", mask: "•••• •••• 1002", tax: "TAX-US-002" },
    { emp: ceoEmp, structure: execStructure, monthlyBase: 25000.00, bank: "Goldman Sachs Private", mask: "•••• •••• 2003", tax: "TAX-US-003" },
    { emp: ctoEmp, structure: execStructure, monthlyBase: 20000.00, bank: "Silicon Valley Bank", mask: "•••• •••• 3004", tax: "TAX-US-004" },
    { emp: cfoEmp, structure: execStructure, monthlyBase: 19166.67, bank: "Morgan Stanley Wealth", mask: "•••• •••• 4005", tax: "TAX-US-005" },
    { emp: cmoEmp, structure: corpStructure, monthlyBase: 17500.00, bank: "Bank of America", mask: "•••• •••• 5006", tax: "TAX-US-006" },
    { emp: hrHeadEmp, structure: corpStructure, monthlyBase: 14583.33, bank: "Citibank Corporate", mask: "•••• •••• 6007", tax: "TAX-US-007" },
    { emp: engEmp, structure: engStructure, monthlyBase: 13333.33, bank: "Wells Fargo Bank", mask: "•••• •••• 7008", tax: "TAX-US-008" },
    { emp: contractorEmp, structure: corpStructure, monthlyBase: 7916.67, bank: "Deutsche Bank AG", mask: "•••• •••• 8009", tax: "TAX-DE-009" },
  ];

  for (const cfg of empSalaryConfigs) {
    await prisma.employeeSalaryStructure.create({
      data: {
        employeeId: cfg.emp.id,
        salaryStructureId: cfg.structure.id,
        baseSalary: cfg.monthlyBase,
        paymentMethod: "BANK_TRANSFER",
        bankName: cfg.bank,
        bankAccountMask: cfg.mask,
        taxIdNumber: cfg.tax,
        effectiveFrom: new Date("2026-01-01"),
        isActive: true,
      },
    });
  }
  console.log(`Assigned salary structures to ${empSalaryConfigs.length} employees.`);

  // 15D. Seed Baseline Processed Payroll Period (August 2026) & Active Draft Period (September 2026)
  const augPeriod = await prisma.payrollPeriod.create({
    data: {
      organizationId: org.id,
      code: "2026-08",
      name: "August 2026 Corporate Payroll Run",
      year: 2026,
      month: 8,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-08-31"),
      paymentDate: new Date("2026-08-31"),
      status: "PROCESSED",
      employeeCount: empSalaryConfigs.length,
      approvedById: cfoEmp.id,
      processedAt: new Date("2026-08-31T17:00:00Z"),
      remarks: "August 2026 executive & staff disbursements completed via wire transfer.",
    },
  });

  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  for (const cfg of empSalaryConfigs) {
    const base = cfg.monthlyBase;
    const isExec = cfg.structure.id === execStructure.id;
    const isEng = cfg.structure.id === engStructure.id;

    const hra = isExec ? base * 0.5 : isEng ? base * 0.4 : base * 0.35;
    const da = isExec ? base * 0.2 : isEng ? base * 0.15 : base * 0.1;
    const ta = isExec ? 1000 : isEng ? 500 : 300;
    const special = isExec ? 2500 : isEng ? 1000 : 0;

    const gross = base + hra + da + ta + special;
    const pf = base * 0.12;
    const taxRate = isExec ? 0.15 : isEng ? 0.1 : 0.08;
    const tax = gross * taxRate;
    const deductions = pf + tax;
    const net = gross - deductions;

    totalGross += gross;
    totalDeductions += deductions;
    totalNet += net;

    const earningsSnapshot = [
      { code: "BASIC", name: "Basic Salary", amount: Math.round(base * 100) / 100, type: "EARNING" },
      { code: "HRA", name: "House Rent Allowance", amount: Math.round(hra * 100) / 100, type: "EARNING" },
      { code: "DA", name: "Dearness Allowance", amount: Math.round(da * 100) / 100, type: "EARNING" },
      { code: "TA", name: "Transport Allowance", amount: Math.round(ta * 100) / 100, type: "EARNING" },
      ...(special > 0 ? [{ code: "SPECIAL", name: "Special Allowance", amount: special, type: "EARNING" }] : []),
    ];

    const deductionsSnapshot = [
      { code: "PF", name: "Provident Fund (12%)", amount: Math.round(pf * 100) / 100, type: "DEDUCTION" },
      { code: "TAX", name: `Statutory Tax (${Math.round(taxRate * 100)}%)`, amount: Math.round(tax * 100) / 100, type: "DEDUCTION" },
    ];

    await prisma.payrollEntry.create({
      data: {
        payrollPeriodId: augPeriod.id,
        employeeId: cfg.emp.id,
        totalPeriodDays: 31,
        workingDays: 22,
        presentDays: 22,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        baseSalary: Math.round(base * 100) / 100,
        grossSalary: Math.round(gross * 100) / 100,
        totalDeductions: Math.round(deductions * 100) / 100,
        netSalary: Math.round(net * 100) / 100,
        earningsBreakdown: JSON.stringify(earningsSnapshot),
        deductionsBreakdown: JSON.stringify(deductionsSnapshot),
        status: "PAID",
        paymentMethod: "BANK_TRANSFER",
        paymentReference: `ACH-202608-${cfg.emp.employeeNumber}`,
        paymentDate: new Date("2026-08-31"),
      },
    });
  }

  await prisma.payrollPeriod.update({
    where: { id: augPeriod.id },
    data: {
      totalGross: Math.round(totalGross * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
    },
  });
  console.log(`Generated August 2026 Processed Payroll with ${empSalaryConfigs.length} payslips ($${Math.round(totalNet).toLocaleString()} net disbursed).`);

  // Active Draft Period for Current Month (September 2026)
  await prisma.payrollPeriod.create({
    data: {
      organizationId: org.id,
      code: "2026-09",
      name: "September 2026 Corporate Payroll Run",
      year: 2026,
      month: 9,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-09-30"),
      status: "DRAFT",
      employeeCount: empSalaryConfigs.length,
      remarks: "Current cycle. Ready for automated calculation.",
    },
  });
  console.log("Seeded September 2026 Active Draft Payroll Run.");

  // 15. Block 4 Activity: Seed Corporate Tasks
  const task1 = await prisma.task.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["ENG"],
      title: "Q4 Corporate Cyber-Security Penetration Test",
      description: "Perform automated vulnerability scanning, OAuth2 audit, and report mitigation findings.",
      priority: "URGENT",
      status: "IN_PROGRESS",
      creatorId: ctoEmp.id,
      assigneeId: engEmp.id,
      dueDate: new Date("2026-09-25"),
      relatedEmployeeId: engEmp.id,
      relatedProjectId: "PRJ-SEC-2026",
    },
  });

  const task2 = await prisma.task.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["HR"],
      title: "2027 Compensation Structure & Benefit Benchmarking",
      description: "Review inflation-adjusted salary grades, tech role market tiers, and update executive salary models.",
      priority: "HIGH",
      status: "TODO",
      creatorId: ceoEmp.id,
      assigneeId: hrHeadEmp.id,
      dueDate: new Date("2026-10-15"),
      relatedProjectId: "PRJ-COMP-2027",
    },
  });

  const task3 = await prisma.task.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["FIN"],
      title: "Annual Statutory Tax Withholding Reconciliation",
      description: "Verify state and federal W-2 withholding statements against General Ledger entries.",
      priority: "HIGH",
      status: "COMPLETED",
      completedAt: new Date("2026-09-08"),
      creatorId: ceoEmp.id,
      assigneeId: cfoEmp.id,
      dueDate: new Date("2026-09-08"),
      relatedProjectId: "PRJ-FIN-TAX",
    },
  });

  const task4 = await prisma.task.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["ENG"],
      title: "Staff Systems Onboarding Playbook Update",
      description: "Document local Turbopack development configurations, seed workflows, and secrets management.",
      priority: "MEDIUM",
      status: "TODO",
      creatorId: hrHeadEmp.id,
      assigneeId: engEmp.id,
      dueDate: new Date("2026-09-30"),
      relatedEmployeeId: engEmp.id,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap["CRM"],
      title: "Global Brand Repositioning & Collateral Review",
      description: "Prepare marketing decks for enterprise CRM roll-out to strategic partners.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      creatorId: chairEmp.id,
      assigneeId: cmoEmp.id,
      dueDate: new Date("2026-10-05"),
      relatedClientId: null,
    },
  });

  // Task Comments
  await prisma.taskComment.createMany({
    data: [
      {
        taskId: task1.id,
        authorId: ctoEmp.id,
        content: "Please ensure you test against the latest session authorization middleware rules.",
        createdAt: new Date("2026-09-08T10:00:00Z"),
      },
      {
        taskId: task1.id,
        authorId: engEmp.id,
        content: "Understood. Starting automated scanning on API boundary endpoints now.",
        createdAt: new Date("2026-09-08T14:30:00Z"),
      },
    ],
  });
  console.log("Seeded 5 Corporate Tasks and Discussion Comments.");

  // 16. Block 4 Activity: Seed Corporate Calendar Events
  await prisma.calendarEvent.createMany({
    data: [
      {
        organizationId: org.id,
        creatorId: ceoEmp.id,
        title: "All-Hands Quarterly Executive Review",
        description: "Company-wide roadmap presentation and Q3 performance retrospect.",
        type: "COMPANY_EVENT",
        startDate: new Date("2026-09-18T14:00:00Z"),
        endDate: new Date("2026-09-18T15:30:00Z"),
        isAllDay: false,
        location: "Main Auditorium & Global Zoom Room",
        meetUrl: "https://meet.nfvs.internal/all-hands",
        departmentId: null,
      },
      {
        organizationId: org.id,
        creatorId: ctoEmp.id,
        title: "Engineering Architecture Sync: Microservices Migration",
        description: "Review of domain boundary isolation and database concurrency limits.",
        type: "MEETING",
        startDate: new Date("2026-09-15T10:00:00Z"),
        endDate: new Date("2026-09-15T11:00:00Z"),
        isAllDay: false,
        location: "Virtual Conference Room A",
        meetUrl: "https://meet.nfvs.internal/eng-sync",
        departmentId: deptMap["ENG"],
      },
      {
        organizationId: org.id,
        creatorId: chairEmp.id,
        title: "Board of Directors Strategic Alignment Summit",
        description: "Full-day governance, financial audit review, and international expansion strategy.",
        type: "MEETING",
        startDate: new Date("2026-09-22T09:00:00Z"),
        endDate: new Date("2026-09-22T17:00:00Z"),
        isAllDay: true,
        location: "Executive Boardroom (Floor 42)",
        departmentId: deptMap["EXEC"],
      },
      {
        organizationId: org.id,
        creatorId: cmoEmp.id,
        title: "Enterprise Client Demo: Vertex Global Logistics",
        description: "Demonstration of the integrated inventory & CRM workflow for enterprise pipeline lead.",
        type: "CLIENT_MEETING",
        startDate: new Date("2026-09-16T15:00:00Z"),
        endDate: new Date("2026-09-16T16:00:00Z"),
        isAllDay: false,
        location: "Client Suite 3B",
        meetUrl: "https://meet.nfvs.internal/client-vertex",
        departmentId: deptMap["CRM"],
      },
    ],
  });
  console.log("Seeded 4 Corporate Calendar Events.");

  // 17. Block 4 Activity: Seed In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        organizationId: org.id,
        userId: engUser.id,
        type: "TASK_ASSIGNED",
        title: "New Task Assigned: Cyber-Security Penetration Test",
        message: "David Chen assigned you to perform the Q4 penetration test.",
        priority: "URGENT",
        isRead: false,
        actionUrl: "/app/tasks",
        metadata: JSON.stringify({ taskId: task1.id, assignedBy: "David Chen" }),
      },
      {
        organizationId: org.id,
        userId: engUser.id,
        type: "LEAVE_APPROVED",
        title: "Leave Request Approved",
        message: "Your Casual Leave request for Oct 9 - Oct 12 has been approved.",
        priority: "NORMAL",
        isRead: false,
        actionUrl: "/app/hr/leaves",
      },
      {
        organizationId: org.id,
        userId: hrHeadUser.id,
        type: "LEAVE_REQUEST",
        title: "Pending Leave Approval: Alex Mercer",
        message: "Alex Mercer requested 2 days of Casual Leave.",
        priority: "NORMAL",
        isRead: true,
        readAt: new Date("2026-09-08T09:00:00Z"),
        actionUrl: "/app/hr/leaves",
      },
      {
        organizationId: org.id,
        userId: cfoUser.id,
        type: "PAYROLL_PROCESSED",
        title: "August 2026 Payroll Disbursed",
        message: "August 2026 payroll run ($230,571.33 disbursed) has been finalized.",
        priority: "HIGH",
        isRead: true,
        readAt: new Date("2026-09-01T12:00:00Z"),
        actionUrl: "/app/payroll/periods",
      },
      {
        organizationId: org.id,
        userId: superAdminUser.id,
        type: "SYSTEM",
        title: "Activity Subsystem Online",
        message: "Tasks, Calendar, and Notification Event Bus operational.",
        priority: "NORMAL",
        isRead: false,
        actionUrl: "/app/tasks",
      },
    ],
  });
  console.log("Seeded In-App Notifications for testing.");

  // 18. Block 5 CRM: Seed Clients & Contacts
  const client1 = await prisma.client.create({
    data: {
      organizationId: org.id,
      code: "CLI-0001",
      name: "Vertex Global Logistics",
      industry: "Logistics & Supply Chain",
      website: "https://vertexlogistics.global",
      phone: "+1-800-555-0199",
      email: "billing@vertexlogistics.global",
      address: "1200 Harbor Boulevard, Suite 800",
      city: "Jersey City",
      state: "NJ",
      country: "United States",
      postalCode: "07310",
      taxId: "EIN-82-9918274",
      status: "ACTIVE",
      tier: "ENTERPRISE",
      ownerId: cmoEmp.id,
      annualRevenue: 45000000,
      notes: "Tier-1 multi-modal logistics client. Exploring fleet integration across 240 warehouse terminals.",
    },
  });

  const contact1 = await prisma.contact.create({
    data: {
      clientId: client1.id,
      firstName: "Marcus",
      lastName: "Sterling",
      email: "m.sterling@vertexlogistics.global",
      phone: "+1-555-0191",
      designation: "Vice President of Global Operations",
      department: "Supply Chain",
      isPrimary: true,
      notes: "Key executive decision maker for systems procurement.",
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      clientId: client1.id,
      firstName: "Elena",
      lastName: "Vance",
      email: "e.vance@vertexlogistics.global",
      phone: "+1-555-0192",
      designation: "Director of Enterprise Procurement",
      department: "Finance & Purchasing",
      isPrimary: false,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      organizationId: org.id,
      code: "CLI-0002",
      name: "Apex Cybernetics Corp",
      industry: "Technology & Autonomous Systems",
      website: "https://apexcybernetics.io",
      phone: "+1-800-555-0244",
      email: "procurement@apexcybernetics.io",
      address: "450 Technology Parkway, Suite 1200",
      city: "Cambridge",
      state: "MA",
      country: "United States",
      postalCode: "02142",
      taxId: "EIN-04-3382910",
      status: "ACTIVE",
      tier: "ENTERPRISE",
      ownerId: ctoEmp.id,
      annualRevenue: 28000000,
      notes: "Autonomous robotics manufacturer with high security compliance requirements.",
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      clientId: client2.id,
      firstName: "Dr. Evelyn",
      lastName: "Reed",
      email: "e.reed@apexcybernetics.io",
      phone: "+1-555-0241",
      designation: "Chief Information Security Officer",
      department: "Cyber Security",
      isPrimary: true,
    },
  });

  const client3 = await prisma.client.create({
    data: {
      organizationId: org.id,
      code: "CLI-0003",
      name: "OmniCare Health Systems",
      industry: "Healthcare & Diagnostics",
      website: "https://omnicarehealth.org",
      phone: "+1-800-555-0377",
      email: "partnerships@omnicarehealth.org",
      address: "700 Medical Center Drive",
      city: "Nashville",
      state: "TN",
      country: "United States",
      postalCode: "37203",
      taxId: "EIN-62-1192837",
      status: "PROSPECT",
      tier: "MID_MARKET",
      ownerId: cmoEmp.id,
      annualRevenue: 12000000,
      notes: "Regional health network upgrading clinical staff identity governance.",
    },
  });

  const contact4 = await prisma.contact.create({
    data: {
      clientId: client3.id,
      firstName: "Jonathan",
      lastName: "Hayes",
      email: "j.hayes@omnicarehealth.org",
      phone: "+1-555-0371",
      designation: "Head of Clinical Informatics",
      department: "Health Informatics",
      isPrimary: true,
    },
  });

  // Link earlier task5 to client1
  await prisma.task.update({
    where: { id: task5.id },
    data: { relatedClientId: client1.id },
  });

  // 19. Block 5 CRM: Seed Opportunities (Deal Pipeline)
  const opp1 = await prisma.opportunity.create({
    data: {
      organizationId: org.id,
      clientId: client1.id,
      contactId: contact1.id,
      ownerId: cmoEmp.id,
      name: "Global Fleet Telematics & Asset Tracking Platform",
      value: 350000,
      stage: "NEGOTIATION",
      probability: 75,
      expectedCloseDate: new Date("2026-10-31"),
      notes: "Negotiating enterprise multi-year subscription terms with VP Operations.",
    },
  });

  const opp2 = await prisma.opportunity.create({
    data: {
      organizationId: org.id,
      clientId: client2.id,
      contactId: contact3.id,
      ownerId: ctoEmp.id,
      name: "Zero-Trust Enterprise Cloud Security Migration",
      value: 280000,
      stage: "PROPOSAL",
      probability: 60,
      expectedCloseDate: new Date("2026-11-15"),
      notes: "Proposal deliverable delivered; awaiting final cybersecurity architect sign-off.",
    },
  });

  const opp3 = await prisma.opportunity.create({
    data: {
      organizationId: org.id,
      clientId: client3.id,
      contactId: contact4.id,
      ownerId: cmoEmp.id,
      name: "HIPAA-Compliant Provider Identity & Access Governance",
      value: 125000,
      stage: "DISCOVERY",
      probability: 30,
      expectedCloseDate: new Date("2026-12-15"),
      notes: "Initial requirements gathering with clinical health informatics team.",
    },
  });

  const opp4 = await prisma.opportunity.create({
    data: {
      organizationId: org.id,
      clientId: client1.id,
      contactId: contact2.id,
      ownerId: cmoEmp.id,
      name: "Warehouse Terminal Barcode Infrastructure Upgrade",
      value: 95000,
      stage: "CLOSED_WON",
      probability: 100,
      expectedCloseDate: new Date("2026-08-15"),
      actualCloseDate: new Date("2026-08-14"),
      notes: "Contract signed and delivered for Q3 implementation.",
    },
  });

  // 20. Block 5 CRM: Seed Inbound Leads
  const lead1 = await prisma.lead.create({
    data: {
      organizationId: org.id,
      firstName: "Dr. Sarah",
      lastName: "Connor",
      companyName: "Cyberdyne Systems",
      email: "sconnor@cyberdyne.corp",
      phone: "+1-555-0899",
      jobTitle: "Director of R&D",
      source: "CONFERENCE",
      status: "QUALIFIED",
      estimatedValue: 180000,
      ownerId: cmoEmp.id,
      notes: "Met at AI World Summit. Ready to evaluate unified operations software.",
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      organizationId: org.id,
      firstName: "Michael",
      lastName: "Chang",
      companyName: "Pacific Horizon Capital",
      email: "m.chang@pacifichorizon.com",
      phone: "+1-555-0842",
      jobTitle: "Managing Director",
      source: "REFERRAL",
      status: "CONTACTED",
      estimatedValue: 95000,
      ownerId: cmoEmp.id,
      notes: "Referral from Arthur Pendelton. Exploring executive reporting dashboards.",
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      organizationId: org.id,
      firstName: "Liam",
      lastName: "Henderson",
      companyName: "Nordic Logistics AS",
      email: "liam@nordiclogistics.eu",
      phone: "+47-21-55-90-00",
      jobTitle: "Chief Operating Officer",
      source: "WEBSITE",
      status: "NEW",
      estimatedValue: 210000,
      ownerId: cmoEmp.id,
      notes: "Inbound form request for cross-border freight management.",
    },
  });

  // 21. Block 5 CRM: Seed Customer 360 Activity Timeline
  await prisma.crmActivity.createMany({
    data: [
      {
        organizationId: org.id,
        clientId: client1.id,
        opportunityId: opp1.id,
        type: "MEETING",
        subject: "Executive Contract Review & SLA Negotiation",
        description: "Met with Marcus Sterling to finalize service level agreements and billing cycles.",
        performedById: cmoEmp.id,
        performedAt: new Date("2026-09-05T14:00:00Z"),
      },
      {
        organizationId: org.id,
        clientId: client1.id,
        opportunityId: opp1.id,
        type: "PROPOSAL",
        subject: "Formal Proposal Delivered: $350,000 Annual SLA",
        description: "Transmitted formal scope of work and pricing schedule for board review.",
        performedById: cmoEmp.id,
        performedAt: new Date("2026-08-28T11:00:00Z"),
      },
      {
        organizationId: org.id,
        clientId: client1.id,
        type: "CALL",
        subject: "Quarterly Operational Check-in",
        description: "Discussed terminal throughput and preliminary feedback on system stability.",
        performedById: cmoEmp.id,
        performedAt: new Date("2026-08-10T16:30:00Z"),
      },
      {
        organizationId: org.id,
        clientId: client2.id,
        opportunityId: opp2.id,
        type: "MEETING",
        subject: "Technical Architecture & Security Deep Dive",
        description: "David Chen presented zero-trust enclave architecture to Dr. Evelyn Reed.",
        performedById: ctoEmp.id,
        performedAt: new Date("2026-09-02T10:00:00Z"),
      },
      {
        organizationId: org.id,
        leadId: lead1.id,
        type: "CALL",
        subject: "Inbound Lead Qualification Call",
        description: "Confirmed budget authority, timeline (Q4), and security compliance scope.",
        performedById: cmoEmp.id,
        performedAt: new Date("2026-09-06T15:00:00Z"),
      },
    ],
  });
  console.log("Seeded CRM: 3 Corporate Clients, 4 Contacts, 4 Opportunities, 3 Leads, and 5 Activity Timeline entries.");

  // ==========================================
  // 23. SEED FINANCE (Invoices, Payments, Expenses, Transactions)
  // ==========================================
  console.log("Seeding Finance Module (Invoices, Payments, Expenses, Financial Transactions)...");

  // Invoice 1: Fully Paid Invoice ($50,000)
  const inv1 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      invoiceNumber: "INV-2026-0001",
      clientId: client1.id,
      contactId: contact1.id,
      opportunityId: opp1.id,
      invoiceDate: new Date("2026-08-01"),
      dueDate: new Date("2026-08-31"),
      currency: "USD",
      subtotal: 50000,
      taxRate: 10,
      taxAmount: 5000,
      discountRate: 0,
      discountAmount: 0,
      total: 55000,
      paidAmount: 55000,
      balance: 0,
      status: "PAID",
      notes: "Annual enterprise platform license & support bundle.",
      terms: "Net 30. All services rendered in accordance with master MSA.",
      createdById: cfoEmp.id,
      approvedById: cfoEmp.id,
      approvedAt: new Date("2026-08-02"),
      items: {
        create: [
          { description: "Enterprise Core Platform Subscription (Annual)", quantity: 1, unitPrice: 40000, amount: 40000 },
          { description: "24/7 Dedicated Platinum SLA Support Tier", quantity: 1, unitPrice: 10000, amount: 10000 },
        ],
      },
    },
  });

  // Payment 1 for Invoice 1
  const pay1 = await prisma.payment.create({
    data: {
      organizationId: org.id,
      paymentReference: "PAY-2026-0001",
      invoiceId: inv1.id,
      clientId: client1.id,
      amount: 55000,
      currency: "USD",
      paymentDate: new Date("2026-08-20"),
      paymentMethod: "WIRE",
      transactionRef: "WIRE-REF-9920182",
      notes: "Full wire remittance received from JPMorgan Chase.",
      status: "COMPLETED",
      recordedById: cfoEmp.id,
    },
  });

  await prisma.financialTransaction.create({
    data: {
      organizationId: org.id,
      transactionNumber: "TXN-2026-0001",
      type: "INVOICE_PAYMENT",
      direction: "INFLOW",
      sourceType: "PAYMENT",
      sourceId: pay1.id,
      amount: 55000,
      currency: "USD",
      date: new Date("2026-08-20"),
      description: `Client payment received for Invoice INV-2026-0001 (${client1.name})`,
      reference: "WIRE-REF-9920182",
      createdById: cfoEmp.id,
      invoiceId: inv1.id,
      paymentId: pay1.id,
    },
  });

  // Invoice 2: Partially Paid Invoice ($35,000 total, $15,000 paid, $20,000 balance)
  const inv2 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      invoiceNumber: "INV-2026-0002",
      clientId: client2.id,
      contactId: contact3.id,
      opportunityId: opp2.id,
      invoiceDate: new Date("2026-08-15"),
      dueDate: new Date("2026-09-15"),
      currency: "USD",
      subtotal: 35000,
      taxRate: 0,
      taxAmount: 0,
      discountRate: 0,
      discountAmount: 0,
      total: 35000,
      paidAmount: 15000,
      balance: 20000,
      status: "PARTIALLY_PAID",
      notes: "Custom multi-site ERP and CRM integration pilot.",
      terms: "50% upfront deposit, balance due upon milestone delivery.",
      createdById: cfoEmp.id,
      approvedById: cfoEmp.id,
      approvedAt: new Date("2026-08-16"),
      items: {
        create: [
          { description: "Phase 1 Architecture Setup & System Integration", quantity: 1, unitPrice: 20000, amount: 20000 },
          { description: "Specialized Security Audit & SSO Implementation", quantity: 1, unitPrice: 15000, amount: 15000 },
        ],
      },
    },
  });

  // Payment 2 for Invoice 2
  const pay2 = await prisma.payment.create({
    data: {
      organizationId: org.id,
      paymentReference: "PAY-2026-0002",
      invoiceId: inv2.id,
      clientId: client2.id,
      amount: 15000,
      currency: "USD",
      paymentDate: new Date("2026-08-25"),
      paymentMethod: "BANK_TRANSFER",
      transactionRef: "ACH-DEP-88129",
      notes: "Phase 1 initial payment deposit.",
      status: "COMPLETED",
      recordedById: cfoEmp.id,
    },
  });

  await prisma.financialTransaction.create({
    data: {
      organizationId: org.id,
      transactionNumber: "TXN-2026-0002",
      type: "INVOICE_PAYMENT",
      direction: "INFLOW",
      sourceType: "PAYMENT",
      sourceId: pay2.id,
      amount: 15000,
      currency: "USD",
      date: new Date("2026-08-25"),
      description: `Deposit payment received for Invoice INV-2026-0002 (${client2.name})`,
      reference: "ACH-DEP-88129",
      createdById: cfoEmp.id,
      invoiceId: inv2.id,
      paymentId: pay2.id,
    },
  });

  // Invoice 3: Sent & Outstanding (Overdue schedule testing) ($80,000)
  await prisma.invoice.create({
    data: {
      organizationId: org.id,
      invoiceNumber: "INV-2026-0003",
      clientId: client3.id,
      contactId: contact4.id,
      opportunityId: opp3.id,
      invoiceDate: new Date("2026-07-20"),
      dueDate: new Date("2026-08-20"), // 20 days overdue relative to Sept 2026!
      currency: "USD",
      subtotal: 80000,
      taxRate: 0,
      taxAmount: 0,
      discountRate: 0,
      discountAmount: 0,
      total: 80000,
      paidAmount: 0,
      balance: 80000,
      status: "SENT",
      notes: "Annual corporate software license for 1,200 seats.",
      terms: "Net 30 payment terms.",
      createdById: cfoEmp.id,
      approvedById: cfoEmp.id,
      approvedAt: new Date("2026-07-21"),
      items: {
        create: [
          { description: "Enterprise Healthcare Tier License - 1,200 Seats", quantity: 1, unitPrice: 80000, amount: 80000 },
        ],
      },
    },
  });

  // Seed Expenses
  // Expense 1: Approved cloud subscription
  await prisma.expense.create({
    data: {
      organizationId: org.id,
      expenseNumber: "EXP-2026-0001",
      employeeId: ctoEmp.id,
      departmentId: deptMap["ENG"],
      category: "SOFTWARE_SUBSCRIPTION",
      amount: 12500,
      currency: "USD",
      date: new Date("2026-08-10"),
      description: "AWS Cloud Enterprise Infrastructure Annual Reserve",
      receiptUrl: "https://documents.nfvs.internal/receipts/aws-aug-2026.pdf",
      status: "APPROVED",
      approverId: cfoEmp.id,
      approvedAt: new Date("2026-08-12"),
    },
  });

  // Expense 2: Paid client travel reimbursement
  const exp2 = await prisma.expense.create({
    data: {
      organizationId: org.id,
      expenseNumber: "EXP-2026-0002",
      employeeId: engEmp.id,
      departmentId: deptMap["ENG"],
      category: "TRAVEL",
      amount: 1450,
      currency: "USD",
      date: new Date("2026-08-18"),
      description: "Client Onsite Architecture Workshop Travel & Lodging",
      receiptUrl: "https://documents.nfvs.internal/receipts/flight-hotel-alex.pdf",
      status: "PAID",
      approverId: cfoEmp.id,
      approvedAt: new Date("2026-08-20"),
      paidAt: new Date("2026-08-22"),
      paymentMethod: "REIMBURSEMENT",
      paymentReference: "REIMB-TXN-40192",
    },
  });

  await prisma.financialTransaction.create({
    data: {
      organizationId: org.id,
      transactionNumber: "TXN-2026-0003",
      type: "EXPENSE",
      direction: "OUTFLOW",
      sourceType: "EXPENSE",
      sourceId: exp2.id,
      amount: 1450,
      currency: "USD",
      date: new Date("2026-08-22"),
      description: `Travel expense reimbursement for Alex Mercer (${exp2.description})`,
      reference: "REIMB-TXN-40192",
      departmentId: deptMap["ENG"],
      createdById: cfoEmp.id,
      expenseId: exp2.id,
    },
  });

  // Expense 3: Submitted office supplies (awaiting review)
  await prisma.expense.create({
    data: {
      organizationId: org.id,
      expenseNumber: "EXP-2026-0003",
      employeeId: hrHeadEmp.id,
      departmentId: deptMap["HR"],
      category: "OFFICE_SUPPLIES",
      amount: 2800,
      currency: "USD",
      date: new Date("2026-09-02"),
      description: "Ergonomic Chairs & Dual Monitors for Operations Team",
      receiptUrl: "https://documents.nfvs.internal/receipts/office-depot-sep.pdf",
      status: "SUBMITTED",
    },
  });

  console.log("Seeded Finance: 3 Invoices, 2 Payments, 3 Expenses, and 3 Financial Transactions.");

  // =========================================================================
  // 22. BLOCK 7: PRODUCTS, SERVICES & INVENTORY MANAGEMENT
  // =========================================================================
  console.log("Seeding Block 7: Products, Services & Inventory...");

  // A. Warehouses
  const whMain = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      code: "WH-001",
      name: "Main Distribution Center",
      address: "1000 Logistics Blvd, Dock 4",
      city: "Chicago",
      state: "IL",
      country: "USA",
      managerId: superAdminEmp.id,
      status: "ACTIVE",
      isDefault: true,
    },
  });

  const whEast = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      code: "WH-002",
      name: "East Coast Logistics Depot",
      address: "450 Industrial Parkway",
      city: "Newark",
      state: "NJ",
      country: "USA",
      managerId: cfoEmp.id,
      status: "ACTIVE",
      isDefault: false,
    },
  });

  const whWest = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      code: "WH-003",
      name: "West Coast Fulfillment Hub",
      address: "880 Sierra Vista Road",
      city: "Reno",
      state: "NV",
      country: "USA",
      managerId: engEmp.id,
      status: "ACTIVE",
      isDefault: false,
    },
  });

  // B. Product Categories (Hierarchical)
  const catHardware = await prisma.productCategory.create({
    data: {
      organizationId: org.id,
      code: "CAT-HW",
      name: "Enterprise Hardware",
      description: "Data center physical equipment and appliances",
      type: "PRODUCT",
      status: "ACTIVE",
    },
  });

  const catServers = await prisma.productCategory.create({
    data: {
      organizationId: org.id,
      code: "CAT-SRV",
      name: "Servers & Compute",
      description: "Rackmount compute nodes and high-density clusters",
      type: "PRODUCT",
      parentId: catHardware.id,
      status: "ACTIVE",
    },
  });

  const catNetwork = await prisma.productCategory.create({
    data: {
      organizationId: org.id,
      code: "CAT-NET",
      name: "Networking Equipment",
      description: "Switches, routers, and enterprise interconnects",
      type: "PRODUCT",
      parentId: catHardware.id,
      status: "ACTIVE",
    },
  });

  const catServices = await prisma.productCategory.create({
    data: {
      organizationId: org.id,
      code: "CAT-SRVC",
      name: "Professional Services",
      description: "Consulting, engineering, and managed SLAs",
      type: "SERVICE",
      status: "ACTIVE",
    },
  });

  const catConsulting = await prisma.productCategory.create({
    data: {
      organizationId: org.id,
      code: "CAT-CNS",
      name: "Technical Consulting",
      description: "Architecture, migrations, and cyber assessments",
      type: "SERVICE",
      parentId: catServices.id,
      status: "ACTIVE",
    },
  });

  // C. Products
  const prodServer = await prisma.product.create({
    data: {
      organizationId: org.id,
      sku: "SKU-SRV-2000",
      name: "NFVS HyperScale 2U Server",
      description: "Dual AMD EPYC 9654, 512GB DDR5, 8x NVMe U.2 Enterprise Server",
      categoryId: catServers.id,
      productType: "PHYSICAL",
      unitOfMeasure: "UNIT",
      sellingPrice: 4800.0,
      costPrice: 3100.0,
      taxRate: 10.0,
      status: "ACTIVE",
      minStockLevel: 5.0,
      maxStockLevel: 50.0,
      reorderLevel: 10.0,
      createdById: superAdminEmp.id,
      leadTimeDays: 14,
      reorderQuantity: 20.0,
    },
  });

  const prodSwitch = await prisma.product.create({
    data: {
      organizationId: org.id,
      sku: "SKU-NET-100G",
      name: "NFVS 100GbE Managed Switch 32-Port",
      description: "32-port 100GbE QSFP28 datacenter spine/leaf switch",
      categoryId: catNetwork.id,
      productType: "PHYSICAL",
      unitOfMeasure: "UNIT",
      sellingPrice: 2400.0,
      costPrice: 1450.0,
      taxRate: 10.0,
      status: "ACTIVE",
      minStockLevel: 8.0,
      maxStockLevel: 40.0,
      reorderLevel: 12.0,
      createdById: superAdminEmp.id,
      leadTimeDays: 10,
      reorderQuantity: 15.0,
    },
  });

  const prodLaptop = await prisma.product.create({
    data: {
      organizationId: org.id,
      sku: "SKU-LAP-X1",
      name: "TitanPro Workstation Laptop 16-inch",
      description: "Core i9, 64GB RAM, 2TB PCIe 4.0, RTX 4080 Mobile",
      categoryId: catHardware.id,
      productType: "PHYSICAL",
      unitOfMeasure: "UNIT",
      sellingPrice: 1950.0,
      costPrice: 1200.0,
      taxRate: 10.0,
      status: "ACTIVE",
      minStockLevel: 10.0,
      maxStockLevel: 60.0,
      reorderLevel: 15.0, // Total will be 12 (LOW STOCK!)
      createdById: superAdminEmp.id,
      leadTimeDays: 7,
      reorderQuantity: 25.0,
    },
  });

  const prodCable = await prisma.product.create({
    data: {
      organizationId: org.id,
      sku: "SKU-CAB-CAT6",
      name: "Cat6A Shielded Patch Cable (10-Pack)",
      description: "10-pack 3-meter blue snagless shielded twisted pair",
      categoryId: catNetwork.id,
      productType: "CONSUMABLE",
      unitOfMeasure: "BOX",
      sellingPrice: 45.0,
      costPrice: 18.0,
      taxRate: 8.0,
      status: "ACTIVE",
      minStockLevel: 25.0,
      maxStockLevel: 250.0,
      reorderLevel: 40.0,
      createdById: superAdminEmp.id,
      leadTimeDays: 3,
      reorderQuantity: 100.0,
    },
  });

  // D. Services Catalog
  await prisma.service.create({
    data: {
      organizationId: org.id,
      serviceCode: "SRV-CNS-01",
      name: "Enterprise Architecture Consulting",
      description: "Principal-level cloud migration & datacenter architecture design",
      categoryId: catConsulting.id,
      sellingPrice: 250.0,
      costPrice: 120.0,
      taxRate: 0.0,
      billingUnit: "HOURLY",
      status: "ACTIVE",
      createdById: superAdminEmp.id,
    },
  });

  await prisma.service.create({
    data: {
      organizationId: org.id,
      serviceCode: "SRV-SEC-02",
      name: "Zero-Trust Security Audit",
      description: "Comprehensive penetration testing, IAM posture review, and ISO 27001 audit",
      categoryId: catConsulting.id,
      sellingPrice: 12500.0,
      costPrice: 5000.0,
      taxRate: 0.0,
      billingUnit: "FIXED_PRICE",
      status: "ACTIVE",
      createdById: superAdminEmp.id,
    },
  });

  await prisma.service.create({
    data: {
      organizationId: org.id,
      serviceCode: "SRV-SLA-247",
      name: "24/7 Mission-Critical Infrastructure SLA",
      description: "15-minute response time guarantee, dedicated site reliability engineering pod",
      categoryId: catServices.id,
      sellingPrice: 3800.0,
      costPrice: 1600.0,
      taxRate: 0.0,
      billingUnit: "MONTHLY_RETAINER",
      status: "ACTIVE",
      createdById: superAdminEmp.id,
    },
  });

  // E. Location-Aware Inventory Stock
  // Server: WH1 (18), WH2 (7) -> Total 25
  await prisma.inventoryItem.create({
    data: {
      organizationId: org.id,
      productId: prodServer.id,
      warehouseId: whMain.id,
      quantity: 18.0,
      reservedQuantity: 2.0,
      aisle: "A1",
      shelf: "S3",
      bin: "B04",
    },
  });
  await prisma.inventoryItem.create({
    data: {
      organizationId: org.id,
      productId: prodServer.id,
      warehouseId: whEast.id,
      quantity: 7.0,
      reservedQuantity: 0.0,
      aisle: "E2",
      shelf: "S1",
      bin: "B01",
    },
  });

  // Switch: WH1 (14), WH3 (5) -> Total 19
  await prisma.inventoryItem.create({
    data: {
      organizationId: org.id,
      productId: prodSwitch.id,
      warehouseId: whMain.id,
      quantity: 14.0,
      reservedQuantity: 0.0,
      aisle: "A2",
      shelf: "S2",
      bin: "B12",
    },
  });
  await prisma.inventoryItem.create({
    data: {
      organizationId: org.id,
      productId: prodSwitch.id,
      warehouseId: whWest.id,
      quantity: 5.0,
      reservedQuantity: 0.0,
      aisle: "W1",
      shelf: "S4",
      bin: "B08",
    },
  });

  // Laptop: WH1 (8), WH2 (4) -> Total 12 (LOW STOCK!)
  await prisma.inventoryItem.create({
    data: {
      organizationId: org.id,
      productId: prodLaptop.id,
      warehouseId: whMain.id,
      quantity: 8.0,
      reservedQuantity: 1.0,
      aisle: "B1",
      shelf: "S1",
      bin: "B02",
    },
  });
  await prisma.inventoryItem.create({
    data: {
      organizationId: org.id,
      productId: prodLaptop.id,
      warehouseId: whEast.id,
      quantity: 4.0,
      reservedQuantity: 0.0,
      aisle: "E1",
      shelf: "S2",
      bin: "B05",
    },
  });

  // Cable: WH1 (120), WH2 (45), WH3 (60) -> Total 225
  await prisma.inventoryItem.create({
    data: {
      organizationId: org.id,
      productId: prodCable.id,
      warehouseId: whMain.id,
      quantity: 120.0,
      reservedQuantity: 10.0,
      aisle: "C3",
      shelf: "S5",
      bin: "B20",
    },
  });
  await prisma.inventoryItem.create({
    data: {
      organizationId: org.id,
      productId: prodCable.id,
      warehouseId: whEast.id,
      quantity: 45.0,
      reservedQuantity: 0.0,
      aisle: "E3",
      shelf: "S3",
      bin: "B15",
    },
  });
  await prisma.inventoryItem.create({
    data: {
      organizationId: org.id,
      productId: prodCable.id,
      warehouseId: whWest.id,
      quantity: 60.0,
      reservedQuantity: 0.0,
      aisle: "W2",
      shelf: "S2",
      bin: "B09",
    },
  });

  // F. Stock Movements
  await prisma.stockMovement.create({
    data: {
      organizationId: org.id,
      movementNumber: "MOV-2026-0001",
      productId: prodServer.id,
      type: "STOCK_IN",
      quantity: 25.0,
      destinationWarehouseId: whMain.id,
      referenceType: "MANUAL",
      reason: "Initial baseline inventory stocking",
      previousBalance: 0.0,
      newBalance: 25.0,
      performedById: superAdminEmp.id,
      notes: "Received and QC inspected",
      createdAt: new Date("2026-08-15"),
    },
  });

  await prisma.stockMovement.create({
    data: {
      organizationId: org.id,
      movementNumber: "MOV-2026-0002",
      productId: prodServer.id,
      type: "TRANSFER",
      quantity: 7.0,
      sourceWarehouseId: whMain.id,
      destinationWarehouseId: whEast.id,
      referenceType: "TRANSFER",
      reason: "Rebalance stock to East Coast depot",
      previousBalance: 25.0,
      newBalance: 18.0,
      performedById: superAdminEmp.id,
      notes: "Inter-facility transfer completed",
      createdAt: new Date("2026-08-20"),
    },
  });

  await prisma.stockMovement.create({
    data: {
      organizationId: org.id,
      movementNumber: "MOV-2026-0003",
      productId: prodLaptop.id,
      type: "STOCK_IN",
      quantity: 15.0,
      destinationWarehouseId: whMain.id,
      referenceType: "MANUAL",
      reason: "Initial shipment from OEM",
      previousBalance: 0.0,
      newBalance: 15.0,
      performedById: superAdminEmp.id,
      createdAt: new Date("2026-08-22"),
    },
  });

  await prisma.stockMovement.create({
    data: {
      organizationId: org.id,
      movementNumber: "MOV-2026-0004",
      productId: prodLaptop.id,
      type: "STOCK_OUT",
      quantity: 3.0,
      sourceWarehouseId: whMain.id,
      referenceType: "INVOICE",
      referenceId: "INV-2026-0001",
      reason: "Client dispatch for Global Dynamics contract",
      previousBalance: 15.0,
      newBalance: 12.0,
      performedById: superAdminEmp.id,
      createdAt: new Date("2026-08-28"),
    },
  });

  // G. Approved Inventory Adjustment
  const adj1 = await prisma.inventoryAdjustment.create({
    data: {
      organizationId: org.id,
      adjustmentNumber: "ADJ-2026-0001",
      warehouseId: whMain.id,
      status: "APPROVED",
      reason: "PHYSICAL_COUNT_DISCREPANCY",
      notes: "Monthly physical count verification in Warehouse 1",
      requestedById: engEmp.id,
      approvedById: cfoEmp.id,
      approvedAt: new Date("2026-08-30"),
      items: {
        create: [
          {
            productId: prodSwitch.id,
            systemQuantity: 15.0,
            countedQuantity: 14.0,
            adjustmentQuantity: -1.0,
            unitCost: 1450.0,
          },
        ],
      },
    },
  });

  console.log("Seeded Block 7: 3 Warehouses, 5 Categories, 4 Products, 3 Services, 8 Inventory Items, 4 Movements, and 1 Adjustment.");

  // 22. Bootstrap Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: superAdminUser.id,
      action: "PLATFORM_INITIALIZATION",
      entity: "Organization",
      entityId: org.id,
      previousValue: null,
      newValue: JSON.stringify({
        organizationId: org.id,
        workDaysConfigured: 7,
        holidaysCount: holidaysData.length,
        leavePoliciesCount: leavePoliciesData.length,
        hrPoliciesCount: hrPoliciesData.length,
        complianceRecordsCount: complianceData.length,
        employeesSeeded: allEmployees.length,
      }),
      metadata: JSON.stringify({
        phase: "BLOCK_2_HR_CORE",
        source: "seed.ts",
      }),
      ipAddress: "127.0.0.1",
      userAgent: "NFVS-Bootstrap-Runner/2.0",
    },
  });

  console.log("Database successfully seeded for Block 2 (HR Core)! Ready for verification.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
