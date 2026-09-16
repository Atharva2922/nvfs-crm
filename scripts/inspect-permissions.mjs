import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const perms = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { code: "asc" }],
  });
  console.log(`Total permissions in database: ${perms.length}`);
  const byModule = {};
  perms.forEach((p) => {
    byModule[p.module] = byModule[p.module] || [];
    byModule[p.module].push(p.code);
  });
  const roles = await prisma.role.findMany({
    orderBy: { level: "desc" },
    include: { rolePermissions: { include: { permission: true } } },
  });
  console.log("\n=== ROLE PERMISSIONS MAPPING ===");
  roles.forEach((r) => {
    console.log(`\nRole: ${r.code} (${r.name}) - Level: ${r.level} - Count: ${r.rolePermissions.length}`);
    console.log(r.rolePermissions.map((rp) => rp.permission.code).join(", ") || "(None)");
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
