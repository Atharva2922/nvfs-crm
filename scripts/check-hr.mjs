import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkHr() {
  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { code: { contains: "HR" } },
        { name: { contains: "HR" } },
        { name: { contains: "Human" } },
      ],
    },
  });
  console.log("HR Roles:", roles);

  const hrUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "hr" } },
        { role: { code: { contains: "HR" } } },
      ],
    },
    include: {
      role: true,
      employee: {
        include: { organization: true, department: true },
      },
    },
  });
  console.log("HR Users:", hrUsers.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role.code,
    employee: u.employee ? {
      name: `${u.employee.firstName} ${u.employee.lastName}`,
      org: u.employee.organization.name,
      dept: u.employee.department?.name,
    } : null,
  })));
}

checkHr()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
