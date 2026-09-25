import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "Enterprise@2026";

async function main() {
  console.log("================================================================================");
  console.log("RE-PARTITIONING & ISOLATING DATA FOR THE TWO NAREE COMPANIES");
  console.log("================================================================================\n");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. Find both organizations
  const org1 = await prisma.organization.findFirst({
    where: {
      OR: [
        { code: "NFVS" },
        { name: { contains: "Venture Studio", mode: "insensitive" } },
      ],
    },
  });

  const org2 = await prisma.organization.findFirst({
    where: {
      OR: [
        { code: "NAREE" },
        { name: { contains: "Naree Foundation", mode: "insensitive" }, code: { not: "NFVS" } },
      ],
      id: { not: org1?.id },
    },
  });

  if (!org1 || !org2) {
    throw new Error(`Could not find both organizations! Org1: ${org1?.name}, Org2: ${org2?.name}`);
  }

  // Ensure metadata & styling for Org 1 (Venture Studio)
  await prisma.organization.update({
    where: { id: org1.id },
    data: {
      name: "Naree Foundation Venture Studio",
      legalName: "Naree Foundation Venture Studio Inc.",
      code: "NFVS",
      primaryColor: "#2563eb",
      secondaryColor: "#1e40af",
      industry: "Venture Capital & Technology Incubation",
      currency: "USD",
      status: "ACTIVE",
    },
  });

  // Ensure metadata & styling for Org 2 (Naree Foundation)
  await prisma.organization.update({
    where: { id: org2.id },
    data: {
      name: "Naree Foundation",
      legalName: "Naree Foundation Non-Profit Trust",
      code: "NAREE",
      primaryColor: "#10b981",
      secondaryColor: "#065f46",
      industry: "Non-Profit & Social Impact",
      currency: "EUR",
      status: "ACTIVE",
    },
  });

  console.log(`✓ Org 1: ${org1.name} [${org1.code}] (ID: ${org1.id})`);
  console.log(`✓ Org 2: ${org2.name} [${org2.code}] (ID: ${org2.id})\n`);

  // 2. Fetch Departments for both organizations
  let depts1 = await prisma.department.findMany({ where: { organizationId: org1.id } });
  let depts2 = await prisma.department.findMany({ where: { organizationId: org2.id } });

  console.log(`Org 1 has ${depts1.length} departments.`);
  console.log(`Org 2 has ${depts2.length} departments.`);

  // If Org 1 is missing departments, create core ones
  if (depts1.length === 0) {
    const d1 = await prisma.department.create({
      data: { organizationId: org1.id, name: "Executive Leadership", code: "EXEC_NFVS" },
    });
    const d2 = await prisma.department.create({
      data: { organizationId: org1.id, name: "Technology & Engineering", code: "ENG_NFVS" },
    });
    const d3 = await prisma.department.create({
      data: { organizationId: org1.id, name: "Venture Operations", code: "OPS_NFVS" },
    });
    depts1 = [d1, d2, d3];
  }

  // If Org 2 is missing departments, create core ones
  if (depts2.length === 0) {
    const d1 = await prisma.department.create({
      data: { organizationId: org2.id, name: "Executive Directorate", code: "EXEC_NAREE" },
    });
    const d2 = await prisma.department.create({
      data: { organizationId: org2.id, name: "Community Welfare & Outreach", code: "OUTREACH" },
    });
    const d3 = await prisma.department.create({
      data: { organizationId: org2.id, name: "Human Capital & Volunteers", code: "HR_NAREE" },
    });
    depts2 = [d1, d2, d3];
  }

  const defaultDept1 = depts1[0];
  const defaultDept2 = depts2[0];

  // 3. Re-partition employees back to their correct organizations
  // NFVS employees (Venture Studio)
  const nfvsEmployeeEmails = [
    "admin.a@apex.internal",
    "ceo.a@apex.internal",
    "cfo.a@apex.internal",
    "cmo.a@apex.internal",
    "coo.a@apex.internal",
    "cto.a@apex.internal",
    "hr.a@apex.internal",
    "admin@nfvs.internal",
    "ceo@nfvs.internal",
    "cfo@nfvs.internal",
    "cmo@nfvs.internal",
    "cto@nfvs.internal",
    "chairperson@nfvs.internal",
    "depthead@nfvs.internal",
    "manager@nfvs.internal",
    "nfvs@crm.com",
    "companya@crm.com",
    "director@enterprise.internal",
  ];

  // NAREE employees (Naree Foundation Non-Profit)
  const nareeEmployeeEmails = [
    "admin.b@beacon.internal",
    "ceo.b@beacon.internal",
    "cfo.b@beacon.internal",
    "cmo.b@beacon.internal",
    "coo.b@beacon.internal",
    "cto.b@beacon.internal",
    "hr.b@beacon.internal",
    "companyb@crm.com",
    "naree@crm.com",
    "atharvnarawade@gmail.com",
    "hr@crm.com",
  ];

  console.log("\n[3] Reassigning employees to Org 1 (Naree Foundation Venture Studio)...");
  for (const email of nfvsEmployeeEmails) {
    const emp = await prisma.employee.findFirst({ where: { email } });
    if (emp) {
      // Find matching dept in org 1 or default
      const dept = depts1.find((d) => d.name === emp.departmentName) || defaultDept1;
      await prisma.employee.update({
        where: { id: emp.id },
        data: {
          organizationId: org1.id,
          departmentId: dept.id,
        },
      });
      console.log(`  -> Assigned ${emp.firstName} ${emp.lastName} (${email}) to NFVS`);
    }
  }

  console.log("\n[4] Reassigning employees to Org 2 (Naree Foundation)...");
  for (const email of nareeEmployeeEmails) {
    const emp = await prisma.employee.findFirst({ where: { email } });
    if (emp) {
      const dept = depts2.find((d) => d.name === emp.departmentName) || defaultDept2;
      await prisma.employee.update({
        where: { id: emp.id },
        data: {
          organizationId: org2.id,
          departmentId: dept.id,
        },
      });
      console.log(`  -> Assigned ${emp.firstName} ${emp.lastName} (${email}) to NAREE`);
    }
  }

  // 4. Ensure memberships for multi-company users
  console.log("\n[5] Ensuring multi-company memberships...");
  const superAdminRole = await prisma.role.findFirst({ where: { code: "SUPER_ADMIN" } });
  const ceoRole = await prisma.role.findFirst({ where: { code: "CEO" } });
  const hrRole = await prisma.role.findFirst({ where: { code: "HR" } });

  const multiCompanyUserEmails = [
    "atharva@gmail.com",
    "superadmin@nfvs.internal",
    "prasadpilke23@gmail.com",
    "kalesayali318@gmail.com",
    "atharvnarawade@gmail.com",
    "hr.b@beacon.internal",
  ];

  for (const email of multiCompanyUserEmails) {
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (user) {
      const roleId = user.roleId || superAdminRole?.id;

      // Ensure membership in Org 1
      await prisma.userCompanyMembership.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: org1.id,
          },
        },
        update: { status: "ACTIVE", roleId },
        create: {
          userId: user.id,
          organizationId: org1.id,
          roleId,
          isPrimary: email.includes("nfvs") || email.includes("apex"),
          status: "ACTIVE",
        },
      });

      // Ensure membership in Org 2
      await prisma.userCompanyMembership.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: org2.id,
          },
        },
        update: { status: "ACTIVE", roleId },
        create: {
          userId: user.id,
          organizationId: org2.id,
          roleId,
          isPrimary: email.includes("beacon") || email.includes("naree") || email.includes("atharv"),
          status: "ACTIVE",
        },
      });

      console.log(`  -> Configured multi-company memberships for ${email}`);
    }
  }

  // 5. Seed some distinct tasks, clients, and leads for both companies to verify 100% data isolation
  console.log("\n[6] Ensuring distinct tasks and operations...");

  // Check tasks in Org 1
  const tasksOrg1 = await prisma.task.count({ where: { organizationId: org1.id } });
  if (tasksOrg1 === 0) {
    const creator1 = await prisma.employee.findFirst({ where: { organizationId: org1.id } });
    if (creator1) {
      await prisma.task.create({
        data: {
          organizationId: org1.id,
          title: "Venture Portfolio Review: AI Healthtech Series A Due Diligence",
          description: "Assess tech stack scalability, IP validity, and burn rate runway for Q4 cohort.",
          priority: "URGENT",
          status: "IN_PROGRESS",
          creatorId: creator1.id,
          assigneeId: creator1.id,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      });
      await prisma.task.create({
        data: {
          organizationId: org1.id,
          title: "Sprint 14 Architecture Milestone: Multi-Tenant Database Sharding",
          description: "Implement connection pooling and tenant boundary enforcement for incubator clients.",
          priority: "HIGH",
          status: "TODO",
          creatorId: creator1.id,
          assigneeId: creator1.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      console.log("  -> Created 2 Venture Studio specific tasks for Org 1");
    }
  }

  // Check tasks in Org 2
  const tasksOrg2 = await prisma.task.count({ where: { organizationId: org2.id } });
  if (tasksOrg2 <= 1) {
    const creator2 = await prisma.employee.findFirst({ where: { organizationId: org2.id } });
    if (creator2) {
      await prisma.task.create({
        data: {
          organizationId: org2.id,
          title: "Community Outreach: Maharashtra Rural Health & Education Drive",
          description: "Coordinate with local NGO partners to deploy medical supplies and educational kits.",
          priority: "HIGH",
          status: "IN_PROGRESS",
          creatorId: creator2.id,
          assigneeId: creator2.id,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      });
      await prisma.task.create({
        data: {
          organizationId: org2.id,
          title: "CSR Grant Utilization Audit & Donor Impact Reporting",
          description: "Compile social impact metrics and financial ledger for European non-profit donor review.",
          priority: "URGENT",
          status: "TODO",
          creatorId: creator2.id,
          assigneeId: creator2.id,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      });
      console.log("  -> Created 2 Social Impact specific tasks for Org 2");
    }
  }

  // Final summary verification
  const count1 = await prisma.employee.count({ where: { organizationId: org1.id } });
  const count2 = await prisma.employee.count({ where: { organizationId: org2.id } });
  const tasksCount1 = await prisma.task.count({ where: { organizationId: org1.id } });
  const tasksCount2 = await prisma.task.count({ where: { organizationId: org2.id } });

  console.log("\n================================================================================");
  console.log("DATA RE-PARTITIONING COMPLETE");
  console.log("================================================================================");
  console.log(`• Naree Foundation Venture Studio (NFVS): ${count1} Employees, ${tasksCount1} Tasks`);
  console.log(`• Naree Foundation (NAREE):             ${count2} Employees, ${tasksCount2} Tasks`);
  console.log("================================================================================\n");
}

main()
  .catch((e) => {
    console.error("Error executing partition script:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
