import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding simple company login accounts...");

  const companyA = await prisma.organization.findFirst({
    where: { code: "APEX-TECH" },
  });
  const companyB = await prisma.organization.findFirst({
    where: { code: "BEACON-BIO" },
  });

  if (!companyA || !companyB) {
    console.error("Organizations not found. Please run seed-multi-company.mjs first.");
    return;
  }

  const ceoRole = await prisma.role.findFirst({ where: { code: "CEO" } });
  if (!ceoRole) {
    console.error("CEO role not found");
    return;
  }

  const passwordHash = await bcrypt.hash("password", 10);

  // 1. Company A simple user
  const userA = await prisma.user.upsert({
    where: { email: "companya@crm.com" },
    update: { passwordHash, roleId: ceoRole.id, isActive: true },
    create: {
      email: "companya@crm.com",
      passwordHash,
      roleId: ceoRole.id,
      isActive: true,
    },
  });

  await prisma.userCompanyMembership.upsert({
    where: {
      userId_organizationId: {
        userId: userA.id,
        organizationId: companyA.id,
      },
    },
    update: { roleId: ceoRole.id, isPrimary: true, status: "ACTIVE" },
    create: {
      userId: userA.id,
      organizationId: companyA.id,
      roleId: ceoRole.id,
      isPrimary: true,
      status: "ACTIVE",
    },
  });

  let empA = await prisma.employee.findFirst({
    where: { organizationId: companyA.id, email: "companya@crm.com" },
  });
  if (!empA) {
    const deptA = await prisma.department.findFirst({ where: { organizationId: companyA.id } });
    empA = await prisma.employee.create({
      data: {
        organizationId: companyA.id,
        departmentId: deptA?.id || null,
        userId: userA.id,
        employeeNumber: "APEX-0099",
        firstName: "Company A",
        lastName: "Executive",
        email: "companya@crm.com",
        designation: "Managing Director",
        employmentType: "FULL_TIME",
        employmentStatus: "ACTIVE",
        hireDate: new Date("2024-01-01"),
      },
    });
  }

  // 2. Company B simple user
  const userB = await prisma.user.upsert({
    where: { email: "companyb@crm.com" },
    update: { passwordHash, roleId: ceoRole.id, isActive: true },
    create: {
      email: "companyb@crm.com",
      passwordHash,
      roleId: ceoRole.id,
      isActive: true,
    },
  });

  await prisma.userCompanyMembership.upsert({
    where: {
      userId_organizationId: {
        userId: userB.id,
        organizationId: companyB.id,
      },
    },
    update: { roleId: ceoRole.id, isPrimary: true, status: "ACTIVE" },
    create: {
      userId: userB.id,
      organizationId: companyB.id,
      roleId: ceoRole.id,
      isPrimary: true,
      status: "ACTIVE",
    },
  });

  let empB = await prisma.employee.findFirst({
    where: { organizationId: companyB.id, email: "companyb@crm.com" },
  });
  if (!empB) {
    const deptB = await prisma.department.findFirst({ where: { organizationId: companyB.id } });
    empB = await prisma.employee.create({
      data: {
        organizationId: companyB.id,
        departmentId: deptB?.id || null,
        userId: userB.id,
        employeeNumber: "BEO-0099",
        firstName: "Company B",
        lastName: "Executive",
        email: "companyb@crm.com",
        designation: "Managing Director",
        employmentType: "FULL_TIME",
        employmentStatus: "ACTIVE",
        hireDate: new Date("2024-01-01"),
      },
    });
  }

  console.log("✓ Successfully seeded:");
  console.log("  - Company 1 (Apex Global Technologies): 'companya' / 'companya@crm.com', password: 'password'");
  console.log("  - Company 2 (Beacon Health & BioSystems): 'companyb' / 'companyb@crm.com', password: 'password'");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
