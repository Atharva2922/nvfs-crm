/**
 * Re-assign ATHARV NARAWADE and any other employees under the wrong org
 * to the correct company: "Naree Foundation"
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // The org the HR user is logged into (shown in screenshot)
  const targetOrg = await prisma.organization.findFirst({
    where: { name: { contains: "Naree Foundation", mode: "insensitive" }, NOT: { name: { contains: "Venture" } } },
  });

  if (!targetOrg) {
    console.log("Could not find Naree Foundation org. Available orgs:");
    const all = await prisma.organization.findMany();
    all.forEach(o => console.log(" -", o.id, o.name));
    return;
  }

  console.log("Target org:", targetOrg.name, "(", targetOrg.id, ")");

  // Find employees in the OTHER org (Venture Studio)
  const otherOrg = await prisma.organization.findFirst({
    where: { NOT: { id: targetOrg.id } },
  });

  if (!otherOrg) {
    console.log("Only one org found — nothing to fix.");
    return;
  }
  console.log("Source org (wrong):", otherOrg.name, "(", otherOrg.id, ")");

  // Get all employees in the wrong org
  const wrongEmp = await prisma.employee.findMany({
    where: { organizationId: otherOrg.id },
    select: { id: true, firstName: true, lastName: true, employeeNumber: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`\nEmployees in wrong org: ${wrongEmp.length}`);
  wrongEmp.forEach(e => console.log(` - ${e.firstName} ${e.lastName} (${e.employeeNumber})`));

  if (wrongEmp.length === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  // Move ALL of them to Naree Foundation
  const result = await prisma.employee.updateMany({
    where: { organizationId: otherOrg.id },
    data: { organizationId: targetOrg.id },
  });

  console.log(`\n✅ Migrated ${result.count} employees to "${targetOrg.name}"`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
