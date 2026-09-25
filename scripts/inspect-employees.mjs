import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const orgs = await prisma.organization.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, code: true },
  });
  console.log("Active Orgs:", orgs);
  for (const org of orgs) {
    const employees = await prisma.employee.findMany({
      where: { organizationId: org.id },
      include: {
        department: true,
        assignedTasks: { where: { status: { in: ["TODO", "IN_PROGRESS"] } } },
        operationAssignments: true,
      },
    });
    console.log(`\n--- Org: ${org.name} (${org.code}) Employees count: ${employees.length}`);
    employees.forEach((e) => {
      console.log(
        ` - [${e.id}] ${e.firstName} ${e.lastName} | ${e.designation} | dept: ${e.department?.name} | tasks: ${e.assignedTasks.length} | ops: ${e.operationAssignments.length} | status: ${e.employmentStatus}`
      );
    });
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
