import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== PROVISIONING HR LOGIN CREDENTIALS ===\n");
  const passwordHash = await bcrypt.hash("password", 10);

  // 1. Check or update Rachel Adams (NFVS HR)
  let hrNfvs = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "hr.a@apex.internal" },
        { email: "hr@crm.com" },
        { email: "hr_nfvs@crm.com" },
      ],
    },
    include: { employee: true, role: true },
  });

  if (hrNfvs) {
    await prisma.user.update({
      where: { id: hrNfvs.id },
      data: { passwordHash, isActive: true },
    });
    console.log(`✓ Updated NFVS HR user: ${hrNfvs.email} (Password set to 'password')`);
  }

  // Also ensure hr@crm.com exists for simple login
  let hrCrm = await prisma.user.findUnique({
    where: { email: "hr@crm.com" },
  });
  if (!hrCrm && hrNfvs) {
    // Create an alias user or update email
    console.log("Creating hr@crm.com...");
    const hrRole = await prisma.role.findFirst({ where: { code: "HR" } });
    if (hrRole) {
      await prisma.user.create({
        data: {
          email: "hr@crm.com",
          passwordHash,
          roleId: hrRole.id,
          isActive: true,
        },
      });
      console.log("✓ Created hr@crm.com user account");
    }
  }

  // 2. Check or update Chloe Bennett (Naree Foundation HR)
  let hrNaree = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "hr.b@beacon.internal" },
        { email: "hr_naree@crm.com" },
      ],
    },
    include: { employee: true, role: true },
  });

  if (hrNaree) {
    await prisma.user.update({
      where: { id: hrNaree.id },
      data: { passwordHash, isActive: true },
    });
    console.log(`✓ Updated Naree Foundation HR user: ${hrNaree.email} (Password set to 'password')`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
