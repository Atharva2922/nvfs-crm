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
  console.log("SYNCHRONIZING CRM CORPORATE ARCHITECTURE & REPORTING HIERARCHY");
  console.log("================================================================================\n");

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. Roles & Hierarchy Levels
  const roleDefs = [
    { code: "SUPER_ADMIN", name: "Super Administrator", level: 100, description: "Platform governance, global read-only audit & persona role assignment authority" },
    { code: "ADMIN", name: "Platform Administrator", level: 90, description: "Operational administration, directs and oversees executive CXOs" },
    { code: "CHAIRPERSON", name: "Chairperson of the Board", level: 88, description: "Strategic governance and executive board audit oversight" },
    { code: "CEO", name: "Chief Executive Officer", level: 85, description: "Executive leadership, directs HR with corporate orders and objectives" },
    { code: "HR", name: "Chief Human Resources Officer", level: 80, description: "Dispatches tasks & operational directives to domain CXOs (COO, CFO, CIO, CMO)" },
    { code: "COO", name: "Chief Operating Officer", level: 75, description: "Directs Operations Team and operational logistics" },
    { code: "CFO", name: "Chief Financial Officer", level: 75, description: "Directs Finance Team, treasury, and accounts" },
    { code: "CIO", name: "Chief Information Officer", level: 75, description: "Directs International Affairs Team, digital strategy, and enterprise IT" },
    { code: "CTO", name: "Chief Technology Officer", level: 75, description: "Directs Engineering, software architecture, and technology" },
    { code: "CMO", name: "Chief Marketing Officer", level: 75, description: "Directs Marketing Team, commercial expansion, and CRM" },
    { code: "DEPARTMENT_HEAD", name: "Department Head", level: 50, description: "Departmental operations and staff leadership" },
    { code: "MANAGER", name: "Team Manager", level: 40, description: "Team task delegation and performance management" },
    { code: "TEAM_LEAD", name: "Team Lead", level: 30, description: "Operational team lead" },
    { code: "EMPLOYEE", name: "Team Staff Contributor", level: 10, description: "Functional team member executing assigned domain tasks" },
  ];

  const roleMap = {};
  for (const def of roleDefs) {
    const role = await prisma.role.upsert({
      where: { code: def.code },
      update: { name: def.name, level: def.level, description: def.description },
      create: { code: def.code, name: def.name, level: def.level, description: def.description },
    });
    roleMap[def.code] = role;
    console.log(`✓ Role [${role.code}] synced (Level: ${role.level})`);
  }

  // Ensure CIO role has permissions similar to CTO/execs
  const allPermissions = await prisma.permission.findMany();
  const ctoPermissions = await prisma.rolePermission.findMany({
    where: { roleId: roleMap["CTO"]?.id },
  });
  if (ctoPermissions.length > 0 && roleMap["CIO"]) {
    for (const cp of ctoPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleMap["CIO"].id,
            permissionId: cp.permissionId,
          },
        },
        update: {},
        create: {
          roleId: roleMap["CIO"].id,
          permissionId: cp.permissionId,
        },
      });
    }
    console.log(`✓ CIO role permissions cloned from CTO (${ctoPermissions.length} permissions).`);
  }

  // 2. Fetch Organizations
  const organizations = await prisma.organization.findMany();
  console.log(`\nFound ${organizations.length} organizations:`, organizations.map((o) => `${o.name} (${o.code})`));

  for (const org of organizations) {
    console.log(`\n--- Configuring Organization: ${org.name} (${org.code}) ---`);

    // Standardize 6 Departments
    const deptDefs = [
      { code: "EXEC", name: "Executive Directorate" },
      { code: "HR", name: "Human Resources Department" },
      { code: "OPS", name: "Operations Team" },
      { code: "FIN", name: "Finance Team" },
      { code: "INTL", name: "International Affairs Team" },
      { code: "MKT", name: "Marketing Team" },
    ];

    const deptMap = {};
    for (const d of deptDefs) {
      let dept = await prisma.department.findFirst({
        where: { organizationId: org.id, code: d.code },
      });
      if (!dept) {
        dept = await prisma.department.create({
          data: {
            organizationId: org.id,
            code: d.code,
            name: d.name,
          },
        });
      } else {
        dept = await prisma.department.update({
          where: { id: dept.id },
          data: { name: d.name },
        });
      }
      deptMap[d.code] = dept;
      console.log(`  ✓ Dept [${dept.code}] "${dept.name}"`);
    }

    // Provision or link personas for this company according to CRM Architecture:
    // Super Admin > Admin > CEO > HR > COO / CFO / CIO / CMO > Teams (Ops, Fin, Int'l, Mkt)
    const suffix = org.code.toLowerCase();

    const personaAccounts = [
      {
        roleCode: "ADMIN",
        email: `admin.${suffix}@${suffix}.internal`,
        firstName: `Admin`,
        lastName: org.code,
        designation: "Platform Administrator",
        deptCode: "EXEC",
        isLeader: true,
      },
      {
        roleCode: "CEO",
        email: `ceo.${suffix}@${suffix}.internal`,
        firstName: `Ceo`,
        lastName: org.code,
        designation: "Chief Executive Officer",
        deptCode: "EXEC",
        isLeader: true,
      },
      {
        roleCode: "HR",
        email: `hr.${suffix}@${suffix}.internal`,
        firstName: `Hr`,
        lastName: org.code,
        designation: "Chief Human Resources Officer",
        deptCode: "HR",
        isLeader: true,
      },
      {
        roleCode: "COO",
        email: `coo.${suffix}@${suffix}.internal`,
        firstName: `Coo`,
        lastName: org.code,
        designation: "Chief Operating Officer",
        deptCode: "OPS",
        isLeader: true,
      },
      {
        roleCode: "CFO",
        email: `cfo.${suffix}@${suffix}.internal`,
        firstName: `Cfo`,
        lastName: org.code,
        designation: "Chief Financial Officer",
        deptCode: "FIN",
        isLeader: true,
      },
      {
        roleCode: "CIO",
        email: `cio.${suffix}@${suffix}.internal`,
        firstName: `Cio`,
        lastName: org.code,
        designation: "Chief Information Officer",
        deptCode: "INTL",
        isLeader: true,
      },
      {
        roleCode: "CMO",
        email: `cmo.${suffix}@${suffix}.internal`,
        firstName: `Cmo`,
        lastName: org.code,
        designation: "Chief Marketing Officer",
        deptCode: "MKT",
        isLeader: true,
      },
      // Team Members
      {
        roleCode: "EMPLOYEE",
        email: `ops.staff.${suffix}@${suffix}.internal`,
        firstName: `Operations`,
        lastName: `Specialist (${org.code})`,
        designation: "Operations Lead Specialist",
        deptCode: "OPS",
        isLeader: false,
      },
      {
        roleCode: "EMPLOYEE",
        email: `fin.staff.${suffix}@${suffix}.internal`,
        firstName: `Finance`,
        lastName: `Analyst (${org.code})`,
        designation: "Financial Controller & Analyst",
        deptCode: "FIN",
        isLeader: false,
      },
      {
        roleCode: "EMPLOYEE",
        email: `intl.staff.${suffix}@${suffix}.internal`,
        firstName: `International`,
        lastName: `Officer (${org.code})`,
        designation: "International Affairs Officer",
        deptCode: "INTL",
        isLeader: false,
      },
      {
        roleCode: "EMPLOYEE",
        email: `mkt.staff.${suffix}@${suffix}.internal`,
        firstName: `Marketing`,
        lastName: `Executive (${org.code})`,
        designation: "Growth & Marketing Executive",
        deptCode: "MKT",
        isLeader: false,
      },
    ];

    const empRecords = {};

    for (const p of personaAccounts) {
      // Find or create user
      let user = await prisma.user.findUnique({ where: { email: p.email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: p.email,
            passwordHash: hashedPassword,
            roleId: roleMap[p.roleCode].id,
            isActive: true,
          },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: roleMap[p.roleCode].id, isActive: true },
        });
      }

      // Find or create employee
      let emp = await prisma.employee.findFirst({
        where: { userId: user.id },
      });
      if (!emp) {
        const empNumber = `EMP-${org.code}-${p.roleCode.slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;
        emp = await prisma.employee.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            departmentId: deptMap[p.deptCode]?.id,
            employeeNumber: empNumber,
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
            designation: p.designation,
            hireDate: new Date(),
            employmentStatus: "ACTIVE",
          },
        });
      } else {
        emp = await prisma.employee.update({
          where: { id: emp.id },
          data: {
            organizationId: org.id,
            departmentId: deptMap[p.deptCode]?.id,
            designation: p.designation,
          },
        });
      }

      empRecords[p.roleCode + (p.isLeader ? "" : `_${p.deptCode}`)] = emp;
      console.log(`  ✓ Persona synced: [${p.roleCode}] ${p.email} (${p.designation})`);
    }

    // Connect Reporting Hierarchy Chain:
    // Admin -> no manager (or Super Admin)
    // CEO -> reports to Admin
    // HR -> reports to CEO
    // COO, CFO, CIO, CMO -> report to HR
    // Operations Team employee -> reports to COO
    // Finance Team employee -> reports to CFO
    // International Affairs Team employee -> reports to CIO
    // Marketing Team employee -> reports to CMO

    const adminEmp = empRecords["ADMIN"];
    const ceoEmp = empRecords["CEO"];
    const hrEmp = empRecords["HR"];
    const cooEmp = empRecords["COO"];
    const cfoEmp = empRecords["CFO"];
    const cioEmp = empRecords["CIO"];
    const cmoEmp = empRecords["CMO"];
    const opsStaffEmp = empRecords["EMPLOYEE_OPS"];
    const finStaffEmp = empRecords["EMPLOYEE_FIN"];
    const intlStaffEmp = empRecords["EMPLOYEE_INTL"];
    const mktStaffEmp = empRecords["EMPLOYEE_MKT"];

    if (ceoEmp && adminEmp) {
      await prisma.employee.update({ where: { id: ceoEmp.id }, data: { managerId: adminEmp.id } });
    }
    if (hrEmp && ceoEmp) {
      await prisma.employee.update({ where: { id: hrEmp.id }, data: { managerId: ceoEmp.id } });
    }
    if (cooEmp && hrEmp) {
      await prisma.employee.update({ where: { id: cooEmp.id }, data: { managerId: hrEmp.id } });
    }
    if (cfoEmp && hrEmp) {
      await prisma.employee.update({ where: { id: cfoEmp.id }, data: { managerId: hrEmp.id } });
    }
    if (cioEmp && hrEmp) {
      await prisma.employee.update({ where: { id: cioEmp.id }, data: { managerId: hrEmp.id } });
    }
    if (cmoEmp && hrEmp) {
      await prisma.employee.update({ where: { id: cmoEmp.id }, data: { managerId: hrEmp.id } });
    }

    if (opsStaffEmp && cooEmp) {
      await prisma.employee.update({ where: { id: opsStaffEmp.id }, data: { managerId: cooEmp.id } });
    }
    if (finStaffEmp && cfoEmp) {
      await prisma.employee.update({ where: { id: finStaffEmp.id }, data: { managerId: cfoEmp.id } });
    }
    if (intlStaffEmp && cioEmp) {
      await prisma.employee.update({ where: { id: intlStaffEmp.id }, data: { managerId: cioEmp.id } });
    }
    if (mktStaffEmp && cmoEmp) {
      await prisma.employee.update({ where: { id: mktStaffEmp.id }, data: { managerId: cmoEmp.id } });
    }

    console.log(`  ✓ Reporting hierarchy chain linked for ${org.name}!`);
  }

  console.log("\n================================================================================");
  console.log("CRM ARCHITECTURE SYNCHRONIZATION COMPLETE");
  console.log("================================================================================");
}

main().catch(console.error).finally(() => prisma.$disconnect());
