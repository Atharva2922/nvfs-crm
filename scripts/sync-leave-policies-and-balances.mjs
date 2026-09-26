import { PrismaClient } from "@prisma/client";

import "dotenv/config";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
  log: ["error", "warn"],
});

async function main() {
  console.log("=== SYNCING LEAVE POLICIES AND RESETTING BALANCES ===");

  const orgs = await prisma.organization.findMany();
  console.log("Found organizations:", orgs.map((o) => `${o.name} (${o.code})`));

  // Medical Leave = 2, Emergency Leave = 2 as requested by user
  const standardPolicies = [
    { code: "CL", name: "Casual Leave", annualAllowance: 12, monthlyLimit: 2, description: "Standard planned personal or casual leave" },
    { code: "EL", name: "Emergency Leave", annualAllowance: 2, monthlyLimit: 1, description: "Short-notice urgent or critical family emergency" },
    { code: "ML", name: "Medical Leave", annualAllowance: 2, monthlyLimit: null, description: "Health-related leave requiring medical recovery" },
    { code: "LWP", name: "Leave Without Pay", annualAllowance: 0, monthlyLimit: null, description: "Unpaid sabbatical or extended personal absence" },
    { code: "C_OFF", name: "Compensatory Off", annualAllowance: 0, monthlyLimit: null, description: "Compensatory rest for extra weekend or holiday work" },
    { code: "HDW", name: "Holiday Working", annualAllowance: 0, monthlyLimit: null, description: "Duty assigned on an official public holiday" },
  ];

  // 1. Upsert policies for each organization
  for (const org of orgs) {
    console.log(`Setting policies for organization: ${org.name} (${org.code})...`);
    for (const sp of standardPolicies) {
      const existing = await prisma.leavePolicy.findUnique({
        where: {
          organizationId_code: {
            organizationId: org.id,
            code: sp.code,
          },
        },
      });

      if (existing) {
        await prisma.leavePolicy.update({
          where: { id: existing.id },
          data: {
            name: sp.name,
            annualAllowance: sp.annualAllowance,
            monthlyLimit: sp.monthlyLimit,
            description: sp.description,
          },
        });
      } else {
        await prisma.leavePolicy.create({
          data: {
            organizationId: org.id,
            code: sp.code,
            name: sp.name,
            annualAllowance: sp.annualAllowance,
            monthlyLimit: sp.monthlyLimit,
            description: sp.description,
          },
        });
      }
    }
  }

  // 2. Fetch all employees
  const employees = await prisma.employee.findMany({
    where: { employmentStatus: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true, organizationId: true },
  });
  console.log(`Found ${employees.length} active employees. Resetting 2026 balances...`);

  // 3. For each employee, reset balances
  for (const emp of employees) {
    const policies = await prisma.leavePolicy.findMany({
      where: { organizationId: emp.organizationId },
    });

    for (const pol of policies) {
      const existing = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leavePolicyId_year: {
            employeeId: emp.id,
            leavePolicyId: pol.id,
            year: 2026,
          },
        },
      });

      if (existing) {
        await prisma.leaveBalance.update({
          where: { id: existing.id },
          data: {
            allocated: pol.annualAllowance,
            used: 0,
            pending: 0,
            remaining: pol.annualAllowance,
          },
        });
      } else {
        await prisma.leaveBalance.create({
          data: {
            employeeId: emp.id,
            leavePolicyId: pol.id,
            year: 2026,
            allocated: pol.annualAllowance,
            used: 0,
            pending: 0,
            remaining: pol.annualAllowance,
          },
        });
      }
    }
  }

  const count = await prisma.leaveBalance.count({ where: { year: 2026 } });
  console.log(`SUCCESS: Total 2026 Leave Balances now in DB: ${count}`);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
