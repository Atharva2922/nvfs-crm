const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  // Print all available models on the client
  const models = Object.keys(db).filter(k => !k.startsWith("_") && !k.startsWith("$")).sort();
  console.log("Available Prisma models:\n" + models.join("\n"));
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
