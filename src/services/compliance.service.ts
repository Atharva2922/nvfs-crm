import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";

export interface ComplianceFilterOptions {
  status?: string;
  regulation?: string;
  frequency?: string;
  riskLevel?: string;
  departmentId?: string;
  ownerId?: string;
  search?: string;
}

export interface CreateComplianceInput {
  title: string;
  code?: string;
  regulation: string;
  jurisdiction?: string;
  departmentId?: string;
  ownerId: string;
  frequency?: string;
  lastCompletedDate?: string | Date;
  nextDueDate: string | Date;
  riskLevel?: string;
  description?: string;
  notes?: string;
}

export class ComplianceService {
  /**
   * Generate sequential Compliance Code CMP-YYYY-XXXX
   */
  static async generateCode(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.legalCompliance.count({
      where: {
        organizationId,
        code: { startsWith: `CMP-${year}-` },
      },
    });
    const seq = String(count + 1).padStart(4, "0");
    return `CMP-${year}-${seq}`;
  }

  /**
   * List statutory compliance requirements
   */
  static async listCompliance(
    user: AuthenticatedUser,
    filters: ComplianceFilterOptions = {},
    page: number = 1,
    limit: number = 25
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };

    if (filters.status) where.status = filters.status;
    if (filters.regulation) where.regulation = filters.regulation;
    if (filters.frequency) where.frequency = filters.frequency;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.ownerId) where.ownerId = filters.ownerId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { code: { contains: filters.search } },
        { regulation: { contains: filters.search } },
        { jurisdiction: { contains: filters.search } },
      ];
    }

    const [total, items] = await Promise.all([
      db.legalCompliance.count({ where }),
      db.legalCompliance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nextDueDate: "asc" },
        include: {
          department: { select: { id: true, name: true, code: true } },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: {
            select: {
              evidences: true,
              documents: true,
              deadlines: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get compliance requirement workspace
   */
  static async getById(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const compliance = await db.legalCompliance.findFirst({
      where: { id, organizationId: orgId },
      include: {
        department: true,
        owner: {
          select: { id: true, firstName: true, lastName: true, designation: true, email: true, phone: true },
        },
        evidences: {
          orderBy: { createdAt: "desc" },
          include: {
            submittedBy: { select: { id: true, firstName: true, lastName: true } },
            verifiedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        documents: {
          orderBy: { updatedAt: "desc" },
          include: {
            versions: { orderBy: { version: "desc" } },
            uploadedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        deadlines: {
          orderBy: { dueDate: "asc" },
          include: {
            owner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            performedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        risks: {
          orderBy: { riskScore: "desc" },
        },
      },
    });

    if (!compliance) throw new Error("Compliance requirement not found");
    return compliance;
  }

  /**
   * Create compliance requirement
   */
  static async create(user: AuthenticatedUser, data: CreateComplianceInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const code = data.code?.trim() || (await this.generateCode(orgId));
    const nextDueDate = new Date(data.nextDueDate);

    const compliance = await db.legalCompliance.create({
      data: {
        organizationId: orgId,
        code,
        title: data.title,
        regulation: data.regulation,
        jurisdiction: data.jurisdiction || "Federal",
        departmentId: data.departmentId || null,
        ownerId: data.ownerId,
        frequency: data.frequency || "YEARLY",
        lastCompletedDate: data.lastCompletedDate ? new Date(data.lastCompletedDate) : null,
        nextDueDate,
        status: "COMPLIANT",
        riskLevel: data.riskLevel || "LOW",
        description: data.description || null,
        notes: data.notes || null,
      },
    });

    // Create deadline
    await db.legalDeadline.create({
      data: {
        organizationId: orgId,
        complianceId: compliance.id,
        title: `Compliance Due: ${compliance.title} (${compliance.regulation})`,
        deadlineType: "COMPLIANCE_DEADLINE",
        dueDate: nextDueDate,
        priority: compliance.riskLevel === "CRITICAL" ? "CRITICAL" : "HIGH",
        ownerId: compliance.ownerId,
        status: "UPCOMING",
      },
    });

    await Promise.all([
      db.legalActivity.create({
        data: {
          organizationId: orgId,
          complianceId: compliance.id,
          type: "CREATED",
          description: `Compliance requirement "${compliance.title}" [${compliance.code}] registered.`,
          performedById: user.employee.id,
        },
      }),
      AuditService.logMutation({
        actorId: user.id,
        action: "COMPLIANCE_REQUIREMENT_CREATED",
        entity: "LegalCompliance",
        entityId: compliance.id,
        newValue: { code: compliance.code, title: compliance.title, regulation: compliance.regulation },
      }),
    ]);

    return compliance;
  }

  /**
   * Submit compliance evidence
   */
  static async submitEvidence(
    user: AuthenticatedUser,
    complianceId: string,
    data: {
      title: string;
      description?: string;
      evidenceType?: string;
      fileUrl?: string;
    }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const compliance = await db.legalCompliance.findFirst({ where: { id: complianceId, organizationId: orgId } });
    if (!compliance) throw new Error("Compliance requirement not found");

    const evidence = await db.complianceEvidence.create({
      data: {
        complianceId,
        title: data.title,
        description: data.description || null,
        evidenceType: data.evidenceType || "CERTIFICATE",
        fileUrl: data.fileUrl || null,
        submittedById: user.employee.id,
        status: "SUBMITTED",
      },
    });

    await db.legalActivity.create({
      data: {
        organizationId: orgId,
        complianceId,
        type: "EVIDENCE_SUBMITTED",
        description: `Compliance proof "${data.title}" submitted by ${user.employee.firstName} ${user.employee.lastName}.`,
        performedById: user.employee.id,
      },
    });

    return evidence;
  }

  /**
   * Verify compliance evidence
   */
  static async verifyEvidence(
    user: AuthenticatedUser,
    evidenceId: string,
    status: "VERIFIED" | "REJECTED"
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const evidence = await db.complianceEvidence.findFirst({
      where: { id: evidenceId },
      include: { compliance: true },
    });
    if (!evidence || evidence.compliance.organizationId !== orgId) {
      throw new Error("Compliance evidence not found");
    }

    const updated = await db.complianceEvidence.update({
      where: { id: evidenceId },
      data: {
        status,
        verifiedById: user.employee.id,
        verifiedAt: new Date(),
      },
    });

    if (status === "VERIFIED") {
      // Update compliance requirement status
      await db.legalCompliance.update({
        where: { id: evidence.complianceId },
        data: {
          status: "COMPLIANT",
          lastCompletedDate: new Date(),
        },
      });
    }

    await db.legalActivity.create({
      data: {
        organizationId: orgId,
        complianceId: evidence.complianceId,
        type: "UPDATED",
        description: `Evidence "${evidence.title}" marked as ${status}.`,
        performedById: user.employee.id,
      },
    });

    return updated;
  }

  /**
   * Update compliance requirement
   */
  static async update(user: AuthenticatedUser, id: string, data: Partial<CreateComplianceInput> & { status?: string }) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.legalCompliance.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new Error("Compliance requirement not found");

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.regulation !== undefined) updateData.regulation = data.regulation;
    if (data.jurisdiction !== undefined) updateData.jurisdiction = data.jurisdiction;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.lastCompletedDate !== undefined) updateData.lastCompletedDate = data.lastCompletedDate ? new Date(data.lastCompletedDate) : null;
    if (data.nextDueDate !== undefined) updateData.nextDueDate = new Date(data.nextDueDate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.riskLevel !== undefined) updateData.riskLevel = data.riskLevel;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await db.legalCompliance.update({
      where: { id },
      data: updateData,
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "COMPLIANCE_REQUIREMENT_UPDATED",
      entity: "LegalCompliance",
      entityId: id,
      previousValue: { status: existing.status, nextDueDate: existing.nextDueDate },
      newValue: { status: updated.status, nextDueDate: updated.nextDueDate },
    });

    return updated;
  }

  /**
   * Safe delete
   */
  static async delete(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const compliance = await db.legalCompliance.findFirst({ where: { id, organizationId: orgId } });
    if (!compliance) throw new Error("Compliance requirement not found");

    await db.legalCompliance.delete({ where: { id } });

    await AuditService.logMutation({
      actorId: user.id,
      action: "COMPLIANCE_REQUIREMENT_DELETED",
      entity: "LegalCompliance",
      entityId: id,
      previousValue: { code: compliance.code, title: compliance.title },
    });

    return { success: true };
  }
}
