import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  console.log("Organization:", org?.name, org?.id);

  const depts = await prisma.department.findMany({ where: { organizationId: org?.id } });
  console.log("\n=== DEPARTMENTS ===");
  depts.forEach((d) => console.log(`- ${d.name} (${d.code}) id: ${d.id}`));

  const roles = await prisma.role.findMany({
    orderBy: { level: "desc" },
    include: { _count: { select: { rolePermissions: true } } },
  });
  console.log("\n=== ALL ROLES ===");
  roles.forEach((r) => {
    console.log(`- ${r.code.padEnd(18)} | Level: ${String(r.level).padStart(3)} | Permissions: ${String(r._count.rolePermissions).padStart(3)} | Name: ${r.name}`);
  });

  const users = await prisma.user.findMany({
    include: {
      role: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          department: { select: { name: true } },
        },
      },
    },
  });
  console.log(`\n=== CURRENT USERS (${users.length}) ===`);
  users.forEach((u) => {
    console.log(
      `- Email: ${(u.email || "").padEnd(30)} | Role: ${u.role.code.padEnd(16)} | User Name: ${(u.name || "").padEnd(20)} | Emp: ${
        u.employee
          ? `${u.employee.firstName} ${u.employee.lastName} [${u.employee.designation} in ${u.employee.department?.name}]`
          : "NO EMPLOYEE"
      }`
    );
  });

  const employees = await prisma.employee.findMany({
    take: 15,
    include: { department: { select: { name: true } }, user: { select: { email: true } } },
  });
  console.log(`\n=== SAMPLE EMPLOYEES (${employees.length}) ===`);
  employees.forEach((e) => {
    console.log(
      `- Emp: ${e.firstName} ${e.lastName} | Desig: ${e.designation} | Dept: ${e.department?.name} | Linked User: ${
        e.user?.email || "None"
      }`
    );
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
