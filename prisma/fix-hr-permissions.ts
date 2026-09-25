import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Granting HR role employee permissions...");

  // Find HR role
  const hrRole = await prisma.role.findFirst({ where: { code: "HR" } });
  if (!hrRole) {
    throw new Error("HR role not found in database. Please run the seed first.");
  }
  console.log(`Found HR role: ${hrRole.name} (${hrRole.id})`);

  // Permissions to grant to HR
  const permissionsToGrant = [
    "employees.employee.create",
    "employees.employee.update",
    "employees.employee.delete",
    "employees.employee.read",
    "organization.department.read",
    "organization.department.manage",
    "hr.leave.read",
    "hr.leave.create",
    "hr.leave.approve",
    "hr.attendance.read",
    "hr.attendance.record",
    "hr.workdays.manage",
    "hr.policies.read",
    "hr.policies.manage",
    "hr.compliance.read",
    "hr.compliance.manage",
    "payroll.structure.read",
    "payroll.structure.manage",
    "payroll.salary.read",
    "payroll.salary.manage",
    "payroll.period.manage",
    "payroll.payslip.read_own",
    "audit.log.read",
  ];

  let granted = 0;
  let alreadyHad = 0;

  for (const code of permissionsToGrant) {
    const permission = await prisma.permission.findFirst({ where: { code } });
    if (!permission) {
      console.warn(`  ⚠️  Permission not found: ${code} — skipping`);
      continue;
    }

    // Check if already assigned
    const existing = await prisma.rolePermission.findFirst({
      where: { roleId: hrRole.id, permissionId: permission.id },
    });

    if (existing) {
      alreadyHad++;
      console.log(`  ✓ Already has: ${code}`);
    } else {
      await prisma.rolePermission.create({
        data: { roleId: hrRole.id, permissionId: permission.id },
      });
      granted++;
      console.log(`  ✅ Granted: ${code}`);
    }
  }

  console.log(`\n✅ Done! Granted ${granted} new permissions. ${alreadyHad} were already assigned.`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
