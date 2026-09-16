import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export interface CreateRiskInput {
  title: string;
  description?: string;
  contractId?: string;
  caseId?: string;
  complianceId?: string;
  probability: number; // 1 to 5
  impact: number;      // 1 to 5
  ownerId?: string;
  mitigationPlan?: string;
  status?: string;
}

export interface UpdateRiskInput {
  title?: string;
  description?: string;
  contractId?: string;
  caseId?: string;
  complianceId?: string;
  probability?: number;
  impact?: number;
  ownerId?: string;
  mitigationPlan?: string;
  status?: string;
}

export class LegalRiskService {
  /**
   * Calculates score and categorizes risk level from 1-5 scale
   */
  static calculateRisk(probability: number, impact: number) {
    const p = Math.max(1, Math.min(5, Math.round(probability)));
    const i = Math.max(1, Math.min(5, Math.round(impact)));
    const score = p * i;
    let level = "LOW";
    if (score >= 20) level = "CRITICAL";
    else if (score >= 15) level = "HIGH";
    else if (score >= 7) level = "MEDIUM";
    else level = "LOW";

    return { probability: p, impact: i, score, level };
  }

  /**
   * Generates sequential risk code: RSK-YYYY-XXXX
   */
  static async generateRiskCode(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RSK-${year}-`;
    const count = await db.legalRisk.count({
      where: {
        organizationId,
        riskCode: { startsWith: prefix },
      },
    });
    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  /**
   * Create a legal risk
   */
  static async createRisk(user: AuthenticatedUser, data: CreateRiskInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const riskCode = await this.generateRiskCode(orgId);
    const { probability, impact, score, level } = this.calculateRisk(data.probability, data.impact);
    const ownerId = data.ownerId || user.employee.id;

    const risk = await db.legalRisk.create({
      data: {
        organizationId: orgId,
        riskCode,
        title: data.title,
        description: data.description || null,
        contractId: data.contractId || null,
        caseId: data.caseId || null,
        complianceId: data.complianceId || null,
        probability,
        impact,
        riskScore: score,
        riskLevel: level,
        ownerId,
        mitigationPlan: data.mitigationPlan || null,
        status: data.status || "IDENTIFIED",
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, designation: true } },
        contract: { select: { id: true, contractNumber: true, title: true } },
        case: { select: { id: true, caseNumber: true, title: true } },
        compliance: { select: { id: true, code: true, title: true } },
      },
    });

    // Log legal activity
    await db.legalActivity.create({
      data: {
        organizationId: orgId,
        contractId: data.contractId || null,
        caseId: data.caseId || null,
        complianceId: data.complianceId || null,
        type: "RISK_UPDATED",
        description: `Risk registered: ${risk.riskCode} - ${risk.title} (${level}, Score: ${score})`,
        performedById: user.employee.id,
        metadata: JSON.stringify({ riskId: risk.id, riskCode: risk.riskCode, score, level }),
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "LEGAL_RISK_CREATED",
      entity: "LegalRisk",
      entityId: risk.id,
      newValue: { riskCode: risk.riskCode, title: risk.title, score, level },
      metadata: { source: "legal_risk_service" },
    });

    return risk;
  }

  /**
   * List risks with filters
   */
  static async getRisks(
    user: AuthenticatedUser,
    filters?: {
      search?: string;
      riskLevel?: string;
      status?: string;
      contractId?: string;
      caseId?: string;
      complianceId?: string;
      ownerId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.max(1, Math.min(100, filters?.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };

    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { riskCode: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
        { mitigationPlan: { contains: q } },
      ];
    }
    if (filters?.riskLevel && filters.riskLevel !== "ALL") where.riskLevel = filters.riskLevel;
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.contractId) where.contractId = filters.contractId;
    if (filters?.caseId) where.caseId = filters.caseId;
    if (filters?.complianceId) where.complianceId = filters.complianceId;
    if (filters?.ownerId) where.ownerId = filters.ownerId;

    const [total, risks] = await Promise.all([
      db.legalRisk.count({ where }),
      db.legalRisk.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ riskScore: "desc" }, { createdAt: "desc" }],
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, designation: true } },
          contract: { select: { id: true, contractNumber: true, title: true } },
          case: { select: { id: true, caseNumber: true, title: true } },
          compliance: { select: { id: true, code: true, title: true } },
        },
      }),
    ]);

    return {
      risks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single risk details
   */
  static async getRiskById(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const risk = await db.legalRisk.findFirst({
      where: { id, organizationId: orgId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, designation: true, email: true } },
        contract: { select: { id: true, contractNumber: true, title: true, status: true } },
        case: { select: { id: true, caseNumber: true, title: true, status: true } },
        compliance: { select: { id: true, code: true, title: true, status: true } },
      },
    });

    if (!risk) throw new Error("Risk not found");
    return risk;
  }

  /**
   * Update risk
   */
  static async updateRisk(user: AuthenticatedUser, id: string, data: UpdateRiskInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.legalRisk.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Risk not found");

    const prob = data.probability !== undefined ? data.probability : existing.probability;
    const imp = data.impact !== undefined ? data.impact : existing.impact;
    const { probability, impact, score, level } = this.calculateRisk(prob, imp);

    const updated = await db.legalRisk.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.contractId !== undefined && { contractId: data.contractId || null }),
        ...(data.caseId !== undefined && { caseId: data.caseId || null }),
        ...(data.complianceId !== undefined && { complianceId: data.complianceId || null }),
        probability,
        impact,
        riskScore: score,
        riskLevel: level,
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
        ...(data.mitigationPlan !== undefined && { mitigationPlan: data.mitigationPlan }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, designation: true } },
      },
    });

    await db.legalActivity.create({
      data: {
        organizationId: orgId,
        contractId: updated.contractId,
        caseId: updated.caseId,
        complianceId: updated.complianceId,
        type: "RISK_UPDATED",
        description: `Risk updated: ${updated.riskCode} - ${updated.title} (Status: ${updated.status}, Score: ${score})`,
        performedById: user.employee.id,
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "LEGAL_RISK_UPDATED",
      entity: "LegalRisk",
      entityId: id,
      previousValue: existing,
      newValue: updated,
    });

    return updated;
  }

  /**
   * Delete risk
   */
  static async deleteRisk(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const existing = await db.legalRisk.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Risk not found");

    await db.legalRisk.delete({ where: { id } });

    await AuditService.logMutation({
      actorId: user.id,
      action: "LEGAL_RISK_DELETED",
      entity: "LegalRisk",
      entityId: id,
      previousValue: existing,
    });

    return { success: true };
  }

  /**
   * Get 5x5 Risk Matrix distribution
   */
  static async getRiskMatrix(user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const risks = await db.legalRisk.findMany({
      where: {
        organizationId: orgId,
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
      select: {
        id: true,
        riskCode: true,
        title: true,
        probability: true,
        impact: true,
        riskScore: true,
        riskLevel: true,
        status: true,
      },
    });

    // Initialize 5x5 grid
    // Rows: Probability (5 down to 1), Cols: Impact (1 to 5)
    const grid: Record<string, { count: number; items: any[] }> = {};
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        grid[`${p}_${i}`] = { count: 0, items: [] };
      }
    }

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const r of risks) {
      const key = `${r.probability}_${r.impact}`;
      if (grid[key]) {
        grid[key].count++;
        grid[key].items.push(r);
      }
      if (r.riskLevel === "CRITICAL") criticalCount++;
      else if (r.riskLevel === "HIGH") highCount++;
      else if (r.riskLevel === "MEDIUM") mediumCount++;
      else lowCount++;
    }

    return {
      totalActiveRisks: risks.length,
      distribution: {
        CRITICAL: criticalCount,
        HIGH: highCount,
        MEDIUM: mediumCount,
        LOW: lowCount,
      },
      grid,
    };
  }
}
