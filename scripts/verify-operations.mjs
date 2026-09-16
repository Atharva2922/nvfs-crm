import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runOperationsVerification() {
  console.log("================================================================================");
  console.log("BLOCK 9: OPERATIONS MANAGEMENT — ENTERPRISE VERIFICATION SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // Test 1: Prerequisites & Multi-Tenant Organization Isolation
    // -------------------------------------------------------------------------
    console.log("--- Test 1: Multi-Tenant Org & Actor Context ---");
    const org = await prisma.organization.findFirst();
    assert(!!org, `Organization identified: ${org?.name} (${org?.id})`);

    const dept = await prisma.department.findFirst({ where: { organizationId: org.id } });
    assert(!!dept, `Operational Department identified: ${dept?.name}`);

    const employees = await prisma.employee.findMany({
      where: { organizationId: org.id },
      take: 4,
    });
    assert(employees.length >= 2, `Identified operational staff pool (${employees.length} employees)`);

    const owner = employees[0];
    const techLead = employees[1];

    // -------------------------------------------------------------------------
    // Test 2: Operation Master Creation & Unique Code
    // -------------------------------------------------------------------------
    console.log("\n--- Test 2: Operation Master Lifecycle ---");
    const opCode = `OP-VERIFY-${Date.now().toString().slice(-5)}`;
    const now = new Date();
    const targetEnd = new Date(now.getTime() + 14 * 86400000);

    const testOp = await prisma.operation.create({
      data: {
        organizationId: org.id,
        operationCode: opCode,
        name: "Mission-Critical Core Switch Uplink Migration",
        description: "Automated verification test operation for high-throughput backbone cutover.",
        operationType: "INFRASTRUCTURE",
        departmentId: dept.id,
        ownerId: owner.id,
        priority: "HIGH",
        status: "PLANNING",
        progress: 0,
        riskLevel: "MEDIUM",
        startDate: now,
        expectedCompletionDate: targetEnd,
        estimatedHours: 80,
        estimatedCost: 15000,
        approvedBudget: 20000,
      },
    });
    assert(!!testOp.id && testOp.operationCode === opCode, `Operation created successfully: ${testOp.name} [${testOp.operationCode}]`);

    // Verify Code Uniqueness Constraint
    let duplicateRejected = false;
    try {
      await prisma.operation.create({
        data: {
          organizationId: org.id,
          operationCode: opCode, // duplicate
          name: "Duplicate Attempt",
          departmentId: dept.id,
          ownerId: owner.id,
          startDate: now,
          expectedCompletionDate: targetEnd,
        },
      });
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected, "Unique constraint enforced: Duplicate operationCode within organization rejected");

    // -------------------------------------------------------------------------
    // Test 3: Operational State Transition Machine
    // -------------------------------------------------------------------------
    console.log("\n--- Test 3: State Machine Progression ---");
    const scheduledOp = await prisma.operation.update({
      where: { id: testOp.id },
      data: { status: "SCHEDULED" },
    });
    assert(scheduledOp.status === "SCHEDULED", "Transitioned: PLANNING -> SCHEDULED");

    const inProgressOp = await prisma.operation.update({
      where: { id: testOp.id },
      data: { status: "IN_PROGRESS", progress: 25 },
    });
    assert(inProgressOp.status === "IN_PROGRESS" && inProgressOp.progress === 25, "Transitioned: SCHEDULED -> IN_PROGRESS");

    // -------------------------------------------------------------------------
    // Test 4: Task Linking, Work Breakdown Structure & Dependencies
    // -------------------------------------------------------------------------
    console.log("\n--- Test 4: Task Linking & Dependencies ---");
    const taskA = await prisma.task.create({
      data: {
        organizationId: org.id,
        operationId: testOp.id,
        title: "Backup Core Switch Firmware & Config",
        status: "COMPLETED",
        priority: "HIGH",
        creatorId: owner.id,
        assigneeId: techLead.id,
        startDate: now,
        dueDate: new Date(now.getTime() + 2 * 86400000),
        estimatedHours: 8,
        actualHours: 6,
        completionRate: 100,
      },
    });
    assert(!!taskA.id, `Created Phase 1 Task: ${taskA.title} (Status: ${taskA.status})`);

    const taskB = await prisma.task.create({
      data: {
        organizationId: org.id,
        operationId: testOp.id,
        title: "Hot-Swap 100GbE QSFP28 Transceivers",
        status: "IN_PROGRESS",
        priority: "URGENT",
        creatorId: owner.id,
        assigneeId: techLead.id,
        dependencyId: taskA.id, // Depends on Task A
        startDate: new Date(now.getTime() + 2 * 86400000),
        dueDate: new Date(now.getTime() + 5 * 86400000),
        estimatedHours: 16,
        actualHours: 4,
        completionRate: 25,
      },
    });
    assert(taskB.dependencyId === taskA.id, `Created Dependent Task with FK Link: ${taskB.title} -> Depends on Task [${taskA.id}]`);

    // Verify task relations back to Operation
    const opWithTasks = await prisma.operation.findUnique({
      where: { id: testOp.id },
      include: { tasks: { include: { dependsOn: true } } },
    });
    assert(opWithTasks.tasks.length === 2, `Operation aggregated 2 operational tasks`);
    assert(opWithTasks.tasks.find((t) => t.id === taskB.id)?.dependsOn?.title === taskA.title, "Task dependency graph successfully resolved");

    // -------------------------------------------------------------------------
    // Test 5: Operational Team Assignments & Work Allocation
    // -------------------------------------------------------------------------
    console.log("\n--- Test 5: Team Assignments & Resource Allocation ---");
    const teamAssignment = await prisma.operationEmployee.create({
      data: {
        operationId: testOp.id,
        employeeId: techLead.id,
        role: "LEAD",
        assignedHours: 40,
        actualHours: 10,
        notes: "Primary technical architect executing the cutover",
      },
    });
    assert(teamAssignment.employeeId === techLead.id && teamAssignment.role === "LEAD", `Assigned ${techLead.firstName} ${techLead.lastName} as LEAD (Allocated: 40h)`);

    // -------------------------------------------------------------------------
    // Test 6: Inventory Allocation & Material Tracking
    // -------------------------------------------------------------------------
    console.log("\n--- Test 6: Inventory Allocation ---");
    const product = await prisma.product.findFirst({ where: { organizationId: org.id } });
    const warehouse = await prisma.warehouse.findFirst({ where: { organizationId: org.id } });

    if (product && warehouse) {
      const opInv = await prisma.operationInventory.create({
        data: {
          operationId: testOp.id,
          productId: product.id,
          warehouseId: warehouse.id,
          requiredQuantity: 12,
          allocatedQuantity: 12,
          usedQuantity: 4,
          unitCost: product.costPrice || 100,
          status: "ALLOCATED",
        },
      });
      assert(opInv.allocatedQuantity === 12 && opInv.usedQuantity === 4, `Allocated 12x ${product.name} from ${warehouse.name} (Used: 4)`);

      // Update usage
      const updatedInv = await prisma.operationInventory.update({
        where: { id: opInv.id },
        data: { usedQuantity: 12, status: "CONSUMED" },
      });
      assert(updatedInv.status === "CONSUMED" && updatedInv.usedQuantity === 12, "Updated inventory allocation to CONSUMED");
    } else {
      console.log("[SKIP] Inventory item or warehouse not found for allocation test.");
    }

    // -------------------------------------------------------------------------
    // Test 7: Vendor Engagement & Procurement Linkage
    // -------------------------------------------------------------------------
    console.log("\n--- Test 7: Vendor & PO Linkage ---");
    const vendor = await prisma.vendor.findFirst({ where: { organizationId: org.id } });
    const po = await prisma.purchaseOrder.findFirst({ where: { organizationId: org.id } });

    if (vendor) {
      const opVendor = await prisma.operationVendor.create({
        data: {
          operationId: testOp.id,
          vendorId: vendor.id,
          purchaseOrderId: po?.id || null,
          role: "SUBCONTRACTOR",
          estimatedCost: 5000,
          actualCost: 4800,
          status: "ENGAGED",
        },
      });
      assert(opVendor.vendorId === vendor.id, `Linked Vendor ${vendor.displayName} (Status: ENGAGED, PO: ${po?.poNumber || "N/A"})`);
    } else {
      console.log("[SKIP] Vendor not found for vendor linkage test.");
    }

    // -------------------------------------------------------------------------
    // Test 8: Operational Incident Triage & Critical Issue Escalation
    // -------------------------------------------------------------------------
    console.log("\n--- Test 8: Incident Triage & Severity Grading ---");
    const issueCode = `ISS-VERIFY-${Date.now().toString().slice(-4)}`;
    const issue = await prisma.operationIssue.create({
      data: {
        organizationId: org.id,
        issueCode,
        operationId: testOp.id,
        title: "Optical SFP Transceiver Loss of Signal on Port 48",
        description: "Laser degraded below -22 dBm threshold causing packet drops.",
        severity: "CRITICAL",
        status: "OPEN",
        reportedById: techLead.id,
        assignedToId: owner.id,
        dueDate: new Date(now.getTime() + 1 * 86400000),
      },
    });
    assert(issue.severity === "CRITICAL" && issue.status === "OPEN", `Created Critical Incident: [${issue.issueCode}] ${issue.title}`);

    // Add comment to incident
    const comment = await prisma.operationIssueComment.create({
      data: {
        issueId: issue.id,
        authorId: owner.id,
        content: "Hot-spare patch cable deployed. Laser optical budget restored to -12 dBm.",
      },
    });
    assert(!!comment.id, `Added resolution comment to incident thread`);

    // Transition Issue to RESOLVED
    const resolvedIssue = await prisma.operationIssue.update({
      where: { id: issue.id },
      data: { status: "RESOLVED", resolutionNotes: "Defective fiber patch cord replaced." },
    });
    assert(resolvedIssue.status === "RESOLVED", "Incident escalated, commented, and successfully marked RESOLVED");

    // -------------------------------------------------------------------------
    // Test 9: Generic Approval Requests (Budget Increase)
    // -------------------------------------------------------------------------
    console.log("\n--- Test 9: Generic Approval Workflow ---");
    const approvalReq = await prisma.approvalRequest.create({
      data: {
        organizationId: org.id,
        operationId: testOp.id,
        entityType: "BUDGET_CHANGE",
        entityId: testOp.id,
        title: "Additional Transceiver Procurement Request ($3,000)",
        description: "Emergency order for spare optic modules.",
        status: "PENDING",
        requestedById: techLead.id,
      },
    });
    assert(approvalReq.status === "PENDING" && approvalReq.entityType === "BUDGET_CHANGE", `Submitted approval request: ${approvalReq.title}`);

    // Decide Approval (Approved by Owner)
    const decidedReq = await prisma.approvalRequest.update({
      where: { id: approvalReq.id },
      data: {
        status: "APPROVED",
        approverId: owner.id,
        decisionDate: new Date(),
        comment: "Authorized under emergency maintenance quota.",
      },
    });
    assert(decidedReq.status === "APPROVED" && decidedReq.approverId === owner.id, "Approval request authorized by Operation Owner");

    // -------------------------------------------------------------------------
    // Test 10: Milestones & Activity Tracking
    // -------------------------------------------------------------------------
    console.log("\n--- Test 10: Operational Milestones & Activity Trail ---");
    const milestone = await prisma.operationMilestone.create({
      data: {
        operationId: testOp.id,
        title: "Backbone Uplink Cutover Completion",
        dueDate: targetEnd,
        status: "COMPLETED",
        completedAt: new Date(),
        order: 1,
      },
    });
    assert(milestone.status === "COMPLETED", `Milestone achieved: ${milestone.title}`);

    const activity = await prisma.operationActivity.create({
      data: {
        operationId: testOp.id,
        type: "COMPLETED",
        description: "Cutover completed with zero packet loss across active rings.",
        performedById: owner.id,
      },
    });
    assert(activity.type === "COMPLETED", "Activity trail logged audit entry");

    // -------------------------------------------------------------------------
    // Test 11: 360 Workspace Aggregation
    // -------------------------------------------------------------------------
    console.log("\n--- Test 11: 360 Operational Aggregation ---");
    const fullOp = await prisma.operation.findUnique({
      where: { id: testOp.id },
      include: {
        tasks: true,
        teamMembers: true,
        inventoryItems: true,
        vendors: true,
        issues: true,
        milestones: true,
        activities: true,
        approvals: true,
      },
    });
    assert(fullOp.tasks.length >= 2, `360 Workspace has ${fullOp.tasks.length} tasks`);
    assert(fullOp.teamMembers.length >= 1, `360 Workspace has ${fullOp.teamMembers.length} team members`);
    assert(fullOp.issues.length >= 1, `360 Workspace has ${fullOp.issues.length} incident records`);
    assert(fullOp.milestones.length >= 1, `360 Workspace has ${fullOp.milestones.length} milestones`);
    assert(fullOp.approvals.length >= 1, `360 Workspace has ${fullOp.approvals.length} approval entries`);

    // Clean up test operation
    await prisma.operation.delete({ where: { id: testOp.id } });
    console.log("\n[CLEANUP] Verification test operation cleanly purged.");

    // Final Summary
    console.log("\n================================================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Verification suite encountered unexpected error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runOperationsVerification();
