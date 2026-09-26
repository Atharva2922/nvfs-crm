import { db } from "@/lib/db";
import { AuditService } from "@/services/audit.service";
import { NotificationService } from "@/services/notification.service";

export interface SectionStatus {
  id: string;
  name: string;
  weight: number;
  completed: boolean;
  score: number;
  missingFields: string[];
}

export interface ProfileCompletionResult {
  totalScore: number;
  isComplete: boolean;
  sections: SectionStatus[];
  allDocumentsVerified: boolean;
  canApprove: boolean;
}

export class EmployeeOnboardingService {
  /**
   * Calculates dynamic profile completion across all 10 standard organizational sections
   */
  static calculateCompletion(
    employee: any,
    profile: any | null,
    documents: any[] = [],
    user: any | null = null
  ): ProfileCompletionResult {
    const prof = profile || {};
    const docs = documents || [];

    // 1. Personal Information (10%)
    const personalMissing: string[] = [];
    if (!prof.dateOfBirth) personalMissing.push("Date of Birth");
    if (!prof.gender) personalMissing.push("Gender");
    if (!prof.maritalStatus) personalMissing.push("Marital Status");
    if (!prof.bloodGroup) personalMissing.push("Blood Group");
    if (!prof.nationality) personalMissing.push("Nationality");
    const personalComplete = personalMissing.length === 0;
    const personalScore = personalComplete ? 10 : Math.max(0, Math.round(((5 - personalMissing.length) / 5) * 10));

    // 2. Employment Information (10%)
    const employmentMissing: string[] = [];
    if (!employee.designation) employmentMissing.push("Designation");
    if (!employee.departmentId) employmentMissing.push("Department");
    if (!employee.hireDate) employmentMissing.push("Hire Date");
    if (!employee.employmentType) employmentMissing.push("Employment Type");
    if (!employee.workMode) employmentMissing.push("Work Mode");
    if (!employee.location) employmentMissing.push("Work Location");
    const employmentComplete = employmentMissing.length === 0;
    const employmentScore = employmentComplete ? 10 : Math.max(0, Math.round(((6 - employmentMissing.length) / 6) * 10));

    // 3. Contact & Address (10%)
    const contactMissing: string[] = [];
    if (!prof.currentAddress) contactMissing.push("Current Address");
    if (!prof.city) contactMissing.push("City");
    if (!prof.state) contactMissing.push("State / Province");
    if (!prof.postalCode) contactMissing.push("Postal Code");
    if (!employee.phone && !prof.alternatePhone) contactMissing.push("Contact Phone");
    if (!prof.personalEmail) contactMissing.push("Personal Email");
    const contactComplete = contactMissing.length === 0;
    const contactScore = contactComplete ? 10 : Math.max(0, Math.round(((6 - contactMissing.length) / 6) * 10));

    // 4. Government IDs (10%)
    const govMissing: string[] = [];
    if (!prof.panNumber && !prof.aadhaarNumber && !prof.passportNumber && !prof.ssnOrNationalId && !prof.taxId) {
      govMissing.push("At least one Government ID (PAN, Aadhaar, Passport, or Tax ID)");
    }
    const govComplete = govMissing.length === 0;
    const govScore = govComplete ? 10 : 0;

    // 5. Bank / Payroll (10%)
    const bankMissing: string[] = [];
    if (!prof.bankName) bankMissing.push("Bank Name");
    if (!prof.accountHolderName) bankMissing.push("Account Holder Name");
    if (!prof.accountNumber) bankMissing.push("Account Number");
    if (!prof.ifscOrRoutingCode) bankMissing.push("IFSC / Routing Code");
    const bankComplete = bankMissing.length === 0;
    const bankScore = bankComplete ? 10 : Math.max(0, Math.round(((4 - bankMissing.length) / 4) * 10));

    // 6. Emergency Contact (10%)
    const emergencyMissing: string[] = [];
    const primName = prof.primaryContactName || employee.emergencyContact;
    if (!primName) emergencyMissing.push("Primary Contact Name");
    if (!prof.primaryContactPhone) emergencyMissing.push("Primary Contact Phone");
    if (!prof.primaryContactRelation) emergencyMissing.push("Primary Relationship");
    const emergencyComplete = emergencyMissing.length === 0;
    const emergencyScore = emergencyComplete ? 10 : Math.max(0, Math.round(((3 - emergencyMissing.length) / 3) * 10));

    // 7. Education (10%)
    const eduMissing: string[] = [];
    if (!prof.highestDegree) eduMissing.push("Highest Degree / Qualification");
    if (!prof.institution) eduMissing.push("College / University");
    if (!prof.graduationYear) eduMissing.push("Graduation Year");
    const eduComplete = eduMissing.length === 0;
    const eduScore = eduComplete ? 10 : Math.max(0, Math.round(((3 - eduMissing.length) / 3) * 10));

    // 8. Professional Details (10%)
    const profMissing: string[] = [];
    if (!prof.skills || prof.skills.trim().length === 0) profMissing.push("Key Skills");
    if (prof.totalExperienceYears === null || prof.totalExperienceYears === undefined) {
      profMissing.push("Total Experience Years");
    }
    const profComplete = profMissing.length === 0;
    const profScore = profComplete ? 10 : Math.max(0, Math.round(((2 - profMissing.length) / 2) * 10));

    // 9. Documents (10%)
    const docMissing: string[] = [];
    if (docs.length === 0) {
      docMissing.push("Upload at least 1 identification document and 1 credential");
    } else if (docs.length < 2) {
      docMissing.push("Upload at least 2 verification documents");
    }
    const docComplete = docs.length >= 2;
    const docScore = docComplete ? 10 : (docs.length === 1 ? 5 : 0);

    // 10. Access & Permissions (10%)
    const accessMissing: string[] = [];
    if (!employee.userId && !user) {
      accessMissing.push("CRM User Account");
    }
    const roleCode = user?.role?.code || employee.user?.role?.code;
    if (!roleCode) {
      accessMissing.push("Role & Permissions assignment");
    }
    const accessComplete = accessMissing.length === 0;
    const accessScore = accessComplete ? 10 : (employee.userId ? 5 : 0);

    const sections: SectionStatus[] = [
      { id: "personal", name: "Personal Information", weight: 10, completed: personalComplete, score: personalScore, missingFields: personalMissing },
      { id: "employment", name: "Employment Information", weight: 10, completed: employmentComplete, score: employmentScore, missingFields: employmentMissing },
      { id: "contact", name: "Contact & Address", weight: 10, completed: contactComplete, score: contactScore, missingFields: contactMissing },
      { id: "government", name: "Government IDs", weight: 10, completed: govComplete, score: govScore, missingFields: govMissing },
      { id: "payroll", name: "Bank / Payroll", weight: 10, completed: bankComplete, score: bankScore, missingFields: bankMissing },
      { id: "emergency", name: "Emergency Contact", weight: 10, completed: emergencyComplete, score: emergencyScore, missingFields: emergencyMissing },
      { id: "education", name: "Education", weight: 10, completed: eduComplete, score: eduScore, missingFields: eduMissing },
      { id: "professional", name: "Professional Details", weight: 10, completed: profComplete, score: profScore, missingFields: profMissing },
      { id: "documents", name: "Documents", weight: 10, completed: docComplete, score: docScore, missingFields: docMissing },
      { id: "access", name: "Access & Permissions", weight: 10, completed: accessComplete, score: accessScore, missingFields: accessMissing },
    ];

    const totalScore = sections.reduce((acc, s) => acc + s.score, 0);
    const allDocumentsVerified = docs.length > 0 && docs.every((d) => d.verificationStatus === "VERIFIED");
    const isComplete = totalScore >= 80;
    const canApprove = totalScore >= 70;

    return {
      totalScore,
      isComplete,
      sections,
      allDocumentsVerified,
      canApprove,
    };
  }

