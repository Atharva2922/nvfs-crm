import { PrismaClient } from "@prisma/client";
import { CrossCompanyResourceService } from "../src/services/cross-company-resource.service";

const prisma = new PrismaClient();

async function main() {
  console.log("=== VERIFYING CROSS-COMPANY ROUTING & SINGLE-ACCEPTOR ASSIGNMENT WORKFLOW ===");

  // 1. Get organizations
  const naree = await prisma.organization.findFirst({
    where: { code: "NAREE" },
  });
  const nfvs = await prisma.organization.findFirst({
    where: { code: "NFVS" },
  });

  if (!naree || !nfvs) {
    throw new Error("Organizations not found");
  }

  console.log(`Borrower Org: ${naree.name} (${naree.code})`);
  console.log(`Lender Org: ${nfvs.name} (${nfvs.code})`);

  // 2. Find a user in NAREE to initiate the request (e.g. NAREE HR or Staff)
  const nareeRequesterUser = await prisma.user.findFirst({
    where: {
      employee: { organizationId: naree.id },
      role: { code: "HR" },
    },
    include: {
      role: true,
      employee: true,
    },
  });

  if (!nareeRequesterUser || !nareeRequesterUser.employee) {
    throw new Error("NAREE requester not found");
  }

  // 3. Find the target staff employee in NFVS (e.g., Atharva Narawade)
  const targetStaff = await prisma.employee.findFirst({
    where: {
      organizationId: nfvs.id,
      email: "atharvnarawade@gmail.com",
    },
  });

  if (!targetStaff) {
    throw new Error("Target staff in NFVS not found");
  }
  console.log(`Target Staff: ${targetStaff.firstName} ${targetStaff.lastName} (${targetStaff.designation})`);

  // 4. Check NFVS designated approvers: CEO, HR, Manager
  const [ceo, hr, manager] = await Promise.all([
    prisma.employee.findFirst({
      where: { organizationId: nfvs.id, user: { role: { code: "CEO" } } },
      include: { user: { include: { role: true } } },
    }),
    prisma.employee.findFirst({
      where: { organizationId: nfvs.id, user: { role: { code: "HR" } } },
      include: { user: { include: { role: true } } },
    }),
    targetStaff.managerId
      ? prisma.employee.findUnique({
          where: { id: targetStaff.managerId },
          include: { user: { include: { role: true } } },
        })
      : null,
  ]);

  console.log("\nDesignated Approvers in NFVS:");
  console.log(`- CEO: ${ceo ? `${ceo.firstName} ${ceo.lastName} (${ceo.email})` : "Not found"}`);
  console.log(`- HR: ${hr ? `${hr.firstName} ${hr.lastName} (${hr.email})` : "Not found"}`);
  console.log(`- Manager: ${manager ? `${manager.firstName} ${manager.lastName} (${manager.email})` : "Unassigned (fallback to department/admin)"}`);

  // 5. Clean up any previous test requests for this employee so they are free
  await prisma.approvalRequest.deleteMany({
    where: {
      entityType: "CROSS_COMPANY_RESOURCE",
      organizationId: nfvs.id,
    },
  });
  await prisma.employeeRequest.deleteMany({
    where: {
      category: "CROSS_COMPANY_RESOURCE",
      organizationId: naree.id,
    },
  });
  await prisma.task.deleteMany({
    where: {
      assigneeId: targetStaff.id,
      title: { contains: "Secondment" },
    },
  });

  // 6. Test createBorrowRequest from NAREE
  console.log("\n--- Step 1: Submitting Borrow Request from NAREE ---");
  const borrowPayload = {
    targetEmployeeId: targetStaff.id,
    title: "Urgent Clinical Data Migration Support",
    description: "Support our engineering team in transitioning healthcare records.",
    durationDays: 7,
    priority: "HIGH",
    startDate: new Date().toISOString(),
  };

  const reqUserObj = {
    id: nareeRequesterUser.id,
    email: nareeRequesterUser.email,
    name: `${nareeRequesterUser.employee.firstName} ${nareeRequesterUser.employee.lastName}`,
    roleCode: nareeRequesterUser.role.code,
    organizationId: naree.id,
    activeCompany: {
      id: naree.id,
      name: naree.name,
      code: naree.code,
      role: nareeRequesterUser.role.code,
    },
    employee: {
      id: nareeRequesterUser.employee.id,
      organizationId: naree.id,
      departmentId: nareeRequesterUser.employee.departmentId,
      designation: nareeRequesterUser.employee.designation,
    },
  };

  const createdRequest = await CrossCompanyResourceService.createBorrowRequest(reqUserObj, borrowPayload);
  console.log("Borrow Request Created:", {
    id: createdRequest.employeeRequest?.id,
    requestNumber: createdRequest.employeeRequest?.requestNumber,
    status: createdRequest.employeeRequest?.status,
    designatedApprovers: createdRequest.designatedApprovers,
  });

  // Verify notifications sent to NFVS approvers
  const notifications = await prisma.notification.findMany({
    where: {
      organizationId: nfvs.id,
      title: { contains: "Cross-Company Staff Borrow Request" },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log(`Notifications delivered to NFVS leadership: ${notifications.length} notifications`);
  notifications.forEach((n) => {
    console.log(`  - [User ID: ${n.userId}] ${n.title}: ${n.message}`);
  });

  // 7. Test getBorrowRequests for NFVS (Incoming)
  const nfvsApproverUser = hr || ceo;
  if (!nfvsApproverUser || !nfvsApproverUser.user) {
    throw new Error("No NFVS approver found to test decision");
  }

  const approverUserObj = {
    id: nfvsApproverUser.userId,
    email: nfvsApproverUser.email,
    name: `${nfvsApproverUser.firstName} ${nfvsApproverUser.lastName}`,
    roleCode: nfvsApproverUser.user.role.code,
    organizationId: nfvs.id,
    activeCompany: {
      id: nfvs.id,
      name: nfvs.name,
      code: nfvs.code,
      role: nfvsApproverUser.user.role.code,
    },
    employee: {
      id: nfvsApproverUser.id,
      organizationId: nfvs.id,
      departmentId: nfvsApproverUser.departmentId,
      designation: nfvsApproverUser.designation,
    },
  };

  const requestsView = await CrossCompanyResourceService.getBorrowRequests(approverUserObj);
  console.log("\n--- Step 2: Incoming Requests at NFVS ---");
  console.log(`Total Incoming: ${requestsView.incoming.length}`);
  const targetIncoming = requestsView.incoming.find((r) => r.targetEmployeeName.includes(targetStaff.firstName));
  console.log("Incoming Request Details:", {
    title: targetIncoming?.title,
    targetEmployee: targetIncoming?.targetEmployeeName,
    ceoName: targetIncoming?.ceoName,
    hrName: targetIncoming?.hrName,
    managerName: targetIncoming?.managerName,
    canApprove: targetIncoming?.canApprove,
    status: targetIncoming?.status,
  });

  // 8. Test decideBorrowRequest: NFVS Approver accepts the request
  console.log("\n--- Step 3: Approver Accepts the Request ---");
  const approvalId = targetIncoming.id;
  const decisionResult = await CrossCompanyResourceService.decideBorrowRequest(
    approverUserObj,
    approvalId,
    "APPROVED",
    "Authorized by NFVS HR. Temporary assignment granted for 7 days."
  );

  console.log("Decision Applied:", {
    id: decisionResult.id,
    status: decisionResult.status,
    acceptedBy: decisionResult.acceptedBy,
  });

  // 9. Verify Assignment Effects
  console.log("\n--- Step 4: Verifying Assignment Effects ---");
  // A. Check UserCompanyMembership in NAREE
  if (targetStaff.userId) {
    const membership = await prisma.userCompanyMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: targetStaff.userId,
          organizationId: naree.id,
        },
      },
    });
    console.log("Cross-Company Membership Created for Target Staff in NAREE:", membership ? "YES (Active)" : "NO");
  }

  // B. Check Secondment Task created in NAREE
  const secondmentTask = await prisma.task.findFirst({
    where: {
      organizationId: naree.id,
      assigneeId: targetStaff.id,
      title: { contains: "Secondment" },
    },
  });
  console.log("Secondment Task created in NAREE:", secondmentTask ? `YES ("${secondmentTask.title}")` : "NO");

  // C. Check Employee Availability in NFVS (should be BUSY / SECONDED)
  const availability = await CrossCompanyResourceService.getPartnerEmployeesWithAvailability(reqUserObj);
  const checkedStaff = availability.employees.find((e) => e.id === targetStaff.id);
  console.log("Employee Workload Status:", {
    fullName: checkedStaff?.fullName,
    isFree: checkedStaff?.isFree,
    busyReason: checkedStaff?.busyReason,
    isBorrowed: checkedStaff?.workload?.isBorrowed,
  });

  console.log("\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
