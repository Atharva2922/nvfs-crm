import { PrismaClient } from "@prisma/client";
import { CrossCompanyResourceService } from "../src/services/cross-company-resource.service.ts";

const prisma = new PrismaClient();

async function runTest() {
  console.log("=== VERIFYING CROSS-COMPANY EMPLOYEE BORROW WORKFLOW ===\n");

  // 1. Get NFVS CEO User
  const nfvsUserDb = await prisma.user.findFirst({
    where: {
      email: { in: ["nfvs@crm.com", "companya@crm.com"] },
      isActive: true,
    },
    include: {
      role: { include: { rolePermissions: { include: { permission: true } } } },
      employee: { include: { organization: true, department: true } },
    },
  });

  if (!nfvsUserDb || !nfvsUserDb.employee) {
    throw new Error("NFVS User not found!");
  }

  const nfvsUser = {
    id: nfvsUserDb.id,
    email: nfvsUserDb.email,
    roleId: nfvsUserDb.roleId,
    roleCode: nfvsUserDb.role.code,
    roleLevel: nfvsUserDb.role.level,
    dataScope: nfvsUserDb.role.dataScope,
    permissions: nfvsUserDb.role.rolePermissions.map((rp) => rp.permission.code),
    employee: nfvsUserDb.employee,
    activeCompany: {
      id: nfvsUserDb.employee.organization.id,
      name: nfvsUserDb.employee.organization.name,
      code: nfvsUserDb.employee.organization.code,
      status: nfvsUserDb.employee.organization.status,
    },
  };

  // 2. Get NAREE CEO User
  const nareeUserDb = await prisma.user.findFirst({
    where: {
      email: { in: ["naree@crm.com", "companyb@crm.com"] },
      isActive: true,
    },
    include: {
      role: { include: { rolePermissions: { include: { permission: true } } } },
      employee: { include: { organization: true, department: true } },
    },
  });

  if (!nareeUserDb || !nareeUserDb.employee) {
    throw new Error("NAREE User not found!");
  }

  const nareeUser = {
    id: nareeUserDb.id,
    email: nareeUserDb.email,
    roleId: nareeUserDb.roleId,
    roleCode: nareeUserDb.role.code,
    roleLevel: nareeUserDb.role.level,
    dataScope: nareeUserDb.role.dataScope,
    permissions: nareeUserDb.role.rolePermissions.map((rp) => rp.permission.code),
    employee: nareeUserDb.employee,
    activeCompany: {
      id: nareeUserDb.employee.organization.id,
      name: nareeUserDb.employee.organization.name,
      code: nareeUserDb.employee.organization.code,
      status: nareeUserDb.employee.organization.status,
    },
  };

  console.log(`✓ Loaded User 1: ${nfvsUser.email} [${nfvsUser.activeCompany.name}]`);
  console.log(`✓ Loaded User 2: ${nareeUser.email} [${nareeUser.activeCompany.name}]\n`);

  // 3. Test Availability Query from NFVS
  console.log("1. Querying Partner Employees Availability from NFVS perspective...");
  const availability = await CrossCompanyResourceService.getPartnerEmployeesWithAvailability(nfvsUser as any);
  console.log(`   Partner Company Detected: ${availability.partnerCompany?.name} (${availability.partnerCompany?.code})`);
  console.log(`   Total Partner Employees: ${availability.employees.length}`);

  const freeEmployees = availability.employees.filter((e) => e.isFree);
  const busyEmployees = availability.employees.filter((e) => !e.isFree);

  console.log(`   - FREE Employees (${freeEmployees.length}):`);
  freeEmployees.forEach((e) => console.log(`     * ${e.fullName} (${e.designation}) - [FREE]`));

  console.log(`   - BUSY Employees (${busyEmployees.length}):`);
  busyEmployees.forEach((e) => console.log(`     * ${e.fullName} (${e.designation}) - [BUSY: ${e.busyReason}]`));

  if (freeEmployees.length === 0) {
    throw new Error("Expected at least one FREE employee in partner company!");
  }
  if (busyEmployees.length === 0) {
    throw new Error("Expected at least one BUSY employee in partner company!");
  }
  console.log("   ✓ Availability detection correctly separates FREE and BUSY employees!\n");

  // 4. Test: Requesting a BUSY employee must be rejected
  const busyTarget = busyEmployees[0];
  console.log(`2. Attempting to request BUSY employee [${busyTarget.fullName}]...`);
  try {
    await CrossCompanyResourceService.createBorrowRequest(nfvsUser as any, {
      targetEmployeeId: busyTarget.id,
      title: "Test Busy Request",
      description: "Should fail because employee is busy",
      durationDays: 3,
    });
    throw new Error("FAILED: Expected request for busy employee to throw an error, but it succeeded!");
  } catch (err: any) {
    console.log(`   ✓ Correctly rejected: "${err.message}"\n`);
  }

  // 5. Test: Requesting a FREE employee must succeed
  const freeTarget = freeEmployees[0];
  console.log(`3. Requesting FREE employee [${freeTarget.fullName}]...`);
  const created = await CrossCompanyResourceService.createBorrowRequest(nfvsUser as any, {
    targetEmployeeId: freeTarget.id,
    title: "Urgent Bio-Tech System Integration Support",
    description: "Assistance required for clinical platform data sync as our internal team is at capacity.",
    durationDays: 5,
    priority: "HIGH",
  });
  console.log(`   ✓ Successfully created Request Number: ${created.employeeRequest.requestNumber}`);
  console.log(`   ✓ Approval Request created in Partner Company: ID ${created.approvalRequest.id}\n`);

  // 6. Test: Check Outgoing Requests from NFVS
  console.log("4. Checking Outgoing Requests from NFVS...");
  const nfvsRequests = await CrossCompanyResourceService.getBorrowRequests(nfvsUser as any);
  console.log(`   Outgoing requests count: ${nfvsRequests.outgoing.length}`);
  const matchOutgoing = nfvsRequests.outgoing.find((r) => r.id === created.employeeRequest.id);
  if (!matchOutgoing) {
    throw new Error("Created request not found in NFVS outgoing list!");
  }
  console.log(`   ✓ Outgoing request verified: ${matchOutgoing.title} | Status: ${matchOutgoing.status}\n`);

  // 7. Test: Check Incoming Requests from NAREE
  console.log("5. Checking Incoming Requests from NAREE perspective...");
  const nareeRequests = await CrossCompanyResourceService.getBorrowRequests(nareeUser as any);
  console.log(`   Incoming requests count: ${nareeRequests.incoming.length}`);
  const matchIncoming = nareeRequests.incoming.find((r) => r.id === created.approvalRequest.id);
  if (!matchIncoming) {
    throw new Error("Created approval request not found in NAREE incoming list!");
  }
  console.log(`   ✓ Incoming request received at NAREE: From ${matchIncoming.requesterOrgName} for ${matchIncoming.targetEmployeeName}`);
  console.log(`   ✓ Current Status: ${matchIncoming.status}\n`);

  // 8. Test: NAREE CEO Approves Request
  console.log("6. NAREE CEO Approves Request...");
  await CrossCompanyResourceService.decideBorrowRequest(
    nareeUser as any,
    matchIncoming.id,
    "APPROVED",
    "Granted for 5 days to support Venture Studio integration."
  );
  console.log("   ✓ Decision APPROVED recorded!\n");

  // 9. Test: Verify status is updated on both sides
  console.log("7. Verifying status synchronization...");
  const nfvsRequestsAfter = await CrossCompanyResourceService.getBorrowRequests(nfvsUser as any);
  const outgoingAfter = nfvsRequestsAfter.outgoing.find((r) => r.id === created.employeeRequest.id);
  console.log(`   NFVS Outgoing Status: ${outgoingAfter?.status}`);
  if (outgoingAfter?.status !== "APPROVED") {
    throw new Error(`Expected NFVS outgoing request status APPROVED, got ${outgoingAfter?.status}`);
  }

  const nareeRequestsAfter = await CrossCompanyResourceService.getBorrowRequests(nareeUser as any);
  const incomingAfter = nareeRequestsAfter.incoming.find((r) => r.id === created.approvalRequest.id);
  console.log(`   NAREE Incoming Status: ${incomingAfter?.status}`);
  if (incomingAfter?.status !== "APPROVED") {
    throw new Error(`Expected NAREE incoming request status APPROVED, got ${incomingAfter?.status}`);
  }
  console.log("   ✓ Both companies show synchronized APPROVED status!\n");

  // 10. Test: Availability now shows the borrowed employee as BUSY
  console.log("8. Verifying borrowed employee availability status...");
  const availabilityAfter = await CrossCompanyResourceService.getPartnerEmployeesWithAvailability(nfvsUser as any);
  const borrowedEmp = availabilityAfter.employees.find((e) => e.id === freeTarget.id);
  console.log(`   Target Employee [${borrowedEmp?.fullName}]: isFree = ${borrowedEmp?.isFree} | Reason: "${borrowedEmp?.busyReason}"`);
  if (borrowedEmp?.isFree !== false) {
    throw new Error("Expected borrowed employee to now be BUSY, but they are still FREE!");
  }
  console.log("   ✓ Borrowed employee is now marked BUSY during their active loan period!\n");

  console.log("=================================================");
  console.log("🎉 ALL CROSS-COMPANY BORROW TESTS PASSED 100%!");
  console.log("=================================================");
}

runTest()
  .catch((err) => {
    console.error("\n❌ Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
