import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== PROVISIONING NAREE COMPANIES & USERS ===\n");

  const passwordHash = await bcrypt.hash("password", 10);

  // 1. Find CEO role
  const ceoRole = await prisma.role.findFirst({
    where: { code: "CEO" },
  });

  if (!ceoRole) {
    throw new Error("CEO role not found in database!");
  }

  // 2. Setup Company 1: Naree Foundation Venture Studio
  const existingOrg1 = await prisma.organization.findFirst({
    where: {
      OR: [
        { code: "NFVS" },
        { code: "APEX-TECH" },
        { name: { contains: "Venture Studio", mode: "insensitive" } },
      ],
    },
  });

  let org1;
  if (existingOrg1) {
    org1 = await prisma.organization.update({
      where: { id: existingOrg1.id },
      data: {
        name: "Naree Foundation Venture Studio",
        legalName: "Naree Foundation Venture Studio",
        code: "NFVS",
        primaryColor: "#2563eb",
        status: "ACTIVE",
        industry: "Venture Capital & Technology Incubation",
      },
    });
    console.log("✓ Updated Company 1:", org1.name, `(${org1.code}) [ID: ${org1.id}]`);
  } else {
    org1 = await prisma.organization.create({
      data: {
        name: "Naree Foundation Venture Studio",
        legalName: "Naree Foundation Venture Studio",
        code: "NFVS",
        primaryColor: "#2563eb",
        status: "ACTIVE",
        industry: "Venture Capital & Technology Incubation",
      },
    });
    console.log("✓ Created Company 1:", org1.name, `(${org1.code}) [ID: ${org1.id}]`);
  }

  // 3. Setup Company 2: Naree Foundation
  const existingOrg2 = await prisma.organization.findFirst({
    where: {
      OR: [
        { code: "NAREE" },
        { code: "BEACON-BIO" },
        { name: { contains: "Naree Foundation", mode: "insensitive" }, code: { not: "NFVS" } },
      ],
    },
  });

  let org2;
  if (existingOrg2 && existingOrg2.id !== org1.id) {
    org2 = await prisma.organization.update({
      where: { id: existingOrg2.id },
      data: {
        name: "Naree Foundation",
        legalName: "Naree Foundation",
        code: "NAREE",
        primaryColor: "#10b981",
        status: "ACTIVE",
        industry: "Non-Profit & Social Impact",
      },
    });
    console.log("✓ Updated Company 2:", org2.name, `(${org2.code}) [ID: ${org2.id}]`);
  } else {
    org2 = await prisma.organization.create({
      data: {
        name: "Naree Foundation",
        legalName: "Naree Foundation",
        code: "NAREE",
        primaryColor: "#10b981",
        status: "ACTIVE",
        industry: "Non-Profit & Social Impact",
      },
    });
    console.log("✓ Created Company 2:", org2.name, `(${org2.code}) [ID: ${org2.id}]`);
  }

  // 4. Clean up any other organizations (deactivate/archive) so ONLY these 2 are active
  const otherOrgs = await prisma.organization.updateMany({
    where: {
      id: { notIn: [org1.id, org2.id] },
    },
    data: {
      status: "SUSPENDED",
    },
  });
  console.log(`✓ Deactivated ${otherOrgs.count} other organizations`);

  // 5. Find or create Department for both companies
  let dept1 = await prisma.department.findFirst({
    where: { organizationId: org1.id },
  });
  if (!dept1) {
    dept1 = await prisma.department.create({
      data: {
        organizationId: org1.id,
        name: "Executive Office",
        code: "EXEC_NFVS",
      },
    });
  }

  let dept2 = await prisma.department.findFirst({
    where: { organizationId: org2.id },
  });
  if (!dept2) {
    dept2 = await prisma.department.create({
      data: {
        organizationId: org2.id,
        name: "Executive Office",
        code: "EXEC_NAREE",
      },
    });
  }

  // 6. Provision / update Company 1 CEO User: nfvs@crm.com and companya@crm.com
  const emailsCompany1 = ["nfvs@crm.com", "companya@crm.com"];
  for (const email of emailsCompany1) {
    let user1 = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user1) {
      user1 = await prisma.user.create({
        data: {
          email,
          passwordHash,
          roleId: ceoRole.id,
          isActive: true,
        },
        include: { employee: true },
      });
    } else {
      await prisma.user.update({
        where: { id: user1.id },
        data: { passwordHash, roleId: ceoRole.id, isActive: true },
      });
    }

    if (!user1.employee) {
      await prisma.employee.create({
        data: {
          userId: user1.id,
          email,
          organizationId: org1.id,
          departmentId: dept1.id,
          employeeNumber: `NFVS-CEO-${email.startsWith("nfvs") ? "01" : "02"}`,
          firstName: "Venture Studio",
          lastName: "Executive",
          designation: "CEO / Managing Director",
          hireDate: new Date(),
          employmentStatus: "ACTIVE",
          workMode: "HYBRID",
        },
      });
    } else {
      await prisma.employee.update({
        where: { id: user1.employee.id },
        data: {
          organizationId: org1.id,
          departmentId: dept1.id,
          employmentStatus: "ACTIVE",
        },
      });
    }
  }
  console.log("✓ Provisioned Company 1 Login IDs: 'nfvs' and 'companya' (password: 'password')");

  // 7. Provision / update Company 2 CEO User: naree@crm.com and companyb@crm.com
  const emailsCompany2 = ["naree@crm.com", "companyb@crm.com"];
  for (const email of emailsCompany2) {
    let user2 = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user2) {
      user2 = await prisma.user.create({
        data: {
          email,
          passwordHash,
          roleId: ceoRole.id,
          isActive: true,
        },
        include: { employee: true },
      });
    } else {
      await prisma.user.update({
        where: { id: user2.id },
        data: { passwordHash, roleId: ceoRole.id, isActive: true },
      });
    }

    if (!user2.employee) {
      await prisma.employee.create({
        data: {
          userId: user2.id,
          email,
          organizationId: org2.id,
          departmentId: dept2.id,
          employeeNumber: `NAREE-CEO-${email.startsWith("naree") ? "01" : "02"}`,
          firstName: "Foundation",
          lastName: "Executive",
          designation: "Executive Director",
          hireDate: new Date(),
          employmentStatus: "ACTIVE",
          workMode: "HYBRID",
        },
      });
    } else {
      await prisma.employee.update({
        where: { id: user2.employee.id },
        data: {
          organizationId: org2.id,
          departmentId: dept2.id,
          employmentStatus: "ACTIVE",
        },
      });
    }
  }
  console.log("✓ Provisioned Company 2 Login IDs: 'naree' and 'companyb' (password: 'password')");

  console.log("\n✓ ALL COMPANIES & SIMPLE LOGINS PROVISIONED SUCCESSFULLY!");
}

main()
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
