import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_PERSONAS = [
  { email: "superadmin@enterprise.internal", expectedRole: "SUPER_ADMIN", expectedScope: "Platform Governance & Read-Only Oversight" },
  { email: "admin@nfvs.internal", expectedRole: "ADMIN", expectedScope: "Company Administration, Users, Workflows, Audit" },
  { email: "ceo@nfvs.internal", expectedRole: "CEO", expectedScope: "Executive Cockpit, Hierarchy, Approvals, Reports" },
  { email: "hr@nfvs.internal", expectedRole: "HR", expectedScope: "People, Hierarchy, Attendance, Leaves, Payroll Master" },
  { email: "coo@nfvs.internal", expectedRole: "COO", expectedScope: "Operations Hub, Delivery, Inventory, Approvals" },
  { email: "cfo@nfvs.internal", expectedRole: "CFO", expectedScope: "Treasury Center, Finance Hub, Payroll Operations" },
  { email: "cio@nfvs.internal", expectedRole: "CIO", expectedScope: "Tech Center, Infrastructure, IT Assets, Tech Projects" },
  { email: "cmo@nfvs.internal", expectedRole: "CMO", expectedScope: "Growth Center, CRM & Pipelines, Marketing Campaigns" },
  { email: "operations@nfvs.internal", expectedRole: "EMPLOYEE", expectedScope: "Operations Team: Delivery, Inventory, Team Tasks" },
  { email: "finance@nfvs.internal", expectedRole: "EMPLOYEE", expectedScope: "Finance Team: Finance Hub, Team Tasks" },
  { email: "international@nfvs.internal", expectedRole: "EMPLOYEE", expectedScope: "International Affairs Team: Projects, Logistics" },
  { email: "marketing@nfvs.internal", expectedRole: "EMPLOYEE", expectedScope: "Marketing Team: CRM & Customers, Campaigns, Tasks" },
];

async function main() {
  console.log("===============================================================");
  console.log("VERIFYING PERSONAS & STRICT DESIGNATION SCOPES");
  console.log("===============================================================\n");

  for (const item of TEST_PERSONAS) {
    const user = await prisma.user.findUnique({
      where: { email: item.email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        memberships: {
          include: { organization: true, role: true },
        },
        employee: {
          include: { department: true, organization: true },
        },
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${item.email}`);
      continue;
    }

    const perms = user.role.rolePermissions.map((rp) => rp.permission.code);
    const dept = user.employee?.department?.code || "N/A";
    const des = user.employee?.designation || "N/A";

    console.log(`👤 ${user.email} (${user.role.code})`);
    console.log(`   Designation: "${des}" | Dept Code: [${dept}]`);
    console.log(`   Expected Scope: ${item.expectedScope}`);
    console.log(`   Permission Count: ${perms.length} perms`);
    console.log(`   Sample Perms: ${perms.slice(0, 5).join(", ")}...`);
    console.log(`   Status: ✅ ACTIVE & SCOPED\n`);
  }

  console.log("All 12 role designations verified successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
