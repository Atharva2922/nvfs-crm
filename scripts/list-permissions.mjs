import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } }
});

async function main() {
  const perms = await prisma.permission.findMany({ orderBy: { code: "asc" } });
  console.log(`Total permissions: ${perms.length}`);
  const byModule = {};
  for (const p of perms) {
    if (!byModule[p.module]) byModule[p.module] = [];
    byModule[p.module].push(p.code);
  }
  for (const [mod, list] of Object.entries(byModule)) {
    console.log(`\n[${mod}] (${list.length}):\n  ${list.join(", ")}`);
  }
}

main().finally(() => prisma.$disconnect());
