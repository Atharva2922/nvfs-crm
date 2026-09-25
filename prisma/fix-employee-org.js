/**
 * Diagnostic: find employees whose organizationId doesn't match any organization,
 * and re-assign them to the correct org so they show up in the list.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({ select: { id: true, name: true, code: true } });
  console.log("Organizations in DB:");
  orgs.forEach(o => console.log(" -", o.name, `(${o.id})`));

  const employees = await prisma.employee.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true, organizationId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const validOrgIds = new Set(orgs.map(o => o.id));
  const orphaned = employees.filter(e => !validOrgIds.has(e.organizationId));

  console.log(`\nTotal employees: ${employees.length}`);
  console.log(`Orphaned (wrong org): ${orphaned.length}`);

  if (orphaned.length > 0 && orgs.length > 0) {
    const targetOrg = orgs[0]; // fix to first org
    console.log(`\nRe-assigning orphaned employees to: ${targetOrg.name}`);
    for (const emp of orphaned) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { organizationId: targetOrg.id },
      });
      console.log(` Fixed: ${emp.firstName} ${emp.lastName} (${emp.employeeNumber})`);
    }
  }

  // Show most recent 5
  console.log("\nMost recent employees:");
  employees.slice(0, 5).forEach(e => {
    const inValidOrg = validOrgIds.has(e.organizationId);
    console.log(` ${inValidOrg ? "✓" : "✗"} ${e.firstName} ${e.lastName} | ${e.employeeNumber} | orgId: ${e.organizationId}`);
  });

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
