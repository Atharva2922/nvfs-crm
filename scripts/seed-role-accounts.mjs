import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Enterprise@2026";

async function main() {
  console.log("================================================================================");
  console.log("SEEDING DEDICATED LOGIN CREDENTIALS FOR EACH CRM ROLE");
  console.log("================================================================================\n");

  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error("No organization found. Please initialize organization first.");
  }
  console.log(`Using Organization: ${org.name} (${org.code})\n`);

  // 1. Fetch Departments
  const departments = await prisma.department.findMany({
    where: { organizationId: org.id },
  });
  const deptMap = {};
  departments.forEach((d) => {
    deptMap[d.code] = d.id;
  });

  // Fallback departments if code not found
  const execDeptId = deptMap["EXEC"] || departments[0]?.id;
  const engDeptId = deptMap["ENG"] || deptMap["SW"] || departments[0]?.id;
  const finDeptId = deptMap["FIN"] || departments[0]?.id;
  const crmDeptId = deptMap["CRM"] || deptMap["MKT"] || departments[0]?.id;
  const opsDeptId = deptMap["OPS"] || departments[0]?.id;
  const swDeptId = deptMap["SW"] || engDeptId;

  // 2. Fetch all system permissions
  const allPermissions = await prisma.permission.findMany();
  const permMap = {};
  allPermissions.forEach((p) => {
    permMap[p.code] = p.id;
  });

  // 3. Ensure role definitions and assign permissions
  const rolePermissionDefinitions = {
    SUPER_ADMIN: allPermissions.map((p) => p.code),
    CHAIRPERSON: allPermissions.map((p) => p.code),
    CEO: [
      "employees.employee.read", "employees.employee.create", "employees.employee.update",
      "organization.department.read", "hr.leave.read", "hr.leave.approve", "hr.attendance.read",
      "hr.workdays.manage", "hr.policies.read", "hr.policies.manage", "hr.compliance.read",
      "hr.compliance.manage", "audit.log.read", "payroll.structure.read", "payroll.structure.manage",
      "payroll.salary.read", "payroll.salary.manage", "payroll.period.manage", "payroll.payslip.read_own",
      "finance.read", "invoice.read", "invoice.approve", "payment.read", "expense.read",
      "expense.approve", "payroll.post", "products.read", "products.create", "products.update",
      "products.cost.read", "services.read", "services.create", "services.update", "inventory.read",
      "inventory.adjust.approve", "warehouses.read"
    ],
    CTO: [
      "employees.employee.read", "organization.department.read", "hr.leave.read", "hr.leave.approve",
      "hr.attendance.read", "hr.policies.read", "payroll.payslip.read_own", "expense.read", "expense.create",
      "products.read", "products.create", "products.update", "products.cost.read", "services.read",
      "services.create", "services.update", "inventory.read", "inventory.adjust", "inventory.transfer",
      "inventory.adjust.approve", "warehouses.read", "warehouses.create", "warehouses.update", "audit.log.read"
    ],
    CFO: [
      "employees.employee.read", "organization.department.read", "hr.leave.read", "hr.attendance.read",
      "hr.policies.read", "audit.log.read", "payroll.structure.read", "payroll.structure.manage",
      "payroll.salary.read", "payroll.salary.manage", "payroll.period.manage", "payroll.payslip.read_own",
      "finance.read", "finance.manage", "invoice.read", "invoice.create", "invoice.update",
      "invoice.approve", "invoice.cancel", "payment.read", "payment.create", "payment.reverse",
      "expense.read", "expense.create", "expense.approve", "expense.reject", "payroll.post",
      "products.read", "products.cost.read", "services.read", "inventory.read", "warehouses.read"
    ],
    CMO: [
      "employees.employee.read", "organization.department.read", "hr.leave.read", "hr.attendance.read",
      "hr.policies.read", "payroll.payslip.read_own", "expense.read", "expense.create", "expense.approve",
      "products.read", "services.read", "inventory.read", "warehouses.read"
    ],
    ADMIN: [
      "employees.employee.read", "employees.employee.create", "employees.employee.update",
      "organization.department.read", "organization.department.manage", "hr.leave.read",
      "hr.leave.create", "hr.leave.approve", "hr.attendance.read", "hr.attendance.record",
      "hr.workdays.manage", "hr.policies.read", "hr.policies.manage", "hr.compliance.read",
      "hr.compliance.manage", "audit.log.read", "settings.roles.manage", "settings.general.manage"
    ],
    DEPARTMENT_HEAD: [
      "employees.employee.read", "organization.department.read", "hr.leave.read", "hr.leave.approve",
      "hr.attendance.read", "hr.policies.read", "payroll.payslip.read_own", "expense.read",
      "expense.create", "expense.approve", "products.read", "products.create", "products.update",
      "services.read", "inventory.read", "inventory.adjust", "inventory.transfer", "inventory.adjust.approve",
      "warehouses.read", "warehouses.create", "warehouses.update"
    ],
    MANAGER: [
      "employees.employee.read", "organization.department.read", "hr.leave.read", "hr.leave.approve",
      "hr.attendance.read", "hr.policies.read", "payroll.payslip.read_own", "expense.read",
      "expense.create", "expense.approve", "products.read", "products.create", "products.update",
      "services.read", "inventory.read", "inventory.adjust", "inventory.transfer", "inventory.adjust.approve",
      "warehouses.read", "warehouses.create", "warehouses.update"
    ],
    EMPLOYEE: [
      "hr.leave.read", "hr.leave.create", "hr.attendance.read", "hr.attendance.record",
      "hr.policies.read", "payroll.payslip.read_own", "expense.read", "expense.create",
      "products.read", "services.read", "inventory.read", "warehouses.read"
    ]
  };

  for (const [roleCode, permCodes] of Object.entries(rolePermissionDefinitions)) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) continue;

    // Check existing
    const existing = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const existingPermIds = new Set(existing.map((e) => e.permissionId));

    for (const code of permCodes) {
      const permId = permMap[code];
      if (permId && !existingPermIds.has(permId)) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permId,
          },
        });
      }
    }
  }
  console.log("✓ Role permissions synchronized across all 10 roles.");

  // 4. Role Accounts Configuration
  const roleAccounts = [
    {
      email: "superadmin@nfvs.internal",
      name: "System Administrator",
      roleCode: "SUPER_ADMIN",
      empNumber: "EMP-EXEC-001",
      firstName: "System",
      lastName: "Administrator",
      designation: "Super Administrator",
      departmentId: execDeptId,
      primaryFocus: "Complete Platform Administration, Security, Audit & Global Governance",
    },
    {
      email: "chairperson@nfvs.internal",
      name: "Rajiv Singhania",
      roleCode: "CHAIRPERSON",
      empNumber: "EMP-EXEC-002",
      firstName: "Rajiv",
      lastName: "Singhania",
      designation: "Chairperson of the Board",
      departmentId: execDeptId,
      primaryFocus: "Executive Board Oversight, Shareholder Reports & CEO Dashboard",
    },
    {
      email: "ceo@nfvs.internal",
      name: "Vikramaditya Sharma",
      roleCode: "CEO",
      empNumber: "EMP-EXEC-003",
      firstName: "Vikramaditya",
      lastName: "Sharma",
      designation: "Chief Executive Officer",
      departmentId: execDeptId,
      primaryFocus: "CEO Executive Dashboard (/app/dashboard/ceo), High-Value Approvals, Corporate Performance",
    },
    {
      email: "cto@nfvs.internal",
      name: "Ananya Deshmukh",
      roleCode: "CTO",
      empNumber: "EMP-ENG-001",
      firstName: "Ananya",
      lastName: "Deshmukh",
      designation: "Chief Technology Officer",
      departmentId: engDeptId,
      primaryFocus: "Operations Hub (/app/operations), Product & Inventory (/app/inventory), Technical Projects",
    },
    {
      email: "cfo@nfvs.internal",
      name: "Rajeshwari Iyer",
      roleCode: "CFO",
      empNumber: "EMP-FIN-001",
      firstName: "Rajeshwari",
      lastName: "Iyer",
      designation: "Chief Financial Officer",
      departmentId: finDeptId,
      primaryFocus: "Finance Hub (/app/finance), Payroll Management (/app/payroll), Cash Flow & Invoices",
    },
    {
      email: "cmo@nfvs.internal",
      name: "Siddharth Malhotra",
      roleCode: "CMO",
      empNumber: "EMP-CRM-001",
      firstName: "Siddharth",
      lastName: "Malhotra",
      designation: "Chief Marketing Officer",
      departmentId: crmDeptId,
      primaryFocus: "CRM & Sales Pipeline (/app/crm), Leads, Opportunities & Client Accounts",
    },
    {
      email: "admin@nfvs.internal",
      name: "Amit Verma",
      roleCode: "ADMIN",
      empNumber: "EMP-ADM-001",
      firstName: "Amit",
      lastName: "Verma",
      designation: "Platform Administrator",
      departmentId: execDeptId,
      primaryFocus: "Settings (/app/settings), Role Permissions, HR & Organization (/app/hr), Audit Logs",
    },
    {
      email: "depthead@nfvs.internal",
      name: "Neha Kulkarni",
      roleCode: "DEPARTMENT_HEAD",
      empNumber: "EMP-OPS-001",
      firstName: "Neha",
      lastName: "Kulkarni",
      designation: "Head of Operations & Logistics",
      departmentId: opsDeptId,
      primaryFocus: "Department Scope Workload Widget (/app/overview), Team Tasks & Operations Management",
    },
    {
      email: "manager@nfvs.internal",
      name: "Rohan Mehta",
      roleCode: "MANAGER",
      empNumber: "EMP-MGR-001",
      firstName: "Rohan",
      lastName: "Mehta",
      designation: "Engineering Manager",
      departmentId: engDeptId,
      primaryFocus: "Team Scope Workload Widget (/app/overview), Team Attendance & Direct Report Approvals",
    },
    {
      email: "employee@nfvs.internal",
      name: "Priya Patel",
      roleCode: "EMPLOYEE",
      empNumber: "EMP-STAFF-001",
      firstName: "Priya",
      lastName: "Patel",
      designation: "Senior Software Engineer",
      departmentId: swDeptId,
      primaryFocus: "Personal Workspace (/app/overview): Attendance Clock, My Tasks, Projects, Leave & Payslips",
    },
  ];

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  console.log("4. Upserting Users and Linking Employee Profiles...\n");

  const seededList = [];

  for (const acc of roleAccounts) {
    const role = await prisma.role.findUnique({ where: { code: acc.roleCode } });
    if (!role) {
      console.warn(`Role ${acc.roleCode} not found in database, skipping.`);
      continue;
    }

    // Upsert User
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        passwordHash: hashedPassword,
        roleId: role.id,
        isActive: true,
      },
      create: {
        email: acc.email,
        passwordHash: hashedPassword,
        roleId: role.id,
        isActive: true,
      },
    });

    // Check if employee exists by email or employeeNumber
    let emp = await prisma.employee.findFirst({
      where: {
        OR: [{ email: acc.email }, { userId: user.id }, { employeeNumber: acc.empNumber }],
      },
    });

    if (emp) {
      emp = await prisma.employee.update({
        where: { id: emp.id },
        data: {
          userId: user.id,
          email: acc.email,
          firstName: acc.firstName,
          lastName: acc.lastName,
          designation: acc.designation,
          departmentId: acc.departmentId,
          organizationId: org.id,
          employmentStatus: "ACTIVE",
          employmentType: "FULL_TIME",
        },
      });
    } else {
      emp = await prisma.employee.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          employeeNumber: acc.empNumber,
          firstName: acc.firstName,
          lastName: acc.lastName,
          email: acc.email,
          designation: acc.designation,
          departmentId: acc.departmentId,
          employmentStatus: "ACTIVE",
          employmentType: "FULL_TIME",
          workMode: "ON_SITE",
          location: "Headquarters (Mumbai)",
          hireDate: new Date("2024-01-15T00:00:00Z"),
          baseSalary: 125000,
          currency: "INR",
        },
      });
    }

    seededList.push({
      role: role.name,
      roleCode: role.code,
      roleLevel: role.level,
      email: acc.email,
      password: DEFAULT_PASSWORD,
      name: `${acc.firstName} ${acc.lastName}`,
      designation: acc.designation,
      primaryFocus: acc.primaryFocus,
    });

    console.log(`✓ [${role.code.padEnd(16)}] User: ${acc.email.padEnd(28)} | Emp: ${acc.firstName} ${acc.lastName} (${acc.designation})`);
  }

  console.log("\n================================================================================");
  console.log("CREDENTIALS TABLE GENERATED SUCCESSFULLY");
  console.log("================================================================================\n");

  console.table(
    seededList.map((s) => ({
      Role: s.roleCode,
      Email: s.email,
      Password: s.password,
      Name: s.name,
      Designation: s.designation,
    }))
  );
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
