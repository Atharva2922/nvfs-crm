import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";

export interface DocumentFilterOptions {
  documentType?: string;
  contractId?: string;
  caseId?: string;
  complianceId?: string;
  search?: string;
}

export interface UploadDocumentInput {
  title: string;
  documentType?: string;
  contractId?: string;
  caseId?: string;
  complianceId?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  changeDescription?: string;
}

export class LegalDocumentService {
  /**
   * List legal documents with version details
   */
  static async listDocuments(
    user: AuthenticatedUser,
    filters: DocumentFilterOptions = {},
    page: number = 1,
    limit: number = 30
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };

    if (filters.documentType) where.documentType = filters.documentType;
    if (filters.contractId) where.contractId = filters.contractId;
    if (filters.caseId) where.caseId = filters.caseId;
    if (filters.complianceId) where.complianceId = filters.complianceId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { latestFileName: { contains: filters.search } },
      ];
    }

    const [total, items] = await Promise.all([
      db.legalDocument.count({ where }),
      db.legalDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          contract: { select: { id: true, contractNumber: true, title: true } },
          case: { select: { id: true, caseNumber: true, title: true } },
          compliance: { select: { id: true, code: true, title: true } },
          versions: {
            orderBy: { version: "desc" },
            include: {
              uploadedBy: { select: { id: true, firstName: true, lastName: true } },
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
   * Create document with initial Version 1
   */
  static async createDocumentWithVersion(
    user: AuthenticatedUser,
    data: UploadDocumentInput
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const document = await db.legalDocument.create({
      data: {
        organizationId: orgId,
        title: data.title,
        documentType: data.documentType || "CONTRACT",
        contractId: data.contractId || null,
        caseId: data.caseId || null,
        complianceId: data.complianceId || null,
        currentVersion: 1,
        latestFileUrl: data.fileUrl,
        latestFileName: data.fileName,
        latestFileSize: data.fileSize || null,
        latestFileType: data.fileType || null,
        uploadedById: user.employee.id,
        versions: {
          create: {
            version: 1,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize || null,
            fileType: data.fileType || null,
            changeDescription: data.changeDescription || "Initial document upload (v1)",
            uploadedById: user.employee.id,
          },
        },
      },
      include: {
        versions: true,
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await Promise.all([
      db.legalActivity.create({
        data: {
          organizationId: orgId,
          contractId: data.contractId || null,
          caseId: data.caseId || null,
          complianceId: data.complianceId || null,
          type: "DOCUMENT_UPLOADED",
          description: `Document "${document.title}" (v1) uploaded by ${user.employee.firstName} ${user.employee.lastName}.`,
          performedById: user.employee.id,
        },
      }),
      AuditService.logMutation({
        actorId: user.id,
        action: "LEGAL_DOCUMENT_UPLOADED",
        entity: "LegalDocument",
        entityId: document.id,
        newValue: { title: document.title, fileName: data.fileName, version: 1 },
      }),
    ]);

    return document;
  }

  /**
   * Add a revised version to an existing document
   */
  static async addVersion(
    user: AuthenticatedUser,
    documentId: string,
    data: {
      fileUrl: string;
      fileName: string;
      fileSize?: number;
      fileType?: string;
      changeDescription?: string;
    }
  ) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const doc = await db.legalDocument.findFirst({
      where: { id: documentId, organizationId: orgId },
    });
    if (!doc) throw new Error("Legal document not found");

    const nextVersion = doc.currentVersion + 1;

    const [version, updatedDoc] = await Promise.all([
      db.legalDocumentVersion.create({
        data: {
          documentId,
          version: nextVersion,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize || null,
          fileType: data.fileType || null,
          changeDescription: data.changeDescription || `Revised version (v${nextVersion})`,
          uploadedById: user.employee.id,
        },
      }),
      db.legalDocument.update({
        where: { id: documentId },
        data: {
          currentVersion: nextVersion,
          latestFileUrl: data.fileUrl,
          latestFileName: data.fileName,
          latestFileSize: data.fileSize || null,
          latestFileType: data.fileType || null,
        },
      }),
    ]);

    await Promise.all([
      db.legalActivity.create({
        data: {
          organizationId: orgId,
          contractId: doc.contractId,
          caseId: doc.caseId,
          complianceId: doc.complianceId,
          type: "VERSION_CREATED",
          description: `New version (v${nextVersion}) uploaded for "${doc.title}": ${data.changeDescription || "Updated draft"}.`,
          performedById: user.employee.id,
        },
      }),
      AuditService.logMutation({
        actorId: user.id,
        action: "LEGAL_DOCUMENT_VERSION_CREATED",
        entity: "LegalDocumentVersion",
        entityId: version.id,
        newValue: { documentId, version: nextVersion, fileName: data.fileName },
      }),
    ]);

    return { document: updatedDoc, version };
  }

  /**
   * Safe delete
   */
  static async delete(user: AuthenticatedUser, id: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const doc = await db.legalDocument.findFirst({ where: { id, organizationId: orgId } });
    if (!doc) throw new Error("Legal document not found");

    await db.legalDocument.delete({ where: { id } });

    await AuditService.logMutation({
      actorId: user.id,
      action: "LEGAL_DOCUMENT_DELETED",
      entity: "LegalDocument",
      entityId: id,
      previousValue: { title: doc.title, version: doc.currentVersion },
    });

    return { success: true };
  }
}
