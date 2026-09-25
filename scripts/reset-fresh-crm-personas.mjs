import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

const DEFAULT_PASSWORD = "Enterprise@2026";

async function main() {
  console.log("================================================================================");
  console.log("PURGING OLD ACCOUNTS & SEEDING PRISTINE CRM ARCHITECTURE PERSONAS");
  console.log("================================================================================\n");

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. Fetch Organizations
  const nfvs = await prisma.organization.findFirst({ where: { code: "NFVS" } });
  const naree = await prisma.organization.findFirst({ where: { code: "NAREE" } });

  if (!nfvs || !naree) {
    throw new Error("Organizations NFVS and NAREE must exist.");
  }

  // 2. Fetch Roles
  const roles = await prisma.role.findMany();
  const roleMap = {};
  roles.forEach((r) => {
    roleMap[r.code] = r;
  });

  // Verify necessary roles exist
  const requiredRoles = ["SUPER_ADMIN", "ADMIN", "CEO", "HR", "COO", "CFO", "CIO", "CMO", "EMPLOYEE"];
  for (const r of requiredRoles) {
    if (!roleMap[r]) {
      throw new Error(`Required role ${r} not found in database.`);
    }
  }

  // 3. Departments Map
  const nfvsDepts = await prisma.department.findMany({ where: { organizationId: nfvs.id } });
  const nareeDepts = await prisma.department.findMany({ where: { organizationId: naree.id } });

  const getDept = (depts, code) => depts.find((d) => d.code === code) || depts[0];

  console.log("1. Cleaning up existing foreign key references to users and employees...");

  // Null out self-referential managerId on employees
  await prisma.employee.updateMany({ data: { managerId: null } });

  // Delete child/dependent records that have foreign keys to Employee/User
  console.log("  - Deleting notifications, task comments, attendance, leave requests...");
  const cleanupTables = [
    "notification",
    "taskComment",
    "task",
    "leaveRequest",
    "leaveBalance",
    "attendanceRecord",
    "onDutyAssignment",
    "employeeRequest",
    "payrollEntry",
    "employeeSalaryStructure",
    "userCompanyMembership",
    "calendarEvent",
    "aIConversation",
    "aIUsageLog",
    "auditLog",
    "operationIssueComment",
    "operationIssue",
    "operationEmployee",
    "operationActivity",
    "approvalRequest",
    "approvalStep",
    "message",
    "conversationParticipant",
    "conversation",
  ];

  for (const table of cleanupTables) {
    if (prisma[table] && typeof prisma[table].deleteMany === "function") {
      try {
        await prisma[table].deleteMany({});
      } catch (err) {
        // Ignored or continued
      }
    }
  }

  // Now delete all employees and users
  console.log("  - Deleting all existing employees...");
  await prisma.employee.deleteMany({});

  console.log("  - Deleting all existing users...");
  await prisma.user.deleteMany({});

  console.log("✓ All old accounts and employees completely purged.\n");

  // 4. Create Pristine Personas according to the CRM Architecture
  console.log("2. Creating Fresh Personas for the Architecture Chain...");

  // A. Platform Super Admin (Global Governance)
  const superAdminUser = await prisma.user.create({
    data: {
      email: "superadmin@enterprise.internal",
      passwordHash: hashedPassword,
      roleId: roleMap["SUPER_ADMIN"].id,
      isActive: true,
    },
  });

  const superAdminEmp = await prisma.employee.create({
    data: {
      userId: superAdminUser.id,
      organizationId: nfvs.id, // primary tenant attachment
      departmentId: getDept(nfvsDepts, "EXEC").id,
      employeeNumber: "EMP-GLOBAL-SUPERADMIN-001",
      firstName: "Platform Super",
      lastName: "Administrator",
      email: "superadmin@enterprise.internal",
      designation: "Platform Super Administrator",
      hireDate: new Date(),
      employmentStatus: "ACTIVE",
    },
  });

  // Global memberships for super admin
  await prisma.userCompanyMembership.createMany({
    data: [
      { userId: superAdminUser.id, organizationId: nfvs.id, roleId: roleMap["SUPER_ADMIN"].id, isPrimary: true },
      { userId: superAdminUser.id, organizationId: naree.id, roleId: roleMap["SUPER_ADMIN"].id, isPrimary: false },
    ],
  });

  console.log(`✓ [SUPER_ADMIN] superadmin@enterprise.internal created.`);

  // Function to seed company hierarchy personas
  async function seedCompany(org, depts, prefix) {
    console.log(`\n--- Seeding ${org.name} (${org.code}) ---`);

    const personas = [
      {
        key: "ADMIN",
        roleCode: "ADMIN",
        email: `admin@${prefix}.internal`,
        firstName: "Admin",
        lastName: `(${org.code})`,
        designation: "Platform Administrator",
        deptCode: "EXEC",
      },
      {
        key: "CEO",
        roleCode: "CEO",
        email: `ceo@${prefix}.internal`,
        firstName: "Chief Executive",
        lastName: `Officer (${org.code})`,
        designation: "Chief Executive Officer",
        deptCode: "EXEC",
      },
      {
        key: "HR",
        roleCode: "HR",
        email: `hr@${prefix}.internal`,
        firstName: "Human Resources",
        lastName: `Officer (${org.code})`,
        designation: "Chief Human Resources Officer",
        deptCode: "HR",
      },
      {
        key: "COO",
        roleCode: "COO",
        email: `coo@${prefix}.internal`,
        firstName: "Chief Operating",
        lastName: `Officer (${org.code})`,
        designation: "Chief Operating Officer",
        deptCode: "OPS",
      },
      {
        key: "CFO",
        roleCode: "CFO",
        email: `cfo@${prefix}.internal`,
        firstName: "Chief Financial",
        lastName: `Officer (${org.code})`,
        designation: "Chief Financial Officer",
        deptCode: "FIN",
      },
      {
        key: "CIO",
        roleCode: "CIO",
        email: `cio@${prefix}.internal`,
        firstName: "Chief Information",
        lastName: `Officer (${org.code})`,
        designation: "Chief Information Officer",
        deptCode: "INTL",
      },
      {
        key: "CMO",
        roleCode: "CMO",
        email: `cmo@${prefix}.internal`,
        firstName: "Chief Marketing",
        lastName: `Officer (${org.code})`,
        designation: "Chief Marketing Officer",
        deptCode: "MKT",
      },
      // Functional Operational Teams
      {
        key: "OPS_STAFF",
        roleCode: "EMPLOYEE",
        email: `operations@${prefix}.internal`,
        firstName: "Operations",
        lastName: `Specialist (${org.code})`,
        designation: "Operations Lead Specialist",
        deptCode: "OPS",
      },
      {
        key: "FIN_STAFF",
        roleCode: "EMPLOYEE",
        email: `finance@${prefix}.internal`,
        firstName: "Finance",
        lastName: `Controller (${org.code})`,
        designation: "Financial Controller & Analyst",
        deptCode: "FIN",
      },
      {
        key: "INTL_STAFF",
        roleCode: "EMPLOYEE",
        email: `international@${prefix}.internal`,
        firstName: "International Affairs",
        lastName: `Officer (${org.code})`,
        designation: "International Affairs & Tech Officer",
        deptCode: "INTL",
      },
      {
        key: "MKT_STAFF",
        roleCode: "EMPLOYEE",
        email: `marketing@${prefix}.internal`,
        firstName: "Marketing",
        lastName: `Executive (${org.code})`,
        designation: "Growth & Marketing Executive",
        deptCode: "MKT",
      },
    ];

    const createdEmps = {};

    for (const p of personas) {
      const user = await prisma.user.create({
        data: {
          email: p.email,
          passwordHash: hashedPassword,
          roleId: roleMap[p.roleCode].id,
          isActive: true,
        },
      });

      const emp = await prisma.employee.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          departmentId: getDept(depts, p.deptCode).id,
          employeeNumber: `EMP-${org.code}-${p.roleCode.slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          designation: p.designation,
          hireDate: new Date(),
          employmentStatus: "ACTIVE",
        },
      });

      await prisma.userCompanyMembership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          roleId: roleMap[p.roleCode].id,
          isPrimary: true,
        },
      });

      createdEmps[p.key] = emp;
      console.log(`  ✓ [${p.roleCode}] ${p.email} (${p.designation})`);
    }

    // Connect CRM Reporting Hierarchy:
    // Super Admin -> Admin -> CEO -> HR -> COO / CFO / CIO / CMO -> Respected Teams
    const admin = createdEmps["ADMIN"];
    const ceo = createdEmps["CEO"];
    const hr = createdEmps["HR"];
    const coo = createdEmps["COO"];
    const cfo = createdEmps["CFO"];
    const cio = createdEmps["CIO"];
    const cmo = createdEmps["CMO"];
    const opsStaff = createdEmps["OPS_STAFF"];
    const finStaff = createdEmps["FIN_STAFF"];
    const intlStaff = createdEmps["INTL_STAFF"];
    const mktStaff = createdEmps["MKT_STAFF"];

    await prisma.employee.update({ where: { id: admin.id }, data: { managerId: superAdminEmp.id } });
    await prisma.employee.update({ where: { id: ceo.id }, data: { managerId: admin.id } });
    await prisma.employee.update({ where: { id: hr.id }, data: { managerId: ceo.id } });
    await prisma.employee.update({ where: { id: coo.id }, data: { managerId: hr.id } });
    await prisma.employee.update({ where: { id: cfo.id }, data: { managerId: hr.id } });
    await prisma.employee.update({ where: { id: cio.id }, data: { managerId: hr.id } });
    await prisma.employee.update({ where: { id: cmo.id }, data: { managerId: hr.id } });

    await prisma.employee.update({ where: { id: opsStaff.id }, data: { managerId: coo.id } });
    await prisma.employee.update({ where: { id: finStaff.id }, data: { managerId: cfo.id } });
    await prisma.employee.update({ where: { id: intlStaff.id }, data: { managerId: cio.id } });
    await prisma.employee.update({ where: { id: mktStaff.id }, data: { managerId: cmo.id } });

    console.log(`  ✓ Reporting links wired: Admin -> CEO -> HR -> CXOs -> Functional Teams.`);
  }

  // Seed NFVS
  await seedCompany(nfvs, nfvsDepts, "nfvs");

  // Seed NAREE
  await seedCompany(naree, nareeDepts, "naree");

  console.log("\n================================================================================");
  console.log("PRISTINE CRM STRUCTURE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("Default Password for all personas: " + DEFAULT_PASSWORD);
  console.log("================================================================================");
}

main().catch(console.error).finally(() => prisma.$disconnect());
