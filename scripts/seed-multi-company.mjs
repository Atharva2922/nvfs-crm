// scripts/seed-multi-company.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "Enterprise@2026";

async function main() {
  console.log("================================================================================");
  console.log("PROVISIONING MULTI-COMPANY ENTERPRISE CRM PLATFORM");
  console.log("================================================================================\n");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. Fetch or ensure system roles
  console.log("[1] Checking System Roles...");
  const roleDefs = [
    { code: "SUPER_ADMIN", name: "Super Admin", level: 100, dataScope: "GLOBAL" },
    { code: "CHAIRPERSON", name: "Chairperson", level: 95, dataScope: "COMPANY" },
    { code: "CEO", name: "Chief Executive Officer", level: 90, dataScope: "COMPANY" },
    { code: "COO", name: "Chief Operating Officer", level: 85, dataScope: "COMPANY" },
    { code: "CFO", name: "Chief Financial Officer", level: 85, dataScope: "COMPANY" },
    { code: "CTO", name: "Chief Technology Officer", level: 85, dataScope: "COMPANY" },
    { code: "CMO", name: "Chief Marketing Officer", level: 85, dataScope: "COMPANY" },
    { code: "HR", name: "Chief Human Resources Officer", level: 80, dataScope: "COMPANY" },
    { code: "ADMIN", name: "Company Admin", level: 70, dataScope: "COMPANY" },
    { code: "DEPARTMENT_HEAD", name: "Department Head", level: 50, dataScope: "DEPARTMENT" },
    { code: "MANAGER", name: "Manager", level: 40, dataScope: "TEAM" },
    { code: "TEAM_LEAD", name: "Team Lead", level: 25, dataScope: "TEAM" },
    { code: "EMPLOYEE", name: "Employee", level: 10, dataScope: "SELF" },
  ];

  const roleMap = {};
  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, level: r.level, dataScope: r.dataScope },
      create: { code: r.code, name: r.name, level: r.level, dataScope: r.dataScope },
    });
    roleMap[r.code] = role.id;
  }
  console.log(`✓ All ${roleDefs.length} system roles active.`);

  // 2. Provision Company A (Apex Global Technologies)
  console.log("\n[2] Provisioning Company A (Apex Global Technologies)...");
  let companyA = await prisma.organization.findFirst({
    where: { code: { in: ["APEX-TECH", "NFVS-CORP"] } },
  });

  if (companyA) {
    companyA = await prisma.organization.update({
      where: { id: companyA.id },
      data: {
        name: "Apex Global Technologies",
        code: "APEX-TECH",
        legalName: "Apex Global Technologies Inc.",
        primaryColor: "#2563eb",
        secondaryColor: "#1e40af",
        industry: "Enterprise Cloud & AI Solutions",
        currency: "USD",
        timezone: "America/New_York",
        status: "ACTIVE",
      },
    });
  } else {
    companyA = await prisma.organization.create({
      data: {
        name: "Apex Global Technologies",
        code: "APEX-TECH",
        legalName: "Apex Global Technologies Inc.",
        primaryColor: "#2563eb",
        secondaryColor: "#1e40af",
        industry: "Enterprise Cloud & AI Solutions",
        currency: "USD",
        timezone: "America/New_York",
        status: "ACTIVE",
      },
    });
  }
  console.log(`✓ Company A ready: ${companyA.name} [${companyA.code}] (ID: ${companyA.id})`);

  // 3. Provision Company B (Beacon Health & BioSystems)
  console.log("\n[3] Provisioning Company B (Beacon Health & BioSystems)...");
  let companyB = await prisma.organization.findUnique({
    where: { code: "BEACON-BIO" },
  });

  if (!companyB) {
    companyB = await prisma.organization.create({
      data: {
        name: "Beacon Health & BioSystems",
        code: "BEACON-BIO",
        legalName: "Beacon Health and Life Sciences AG",
        primaryColor: "#059669",
        secondaryColor: "#065f46",
        industry: "Biomedical Engineering & Health Informatics",
        currency: "EUR",
        timezone: "Europe/Berlin",
        status: "ACTIVE",
      },
    });
  } else {
    companyB = await prisma.organization.update({
      where: { id: companyB.id },
      data: {
        name: "Beacon Health & BioSystems",
        primaryColor: "#059669",
        secondaryColor: "#065f46",
        industry: "Biomedical Engineering & Health Informatics",
        currency: "EUR",
        status: "ACTIVE",
      },
    });
  }
  console.log(`✓ Company B ready: ${companyB.name} [${companyB.code}] (ID: ${companyB.id})`);

  // Helper to ensure departments for a company
  async function ensureDepartments(orgId, deptDefs) {
    const deptMap = {};
    for (const d of deptDefs) {
      const existing = await prisma.department.findUnique({
        where: { organizationId_code: { organizationId: orgId, code: d.code } },
      });
      if (existing) {
        deptMap[d.code] = existing.id;
      } else {
        const created = await prisma.department.create({
          data: { organizationId: orgId, name: d.name, code: d.code },
        });
        deptMap[d.code] = created.id;
      }
    }
    return deptMap;
  }

  // 4. Ensure Company A Departments
  const deptDefsA = [
    { code: "EXEC", name: "Executive Leadership" },
    { code: "ENG", name: "Engineering & Cloud" },
    { code: "CRM", name: "Enterprise Commercial" },
    { code: "FIN", name: "Finance & Accounts" },
    { code: "OPS", name: "Operations & Logistics" },
    { code: "HR", name: "People Operations" },
  ];
  const deptsA = await ensureDepartments(companyA.id, deptDefsA);

  // Sub-Teams for Company A
  let teamCloudA = await prisma.team.findFirst({
    where: { organizationId: companyA.id, code: "CLOUD-INFRA" },
  });
  if (!teamCloudA) {
    teamCloudA = await prisma.team.create({
      data: {
        organizationId: companyA.id,
        departmentId: deptsA["ENG"],
        name: "Cloud Infrastructure Team",
        code: "CLOUD-INFRA",
      },
    });
  }

  let teamDevA = await prisma.team.findFirst({
    where: { organizationId: companyA.id, code: "PLATFORM-DEV" },
  });
  if (!teamDevA) {
    teamDevA = await prisma.team.create({
      data: {
        organizationId: companyA.id,
        departmentId: deptsA["ENG"],
        name: "Core Platform Development Team",
        code: "PLATFORM-DEV",
      },
    });
  }

  // 5. Ensure Company B Departments
  const deptDefsB = [
    { code: "EXEC", name: "Executive Directorate" },
    { code: "ENG", name: "Clinical & Bio-Engineering" },
    { code: "CRM", name: "Healthcare Partnerships" },
    { code: "FIN", name: "Treasury & Finance" },
    { code: "OPS", name: "Clinical Operations" },
    { code: "HR", name: "Human Capital" },
  ];
  const deptsB = await ensureDepartments(companyB.id, deptDefsB);

  // Sub-Teams for Company B
  let teamGenomicsB = await prisma.team.findFirst({
    where: { organizationId: companyB.id, code: "GENOMICS-RES" },
  });
  if (!teamGenomicsB) {
    teamGenomicsB = await prisma.team.create({
      data: {
        organizationId: companyB.id,
        departmentId: deptsB["ENG"],
        name: "Genomics Informatics Team",
        code: "GENOMICS-RES",
      },
    });
  }

  let teamClinicalB = await prisma.team.findFirst({
    where: { organizationId: companyB.id, code: "CLINICAL-DEV" },
  });
  if (!teamClinicalB) {
    teamClinicalB = await prisma.team.create({
      data: {
        organizationId: companyB.id,
        departmentId: deptsB["ENG"],
        name: "Clinical Systems Development Team",
        code: "CLINICAL-DEV",
      },
    });
  }

  // Helper to upsert user, employee, and membership
  async function seedCompanyUser(data) {
    let user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { employee: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          roleId: roleMap[data.roleCode],
          isActive: true,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { roleId: roleMap[data.roleCode], isActive: true },
      });
    }

    // User Company Membership
    await prisma.userCompanyMembership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: data.companyId,
        },
      },
      update: {
        roleId: roleMap[data.roleCode],
        isPrimary: data.isPrimary ?? true,
        status: "ACTIVE",
      },
      create: {
        userId: user.id,
        organizationId: data.companyId,
        roleId: roleMap[data.roleCode],
        isPrimary: data.isPrimary ?? true,
        status: "ACTIVE",
      },
    });

    // Employee master record
    let emp = await prisma.employee.findFirst({
      where: { organizationId: data.companyId, email: data.email },
    });

    if (!emp) {
      emp = await prisma.employee.create({
        data: {
          organizationId: data.companyId,
          departmentId: data.departmentId,
          teamId: data.teamId || null,
          userId: user.id,
          employeeNumber: data.empNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          designation: data.designation,
          employmentType: "FULL_TIME",
          employmentStatus: "ACTIVE",
          hireDate: new Date("2024-01-15"),
        },
      });
    } else {
      emp = await prisma.employee.update({
        where: { id: emp.id },
        data: {
          departmentId: data.departmentId,
          teamId: data.teamId || null,
          userId: user.id,
          designation: data.designation,
        },
      });
    }

    return { user, emp };
  }

  // 6. Seed Company A Executive Roster
  console.log("\n[4] Seeding Company A Leadership & Personnel...");
  const usersA = [
    {
      email: "admin.a@apex.internal",
      firstName: "Amit",
      lastName: "Verma",
      designation: "Platform & Company Admin",
      roleCode: "ADMIN",
      companyId: companyA.id,
      departmentId: deptsA["EXEC"],
      empNumber: "APEX-0001",
    },
    {
      email: "ceo.a@apex.internal",
      firstName: "Marcus",
      lastName: "Vance",
      designation: "Chief Executive Officer",
      roleCode: "CEO",
      companyId: companyA.id,
      departmentId: deptsA["EXEC"],
      empNumber: "APEX-0002",
    },
    {
      email: "cto.a@apex.internal",
      firstName: "Elena",
      lastName: "Rostova",
      designation: "Chief Technology Officer",
      roleCode: "CTO",
      companyId: companyA.id,
      departmentId: deptsA["ENG"],
      empNumber: "APEX-0003",
    },
    {
      email: "cmo.a@apex.internal",
      firstName: "David",
      lastName: "Kim",
      designation: "Chief Marketing Officer",
      roleCode: "CMO",
      companyId: companyA.id,
      departmentId: deptsA["CRM"],
      empNumber: "APEX-0004",
    },
    {
      email: "cfo.a@apex.internal",
      firstName: "Sarah",
      lastName: "Jenkins",
      designation: "Chief Financial Officer",
      roleCode: "CFO",
      companyId: companyA.id,
      departmentId: deptsA["FIN"],
      empNumber: "APEX-0005",
    },
    {
      email: "coo.a@apex.internal",
      firstName: "Arthur",
      lastName: "Pendelton",
      designation: "Chief Operating Officer",
      roleCode: "COO",
      companyId: companyA.id,
      departmentId: deptsA["OPS"],
      empNumber: "APEX-0006",
    },
    {
      email: "hr.a@apex.internal",
      firstName: "Rachel",
      lastName: "Adams",
      designation: "Head of People Operations",
      roleCode: "HR",
      companyId: companyA.id,
      departmentId: deptsA["HR"],
      empNumber: "APEX-0007",
    },
    {
      email: "priya@apex-tech.internal",
      firstName: "Priya",
      lastName: "Patel",
      designation: "Senior Cloud Engineer",
      roleCode: "EMPLOYEE",
      companyId: companyA.id,
      departmentId: deptsA["ENG"],
      teamId: teamCloudA.id,
      empNumber: "APEX-0008",
    },
  ];

  for (const u of usersA) {
    await seedCompanyUser(u);
    console.log(`  ✓ Company A User: ${u.email} [${u.roleCode}] - ${u.firstName} ${u.lastName}`);
  }

  // 7. Seed Company B Executive Roster
  console.log("\n[5] Seeding Company B Leadership & Personnel...");
  const usersB = [
    {
      email: "admin.b@beacon.internal",
      firstName: "Hanna",
      lastName: "Schmidt",
      designation: "Company Administrator",
      roleCode: "ADMIN",
      companyId: companyB.id,
      departmentId: deptsB["EXEC"],
      empNumber: "BEO-0001",
    },
    {
      email: "ceo.b@beacon.internal",
      firstName: "Catherine",
      lastName: "Wright",
      designation: "Chief Executive Officer",
      roleCode: "CEO",
      companyId: companyB.id,
      departmentId: deptsB["EXEC"],
      empNumber: "BEO-0002",
    },
    {
      email: "cto.b@beacon.internal",
      firstName: "Julian",
      lastName: "Thorne",
      designation: "Chief Technology Officer",
      roleCode: "CTO",
      companyId: companyB.id,
      departmentId: deptsB["ENG"],
      empNumber: "BEO-0003",
    },
    {
      email: "cmo.b@beacon.internal",
      firstName: "Nadia",
      lastName: "Al-Mansoor",
      designation: "Chief Marketing Officer",
      roleCode: "CMO",
      companyId: companyB.id,
      departmentId: deptsB["CRM"],
      empNumber: "BEO-0004",
    },
    {
      email: "cfo.b@beacon.internal",
      firstName: "Robert",
      lastName: "Sterling",
      designation: "Chief Financial Officer",
      roleCode: "CFO",
      companyId: companyB.id,
      departmentId: deptsB["FIN"],
      empNumber: "BEO-0005",
    },
    {
      email: "coo.b@beacon.internal",
      firstName: "Thomas",
      lastName: "Hayes",
      designation: "Chief Operating Officer",
      roleCode: "COO",
      companyId: companyB.id,
      departmentId: deptsB["OPS"],
      empNumber: "BEO-0006",
    },
    {
      email: "hr.b@beacon.internal",
      firstName: "Chloe",
      lastName: "Bennett",
      designation: "Director of Human Resources",
      roleCode: "HR",
      companyId: companyB.id,
      departmentId: deptsB["HR"],
      empNumber: "BEO-0007",
    },
    {
      email: "marcus@beacon-bio.internal",
      firstName: "Marcus",
      lastName: "Lee",
      designation: "Clinical Research Specialist",
      roleCode: "EMPLOYEE",
      companyId: companyB.id,
      departmentId: deptsB["ENG"],
      teamId: teamGenomicsB.id,
      empNumber: "BEO-0008",
    },
  ];

  for (const u of usersB) {
    await seedCompanyUser(u);
    console.log(`  ✓ Company B User: ${u.email} [${u.roleCode}] - ${u.firstName} ${u.lastName}`);
  }

  // 8. Seed Super Admin & Cross-Company User
  console.log("\n[6] Seeding Super Admin & Multi-Company Executive...");
  // Super Admin
  let superAdminUser = await prisma.user.findUnique({
    where: { email: "superadmin@nfvs.internal" },
  });
  if (!superAdminUser) {
    superAdminUser = await prisma.user.create({
      data: {
        email: "superadmin@nfvs.internal",
        passwordHash,
        roleId: roleMap["SUPER_ADMIN"],
        isActive: true,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: superAdminUser.id },
      data: { roleId: roleMap["SUPER_ADMIN"], isActive: true },
    });
  }

  // Multi-Company Executive (Assigned to both Company A and Company B)
  let multiCompanyUser = await prisma.user.findUnique({
    where: { email: "director@enterprise.internal" },
  });
  if (!multiCompanyUser) {
    multiCompanyUser = await prisma.user.create({
      data: {
        email: "director@enterprise.internal",
        passwordHash,
        roleId: roleMap["CHAIRPERSON"],
        isActive: true,
      },
    });
  }

  // Memberships for multi-company user in Company A & Company B
  await prisma.userCompanyMembership.upsert({
    where: {
      userId_organizationId: {
        userId: multiCompanyUser.id,
        organizationId: companyA.id,
      },
    },
    update: { roleId: roleMap["CHAIRPERSON"], isPrimary: true, status: "ACTIVE" },
    create: {
      userId: multiCompanyUser.id,
      organizationId: companyA.id,
      roleId: roleMap["CHAIRPERSON"],
      isPrimary: true,
      status: "ACTIVE",
    },
  });

  await prisma.userCompanyMembership.upsert({
    where: {
      userId_organizationId: {
        userId: multiCompanyUser.id,
        organizationId: companyB.id,
      },
    },
    update: { roleId: roleMap["CHAIRPERSON"], isPrimary: false, status: "ACTIVE" },
    create: {
      userId: multiCompanyUser.id,
      organizationId: companyB.id,
      roleId: roleMap["CHAIRPERSON"],
      isPrimary: false,
      status: "ACTIVE",
    },
  });

  console.log("  ✓ Super Admin: superadmin@nfvs.internal [SUPER_ADMIN]");
  console.log("  ✓ Multi-Company Executive: director@enterprise.internal [CHAIRPERSON] (Assigned to APEX-TECH & BEACON-BIO)");

  // 9. Seed Business Data for Company A (Isolated)
  console.log("\n[7] Seeding Isolated Business Records for Company A...");
  const empA = await prisma.employee.findFirst({ where: { organizationId: companyA.id } });
  
  const clientA = await prisma.client.upsert({
    where: { id: "client_apex_01" },
    update: {},
    create: {
      id: "client_apex_01",
      organizationId: companyA.id,
      name: "Nordic Logistics Global",
      code: "CLI-APEX-001",
      status: "ACTIVE",
      tier: "ENTERPRISE",
      industry: "Freight & Cloud Logistics",
    },
  });

  const leadA = await prisma.lead.upsert({
    where: { id: "lead_apex_01" },
    update: {},
    create: {
      id: "lead_apex_01",
      organizationId: companyA.id,
      firstName: "Erik",
      lastName: "Lindqvist",
      companyName: "Nordic Logistics Global",
      email: "erik.l@nordiclogistics.com",
      jobTitle: "VP of Logistics Technology",
      status: "QUALIFIED",
      estimatedValue: 240000,
      notes: "Global Supply Chain Optimization ERP",
    },
  });

  const invoiceA = await prisma.invoice.upsert({
    where: { organizationId_invoiceNumber: { organizationId: companyA.id, invoiceNumber: "INV-APEX-2026-001" } },
    update: {},
    create: {
      organizationId: companyA.id,
      invoiceNumber: "INV-APEX-2026-001",
      clientId: clientA.id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: "USD",
      subtotal: 85000,
      total: 85000,
      balance: 85000,
      status: "ISSUED",
      createdById: empA.id,
    },
  });
  console.log(`  ✓ Company A Client: ${clientA.name} ($${leadA.estimatedValue} deal pipeline, Invoice: ${invoiceA.invoiceNumber})`);

  // 10. Seed Business Data for Company B (Isolated)
  console.log("\n[8] Seeding Isolated Business Records for Company B...");
  const empB = await prisma.employee.findFirst({ where: { organizationId: companyB.id } });

  const clientB = await prisma.client.upsert({
    where: { id: "client_beacon_01" },
    update: {},
    create: {
      id: "client_beacon_01",
      organizationId: companyB.id,
      name: "St. Jude Biomedical Institute",
      code: "CLI-BEO-001",
      status: "ACTIVE",
      tier: "ENTERPRISE",
      industry: "Clinical Diagnostics & Genomics",
    },
  });

  const leadB = await prisma.lead.upsert({
    where: { id: "lead_beacon_01" },
    update: {},
    create: {
      id: "lead_beacon_01",
      organizationId: companyB.id,
      firstName: "Dr. Alistair",
      lastName: "Vance",
      companyName: "St. Jude Biomedical Institute",
      email: "a.vance@stjude-bio.org",
      jobTitle: "Chief of Pathology & Genomics",
      status: "QUALIFIED",
      estimatedValue: 520000,
      notes: "Hospital Automated Oncology Sequencing Platform",
    },
  });

  const invoiceB = await prisma.invoice.upsert({
    where: { organizationId_invoiceNumber: { organizationId: companyB.id, invoiceNumber: "INV-BEO-2026-001" } },
    update: {},
    create: {
      organizationId: companyB.id,
      invoiceNumber: "INV-BEO-2026-001",
      clientId: clientB.id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: "EUR",
      subtotal: 140000,
      total: 140000,
      balance: 140000,
      status: "ISSUED",
      createdById: empB.id,
    },
  });
  console.log(`  ✓ Company B Client: ${clientB.name} (€${leadB.estimatedValue} deal pipeline, Invoice: ${invoiceB.invoiceNumber})`);

  // 11. Seed Approval Requests for Company A & B
  console.log("\n[9] Seeding Initial Multi-Step Approval Requests...");
  await prisma.approvalRequest.upsert({
    where: { id: "wf_apex_budget_01" },
    update: {},
    create: {
      id: "wf_apex_budget_01",
      organizationId: companyA.id,
      entityType: "MARKETING_BUDGET",
      entityId: "MKTG-2026-Q4",
      title: "Q4 Enterprise Marketing & Ad Campaign ($120,000)",
      description: "Global Multi-Cloud Growth & Enterprise Outreach Campaign",
      status: "PENDING",
      requestedById: empA.id,
      metadata: JSON.stringify({
        workflowType: "MARKETING_BUDGET",
        currentStepIndex: 1,
        totalSteps: 2,
        currentRequiredRole: "CMO",
        stepsHistory: [],
        data: { requestedBudget: 120000, currency: "USD" }
      }),
    },
  });

  await prisma.approvalRequest.upsert({
    where: { id: "wf_beacon_tech_01" },
    update: {},
    create: {
      id: "wf_beacon_tech_01",
      organizationId: companyB.id,
      entityType: "TECH_PURCHASE",
      entityId: "TECH-2026-004",
      title: "Bioinformatics High-Performance GPU Cluster ($280,000)",
      description: "On-premise GPU cluster acquisition for genomics sequencing models",
      status: "PENDING",
      requestedById: empB.id,
      metadata: JSON.stringify({
        workflowType: "TECH_PURCHASE",
        currentStepIndex: 1,
        totalSteps: 2,
        currentRequiredRole: "CFO",
        stepsHistory: [],
        data: { requestedAmount: 280000, currency: "EUR" }
      }),
    },
  });
  console.log("  ✓ Configured dynamic multi-step approval workflows for Company A and Company B.");

  console.log("\n================================================================================");
  console.log("MULTI-COMPANY PROVISIONING COMPLETE!");
  console.log("================================================================================");
  console.log("Credentials for all accounts: 'Enterprise@2026'");
  console.log("- Super Admin: superadmin@nfvs.internal");
  console.log("- Multi-Company Exec: director@enterprise.internal");
  console.log("- Company A CEO: ceo.a@apex.internal");
  console.log("- Company B CEO: ceo.b@beacon.internal");
  console.log("================================================================================\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
