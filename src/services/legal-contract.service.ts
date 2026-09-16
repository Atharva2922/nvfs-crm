import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";

export interface ContractFilterOptions {
  status?: string;
  contractType?: string;
  partyType?: string;
  riskLevel?: string;
  departmentId?: string;
  legalOwnerId?: string;
  businessOwnerId?: string;
  clientId?: string;
  vendorId?: string;
  search?: string;
  expiryHorizon?: '90' | '60' | '30' | '15' | 'overdue';
  startDate?: string;
  endDate?: string;
}

export interface CreateContractInput {
  title: string;
  contractNumber?: string;
  description?: string;
  contractType?: string;
  departmentId?: string;
  legalOwnerId: string;
  businessOwnerId?: string;
  partyType?: string;
  clientId?: string;
  vendorId?: string;
  employeeId?: string;
  externalPartyName?: string;
  effectiveDate: string | Date;
  expiryDate: string | Date;
  renewalDate?: string | Date;
  renewalType?: string;
  noticePeriodDays?: number;
  contractValue?: number;
  currency?: string;
  paymentTerms?: string;
  riskLevel?: string;
  riskDescription?: string;
  keyRisks?: string;
  mitigationPlan?: string;
  purchaseOrderId?: string;
  operationId?: string;
  opportunityId?: string;
  internalNotes?: string;
  parties?: Array<{
    partyName: string;
    partyRole?: string;
    signatoryName?: string;
    signatoryEmail?: string;
  }>;
}

