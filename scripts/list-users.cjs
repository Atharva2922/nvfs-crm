const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      isActive: true,
      role: { select: { code: true, name: true } },
      employee: { select: { id: true, firstName: true } },
    },
    orderBy: { email: "asc" },
  });

  console.log(`\nTotal user accounts: ${users.length}\n`);
  users.forEach(u => {
    const empStatus = u.employee ? `has employee record: ${u.employee.firstName}` : "NO employee record (login only)";
    console.log(`  [${u.role?.code}] ${u.email} | active=${u.isActive} | ${empStatus}`);
  });

  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
