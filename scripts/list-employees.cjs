const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const employees = await db.employee.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      employeeNumber: true,
      employmentStatus: true,
      organization: { select: { name: true } },
    },
    orderBy: [{ organization: { name: "asc" } }, { lastName: "asc" }],
  });

  console.log(`\nTotal employees: ${employees.length}\n`);
  employees.forEach((e) => {
    console.log(`[${e.organization?.name || "?"}] ${e.employeeNumber} | ${e.firstName} ${e.lastName} | ${e.designation} | ${e.employmentStatus}`);
  });

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