export class LegalContractService {
  /**
   * Helper: Generate sequential, unique Contract Number CTR-YYYY-XXXX
   */
  static async generateContractNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.legalContract.count({
      where: {
        organizationId,
        contractNumber: { startsWith: `CTR-${year}-` },
      },
    });
    const seq = String(count + 1).padStart(4, "0");
    return `CTR-${year}-${seq}`;
  }

  /**
   * List contracts with multi-criteria filtering, search, and pagination
   */
  static async listContracts(
    user: AuthenticatedUser,
    filters: ContractFilterOptions = {},
    page: number = 1,
    limit: number = 25
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = { organizationId: orgId };

    if (filters.status) where.status = filters.status;
    if (filters.contractType) where.contractType = filters.contractType;
    if (filters.partyType) where.partyType = filters.partyType;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.legalOwnerId) where.legalOwnerId = filters.legalOwnerId;
    if (filters.businessOwnerId) where.businessOwnerId = filters.businessOwnerId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.vendorId) where.vendorId = filters.vendorId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { contractNumber: { contains: filters.search } },
        { description: { contains: filters.search } },
        { externalPartyName: { contains: filters.search } },
        { client: { name: { contains: filters.search } } },
        { vendor: { displayName: { contains: filters.search } } },
      ];
    }

    if (filters.expiryHorizon) {
      if (filters.expiryHorizon === 'overdue') {
        where.expiryDate = { lt: now };
        where.status = { notIn: ["EXPIRED", "TERMINATED", "ARCHIVED"] };
      } else {
        const days = parseInt(filters.expiryHorizon, 10);
        const targetDate = new Date(now.getTime() + days * 86400000);
        where.expiryDate = { gte: now, lte: targetDate };
        where.status = { notIn: ["TERMINATED", "ARCHIVED"] };
      }
    }

    const [total, items] = await Promise.all([
      db.legalContract.count({ where }),
      db.legalContract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          department: { select: { id: true, name: true, code: true } },
          legalOwner: { select: { id: true, firstName: true, lastName: true, email: true, designation: true } },
          businessOwner: { select: { id: true, firstName: true, lastName: true, email: true } },
          client: { select: { id: true, name: true, code: true } },
          vendor: { select: { id: true, displayName: true, vendorCode: true } },
          employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
          _count: {
            select: {
              documents: true,
              renewals: true,
              cases: true,
              approvals: true,
              tasks: true,
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
   * Get 360 Contract Workspace aggregation
   */
  static async getById(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const contract = await db.legalContract.findFirst({
      where: { id, organizationId: orgId },
      include: {
        department: true,
        legalOwner: {
          select: { id: true, firstName: true, lastName: true, designation: true, email: true, phone: true, avatarUrl: true },
        },
        businessOwner: {
          select: { id: true, firstName: true, lastName: true, designation: true, email: true, phone: true },
        },
        client: true,
        vendor: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, email: true, designation: true },
        },
        purchaseOrder: {
          select: { id: true, poNumber: true, total: true, status: true },
        },
        operation: {
          select: { id: true, operationCode: true, name: true, status: true },
        },
        opportunity: {
          select: { id: true, name: true, value: true, stage: true },
        },
        parties: {
          orderBy: { createdAt: "asc" },
        },
        renewals: {
          orderBy: { renewalNumber: "desc" },
          include: {
            initiatedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        documents: {
          orderBy: { updatedAt: "desc" },
          include: {
            versions: { orderBy: { version: "desc" } },
            uploadedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            performedBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
        approvals: {
          orderBy: { createdAt: "desc" },
          include: {
            requestedBy: { select: { id: true, firstName: true, lastName: true } },
            approver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        deadlines: {
          orderBy: { dueDate: "asc" },
          include: {
            owner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        cases: {
          select: { id: true, caseNumber: true, title: true, status: true, priority: true, riskLevel: true },
        },
        risks: {
          orderBy: { riskScore: "desc" },
        },
        invoices: {
          select: { id: true, invoiceNumber: true, total: true, balance: true, status: true, dueDate: true },
        },
        expenses: {
          select: { id: true, expenseNumber: true, amount: true, category: true, status: true, date: true },
        },
        tasks: {
          select: { id: true, title: true, status: true, priority: true, dueDate: true },
        },
      },
    });

    if (!contract) throw new Error("Contract not found");
    return contract;
  }

  /**
   * Create new contract with validation, party links, and initial activity log
   */
  static async create(user: AuthenticatedUser, data: CreateContractInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const effDate = new Date(data.effectiveDate);
    const expDate = new Date(data.expiryDate);

    if (expDate < effDate) {
      throw new Error("Contract expiry date cannot be earlier than effective date");
    }

    const contractNumber = data.contractNumber?.trim() || (await this.generateContractNumber(orgId));

    // Calculate default renewal notice date if renewal date not provided
    let renewalDate: Date | null = data.renewalDate ? new Date(data.renewalDate) : null;
    if (!renewalDate && data.renewalType !== "NONE") {
      const noticeDays = data.noticePeriodDays || 30;
      renewalDate = new Date(expDate.getTime() - noticeDays * 86400000);
    }

    const contract = await db.legalContract.create({
      data: {
        organizationId: orgId,
        contractNumber,
        title: data.title,
        description: data.description || null,
        contractType: data.contractType || "CUSTOMER_MSA",
        departmentId: data.departmentId || null,
        legalOwnerId: data.legalOwnerId,
        businessOwnerId: data.businessOwnerId || null,
        partyType: data.partyType || (data.clientId ? "CLIENT" : data.vendorId ? "VENDOR" : data.employeeId ? "EMPLOYEE" : "OTHER"),
        clientId: data.clientId || null,
        vendorId: data.vendorId || null,
        employeeId: data.employeeId || null,
        externalPartyName: data.externalPartyName || null,
        effectiveDate: effDate,
        expiryDate: expDate,
        renewalDate,
        renewalType: data.renewalType || "MANUAL",
        noticePeriodDays: data.noticePeriodDays || 30,
        contractValue: data.contractValue || 0,
        currency: data.currency || "INR",
        paymentTerms: data.paymentTerms || null,
        status: "DRAFT",
        riskLevel: data.riskLevel || "LOW",
        riskDescription: data.riskDescription || null,
        keyRisks: data.keyRisks || null,
        mitigationPlan: data.mitigationPlan || null,
        purchaseOrderId: data.purchaseOrderId || null,
        operationId: data.operationId || null,
        opportunityId: data.opportunityId || null,
        internalNotes: data.internalNotes || null,
        parties: data.parties && data.parties.length > 0 ? {
          create: data.parties.map((p) => ({
            partyName: p.partyName,
            partyRole: p.partyRole || "PARTY_B",
            signatoryName: p.signatoryName || null,
            signatoryEmail: p.signatoryEmail || null,
          })),
        } : undefined,
      },
      include: {
        department: true,
        legalOwner: true,
        client: true,
        vendor: true,
      },
    });

    // Create initial legal deadlines for expiry and renewal notice
    await db.legalDeadline.createMany({
      data: [
        {
          organizationId: orgId,
          contractId: contract.id,
          title: `Contract Expiry: ${contract.title}`,
          deadlineType: "CONTRACT_EXPIRY",
          dueDate: expDate,
          priority: contract.riskLevel === "CRITICAL" ? "CRITICAL" : "HIGH",
          ownerId: contract.legalOwnerId,
          status: "UPCOMING",
        },
        ...(renewalDate ? [{
          organizationId: orgId,
          contractId: contract.id,
          title: `Renewal Notice Deadline: ${contract.title}`,
          deadlineType: "RENEWAL_NOTICE",
          dueDate: renewalDate,
          priority: "HIGH",
          ownerId: contract.legalOwnerId,
          status: "UPCOMING",
        }] : []),
      ],
    });

    // Log Activity & Audit
    await Promise.all([
      db.legalActivity.create({
        data: {
          organizationId: orgId,
          contractId: contract.id,
          type: "CREATED",
          description: `Contract "${contract.title}" [${contract.contractNumber}] created as DRAFT.`,
          performedById: user.employee.id,
        },
      }),
      AuditService.logMutation({
        actorId: user.id,
        action: "LEGAL_CONTRACT_CREATED",
        entity: "LegalContract",
        entityId: contract.id,
        newValue: { contractNumber: contract.contractNumber, title: contract.title, value: contract.contractValue },
      }),
    ]);

    return contract;
  }

  /**
   * Update contract metadata and terms
   */
  static async update(user: AuthenticatedUser, id: string, data: Partial<CreateContractInput>) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.legalContract.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new Error("Contract not found");

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.contractType !== undefined) updateData.contractType = data.contractType;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.legalOwnerId !== undefined) updateData.legalOwnerId = data.legalOwnerId;
    if (data.businessOwnerId !== undefined) updateData.businessOwnerId = data.businessOwnerId;
    if (data.partyType !== undefined) updateData.partyType = data.partyType;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.vendorId !== undefined) updateData.vendorId = data.vendorId;
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.externalPartyName !== undefined) updateData.externalPartyName = data.externalPartyName;
    if (data.effectiveDate !== undefined) updateData.effectiveDate = new Date(data.effectiveDate);
    if (data.expiryDate !== undefined) updateData.expiryDate = new Date(data.expiryDate);
    if (data.renewalDate !== undefined) updateData.renewalDate = data.renewalDate ? new Date(data.renewalDate) : null;
    if (data.renewalType !== undefined) updateData.renewalType = data.renewalType;
    if (data.noticePeriodDays !== undefined) updateData.noticePeriodDays = data.noticePeriodDays;
    if (data.contractValue !== undefined) updateData.contractValue = data.contractValue;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
    if (data.riskLevel !== undefined) updateData.riskLevel = data.riskLevel;
    if (data.riskDescription !== undefined) updateData.riskDescription = data.riskDescription;
    if (data.keyRisks !== undefined) updateData.keyRisks = data.keyRisks;
    if (data.mitigationPlan !== undefined) updateData.mitigationPlan = data.mitigationPlan;
    if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;

    const updated = await db.legalContract.update({
      where: { id },
      data: updateData,
    });

    await Promise.all([
      db.legalActivity.create({
        data: {
          organizationId: orgId,
          contractId: id,
          type: "UPDATED",
          description: `Contract details updated by ${user.employee.firstName} ${user.employee.lastName}.`,
          performedById: user.employee.id,
        },
      }),
      AuditService.logMutation({
        actorId: user.id,
        action: "LEGAL_CONTRACT_UPDATED",
        entity: "LegalContract",
        entityId: id,
        previousValue: { title: existing.title, status: existing.status, riskLevel: existing.riskLevel },
        newValue: { title: updated.title, status: updated.status, riskLevel: updated.riskLevel },
      }),
    ]);

    return updated;
  }

  /**
   * Contract State Machine Transition
   */
  static async transitionStatus(
    user: AuthenticatedUser,
    id: string,
    toStatus: string,
    reason?: string
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.legalContract.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Contract not found");

    const validTransitions: Record<string, string[]> = {
      DRAFT: ["UNDER_REVIEW", "TERMINATED", "ARCHIVED"],
      UNDER_REVIEW: ["PENDING_APPROVAL", "DRAFT", "ARCHIVED"],
      PENDING_APPROVAL: ["APPROVED", "UNDER_REVIEW", "DRAFT"],
      APPROVED: ["ACTIVE", "TERMINATED", "ARCHIVED"],
      ACTIVE: ["EXPIRING_SOON", "EXPIRED", "TERMINATED", "ARCHIVED"],
      EXPIRING_SOON: ["ACTIVE", "EXPIRED", "TERMINATED", "ARCHIVED"],
      EXPIRED: ["ACTIVE", "TERMINATED", "ARCHIVED"],
      TERMINATED: ["ARCHIVED"],
      ARCHIVED: ["DRAFT"],
    };

    const allowed = validTransitions[existing.status] || [];
    if (!allowed.includes(toStatus)) {
      throw new Error(`Invalid status transition from ${existing.status} to ${toStatus}`);
    }

    const updated = await db.legalContract.update({
      where: { id },
      data: { status: toStatus },
    });

    await Promise.all([
      db.legalActivity.create({
        data: {
          organizationId: orgId,
          contractId: id,
          type: "STATUS_CHANGED",
          description: `Status transitioned from ${existing.status} to ${toStatus}${reason ? `: ${reason}` : ""}`,
          performedById: user.employee.id,
        },
      }),
      AuditService.logMutation({
        actorId: user.id,
        action: "LEGAL_CONTRACT_STATUS_CHANGED",
        entity: "LegalContract",
        entityId: id,
        previousValue: { status: existing.status },
        newValue: { status: toStatus, reason },
      }),
    ]);

    return updated;
  }

  /**
   * Process Contract Renewal
   */
  static async renewContract(
    user: AuthenticatedUser,
    id: string,
    data: {
      newExpiryDate: string | Date;
      renewalValue?: number;
      renewalType?: string;
      notes?: string;
    }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const contract = await db.legalContract.findFirst({
      where: { id, organizationId: orgId },
      include: { renewals: true },
    });
    if (!contract) throw new Error("Contract not found");

    const nextExpiry = new Date(data.newExpiryDate);
    if (nextExpiry <= contract.expiryDate) {
      throw new Error("New expiry date must be strictly after current expiry date");
    }

    const renewalCount = contract.renewals.length + 1;
    const noticeDays = contract.noticePeriodDays || 30;
    const nextRenewalNotice = new Date(nextExpiry.getTime() - noticeDays * 86400000);

    const renewal = await db.legalRenewal.create({
      data: {
        contractId: id,
        renewalNumber: renewalCount,
        previousExpiryDate: contract.expiryDate,
        newExpiryDate: nextExpiry,
        noticeDeadline: nextRenewalNotice,
        renewalType: data.renewalType || contract.renewalType,
        renewalValue: data.renewalValue !== undefined ? data.renewalValue : contract.contractValue,
        status: "COMPLETED",
        notes: data.notes || null,
        initiatedById: user.employee.id,
        completedAt: new Date(),
      },
    });

    // Update contract expiry and status
    const updated = await db.legalContract.update({
      where: { id },
      data: {
        expiryDate: nextExpiry,
        renewalDate: nextRenewalNotice,
        status: "ACTIVE",
        contractValue: data.renewalValue !== undefined ? data.renewalValue : contract.contractValue,
      },
    });

    // Create deadline for renewed expiry
    await db.legalDeadline.create({
      data: {
        organizationId: orgId,
        contractId: id,
        title: `Renewed Contract Expiry: ${contract.title}`,
        deadlineType: "CONTRACT_EXPIRY",
        dueDate: nextExpiry,
        priority: "HIGH",
        ownerId: contract.legalOwnerId,
        status: "UPCOMING",
      },
    });

    // Log Activity & Notification
    await Promise.all([
      db.legalActivity.create({
        data: {
          organizationId: orgId,
          contractId: id,
          type: "RENEWED",
          description: `Contract successfully renewed (Cycle #${renewalCount}) to ${nextExpiry.toLocaleDateString()}.`,
          performedById: user.employee.id,
        },
      }),
      AuditService.logMutation({
        actorId: user.id,
        action: "LEGAL_CONTRACT_RENEWED",
        entity: "LegalContract",
        entityId: id,
        previousValue: { expiryDate: contract.expiryDate },
        newValue: { expiryDate: nextExpiry, renewalId: renewal.id },
      }),
      EventBusService.publish({
        type: "LEGAL_RENEWAL_DUE",
        organizationId: orgId,
        actorId: user.employee.id,
        targetUserIds: [user.id],
        title: `Contract Renewed: ${contract.title}`,
        message: `Contract ${contract.contractNumber} has been successfully extended until ${nextExpiry.toLocaleDateString()}.`,
        actionUrl: `/app/legal/contracts/${id}`,
      }),
    ]);

    return { contract: updated, renewal };
  }

  /**
   * Request formal approval for contract
   */
  static async requestApproval(
    user: AuthenticatedUser,
    id: string,
    notes?: string
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const contract = await db.legalContract.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!contract) throw new Error("Contract not found");

    const approval = await db.approvalRequest.create({
      data: {
        organizationId: orgId,
        entityType: "CONTRACT",
        entityId: id,
        contractId: id,
        title: `Contract Authorization: ${contract.title} [${contract.contractNumber}]`,
        description: notes || `Approval requested for ${contract.contractType} valued at ₹${contract.contractValue.toLocaleString()}`,
        requestedById: user.employee.id,
        status: "PENDING",
      },
    });

    await db.legalContract.update({
      where: { id },
      data: { status: "PENDING_APPROVAL" },
    });

    await db.legalActivity.create({
      data: {
        organizationId: orgId,
        contractId: id,
        type: "SUBMITTED",
        description: `Submitted for formal executive authorization.`,
        performedById: user.employee.id,
      },
    });

    return approval;
  }

  /**
   * Safe delete contract (checks invoices/expenses/cases)
   */
  static async delete(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const contract = await db.legalContract.findFirst({
      where: { id, organizationId: orgId },
      include: {
        invoices: { select: { id: true } },
        expenses: { select: { id: true } },
        cases: { select: { id: true } },
      },
    });
    if (!contract) throw new Error("Contract not found");

    if (contract.invoices.length > 0 || contract.expenses.length > 0 || contract.cases.length > 0) {
      throw new Error("Cannot delete contract with linked financial or litigation records. Archive or terminate instead.");
    }

    await db.legalContract.delete({ where: { id } });

    await AuditService.logMutation({
      actorId: user.id,
      action: "LEGAL_CONTRACT_DELETED",
      entity: "LegalContract",
      entityId: id,
      previousValue: { contractNumber: contract.contractNumber, title: contract.title },
    });

    return { success: true };
  }
}
