const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

// Map role code to designation title
const ROLE_DESIGNATIONS = {
  CEO: "Chief Executive Officer",
  CFO: "Chief Financial Officer",
  CTO: "Chief Technology Officer",
  COO: "Chief Operating Officer",
  CMO: "Chief Marketing Officer",
  HR: "Chief Human Resources Officer",
  ADMIN: "Platform Administrator",
  CHAIRPERSON: "Chairperson of the Board",
  MANAGER: "Operations Manager",
  DEPARTMENT_HEAD: "Department Head",
};

// Map role code to department code
const ROLE_DEPT_CODE = {
  CEO: "EXEC",
  CHAIRPERSON: "EXEC",
  CFO: "FIN",
  CTO: "ENG",
  COO: "OPS",
  CMO: "MKT",
  HR: "HR",
  ADMIN: "OPS",
  MANAGER: "OPS",
  DEPARTMENT_HEAD: "OPS",
};

// Derive first/last name from email local part
function parseName(email) {
  const local = email.split("@")[0];
  const parts = local.replace(/[._-]/g, " ").trim().split(/\s+/);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const firstName = cap(parts[0]);
  const lastName = parts.length > 1 ? parts.slice(1).map(cap).join(" ") : "User";
  return { firstName, lastName };
}

let empCounter = 1;
function genEmpNumber(roleCode, orgCode) {
  return `${orgCode}-${roleCode}-${String(empCounter++).padStart(3, "0")}`;
}

async function main() {
  console.log("=== Creating Employee Records for Key Role Users ===\n");

  const TARGET_ROLES = ["CEO", "CFO", "CTO", "COO", "CMO", "HR", "ADMIN", "CHAIRPERSON", "MANAGER", "DEPARTMENT_HEAD"];

  // Fetch users
  const users = await db.user.findMany({
    where: { role: { code: { in: TARGET_ROLES } }, isActive: true },
    include: {
      role: true,
      memberships: {
        include: { organization: { include: { departments: true } } },
        orderBy: { isPrimary: "desc" },
      },
    },
    orderBy: [{ role: { code: "asc" } }, { email: "asc" }],
  });
  console.log(`Found ${users.length} users to process\n`);

  // Fetch all orgs with departments as fallback
  const allOrgs = await db.organization.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: { departments: true },
  });

  // Manual email -> org code mapping for users with no membership
  const EMAIL_ORG_MAP = {
    "nfvs@crm.com": "NFVS",
    "naree@crm.com": "NAREE",
    "hr@crm.com": "NFVS",
    "ceo@nfvs.internal": "NFVS",
    "cfo@nfvs.internal": "NFVS",
    "cto@nfvs.internal": "NFVS",
    "coo.a@apex.internal": "NFVS",
    "coo.b@beacon.internal": "NAREE",
    "cmo@nfvs.internal": "NFVS",
    "hr.a@apex.internal": "NFVS",
    "hr.b@beacon.internal": "NAREE",
    "admin@nfvs.internal": "NFVS",
    "chairperson@nfvs.internal": "NFVS",
    "depthead@nfvs.internal": "NFVS",
    "manager@nfvs.internal": "NFVS",
  };

  const created = [];
  const skipped = [];

  for (const user of users) {
    const roleCode = user.role.code;

    // Determine target org
    let org = null;
    let depts = [];

    if (user.memberships.length > 0) {
      org = user.memberships[0].organization;
      depts = org.departments || [];
    }

    if (!org) {
      const mappedCode = EMAIL_ORG_MAP[user.email];
      if (mappedCode) {
        const found = allOrgs.find(o => o.code === mappedCode);
        if (found) { org = found; depts = found.departments || []; }
      }
    }

    // Default to NFVS if still nothing
    if (!org) {
      const nfvs = allOrgs.find(o => o.code === "NFVS");
      if (nfvs) { org = nfvs; depts = nfvs.departments || []; }
    }

    if (!org) {
      skipped.push({ email: user.email, reason: "No organization found" });
      continue;
    }

    // Find appropriate department
    const deptCode = ROLE_DEPT_CODE[roleCode] || "OPS";
    const dept = depts.find(d => d.code === deptCode) || depts.find(d => d.code === "OPS") || depts[0];

    if (!dept) {
      skipped.push({ email: user.email, reason: `No dept in ${org.name}` });
      continue;
    }

    const { firstName, lastName } = parseName(user.email);
    const designation = ROLE_DESIGNATIONS[roleCode] || roleCode;
    const empNumber = genEmpNumber(roleCode, org.code);

    try {
      const emp = await db.employee.create({
        data: {
          employeeNumber: empNumber,
          firstName,
          lastName,
          email: user.email,
          designation,
          employmentStatus: "ACTIVE",
          employmentType: "FULL_TIME",
          hireDate: new Date("2024-01-01"),
          organizationId: org.id,
          departmentId: dept.id,
          userId: user.id,
        },
      });
      created.push(emp.employeeNumber);
      console.log(`✅ [${org.code}] ${roleCode} | ${firstName} ${lastName} | ${designation} | ${dept.name} | Emp#${empNumber}`);
    } catch (err) {
      if (err.code === "P2002") {
        skipped.push({ email: user.email, reason: "Already linked to an employee" });
        console.log(`⏭  Skipped (duplicate): ${user.email}`);
      } else {
        skipped.push({ email: user.email, reason: err.message });
        console.log(`❌ Error for ${user.email}: ${err.message}`);
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`✅ Created: ${created.length} employee records`);
  if (skipped.length > 0) {
    console.log(`⏭  Skipped: ${skipped.length}`);
    skipped.forEach(s => console.log(`   - ${s.email}: ${s.reason}`));
  }

  const total = await db.employee.count();
  console.log(`\nTotal employees in DB: ${total}`);

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("Fatal:", e.message);
  await db.$disconnect();
  process.exit(1);
});
