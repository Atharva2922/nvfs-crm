import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } }
});

async function main() {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: { permission: true }
      }
    },
    orderBy: { level: "desc" }
  });
  console.log("=== ROLE PERMISSIONS SUMMARY ===");
  for (const r of roles) {
    const modules = [...new Set(r.rolePermissions.map(rp => rp.permission.module))];
    console.log(`[${r.code}] (Lvl ${r.level}): ${r.rolePermissions.length} perms | Modules: ${modules.join(", ") || "NONE"}`);
  }
}

main().finally(() => prisma.$disconnect());
