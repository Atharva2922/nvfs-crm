import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== SEEDING SAMPLE WORKLOAD FOR AVAILABILITY TESTING ===\n");

  const orgs = await prisma.organization.findMany({
    where: { status: "ACTIVE" },
  });

  const nfvsOrg = orgs.find((o) => o.code === "NFVS");
  const nareeOrg = orgs.find((o) => o.code === "NAREE");

  if (!nfvsOrg || !nareeOrg) {
    throw new Error("Active NFVS and NAREE organizations not found!");
  }

  // 1. Assign 2 active tasks to Catherine Wright (CEO of Naree) or Thomas Hayes (COO of Naree)
  const nareeEmployees = await prisma.employee.findMany({
    where: { organizationId: nareeOrg.id },
  });

  const catherine = nareeEmployees.find((e) => e.firstName === "Catherine" || e.lastName === "Wright");
  const thomas = nareeEmployees.find((e) => e.firstName === "Thomas" || e.lastName === "Hayes");

  if (catherine) {
    const existing = await prisma.task.findFirst({
      where: { assigneeId: catherine.id, status: "IN_PROGRESS" },
    });
    if (!existing) {
      await prisma.task.create({
        data: {
          organizationId: nareeOrg.id,
          title: "Coordinate Healthcare Strategic Grant with Ministry",
          description: "Review grant proposal documents and prepare clinical partnership response.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          assigneeId: catherine.id,
          creatorId: catherine.id,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      });
      console.log(`✓ Assigned active task to ${catherine.firstName} ${catherine.lastName} (now BUSY)`);
    }
  }

  if (thomas) {
    const existing = await prisma.task.findFirst({
      where: { assigneeId: thomas.id, status: "TODO" },
    });
    if (!existing) {
      await prisma.task.create({
        data: {
          organizationId: nareeOrg.id,
          title: "Clinical Field Equipment Inspection & Logistics Audit",
          description: "Conduct bi-weekly inspection of deployed medical units.",
          status: "TODO",
          priority: "MEDIUM",
          assigneeId: thomas.id,
          creatorId: thomas.id,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      });
      console.log(`✓ Assigned active task to ${thomas.firstName} ${thomas.lastName} (now BUSY)`);
    }
  }

  // 2. In NFVS, assign a task to Rohan Mehta
  const nfvsEmployees = await prisma.employee.findMany({
    where: { organizationId: nfvsOrg.id },
  });
  const rohan = nfvsEmployees.find((e) => e.firstName === "Rohan" || e.lastName === "Mehta");
  if (rohan) {
    const existing = await prisma.task.findFirst({
      where: { assigneeId: rohan.id, status: "IN_PROGRESS" },
    });
    if (!existing) {
      await prisma.task.create({
        data: {
          organizationId: nfvsOrg.id,
          title: "Sprint 42 Architecture Review & Cloud Deploy",
          description: "Oversee cloud deployment pipeline migration.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          assigneeId: rohan.id,
          creatorId: rohan.id,
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        },
      });
      console.log(`✓ Assigned active task to ${rohan.firstName} ${rohan.lastName} (now BUSY)`);
    }
  }

  console.log("\n✓ Workload seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
