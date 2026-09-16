import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedOperations() {
  console.log("================================================================================");
  console.log("SEEDING BLOCK 9: OPERATIONS MANAGEMENT");
  console.log("================================================================================\n");

  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error("No organization found. Please run base seed first.");
      return;
    }

    let dept = await prisma.department.findFirst({ where: { organizationId: org.id } });
    if (!dept) {
      dept = await prisma.department.create({
        data: {
          organizationId: org.id,
          name: "Operations & Delivery",
          code: "OPS-DEPT",
        },
      });
    }

    const employees = await prisma.employee.findMany({
      where: { organizationId: org.id },
      take: 5,
    });
    if (employees.length === 0) {
      console.error("No employees found. Seed employees first.");
      return;
    }

    const client = await prisma.client.findFirst({ where: { organizationId: org.id } });
    const opportunity = await prisma.opportunity.findFirst({ where: { organizationId: org.id } });
    const warehouse = await prisma.warehouse.findFirst({ where: { organizationId: org.id } });
    const product = await prisma.product.findFirst({ where: { organizationId: org.id } });
    const vendor = await prisma.vendor.findFirst({ where: { organizationId: org.id } });
    const po = await prisma.purchaseOrder.findFirst({ where: { organizationId: org.id } });

    const owner = employees[0];
    const member1 = employees[1] || employees[0];
    const member2 = employees[2] || employees[0];

    console.log(`Using Org: ${org.name} (${org.id})`);
    console.log(`Using Dept: ${dept.name} (${dept.id})`);
    console.log(`Using Owner: ${owner.firstName} ${owner.lastName}`);

    const now = new Date();

    // -------------------------------------------------------------
    // Operation 1: Cloud Infrastructure Modernization (ACTIVE / ON TRACK)
    // -------------------------------------------------------------
    const op1Code = `OP-SEED-${Date.now().toString().slice(-4)}A`;
    const op1Start = new Date(now.getTime() - 14 * 86400000);
    const op1End = new Date(now.getTime() + 30 * 86400000);

    const op1 = await prisma.operation.create({
      data: {
        organizationId: org.id,
        departmentId: dept.id,
        ownerId: owner.id,
        clientId: client ? client.id : null,
        opportunityId: opportunity ? opportunity.id : null,
        operationCode: op1Code,
        name: "Cloud Infrastructure Modernization Phase 1",
        description:
          "Enterprise cloud migration initiative to shift on-prem workloads to high-availability cluster.",
        operationType: "CLIENT_DELIVERY",
        status: "IN_PROGRESS",
        priority: "HIGH",
        startDate: op1Start,
        expectedCompletionDate: op1End,
        progress: 45,
        riskLevel: "LOW",
        estimatedHours: 240,
        actualHours: 95,
        estimatedCost: 120000,
        approvedBudget: 150000,
        actualCost: 52000,
      },
    });

    console.log(`[CREATED] Operation 1 (Active): ${op1.name} [${op1.operationCode}]`);

    // Assign team
    await prisma.operationEmployee.create({
      data: {
        operationId: op1.id,
        employeeId: owner.id,
        role: "LEAD",
        assignedHours: 120,
        actualHours: 50,
      },
    });
    await prisma.operationEmployee.create({
      data: {
        operationId: op1.id,
        employeeId: member1.id,
        role: "ENGINEER",
        assignedHours: 120,
        actualHours: 45,
      },
    });

    // Create Tasks with Dependencies
    const task1 = await prisma.task.create({
      data: {
        organizationId: org.id,
        operationId: op1.id,
        title: "Provision Multi-Region Kubernetes Cluster",
        description: "Deploy terraform modules for VPC and managed node groups",
        status: "COMPLETED",
        priority: "HIGH",
        assigneeId: member1.id,
        creatorId: owner.id,
        startDate: op1Start,
        dueDate: new Date(now.getTime() - 5 * 86400000),
        estimatedHours: 40,
        actualHours: 38,
        completionRate: 100,
      },
    });

    const task2 = await prisma.task.create({
      data: {
        organizationId: org.id,
        operationId: op1.id,
        title: "Configure VPC Peering & Transit Gateway",
        description: "Interconnect VPC clusters with on-prem direct connect",
        status: "IN_PROGRESS",
        priority: "URGENT",
        assigneeId: member1.id,
        creatorId: owner.id,
        startDate: new Date(now.getTime() - 4 * 86400000),
        dueDate: new Date(now.getTime() + 10 * 86400000),
        estimatedHours: 60,
        actualHours: 25,
        completionRate: 50,
        dependencyId: task1.id,
      },
    });

    // Create Milestones
    await prisma.operationMilestone.createMany({
      data: [
        {
          operationId: op1.id,
          title: "Infrastructure Architecture Sign-off",
          description: "Full architectural review and security sign-off",
          dueDate: new Date(now.getTime() - 7 * 86400000),
          status: "COMPLETED",
          completedAt: new Date(now.getTime() - 8 * 86400000),
          order: 1,
        },
        {
          operationId: op1.id,
          title: "Staging Workload Migration",
          description: "All non-production services operational on cloud",
          dueDate: new Date(now.getTime() + 15 * 86400000),
          status: "PENDING",
          order: 2,
        },
      ],
    });

    // Link Inventory
    if (warehouse && product) {
      await prisma.operationInventory.create({
        data: {
          operationId: op1.id,
          productId: product.id,
          warehouseId: warehouse.id,
          requiredQuantity: 10,
          allocatedQuantity: 10,
          usedQuantity: 4,
          unitCost: product.costPrice || 250,
          status: "ALLOCATED",
        },
      });
    }

    // Link Vendor
    if (vendor) {
      await prisma.operationVendor.create({
        data: {
          operationId: op1.id,
          vendorId: vendor.id,
          purchaseOrderId: po ? po.id : null,
          role: "CONSULTANT",
          estimatedCost: 25000,
          actualCost: 10000,
          status: "ENGAGED",
        },
      });
    }

    // Activity Log
    await prisma.operationActivity.create({
      data: {
        operationId: op1.id,
        performedById: owner.id,
        type: "TASK_COMPLETED",
        description: `Task "${task1.title}" completed on schedule.`,
      },
    });

    // -------------------------------------------------------------
    // Operation 2: Data Center Hardware Migration (DELAYED + CRITICAL ISSUE)
    // -------------------------------------------------------------
    const op2Code = `OP-SEED-${Date.now().toString().slice(-4)}B`;
    const op2Start = new Date(now.getTime() - 40 * 86400000);
    const op2End = new Date(now.getTime() - 5 * 86400000); // 5 days in the PAST = Overdue/Delayed

    const op2 = await prisma.operation.create({
      data: {
        organizationId: org.id,
        departmentId: dept.id,
        ownerId: owner.id,
        clientId: client ? client.id : null,
        operationCode: op2Code,
        name: "Data Center Hardware Migration & SAN Upgrade",
        description:
          "Mission-critical SAN storage cutover delayed due to critical hardware backplane firmware faults.",
        operationType: "INFRASTRUCTURE",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        startDate: op2Start,
        expectedCompletionDate: op2End, // DELAYED!
        progress: 70,
        riskLevel: "CRITICAL",
        riskDescription: "Severe firmware fault on SAN switches causing packet dropouts",
        mitigationPlan: "Vendor hotfix deployment and temporary failover to secondary SAN",
        estimatedHours: 160,
        actualHours: 195,
        estimatedCost: 80000,
        approvedBudget: 90000,
        actualCost: 88500,
      },
    });

    console.log(`[CREATED] Operation 2 (DELAYED): ${op2.name} [${op2.operationCode}]`);

    // Assign team
    await prisma.operationEmployee.create({
      data: {
        operationId: op2.id,
        employeeId: member2.id,
        role: "SPECIALIST",
        assignedHours: 160,
        actualHours: 140,
      },
    });

    // Create a CRITICAL Issue
    const critIssue = await prisma.operationIssue.create({
      data: {
        organizationId: org.id,
        issueCode: `ISS-${Date.now().toString().slice(-4)}1`,
        operationId: op2.id,
        title: "Core Router SAN Switch Failure & Firmware Incompatibility",
        description:
          "Fiber channel transceivers experiencing 40% packet drops following high-density SAN array cutover. Requires immediate vendor hardware patch.",
        severity: "CRITICAL",
        status: "OPEN",
        reportedById: owner.id,
        assignedToId: member2.id,
        dueDate: new Date(now.getTime() + 1 * 86400000),
      },
    });

    // Create Issue Comment
    await prisma.operationIssueComment.create({
      data: {
        issueId: critIssue.id,
        authorId: member2.id,
        content: "Vendor TAC opened case #994411. Replacement transceivers arriving tomorrow morning.",
      },
    });

    console.log(`[LOGGED] Critical Incident: ${critIssue.title} [${critIssue.severity}]`);

    // -------------------------------------------------------------
    // Operation 3: Enterprise Security Compliance Audit (COMPLETED)
    // -------------------------------------------------------------
    const op3Code = `OP-SEED-${Date.now().toString().slice(-4)}C`;
    const op3Start = new Date(now.getTime() - 60 * 86400000);
    const op3End = new Date(now.getTime() - 10 * 86400000);

    const op3 = await prisma.operation.create({
      data: {
        organizationId: org.id,
        departmentId: dept.id,
        ownerId: owner.id,
        operationCode: op3Code,
        name: "Enterprise ISO27001 Security & SOC2 Compliance Audit",
        description:
          "Comprehensive organization-wide security posture validation and SOC2 Type II certification audit.",
        operationType: "MAINTENANCE",
        status: "COMPLETED",
        priority: "MEDIUM",
        startDate: op3Start,
        expectedCompletionDate: op3End,
        actualCompletionDate: new Date(now.getTime() - 12 * 86400000),
        progress: 100,
        riskLevel: "LOW",
        estimatedHours: 80,
        actualHours: 72,
        estimatedCost: 35000,
        approvedBudget: 40000,
        actualCost: 33500,
      },
    });

    console.log(`[CREATED] Operation 3 (COMPLETED): ${op3.name} [${op3.operationCode}]`);

    // -------------------------------------------------------------
    // Operation 4: Global ERP Rollout (PLANNING / PENDING APPROVAL)
    // -------------------------------------------------------------
    const op4Code = `OP-SEED-${Date.now().toString().slice(-4)}D`;
    const op4 = await prisma.operation.create({
      data: {
        organizationId: org.id,
        departmentId: dept.id,
        ownerId: owner.id,
        operationCode: op4Code,
        name: "Global ERP Rollout - APAC Regional Operations",
        description:
          "Phased expansion of localized procurement and inventory pipelines for APAC logistics centers.",
        operationType: "INTERNAL_INITIATIVE",
        status: "PLANNING",
        priority: "HIGH",
        startDate: new Date(now.getTime() + 10 * 86400000),
        expectedCompletionDate: new Date(now.getTime() + 180 * 86400000),
        progress: 10,
        riskLevel: "MEDIUM",
        estimatedHours: 500,
        actualHours: 10,
        estimatedCost: 250000,
        approvedBudget: 300000,
        actualCost: 0,
      },
    });

    // Create an Approval Request for Budget
    await prisma.approvalRequest.create({
      data: {
        organizationId: org.id,
        operationId: op4.id,
        entityType: "BUDGET_CHANGE",
        entityId: op4.id,
        title: "Contingency Budget Allocation for APAC Nodes",
        description: "Capital expenditure authorization required for overseas data nodes ($50,000 contingency).",
        status: "PENDING",
        requestedById: owner.id,
      },
    });

    console.log(`[CREATED] Operation 4 (PLANNING & PENDING APPROVAL): ${op4.name} [${op4.operationCode}]`);

    console.log("\nOperations successfully seeded!");
    console.log("================================================================================");
  } catch (error) {
    console.error("Error seeding operations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedOperations();