  /**
   * Retrieves the full employee dossier with profile, documents, and dynamic completion
   */
  static async getEmployeeDossier(employeeId: string) {
    let employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        organization: true,
        department: true,
        team: true,
        manager: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            designation: true,
            email: true,
          },
        },
        user: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
            memberships: {
              include: {
                organization: true,
                role: true,
              },
            },
          },
        },
        profile: true,
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!employee) {
      return null;
    }

    // If profile doesn't exist, ensure an empty profile is created
    if (!employee.profile) {
      const createdProfile = await db.employeeProfile.create({
        data: {
          employeeId: employee.id,
          personalEmail: employee.email,
          country: "India",
        },
      });
      employee.profile = createdProfile;
    }

    const completion = this.calculateCompletion(
      employee,
      employee.profile,
      employee.documents,
      employee.user
    );

    // Keep employee.profileCompletion synced in database if it differs
    if (employee.profileCompletion !== completion.totalScore) {
      await db.employee.update({
        where: { id: employee.id },
        data: { profileCompletion: completion.totalScore },
      });
      employee.profileCompletion = completion.totalScore;
    }

    return {
      employee,
      completion,
    };
  }

  /**
   * Updates employee profile details and synchronizes status & completion score
   */
  static async updateEmployeeProfile(employeeId: string, payload: any, actorUserId?: string) {
    const {
      // 1. Personal Information
      dateOfBirth,
      gender,
      maritalStatus,
      bloodGroup,
      nationality,
      fatherOrSpouseName,
      bio,

      // 2. Employment fields that reside on Employee model
      designation,
      departmentId,
      teamId,
      managerId,
      employmentType,
      workMode,
      location,
      hireDate,
      phone,

      // 3. Contact & Address
      currentAddress,
      permanentAddress,
      personalEmail,
      alternatePhone,
      city,
      state,
      postalCode,
      country,

      // 4. Government IDs
      panNumber,
      aadhaarNumber,
      passportNumber,
      passportExpiry,
      ssnOrNationalId,
      taxId,

      // 5. Bank / Payroll
      bankName,
      accountHolderName,
      accountNumber,
      ifscOrRoutingCode,
      branchName,
      accountType,
      upiId,

      // 6. Emergency Contact
      primaryContactName,
      primaryContactRelation,
      primaryContactPhone,
      secondaryContactName,
      secondaryContactRelation,
      secondaryContactPhone,

      // 7. Education
      highestDegree,
      institution,
      fieldOfStudy,
      graduationYear,
      gradeOrGpa,
      certifications,

      // 8. Professional Details
      previousEmployer,
      previousDesignation,
      totalExperienceYears,
      skills,
      linkedinUrl,
      portfolioUrl,
    } = payload;

    // Update Employee core fields if provided
    const employeeUpdateData: any = {};
    if (designation !== undefined) employeeUpdateData.designation = designation;
    if (departmentId !== undefined) employeeUpdateData.departmentId = departmentId;
    if (teamId !== undefined) employeeUpdateData.teamId = teamId || null;
    if (managerId !== undefined) employeeUpdateData.managerId = managerId || null;
    if (employmentType !== undefined) employeeUpdateData.employmentType = employmentType;
    if (workMode !== undefined) employeeUpdateData.workMode = workMode;
    if (location !== undefined) employeeUpdateData.location = location;
    if (hireDate !== undefined) employeeUpdateData.hireDate = new Date(hireDate);
    if (phone !== undefined) employeeUpdateData.phone = phone;
    if (primaryContactName !== undefined) employeeUpdateData.emergencyContact = primaryContactName;

    if (Object.keys(employeeUpdateData).length > 0) {
      await db.employee.update({
        where: { id: employeeId },
        data: employeeUpdateData,
      });
    }

    // Upsert EmployeeProfile
    const profileData: any = {
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender ?? undefined,
      maritalStatus: maritalStatus ?? undefined,
      bloodGroup: bloodGroup ?? undefined,
      nationality: nationality ?? undefined,
      fatherOrSpouseName: fatherOrSpouseName ?? undefined,
      bio: bio ?? undefined,

      currentAddress: currentAddress ?? undefined,
      permanentAddress: permanentAddress ?? undefined,
      personalEmail: personalEmail ?? undefined,
      alternatePhone: alternatePhone ?? undefined,
      city: city ?? undefined,
      state: state ?? undefined,
      postalCode: postalCode ?? undefined,
      country: country ?? undefined,

      panNumber: panNumber ? panNumber.toUpperCase() : undefined,
      aadhaarNumber: aadhaarNumber ?? undefined,
      passportNumber: passportNumber ? passportNumber.toUpperCase() : undefined,
      passportExpiry: passportExpiry ? new Date(passportExpiry) : undefined,
      ssnOrNationalId: ssnOrNationalId ?? undefined,
      taxId: taxId ?? undefined,

      bankName: bankName ?? undefined,
      accountHolderName: accountHolderName ?? undefined,
      accountNumber: accountNumber ?? undefined,
      ifscOrRoutingCode: ifscOrRoutingCode ? ifscOrRoutingCode.toUpperCase() : undefined,
      branchName: branchName ?? undefined,
      accountType: accountType ?? undefined,
      upiId: upiId ?? undefined,

      primaryContactName: primaryContactName ?? undefined,
      primaryContactRelation: primaryContactRelation ?? undefined,
      primaryContactPhone: primaryContactPhone ?? undefined,
      secondaryContactName: secondaryContactName ?? undefined,
      secondaryContactRelation: secondaryContactRelation ?? undefined,
      secondaryContactPhone: secondaryContactPhone ?? undefined,

      highestDegree: highestDegree ?? undefined,
      institution: institution ?? undefined,
      fieldOfStudy: fieldOfStudy ?? undefined,
      graduationYear: graduationYear ? Number(graduationYear) : undefined,
      gradeOrGpa: gradeOrGpa ?? undefined,
      certifications: certifications ?? undefined,

      previousEmployer: previousEmployer ?? undefined,
      previousDesignation: previousDesignation ?? undefined,
      totalExperienceYears: totalExperienceYears !== undefined ? Number(totalExperienceYears) : undefined,
      skills: Array.isArray(skills) ? skills.join(", ") : skills,
      linkedinUrl: linkedinUrl ?? undefined,
      portfolioUrl: portfolioUrl ?? undefined,
    };

    // Clean undefined keys
    Object.keys(profileData).forEach((key) => {
      if (profileData[key] === undefined) delete profileData[key];
    });

    const updatedProfile = await db.employeeProfile.upsert({
      where: { employeeId },
      create: {
        employeeId,
        ...profileData,
      },
      update: profileData,
    });

    // Re-fetch employee & docs to calculate fresh score
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        documents: true,
        user: { include: { role: true } },
      },
    });

    if (employee) {
      const completion = this.calculateCompletion(
        employee,
        updatedProfile,
        employee.documents,
        employee.user
      );

      // Determine appropriate onboarding lifecycle state
      let nextOnboardingStatus = employee.onboardingStatus;
      if (employee.onboardingStatus === "PENDING_PROFILE") {
        if (completion.totalScore >= 70) {
          nextOnboardingStatus = "PENDING_VERIFICATION";
        }
      } else if (employee.onboardingStatus === "PENDING_VERIFICATION") {
        if (completion.allDocumentsVerified && completion.canApprove) {
          nextOnboardingStatus = "PENDING_APPROVAL";
        }
      }

      await db.employee.update({
        where: { id: employee.id },
        data: {
          profileCompletion: completion.totalScore,
          onboardingStatus: nextOnboardingStatus,
        },
      });

      if (actorUserId) {
        await AuditService.logMutation({
          actorId: actorUserId,
          action: "EMPLOYEE_PROFILE_UPDATED",
          entity: "EmployeeProfile",
          entityId: employeeId,
          newValue: { completionScore: completion.totalScore, onboardingStatus: nextOnboardingStatus },
          metadata: { source: "complete_profile_workflow" },
        });
      }
    }

    return this.getEmployeeDossier(employeeId);
  }

  /**
   * Adds an uploaded document to the employee document vault
   */
  static async addDocument(employeeId: string, docData: {
    type: string;
    title: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
  }) {
    const doc = await db.employeeDocument.create({
      data: {
        employeeId,
        type: docData.type,
        title: docData.title,
        fileName: docData.fileName,
        fileUrl: docData.fileUrl,
        fileSize: docData.fileSize || 0,
        mimeType: docData.mimeType || "application/pdf",
        verificationStatus: "PENDING",
      },
    });

    // Recalculate completion
    await this.refreshEmployeeCompletion(employeeId);

    return doc;
  }

  /**
   * Verifies or Rejects a document
   */
  static async verifyDocument(
    documentId: string,
    status: "VERIFIED" | "REJECTED",
    notes: string,
    verifierUserId: string,
    verifierName: string
  ) {
    const doc = await db.employeeDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: status,
        verificationNotes: notes || null,
        verifiedAt: new Date(),
        verifiedBy: verifierName,
      },
      include: { employee: true },
    });

    await AuditService.logMutation({
      actorId: verifierUserId,
      action: status === "VERIFIED" ? "EMPLOYEE_DOCUMENT_VERIFIED" : "EMPLOYEE_DOCUMENT_REJECTED",
      entity: "EmployeeDocument",
      entityId: documentId,
      newValue: { status, notes, employeeId: doc.employeeId },
      metadata: { verifier: verifierName },
    });

    await this.refreshEmployeeCompletion(doc.employeeId);

    return doc;
  }

  /**
   * Final HR Approval Step: Transitions Employee to ACTIVE and fully activates system account
   */
  static async approveAndActivateEmployee(
    employeeId: string,
    approverUserId: string,
    approverName: string,
    approvalNotes: string = "All profile details and credentials verified by HR"
  ) {
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: true,
        organization: true,
        profile: true,
        documents: true,
      },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    const now = new Date();

    // 1. Activate Employee Master Record
    const updatedEmployee = await db.employee.update({
      where: { id: employeeId },
      data: {
        employmentStatus: "ACTIVE",
        onboardingStatus: "COMPLETED",
        approvedAt: now,
        approvedBy: approverName,
        approvalNotes,
        profileCompletion: 100,
      },
    });

    // 2. Activate Linked User Login Account
    if (employee.userId) {
      await db.user.update({
        where: { id: employee.userId },
        data: { isActive: true },
      });

      // Also ensure primary company membership is ACTIVE
      await db.userCompanyMembership.updateMany({
        where: {
          userId: employee.userId,
          organizationId: employee.organizationId,
        },
        data: { status: "ACTIVE" },
      });

      // Send system notification to newly activated user
      await NotificationService.create({
        organizationId: employee.organizationId,
        userId: employee.userId,
        type: "SYSTEM",
        title: "Account Activated 🎉",
        message: `Welcome to ${employee.organization.name}! Your employee profile has been approved and your corporate account is now ACTIVE.`,
        link: "/app/overview",
      }).catch(() => {});
    }

    // 3. Log Audit Trail
    await AuditService.logMutation({
      actorId: approverUserId,
      action: "EMPLOYEE_ONBOARDING_APPROVED",
      entity: "Employee",
      entityId: employeeId,
      newValue: {
        status: "ACTIVE",
        onboardingStatus: "COMPLETED",
        approvedBy: approverName,
        notes: approvalNotes,
      },
      metadata: { approver: approverName },
    });

    return updatedEmployee;
  }

  /**
   * Helper to recalculate and store latest score and appropriate status
   */
  private static async refreshEmployeeCompletion(employeeId: string) {
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        profile: true,
        documents: true,
        user: { include: { role: true } },
      },
    });

    if (!employee) return;

    const completion = this.calculateCompletion(
      employee,
      employee.profile,
      employee.documents,
      employee.user
    );

    let onboardingStatus = employee.onboardingStatus;
    if (onboardingStatus === "COMPLETED") {
      // keep completed
    } else if (completion.allDocumentsVerified && completion.canApprove) {
      onboardingStatus = "PENDING_APPROVAL";
    } else if (completion.totalScore >= 60 || employee.documents.length > 0) {
      onboardingStatus = "PENDING_VERIFICATION";
    } else {
      onboardingStatus = "PENDING_PROFILE";
    }

    await db.employee.update({
      where: { id: employeeId },
      data: {
        profileCompletion: completion.totalScore,
        onboardingStatus,
      },
    });
  }
}
