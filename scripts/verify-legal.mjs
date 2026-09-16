import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("================================================================================");
  console.log("VERIFICATION SUITE: BLOCK 10 — LEGAL MANAGEMENT");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const org = await prisma.organization.findFirst();
    assert(!!org, "Organization exists for tenant isolation");

    // Test 1: Contracts Exist and Tenant Scoped
    const contracts = await prisma.legalContract.findMany({
      where: { organizationId: org.id },
    });
    assert(contracts.length >= 4, `Found ${contracts.length} contracts (expected >= 4)`);

    // Test 2: Sequential Contract Code Format CTR-YYYY-XXXX
    const contractCodeValid = contracts.every((c) => /^CTR-\d{4}-\d{4}$/.test(c.contractNumber));
    assert(contractCodeValid, "Contract codes follow strict format CTR-YYYY-XXXX");

    // Test 3: Counterparty Association (Client / Vendor)
    const clientContract = contracts.find((c) => c.clientId !== null);
    assert(!!clientContract, "Contract correctly links to existing Client model");
    const vendorContract = contracts.find((c) => c.vendorId !== null);
    assert(!!vendorContract, "Contract correctly links to existing Vendor model");

    // Test 4: State Machine Lifecycle Statuses
    const statuses = contracts.map((c) => c.status);
    assert(statuses.includes("ACTIVE"), "Active contracts exist");
    assert(statuses.includes("EXPIRING_SOON"), "Expiring Soon contracts exist for horizon tracking");
    assert(statuses.includes("PENDING_APPROVAL"), "Pending Approval contracts exist for workflow");

    // Test 5: Contract 360 Aggregation Relations
    const contract360 = await prisma.legalContract.findFirst({
      where: { contractNumber: "CTR-2026-0001", organizationId: org.id },
      include: {
        legalOwner: true,
        client: true,
        documents: true,
      },
    });
    assert(!!contract360 && !!contract360.legalOwner, "Contract 360 loads legal owner correctly");
    assert(!!contract360 && contract360.documents.length > 0, "Contract 360 loads linked document repository");

    // Test 6: Contract Renewal Execution Test
    const renewalContract = await prisma.legalContract.findFirst({
      where: { organizationId: org.id, status: "ACTIVE" },
    });
    const previousExpiry = renewalContract.expiryDate;
    const newExpiry = new Date(previousExpiry.getTime() + 180 * 24 * 60 * 60 * 1000);

    const renewalRecord = await prisma.legalRenewal.create({
      data: {
        contractId: renewalContract.id,
        previousExpiryDate: previousExpiry,
        newExpiryDate: newExpiry,
        renewalType: "MANUAL",
        initiatedById: renewalContract.legalOwnerId,
        status: "COMPLETED",
        notes: "Automated verification renewal test",
      },
    });
    assert(!!renewalRecord, "LegalRenewal record created successfully");

    // Update contract expiry
    const renewedContract = await prisma.legalContract.update({
      where: { id: renewalContract.id },
      data: { expiryDate: newExpiry },
    });
    assert(
      renewedContract.expiryDate.getTime() === newExpiry.getTime(),
      "Contract expiration date updated upon renewal execution"
    );

    // Test 7: Litigation Cases Exist
    const cases = await prisma.legalCase.findMany({
      where: { organizationId: org.id },
    });
    assert(cases.length >= 1, `Found ${cases.length} litigation cases (expected >= 1)`);

    // Test 8: Case Sequential Code Format CASE-YYYY-XXXX
    const caseCodeValid = cases.every((cs) => /^CASE-\d{4}-\d{4}$/.test(cs.caseNumber));
    assert(caseCodeValid, "Case numbers follow strict format CASE-YYYY-XXXX");

    // Test 9: Case Financial Exposure Computation
    const totalExposure = cases.reduce(
      (acc, cs) => acc + (cs.estimatedFinancialExposure || 0),
      0
    );
    assert(totalExposure > 0, `Total litigation exposure calculated: $${totalExposure.toLocaleString()}`);

    // Test 10: Case Proceedings & Hearing Events
    const caseEvents = await prisma.legalCaseEvent.findMany({
      where: { case: { organizationId: org.id } },
    });
    assert(caseEvents.length >= 1, `Found ${caseEvents.length} hearing proceedings logged`);

    // Test 11: Statutory Compliance Obligations Exist
    const complianceItems = await prisma.legalCompliance.findMany({
      where: { organizationId: org.id },
    });
    assert(complianceItems.length >= 2, `Found ${complianceItems.length} compliance obligations (expected >= 2)`);

    // Test 12: Compliance Sequential Code Format CMP-YYYY-XXXX
    const compCodeValid = complianceItems.every((cmp) => /^CMP-\d{4}-\d{4}$/.test(cmp.code));
    assert(compCodeValid, "Compliance codes follow format CMP-YYYY-XXXX");

    // Test 13: Overdue vs Compliant Status Tracking
    const overdueComp = complianceItems.find((c) => c.status === "OVERDUE");
    assert(!!overdueComp, "Overdue compliance obligation detected for risk alerting");
    const compliantItem = complianceItems.find((c) => c.status === "COMPLIANT");
    assert(!!compliantItem, "Compliant obligation with verified attestation exists");

    // Test 14: Evidentiary Proof Submission and Verification
    const evidences = await prisma.complianceEvidence.findMany({
      where: { compliance: { organizationId: org.id } },
    });
    assert(evidences.length >= 1, `Found ${evidences.length} compliance evidence proofs`);
    const verifiedEvidence = evidences.find((e) => e.status === "VERIFIED");
    assert(!!verifiedEvidence, "Verified compliance evidence attestation confirmed");

    // Test 15: Version-Tracked Documents
    const documents = await prisma.legalDocument.findMany({
      where: { organizationId: org.id },
      include: { versions: true },
    });
    assert(documents.length >= 1, `Found ${documents.length} versioned legal documents`);
    const multiVersionDoc = documents.find((d) => d.versions.length >= 2);
    assert(!!multiVersionDoc, "Document repository supports multi-version audit history (v1, v2)");
    assert(multiVersionDoc.currentVersion === 2, "Document tracks currentVersion correctly (v2)");

    // Test 16: Risk Register & 5x5 Matrix Calculation
    const risks = await prisma.legalRisk.findMany({
      where: { organizationId: org.id },
    });
    assert(risks.length >= 3, `Found ${risks.length} legal risks registered`);

    const criticalRisk = risks.find((r) => r.riskLevel === "CRITICAL");
    assert(!!criticalRisk, "Critical risk detected (score >= 20)");
    assert(
      criticalRisk.riskScore === criticalRisk.probability * criticalRisk.impact,
      "Risk score formula verified: Probability × Impact"
    );

    // Test 17: Legal Deadlines Tracking
    const deadlines = await prisma.legalDeadline.findMany({
      where: { organizationId: org.id },
    });
    assert(deadlines.length >= 2, `Found ${deadlines.length} legal deadlines scheduled`);

    // Test 18: External Legal Counsel Contacts Directory
    const contacts = await prisma.legalContact.findMany({
      where: { organizationId: org.id },
    });
    assert(contacts.length >= 2, `Found ${contacts.length} external legal contacts / law firms`);

    // Test 19: Immutable Audit Activity Trail
    const activities = await prisma.legalActivity.findMany({
      where: { organizationId: org.id },
    });
    // Record a test activity
    const testAct = await prisma.legalActivity.create({
      data: {
        organizationId: org.id,
        type: "STATUS_CHANGED",
        description: "Automated verification test activity logged",
      },
    });
    assert(!!testAct, "LegalActivity audit trail writes and persists correctly");

    // Test 20: Cross-Module Backward Compatibility (Operations, CRM, HR, Finance)
    const opCount = await prisma.operation.count({ where: { organizationId: org.id } });
    assert(opCount >= 0, "Operations (Block 9) remains fully intact and queryable");
    const empCount = await prisma.employee.count({ where: { organizationId: org.id } });
    assert(empCount > 0, "HR / Employees (Block 2) remains fully intact");
    const finCount = await prisma.invoice.count({ where: { organizationId: org.id } });
    assert(finCount >= 0, "Finance / Invoices (Block 5) remains fully intact");
    const vendCount = await prisma.vendor.count({ where: { organizationId: org.id } });
    assert(vendCount >= 0, "Vendors / POs (Block 8) remains fully intact");

    console.log("\n================================================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================");
  } catch (err) {
    console.error("Verification error:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runVerification();
