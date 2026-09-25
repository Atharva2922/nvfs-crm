import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const tasks = await prisma.task.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      organizationId: true,
      assignee: {
        select: {
          firstName: true,
          lastName: true,
          organization: { select: { name: true, code: true } },
        },
      },
    },
  });
  console.log("Tasks:", tasks);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
