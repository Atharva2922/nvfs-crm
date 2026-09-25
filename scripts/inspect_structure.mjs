import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: { select: { code: true, name: true, level: true } },
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          organization: { select: { code: true } },
          department: { select: { code: true, name: true } },
          manager: {
            select: {
              firstName: true,
              lastName: true,
              user: { select: { role: { select: { code: true } } } }
            }
          }
        }
      }
    }
  });
  console.log(`Total users: ${users.length}`);
  for (const u of users) {
    const emp = u.employee;
    const mgr = emp?.manager ? `${emp.manager.firstName} (${emp.manager.user?.role?.code})` : "None";
    console.log(`- [${u.role.code}] ${u.email} | ${emp?.firstName} ${emp?.lastName} | Org: ${emp?.organization?.code} | Dept: ${emp?.department?.code} | Mgr: ${mgr}`);
  }
}

main().finally(() => prisma.$disconnect());
