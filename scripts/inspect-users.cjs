const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({
    where: {
      role: {
        code: { in: ["HR", "CEO", "ADMIN", "SUPER_ADMIN", "CFO", "CTO", "COO", "CMO", "CHAIRPERSON", "MANAGER", "DEPARTMENT_HEAD"] }
      }
    },
    select: {
      id: true,
      email: true,
      isActive: true,
      role: { select: { code: true, name: true } },
      memberships: {
        select: {
          organization: { select: { id: true, name: true, code: true } },
          isPrimary: true,
        }
      }
    },
    orderBy: [{ role: { code: "asc" } }, { email: "asc" }],
  });

  console.log(`\nUsers with key roles: ${users.length}\n`);
  users.forEach(u => {
    const orgs = u.memberships.map(m => `${m.organization.name} (${m.organization.code})${m.isPrimary ? " [PRIMARY]" : ""}`).join(", ");
    console.log(`  [${u.role?.code}] ${u.email}`);
    console.log(`    Orgs: ${orgs || "NONE"}\n`);
  });

  // Also show departments per org
  const depts = await db.department.findMany({
    select: { id: true, name: true, code: true, organization: { select: { name: true } } },
    orderBy: [{ organization: { name: "asc" } }, { name: "asc" }],
  });
  console.log(`\nDepartments (${depts.length}):`);
  depts.forEach(d => console.log(`  [${d.organization?.name}] ${d.code} | ${d.name}`));

  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
