import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";

export interface CaseFilterOptions {
  status?: string;
  caseType?: string;
  priority?: string;
  riskLevel?: string;
  internalOwnerId?: string;
  clientId?: string;
  vendorId?: string;
  contractId?: string;
  search?: string;
}

export interface CreateCaseInput {
  title: string;
  caseNumber?: string;
  caseType?: string;
  description?: string;
  priority?: string;
  riskLevel?: string;
  internalOwnerId: string;
  externalCounselId?: string;
  opposingParty?: string;
  opposingCounsel?: string;
  courtJurisdiction?: string;
  judgeOrArbitrator?: string;
  clientId?: string;
  vendorId?: string;
  employeeId?: string;
  contractId?: string;
  targetResolutionDate?: string | Date;
  estimatedFinancialExposure?: number;
  notes?: string;
}

export class LegalCaseService {
  /**
   * Generate sequential Case Number CASE-YYYY-XXXX
   */
  static async generateCaseNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.legalCase.count({
      where: {
        organizationId,
        caseNumber: { startsWith: `CASE-${year}-` },
      },
    });
    const seq = String(count + 1).padStart(4, "0");
    return `CASE-${year}-${seq}`;
  }

  /**
   * List legal cases with multi-filtering and pagination
   */
  static async listCases(
    user: AuthenticatedUser,
    filters: CaseFilterOptions = {},
    page: number = 1,
    limit: number = 25
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };

    if (filters.status) where.status = filters.status;
    if (filters.caseType) where.caseType = filters.caseType;
    if (filters.priority) where.priority = filters.priority;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.internalOwnerId) where.internalOwnerId = filters.internalOwnerId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.contractId) where.contractId = filters.contractId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { caseNumber: { contains: filters.search } },
        { description: { contains: filters.search } },
        { opposingParty: { contains: filters.search } },
        { courtJurisdiction: { contains: filters.search } },
      ];
    }

    const [total, items] = await Promise.all([
      db.legalCase.count({ where }),
      db.legalCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          internalOwner: { select: { id: true, firstName: true, lastName: true, email: true } },
          externalCounsel: { select: { id: true, name: true, firmName: true, email: true } },
          client: { select: { id: true, name: true, code: true } },
          vendor: { select: { id: true, displayName: true } },
          contract: { select: { id: true, contractNumber: true, title: true } },
          _count: {
            select: {
              events: true,
              documents: true,
              tasks: true,
              expenses: true,
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
   * Get 360 Case Workspace
   */
  static async getById(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const legalCase = await db.legalCase.findFirst({
      where: { id, organizationId: orgId },
      include: {
        internalOwner: {
          select: { id: true, firstName: true, lastName: true, designation: true, email: true, phone: true },
        },
        externalCounsel: true,
        client: true,
        vendor: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, email: true },
        },
        contract: {
          select: { id: true, contractNumber: true, title: true, status: true, contractValue: true },
        },
        events: {
          orderBy: { eventDate: "desc" },
        },
        documents: {
          orderBy: { updatedAt: "desc" },
          include: {
            versions: { orderBy: { version: "desc" } },
            uploadedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        tasks: {
          orderBy: { dueDate: "asc" },
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        expenses: {
          orderBy: { date: "desc" },
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

    if (!legalCase) throw new Error("Legal case not found");
    return legalCase;
  }

  /**
   * Create legal case
   */
  static async create(user: AuthenticatedUser, data: CreateCaseInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const caseNumber = data.caseNumber?.trim() || (await this.generateCaseNumber(orgId));

    const legalCase = await db.legalCase.create({
      data: {
        organizationId: orgId,
        caseNumber,
        title: data.title,
        caseType: data.caseType || "DISPUTE",
        description: data.description || null,
        status: "OPEN",
        priority: data.priority || "MEDIUM",
        riskLevel: data.riskLevel || "MEDIUM",
        internalOwnerId: data.internalOwnerId || user.employee.id,
        externalCounselId: data.externalCounselId || null,
        opposingParty: data.opposingParty || null,
        opposingCounsel: data.opposingCounsel || null,
        courtJurisdiction: data.courtJurisdiction || null,
        judgeOrArbitrator: data.judgeOrArbitrator || null,
        clientId: data.clientId || null,
        vendorId: data.vendorId || null,
        employeeId: data.employeeId || null,
        contractId: data.contractId || null,
        targetResolutionDate: data.targetResolutionDate ? new Date(data.targetResolutionDate) : null,
        estimatedFinancialExposure: data.estimatedFinancialExposure || 0,
        notes: data.notes || null,
      },
      include: {
        internalOwner: true,
      },
    });

    await Promise.all([
      db.legalActivity.create({
        data: {
          organizationId: orgId,
          caseId: legalCase.id,
          type: "CREATED",
          description: `Case "${legalCase.title}" [${legalCase.caseNumber}] opened.`,
          performedById: user.employee.id,
        },
      }),
      AuditService.logMutation({
        actorId: user.id,
        action: "LEGAL_CASE_CREATED",
        entity: "LegalCase",
        entityId: legalCase.id,
        newValue: { caseNumber: legalCase.caseNumber, title: legalCase.title, exposure: legalCase.estimatedFinancialExposure },
      }),
      EventBusService.publish({
        type: "LEGAL_CASE_ASSIGNED",
        organizationId: orgId,
        actorId: user.employee.id,
        targetUserIds: [legalCase.internalOwner.userId || user.id],
        title: `Assigned Legal Matter: ${legalCase.caseNumber}`,
        message: `You have been designated internal lead on legal matter: ${legalCase.title}`,
        actionUrl: `/app/legal/cases/${legalCase.id}`,
      }),
    ]);

    return legalCase;
  }

  /**
   * Update legal case
   */
  static async update(user: AuthenticatedUser, id: string, data: Partial<CreateCaseInput> & { status?: string; actualFinancialExposure?: number; resolutionNotes?: string }) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.legalCase.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new Error("Legal case not found");

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.caseType !== undefined) updateData.caseType = data.caseType;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (["RESOLVED", "CLOSED"].includes(data.status) && !existing.actualResolutionDate) {
        updateData.actualResolutionDate = new Date();
      }
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.riskLevel !== undefined) updateData.riskLevel = data.riskLevel;
    if (data.internalOwnerId !== undefined) updateData.internalOwnerId = data.internalOwnerId;
    if (data.externalCounselId !== undefined) updateData.externalCounselId = data.externalCounselId;
    if (data.opposingParty !== undefined) updateData.opposingParty = data.opposingParty;
    if (data.opposingCounsel !== undefined) updateData.opposingCounsel = data.opposingCounsel;
    if (data.courtJurisdiction !== undefined) updateData.courtJurisdiction = data.courtJurisdiction;
    if (data.judgeOrArbitrator !== undefined) updateData.judgeOrArbitrator = data.judgeOrArbitrator;
    if (data.targetResolutionDate !== undefined) updateData.targetResolutionDate = data.targetResolutionDate ? new Date(data.targetResolutionDate) : null;
    if (data.estimatedFinancialExposure !== undefined) updateData.estimatedFinancialExposure = data.estimatedFinancialExposure;
    if (data.actualFinancialExposure !== undefined) updateData.actualFinancialExposure = data.actualFinancialExposure;
    if (data.resolutionNotes !== undefined) updateData.resolutionNotes = data.resolutionNotes;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await db.legalCase.update({
      where: { id },
      data: updateData,
    });

    await Promise.all([
      db.legalActivity.create({
        data: {
          organizationId: orgId,
          caseId: id,
          type: "UPDATED",
          description: `Case updated by ${user.employee.firstName} ${user.employee.lastName}.`,
          performedById: user.employee.id,
        },
      }),
      AuditService.logMutation({
        actorId: user.id,
        action: "LEGAL_CASE_UPDATED",
        entity: "LegalCase",
        entityId: id,
        previousValue: { status: existing.status, priority: existing.priority },
        newValue: { status: updated.status, priority: updated.priority },
      }),
    ]);

    return updated;
  }

  /**
   * Log case event (hearing, filing, meeting, decision)
   */
  static async addEvent(
    user: AuthenticatedUser,
    caseId: string,
    data: {
      eventType: string;
      title: string;
      description?: string;
      eventDate: string | Date;
      location?: string;
      outcome?: string;
      createDeadline?: boolean;
    }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const legalCase = await db.legalCase.findFirst({ where: { id: caseId, organizationId: orgId } });
    if (!legalCase) throw new Error("Legal case not found");

    const eventDate = new Date(data.eventDate);

    const event = await db.legalCaseEvent.create({
      data: {
        caseId,
        eventType: data.eventType,
        title: data.title,
        description: data.description || null,
        eventDate,
        location: data.location || null,
        performedById: user.employee.id,
        outcome: data.outcome || null,
      },
    });

    // Create deadline if requested or if hearing/filing in the future
    if (data.createDeadline || (eventDate > new Date() && ["HEARING", "FILING"].includes(data.eventType))) {
      await db.legalDeadline.create({
        data: {
          organizationId: orgId,
          caseId,
          title: `Case Event: ${data.title}`,
          deadlineType: data.eventType === "HEARING" ? "CASE_HEARING" : "FILING_DEADLINE",
          dueDate: eventDate,
          priority: legalCase.priority === "URGENT" ? "CRITICAL" : "HIGH",
          ownerId: legalCase.internalOwnerId,
          status: "UPCOMING",
          notes: data.description || null,
        },
      });
    }

    await db.legalActivity.create({
      data: {
        organizationId: orgId,
        caseId,
        type: "EVENT_LOGGED",
        description: `Case proceeding logged: [${data.eventType}] ${data.title}.`,
        performedById: user.employee.id,
      },
    });

    return event;
  }

  /**
   * Safe delete case
   */
  static async delete(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const legalCase = await db.legalCase.findFirst({
      where: { id, organizationId: orgId },
      include: { expenses: true },
    });
    if (!legalCase) throw new Error("Legal case not found");

    if (legalCase.expenses.length > 0) {
      throw new Error("Cannot delete legal case with attached legal expenses. Close the case instead.");
    }

    await db.legalCase.delete({ where: { id } });

    await AuditService.logMutation({
      actorId: user.id,
      action: "LEGAL_CASE_DELETED",
      entity: "LegalCase",
      entityId: id,
      previousValue: { caseNumber: legalCase.caseNumber, title: legalCase.title },
    });

    return { success: true };
  }

  static async getCases(user: AuthenticatedUser, filters: CaseFilterOptions = {}, page: number = 1, limit: number = 25) {
    return this.listCases(user, filters, page, limit);
  }

  static async createCase(user: AuthenticatedUser, data: CreateCaseInput) {
    return this.create(user, data);
  }

  static async updateCase(user: AuthenticatedUser, id: string, data: any) {
    return this.update(user, id, data);
  }

  static async deleteCase(user: AuthenticatedUser, id: string) {
    return this.delete(user, id);
  }

  static async logEvent(user: AuthenticatedUser, caseId: string, data: any) {
    return this.addEvent(user, caseId, data);
  }

  static async getCaseById(user: AuthenticatedUser, id: string) {
    return this.getById(user, id);
  }
}
