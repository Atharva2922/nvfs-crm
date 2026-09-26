import { PrismaClient } from "@prisma/client";
import { EmployeeOnboardingService } from "../src/services/employee-onboarding.service.ts";

const prisma = new PrismaClient();

async function runTest() {
  console.log("=== STARTING COMPLETE EMPLOYEE ONBOARDING WORKFLOW TEST ===\n");

  try {
    // 1. Find or pick an organization and HR / Super Admin actor
    const org = await prisma.organization.findFirst({ where: { status: "ACTIVE" } });
    if (!org) throw new Error("No organization found");
    console.log(`[1] Selected Organization: ${org.name} (${org.code})`);

    const hrUser = await prisma.user.findFirst({
      where: {
        role: { code: { in: ["SUPER_ADMIN", "ADMIN", "HR", "CEO"] } },
      },
      include: { role: true, employee: true },
    });
    if (!hrUser) throw new Error("No HR / Admin user found");
    console.log(`[1] HR / Admin Actor: ${hrUser.email} (Role: ${hrUser.role.code})`);

    // 2. SUPER ADMIN / HR -> Create Employee (Basic Account Created)
    const dept = await prisma.department.findFirst({ where: { organizationId: org.id } });
    const testEmail = `newhire.test.${Date.now()}@enterprise.com`;
    const count = await prisma.employee.count({ where: { organizationId: org.id } });
    const employeeNumber = `EMP-${org.code || "EMP"}-TEST-${String(count + 1).padStart(3, "0")}`;

    console.log("\n[2] Creating Employee with Basic Details...");
    const createdEmployee = await prisma.employee.create({
      data: {
        organizationId: org.id,
        departmentId: dept?.id || null,
        employeeNumber,
        firstName: "Rohan",
        lastName: "Deshmukh",
        email: testEmail,
        phone: "+91 98200 88990",
        designation: "Associate Cloud Engineer",
        employmentType: "FULL_TIME",
        employmentStatus: "PROBATION",
        onboardingStatus: "PENDING_PROFILE",
        profileCompletion: 20,
        workMode: "HYBRID",
        location: "Headquarters (Mumbai)",
        emergencyContact: "Sunita Deshmukh",
        hireDate: new Date(),
      },
    });

    // Auto-create initial profile
    const initialProfile = await prisma.employeeProfile.create({
      data: {
        employeeId: createdEmployee.id,
        personalEmail: testEmail,
        currentAddress: "B-201, Green Acres, Mumbai",
        country: "India",
        primaryContactName: "Sunita Deshmukh",
        primaryContactPhone: "+91 98200 88990",
      },
    });

    console.log(`✅ Basic Account Created: ${createdEmployee.firstName} ${createdEmployee.lastName} (${createdEmployee.employeeNumber})`);
    console.log(`   Initial Status: ${createdEmployee.employmentStatus} | Onboarding: ${createdEmployee.onboardingStatus} | Completion: ${createdEmployee.profileCompletion}%`);

    // 3. Complete Employee Profile across all 10 sections
    console.log("\n[3] Executing 'Complete Employee Profile' (10 Sections)...");
    const profilePayload = {
      // 1. Personal Information
      dateOfBirth: "1996-08-14",
      gender: "MALE",
      maritalStatus: "SINGLE",
      bloodGroup: "B+",
      nationality: "Indian",
      fatherOrSpouseName: "Sanjay Deshmukh",
      bio: "Cloud & DevOps engineer with expertise in Docker, Kubernetes, and PostgreSQL.",

      // 2. Employment Information
      designation: "Associate Cloud Engineer",
      departmentId: dept?.id,
      employmentType: "FULL_TIME",
      workMode: "HYBRID",
      location: "Headquarters (Mumbai)",

      // 3. Contact & Address
      currentAddress: "Flat 402, Skyline Heights, Andheri East",
      permanentAddress: "Flat 402, Skyline Heights, Andheri East",
      personalEmail: `personal.${testEmail}`,
      alternatePhone: "+91 98200 11222",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400069",
      country: "India",

      // 4. Government IDs
      panNumber: "ABCDE9988F",
      aadhaarNumber: "7890 1234 5678",
      passportNumber: "Z9876543",
      passportExpiry: "2034-05-10",

      // 5. Bank / Payroll
      bankName: "HDFC Bank",
      accountHolderName: "Rohan Sanjay Deshmukh",
      accountNumber: "50100234567890",
      ifscOrRoutingCode: "HDFC0000123",
      branchName: "Andheri East Branch",
      accountType: "SALARY",
      upiId: "rohan@okhdfcbank",

      // 6. Emergency Contact
      primaryContactName: "Sanjay Deshmukh",
      primaryContactRelation: "Father",
      primaryContactPhone: "+91 98200 44556",

      // 7. Education
      highestDegree: "Bachelor of Engineering (B.E.)",
      institution: "Mumbai University",
      fieldOfStudy: "Information Technology",
      graduationYear: 2018,
      gradeOrGpa: "8.7 CGPA",
      certifications: "AWS Certified Developer Associate",

      // 8. Professional Details
      previousEmployer: "Infosys Ltd.",
      previousDesignation: "Software Engineer",
      totalExperienceYears: 4.5,
      skills: "AWS, Kubernetes, Terraform, Node.js, Next.js",
      linkedinUrl: "https://linkedin.com/in/rohandeshmukh-demo",
      portfolioUrl: "https://github.com/rohandeshmukh-demo",
    };

    const updatedDossier = await EmployeeOnboardingService.updateEmployeeProfile(
      createdEmployee.id,
      profilePayload,
      hrUser.id
    );

    console.log(`✅ Profile Updated!`);
    console.log(`   New Completion Score: ${updatedDossier.completion.totalScore}%`);
    console.log(`   Onboarding Status: ${updatedDossier.employee.onboardingStatus}`);
    console.log(`   Section Breakdown (Sample):`);
    for (const s of updatedDossier.completion.sections.slice(0, 5)) {
      console.log(`     - ${s.name}: ${s.completed ? 'COMPLETED (10/10)' : 'PENDING'} [Score: ${s.score}]`);
    }

    // 4. Upload Documents to Document Vault
    console.log("\n[4] Uploading Credentials to Document Vault...");
    const doc1 = await EmployeeOnboardingService.addDocument(createdEmployee.id, {
      type: "AADHAAR",
      title: "Aadhaar Card (Front & Back)",
      fileName: "aadhaar_rohan_deshmukh.pdf",
      fileUrl: `https://storage.internal.org/employees/${createdEmployee.id}/aadhaar.pdf`,
      fileSize: 420000,
      mimeType: "application/pdf",
    });

    const doc2 = await EmployeeOnboardingService.addDocument(createdEmployee.id, {
      type: "RESUME",
      title: "Updated Curriculum Vitae (CV)",
      fileName: "rohan_deshmukh_resume.pdf",
      fileUrl: `https://storage.internal.org/employees/${createdEmployee.id}/resume.pdf`,
      fileSize: 180000,
      mimeType: "application/pdf",
    });

    console.log(`✅ Uploaded 2 Documents: [${doc1.title}] & [${doc2.title}] (Status: ${doc1.verificationStatus})`);

    // 5. Document Verification by HR
    console.log("\n[5] HR Review & Document Verification...");
    const verifiedDoc1 = await EmployeeOnboardingService.verifyDocument(
      doc1.id,
      "VERIFIED",
      "Aadhaar UID verified with UIDAI database. Identity confirmed.",
      hrUser.id,
      `${hrUser.employee?.firstName || ""} ${hrUser.employee?.lastName || ""}`.trim() || hrUser.email
    );
    console.log(`✅ Verified: ${verifiedDoc1.title} -> Status: ${verifiedDoc1.verificationStatus} by ${verifiedDoc1.verifiedBy}`);

    const verifiedDoc2 = await EmployeeOnboardingService.verifyDocument(
      doc2.id,
      "VERIFIED",
      "Credentials and prior work experience verified.",
      hrUser.id,
      `${hrUser.employee?.firstName || ""} ${hrUser.employee?.lastName || ""}`.trim() || hrUser.email
    );
    console.log(`✅ Verified: ${verifiedDoc2.title} -> Status: ${verifiedDoc2.verificationStatus} by ${verifiedDoc2.verifiedBy}`);

    // Re-check dossier status
    const midDossier = await EmployeeOnboardingService.getEmployeeDossier(createdEmployee.id);
    console.log(`   Dossier Readiness -> Completion Score: ${midDossier.completion.totalScore}% | Onboarding: ${midDossier.employee.onboardingStatus}`);

    // 6. HR Approval & Account Activation
    console.log("\n[6] HR Final Approval & Employee Account Activation...");
    const approvedEmp = await EmployeeOnboardingService.approveAndActivateEmployee(
      createdEmployee.id,
      hrUser.id,
      `${hrUser.employee?.firstName || ""} ${hrUser.employee?.lastName || ""}`.trim() || hrUser.email,
      "All 10 profile sections complete and credentials verified. Approved to Active Workforce."
    );

    console.log(`🎉 EMPLOYEE ACCOUNT ACTIVE!`);
    console.log(`   Employee ID: ${approvedEmp.employeeNumber}`);
    console.log(`   Employment Status: ${approvedEmp.employmentStatus}`);
    console.log(`   Onboarding Status: ${approvedEmp.onboardingStatus}`);
    console.log(`   Profile Completion: ${approvedEmp.profileCompletion}%`);
    console.log(`   Approved By: ${approvedEmp.approvedBy} at ${approvedEmp.approvedAt}`);
    console.log(`   HR Approval Notes: "${approvedEmp.approvalNotes}"`);

    // Clean up test employee
    console.log("\n[7] Cleaning up test records...");
    await prisma.employeeDocument.deleteMany({ where: { employeeId: createdEmployee.id } });
    await prisma.employeeProfile.deleteMany({ where: { employeeId: createdEmployee.id } });
    await prisma.employee.delete({ where: { id: createdEmployee.id } });
    console.log("✅ Test records cleaned up successfully.");

    console.log("\n=== ALL TEST STEPS PASSED SUCCESSFULLY (100%) ===");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
