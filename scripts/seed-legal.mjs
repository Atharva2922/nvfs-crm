import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedLegal() {
  console.log("================================================================================");
  console.log("SEEDING BLOCK 10: LEGAL MANAGEMENT");
  console.log("================================================================================\n");

  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error("No organization found. Please run base seed first.");
      return;
    }

    const employees = await prisma.employee.findMany({
      where: { organizationId: org.id },
      take: 5,
    });
    if (employees.length === 0) {
      console.error("No employees found. Seed employees first.");
      return;
    }

    const legalOwner = employees[0];
    const client = await prisma.client.findFirst({ where: { organizationId: org.id } });
    const vendor = await prisma.vendor.findFirst({ where: { organizationId: org.id } });
    const operation = await prisma.operation.findFirst({ where: { organizationId: org.id } });
    const department = await prisma.department.findFirst({ where: { organizationId: org.id } });

    console.log(`Organization: ${org.name} (${org.code})`);
    console.log(`Legal Owner: ${legalOwner.firstName} ${legalOwner.lastName}`);
    console.log(`Counterparty Client: ${client?.name || "None"}`);
    console.log(`Counterparty Vendor: ${vendor?.displayName || vendor?.name || "None"}\n`);

    const now = new Date();
    const in20Days = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in365Days = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const past5Days = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. External Counsel & Legal Contacts
    console.log("1. Seeding External Legal Counsel...");
    const counsel1 = await prisma.legalContact.upsert({
      where: { id: "counsel-pearsons-01" },
      update: {},
      create: {
        id: "counsel-pearsons-01",
        organizationId: org.id,
        name: "Jessica Pearson, Esq.",
        firmName: "Pearson Hardman LLP",
        role: "Managing Litigation Partner",
        email: "j.pearson@pearsonhardman.law",
        phone: "+1 (212) 555-0199",
        contactType: "EXTERNAL_COUNSEL",
        address: "767 5th Ave, New York, NY 10153",
        notes: "Lead outside counsel for IP disputes and chancery litigation.",
      },
    });

    const counsel2 = await prisma.legalContact.upsert({
      where: { id: "counsel-skadden-02" },
      update: {},
      create: {
        id: "counsel-skadden-02",
        organizationId: org.id,
        name: "David Boies, Esq.",
        firmName: "Boies Schiller & Flexner LLP",
        role: "Regulatory Compliance Specialist",
        email: "dboies@bsfllp.com",
        phone: "+1 (212) 555-0144",
        contactType: "LAW_FIRM",
        address: "55 Hudson Yards, New York, NY 10001",
        notes: "Antitrust and statutory regulatory compliance advisory.",
      },
    });
    console.log("   ✓ External Counsel Seeded.");

    // 2. Legal Contracts
    console.log("2. Seeding Enterprise Contracts & Master Agreements...");
    
    // Contract 1: Active Enterprise MSA
    const ctr1 = await prisma.legalContract.upsert({
      where: { organizationId_contractNumber: { organizationId: org.id, contractNumber: "CTR-2026-0001" } },
      update: {},
      create: {
        organizationId: org.id,
        contractNumber: "CTR-2026-0001",
        title: "Enterprise Master Services Agreement (MSA)",
        contractType: "CUSTOMER_MSA",
        partyType: "CLIENT",
        clientId: client?.id || null,
        legalOwnerId: legalOwner.id,
        operationId: operation?.id || null,
        contractValue: 250000,
        currency: "USD",
        paymentTerms: "Net 30, Quarterly Invoicing",
        effectiveDate: past30Days,
        expiryDate: in365Days,
        renewalType: "AUTOMATIC",
        noticePeriodDays: 30,
        status: "ACTIVE",
        riskLevel: "LOW",
        internalNotes: "Principal customer MSA governing cloud operations and technical SLA delivery.",
      },
    });

    // Contract 2: Expiring Cloud Infrastructure Agreement (30-day horizon)
    const ctr2 = await prisma.legalContract.upsert({
      where: { organizationId_contractNumber: { organizationId: org.id, contractNumber: "CTR-2026-0002" } },
      update: {},
      create: {
        organizationId: org.id,
        contractNumber: "CTR-2026-0002",
        title: "Mission Critical Cloud Infrastructure SLA",
        contractType: "VENDOR_PROCUREMENT",
        partyType: "VENDOR",
        vendorId: vendor?.id || null,
        legalOwnerId: legalOwner.id,
        contractValue: 72000,
        currency: "USD",
        paymentTerms: "Annual Advance",
        effectiveDate: new Date(now.getTime() - 345 * 24 * 60 * 60 * 1000),
        expiryDate: in20Days, // Expires in 20 days!
        renewalType: "AUTOMATIC",
        noticePeriodDays: 15,
        status: "EXPIRING_SOON",
        riskLevel: "MEDIUM",
        internalNotes: "Primary hosting provider agreement entering urgent renewal window.",
      },
    });

    // Contract 3: Contract Pending Executive Approval
    const ctr3 = await prisma.legalContract.upsert({
      where: { organizationId_contractNumber: { organizationId: org.id, contractNumber: "CTR-2026-0003" } },
      update: {},
      create: {
        organizationId: org.id,
        contractNumber: "CTR-2026-0003",
        title: "Enterprise Cybersecurity Retainer & SOC Services",
        contractType: "SERVICE_LEVEL_AGREEMENT",
        partyType: "VENDOR",
        vendorId: vendor?.id || null,
        legalOwnerId: legalOwner.id,
        contractValue: 180000,
        currency: "USD",
        effectiveDate: now,
        expiryDate: in365Days,
        renewalType: "MANUAL",
        noticePeriodDays: 30,
        status: "PENDING_APPROVAL",
        riskLevel: "LOW",
        internalNotes: "Awaiting CFO / CEO signoff prior to counter-signature.",
      },
    });

    // Contract 4: Expired NDA
    const ctr4 = await prisma.legalContract.upsert({
      where: { organizationId_contractNumber: { organizationId: org.id, contractNumber: "CTR-2025-0045" } },
      update: {},
      create: {
        organizationId: org.id,
        contractNumber: "CTR-2025-0045",
        title: "Mutual Confidentiality & Non-Disclosure Agreement",
        contractType: "NDA_CONFIDENTIALITY",
        partyType: "CLIENT",
        clientId: client?.id || null,
        legalOwnerId: legalOwner.id,
        contractValue: 0,
        currency: "USD",
        effectiveDate: new Date(now.getTime() - 395 * 24 * 60 * 60 * 1000),
        expiryDate: past30Days,
        renewalType: "NONE",
        status: "EXPIRED",
        riskLevel: "LOW",
        internalNotes: "Preliminary evaluation NDA expired upon MSA execution.",
      },
    });
    console.log("   ✓ 4 Contracts Seeded (Active, Expiring Soon, Pending Approval, Expired).");

    // 3. Legal Cases & Litigation Docket
    console.log("3. Seeding Litigation & Legal Cases...");
    const case1 = await prisma.legalCase.upsert({
      where: { organizationId_caseNumber: { organizationId: org.id, caseNumber: "CASE-2026-0001" } },
      update: {},
      create: {
        organizationId: org.id,
        caseNumber: "CASE-2026-0001",
        title: "Interslice Technologies v. NFVS Corporate (Patent Infringement)",
        caseType: "INTELLECTUAL_PROPERTY",
        courtJurisdiction: "US District Court, Southern District of New York (1:26-cv-02941-JGK)",
        judgeOrArbitrator: "Hon. John G. Koeltl",
        opposingParty: "Interslice Technologies Inc.",
        opposingCounsel: "Quinn Emanuel Urquhart & Sullivan, LLP",
        internalOwnerId: legalOwner.id,
        externalCounselId: counsel1.id,
        estimatedFinancialExposure: 150000,
        actualFinancialExposure: 75000,
        openDate: past30Days,
        priority: "URGENT",
        riskLevel: "CRITICAL",
        status: "IN_PROGRESS",
        description: "Allegations of algorithmic similarity in real-time distributed state management module.",
        notes: "Demonstrate prior art in 2024 open specification repository and seek summary judgment dismissal.",
      },
    });

    // Case Hearing Event
    await prisma.legalCaseEvent.create({
      data: {
        caseId: case1.id,
        eventType: "HEARING",
        title: "Markman Claim Construction Hearing",
        description: "Patent scope determination before Judge Koeltl.",
        eventDate: in20Days,
        location: "Courtroom 14B, Daniel Patrick Moynihan Courthouse, NYC",
        outcome: "Briefs submitted; awaiting preliminary oral arguments.",
      },
    });
    console.log("   ✓ Legal Case & Hearing Proceeding Seeded.");

    // 4. Statutory Compliance Obligations & Evidence
    console.log("4. Seeding Statutory Compliance Requirements...");
    const comp1 = await prisma.legalCompliance.upsert({
      where: { organizationId_code: { organizationId: org.id, code: "CMP-2026-0001" } },
      update: {},
      create: {
        organizationId: org.id,
        code: "CMP-2026-0001",
        title: "Annual SOC 2 Type II Security & Confidentiality Attestation",
        regulation: "SOC2",
        jurisdiction: "AICPA / Global",
        departmentId: department?.id || null,
        ownerId: legalOwner.id,
        frequency: "YEARLY",
        lastCompletedDate: past30Days,
        nextDueDate: in60Days,
        status: "COMPLIANT",
        riskLevel: "HIGH",
        description: "Annual independent audit evaluating Trust Services Criteria for Security, Availability, and Confidentiality.",
      },
    });

    // Evidence for SOC 2
    await prisma.complianceEvidence.create({
      data: {
        complianceId: comp1.id,
        title: "KPMG 2026 SOC 2 Type II Unqualified Audit Opinion",
        description: "Zero exceptions noted across Trust Services Principles.",
        evidenceType: "AUDIT_REPORT",
        fileUrl: "/vault/compliance/soc2_kpmg_report_2026.pdf",
        submittedById: legalOwner.id,
        verifiedById: legalOwner.id,
        verifiedAt: now,
        status: "VERIFIED",
      },
    });

    // Overdue Compliance 2: GDPR Data Protection Impact Assessment
    const comp2 = await prisma.legalCompliance.upsert({
      where: { organizationId_code: { organizationId: org.id, code: "CMP-2026-0002" } },
      update: {},
      create: {
        organizationId: org.id,
        code: "CMP-2026-0002",
        title: "EU GDPR Article 35 Data Protection Impact Assessment (DPIA)",
        regulation: "GDPR",
        jurisdiction: "European Union / EEA",
        departmentId: department?.id || null,
        ownerId: legalOwner.id,
        frequency: "QUARTERLY",
        nextDueDate: past5Days, // Overdue!
        status: "OVERDUE",
        riskLevel: "CRITICAL",
        description: "Statutory mandatory privacy assessment for biometric access and telemetry logging.",
      },
    });
    console.log("   ✓ Statutory Compliance (Compliant & Overdue DPIA) Seeded.");

    // 5. Versioned Legal Documents Vault
    console.log("5. Seeding Version-Tracked Document Vault...");
    await prisma.legalDocument.create({
      data: {
        organizationId: org.id,
        title: "Executed Master Services Agreement - Signed Final",
        documentType: "CONTRACT",
        contractId: ctr1.id,
        currentVersion: 2,
        latestFileUrl: "/vault/contracts/MSA_Final_v2.pdf",
        latestFileName: "MSA_Final_v2_Executed.pdf",
        uploadedById: legalOwner.id,
        versions: {
          create: [
            {
              version: 1,
              fileName: "MSA_Draft_v1.docx",
              fileUrl: "/vault/contracts/MSA_Draft_v1.docx",
              changeDescription: "Initial commercial draft sent to client for redlines",
              uploadedById: legalOwner.id,
            },
            {
              version: 2,
              fileName: "MSA_Final_v2_Executed.pdf",
              fileUrl: "/vault/contracts/MSA_Final_v2.pdf",
              changeDescription: "Incorporated bilateral indemnification and signed by authorized officer",
              uploadedById: legalOwner.id,
            },
          ],
        },
      },
    });
    console.log("   ✓ Document Vault with v1 & v2 Seeded.");

    // 6. Legal Risks Register
    console.log("6. Seeding Legal Risk Register...");
    await prisma.legalRisk.upsert({
      where: { organizationId_riskCode: { organizationId: org.id, riskCode: "RSK-2026-0001" } },
      update: {},
      create: {
        organizationId: org.id,
        riskCode: "RSK-2026-0001",
        title: "Preliminary Injunction Risk in Patent Litigation",
        caseId: case1.id,
        probability: 4,
        impact: 5,
        riskScore: 20,
        riskLevel: "CRITICAL",
        ownerId: legalOwner.id,
        mitigationPlan: "Expedite non-infringing architecture redesign branch and retain specialized Markman counsel.",
        status: "MITIGATING",
      },
    });

    await prisma.legalRisk.upsert({
      where: { organizationId_riskCode: { organizationId: org.id, riskCode: "RSK-2026-0002" } },
      update: {},
      create: {
        organizationId: org.id,
        riskCode: "RSK-2026-0002",
        title: "GDPR Article 83 Statutory Fine for Delayed DPIA",
        complianceId: comp2.id,
        probability: 3,
        impact: 5,
        riskScore: 15,
        riskLevel: "HIGH",
        ownerId: legalOwner.id,
        mitigationPlan: "Complete technical data flow audit and submit findings to Data Protection Officer.",
        status: "IDENTIFIED",
      },
    });

    await prisma.legalRisk.upsert({
      where: { organizationId_riskCode: { organizationId: org.id, riskCode: "RSK-2026-0003" } },
      update: {},
      create: {
        organizationId: org.id,
        riskCode: "RSK-2026-0003",
        title: "Cloud Provider Unilateral SLA Termination",
        contractId: ctr2.id,
        probability: 3,
        impact: 3,
        riskScore: 9,
        riskLevel: "MEDIUM",
        ownerId: legalOwner.id,
        mitigationPlan: "Establish multi-cloud failover redundancy across secondary hosting provider.",
        status: "ASSESSED",
      },
    });
    console.log("   ✓ Legal Risk Register Seeded.");

    // 7. Legal Deadlines
    console.log("7. Seeding Legal & Statutory Deadlines...");
    await prisma.legalDeadline.create({
      data: {
        organizationId: org.id,
        title: "File Opposition Brief to Interslice Motion",
        deadlineType: "FILING_DEADLINE",
        dueDate: in20Days,
        priority: "CRITICAL",
        caseId: case1.id,
        ownerId: legalOwner.id,
        notes: "Mandatory federal filing deadline under SDNY Local Civil Rule 6.1.",
      },
    });

    await prisma.legalDeadline.create({
      data: {
        organizationId: org.id,
        title: "Submit 15-Day Renewal Opt-Out Notice for Cloud SLA",
        deadlineType: "RENEWAL_NOTICE",
        dueDate: new Date(in20Days.getTime() - 15 * 24 * 60 * 60 * 1000),
        priority: "HIGH",
        contractId: ctr2.id,
        ownerId: legalOwner.id,
        notes: "Notice window deadline to renegotiate bandwidth tiers.",
      },
    });
    console.log("   ✓ Deadlines Seeded.");

    console.log("\n================================================================================");
    console.log("BLOCK 10: LEGAL MANAGEMENT SEEDED SUCCESSFULLY");
    console.log("================================================================================");
  } catch (err) {
    console.error("Error seeding legal module:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedLegal();
