import { PrismaClient } from "@prisma/client";
import { performance } from "perf_hooks";

const prisma = new PrismaClient({
  log: [{ emit: "event", level: "query" }],
});

let queryCount = 0;
let totalQueryDurationMs = 0;

prisma.$on("query", (e) => {
  queryCount++;
  totalQueryDurationMs += e.duration;
});

async function measure(name, fn) {
  const startQueryCount = queryCount;
  const startQueryDuration = totalQueryDurationMs;
  const start = performance.now();

  const result = await fn();

  const elapsed = Math.round(performance.now() - start);
  const queriesRan = queryCount - startQueryCount;
  const queryTime = Math.round(totalQueryDurationMs - startQueryDuration);

  console.log(`[${name}] Execution: ${elapsed}ms | DB Queries: ${queriesRan} (${queryTime}ms DB time)`);
  return { result, elapsed, queriesRan, queryTime };
}

async function run() {
  console.log("==================================================");
  console.log("       CRM PERFORMANCE BASELINE BENCHMARK        ");
  console.log("==================================================\n");

  const org = await prisma.organization.findFirst({ where: { status: "ACTIVE" } });
  if (!org) {
    console.error("No active organization found!");
    return;
  }
  console.log(`Active Target Tenant: ${org.name} (${org.code})\n`);

  // 1. Employee Directory Query & Availability Computation
  console.log("--- 1. EMPLOYEE DIRECTORY ---");
  await measure("Employee Directory (50 items with joins)", async () => {
    const where = { organizationId: org.id };
    const [totalCount, rawEmployees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        take: 50,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        include: {
          department: true,
          assignedTasks: {
            where: { status: { in: ["TODO", "IN_PROGRESS"] } },
            select: { id: true, title: true, status: true, priority: true },
          },
          operationAssignments: {
            include: {
              operation: { select: { id: true, status: true } },
            },
          },
          onDutyAssignments: {
            where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
            select: { id: true },
          },
          manager: {
            select: { id: true, firstName: true, lastName: true, designation: true },
          },
          user: {
            select: { id: true, email: true, role: { select: { code: true, name: true } } },
          },
        },
      }),
    ]);
    return { totalCount, count: rawEmployees.length };
  });

  // 2. Employee Profile Dossier
  console.log("\n--- 2. EMPLOYEE PROFILE DOSSIER ---");
  const testEmp = await prisma.employee.findFirst({ where: { organizationId: org.id } });
  if (testEmp) {
    await measure("Employee Complete Profile Dossier Fetch", async () => {
      return prisma.employee.findUnique({
        where: { id: testEmp.id },
        include: {
          organization: true,
          department: true,
          team: true,
          manager: {
            select: { id: true, employeeNumber: true, firstName: true, lastName: true, designation: true, email: true },
          },
          user: {
            include: {
              role: {
                include: {
                  rolePermissions: { include: { permission: true } },
                },
              },
              memberships: {
                include: { organization: true, role: true },
              },
            },
          },
          profile: true,
          documents: { orderBy: { uploadedAt: "desc" } },
        },
      });
    });
  }

  // 3. CEO Executive Dashboard Data Aggregation
  console.log("\n--- 3. CEO EXECUTIVE DASHBOARD METRICS ---");
  await measure("CEO Dashboard Core Datasets Aggregation", async () => {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd = new Date();

    return Promise.all([
      prisma.invoice.findMany({
        where: { organizationId: org.id, invoiceDate: { gte: currentStart, lte: currentEnd }, status: { not: "CANCELLED" } },
        select: { total: true, balance: true, paidAmount: true },
      }),
      prisma.expense.findMany({
        where: { organizationId: org.id, date: { gte: currentStart, lte: currentEnd }, status: { in: ["APPROVED", "PAID"] } },
        select: { amount: true },
      }),
      prisma.opportunity.findMany({
        where: { organizationId: org.id },
        select: { id: true, name: true, value: true, stage: true, probability: true },
      }),
      prisma.lead.findMany({
        where: { organizationId: org.id },
        select: { id: true, status: true },
      }),
      prisma.operation.findMany({
        where: { organizationId: org.id },
        select: { id: true, name: true, status: true, priority: true, progress: true },
      }),
      prisma.approvalRequest.findMany({
        where: { organizationId: org.id, status: "PENDING" },
        take: 10,
        select: { id: true, entityType: true, status: true },
      }),
      prisma.department.findMany({
        where: { organizationId: org.id },
        select: { id: true, name: true, code: true },
      }),
      prisma.employee.findMany({
        where: { organizationId: org.id },
        select: { id: true, employmentStatus: true, departmentId: true },
      }),
    ]);
  });

  // 4. Settings & Permissions
  console.log("\n--- 4. SETTINGS & RBAC PERMISSIONS ---");
  await measure("System & Company Settings Fetch", async () => {
    return Promise.all([
      prisma.companySetting.findMany({ where: { organizationId: org.id } }),
      prisma.systemSetting.findMany(),
    ]);
  });

  await measure("RBAC Permissions Resolution for User", async () => {
    const user = await prisma.user.findFirst({
      where: { role: { code: "ADMIN" } },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    });
    return user?.role?.rolePermissions?.map((rp) => rp.permission.code) || [];
  });

  console.log("\n==================================================");
  console.log(`TOTAL DATABASE QUERIES: ${queryCount}`);
  console.log(`TOTAL DB TIME ACCUMULATED: ${Math.round(totalQueryDurationMs)}ms`);
  console.log("==================================================");

  await prisma.$disconnect();
}

run();
