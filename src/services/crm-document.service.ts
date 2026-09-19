import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AuditService } from "./audit.service";
import { EventBusService } from "./event-bus.service";

export interface CreateDocumentInput {
  clientId: string;
  opportunityId?: string;
  name?: string;
  title?: string;
  fileUrl: string;
  fileSize?: number | string;
  fileType?: string;
  category?: "CONTRACT" | "PROPOSAL" | "NDA" | "INVOICE" | "COMPLIANCE" | "OTHER";
  notes?: string;
}

export class CrmDocumentService {
  /**
   * List documents for a client
   */
  static async getDocuments(user: AuthenticatedUser, clientId: string) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const activities = await db.crmActivity.findMany({
      where: {
        organizationId: user.employee.organizationId,
        clientId,
        type: "DOCUMENT",
      },
      orderBy: { performedAt: "desc" },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true, designation: true } },
      },
    });

    return activities.map((act) => {
      let meta: any = {};
      try {
        if (act.metadata) meta = JSON.parse(act.metadata);
      } catch {}

      const docTitle = act.subject.replace("Document Uploaded: ", "");
      return {
        id: act.id,
        name: docTitle,
        title: docTitle,
        description: act.description,
        fileUrl: meta.fileUrl || "",
        fileSize: meta.fileSize || 0,
        fileType: meta.fileType || "application/octet-stream",
        category: meta.category || "OTHER",
        uploadedAt: act.performedAt,
        uploadedBy: act.performedBy,
      };
    });
  }

  /**
   * Record uploaded document metadata
   */
  static async uploadDocument(user: AuthenticatedUser, data: CreateDocumentInput) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");
    const orgId = user.employee.organizationId;

    const client = await db.client.findUnique({ where: { id: data.clientId } });
    if (!client || client.organizationId !== orgId) throw new Error("Client account not found or unauthorized");

    const docName = (data.name || data.title || "Customer Document").trim();

    const metadataPayload = {
      fileUrl: data.fileUrl,
      fileSize: data.fileSize || null,
      fileType: data.fileType || "application/pdf",
      category: data.category || "CONTRACT",
      notes: data.notes || null,
    };

    const sizeFormatted = data.fileSize 
      ? (typeof data.fileSize === "number" ? `${(data.fileSize / 1024 / 1024).toFixed(2)} MB` : String(data.fileSize)) 
      : "File attached";

    const activity = await db.crmActivity.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        opportunityId: data.opportunityId || null,
        type: "DOCUMENT",
        subject: `Document Uploaded: ${docName}`,
        description: `Category: ${metadataPayload.category} (${sizeFormatted})${data.notes ? ` - ${data.notes}` : ""}`,
        metadata: JSON.stringify(metadataPayload),
        performedById: user.employee.id,
        performedAt: new Date(),
      },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true, designation: true } },
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_DOCUMENT_UPLOADED",
      entity: "Document",
      entityId: activity.id,
      newValue: {
        name: data.name,
        category: metadataPayload.category,
        clientId: client.id,
      },
      metadata: { source: "document_service" },
    });

    // Notify client owner if not self
    if (client.ownerId && client.ownerId !== user.employee.id) {
      try {
        const ownerEmp = await db.employee.findUnique({
          where: { id: client.ownerId },
          select: { userId: true },
        });
        if (ownerEmp?.userId) {
          await EventBusService.publish({
            type: "DOCUMENT_UPLOADED",
            organizationId: orgId,
            actorId: user.id,
            targetUserIds: [ownerEmp.userId],
            title: `Document Uploaded: ${docName}`,
            message: `${user.employee.firstName} ${user.employee.lastName} uploaded "${docName}" (${metadataPayload.category}) to ${client.name}.`,
            actionUrl: `/app/crm/clients/${client.id}`,
            metadata: { documentId: activity.id, clientId: client.id, category: metadataPayload.category },
            priority: "NORMAL",
          });
        }
      } catch (notifErr) {
        console.error("[Notification Warning]: Failed to publish DOCUMENT_UPLOADED:", notifErr);
      }
    }

    return {
      id: activity.id,
      name: docName,
      title: docName,
      ...metadataPayload,
      uploadedAt: activity.performedAt,
      uploadedBy: activity.performedBy,
    };
  }

  /**
   * Delete document entry
   */
  static async deleteDocument(activityId: string, user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const activity = await db.crmActivity.findUnique({ where: { id: activityId } });
    if (!activity || activity.type !== "DOCUMENT") throw new Error("Document not found");
    if (activity.organizationId !== user.employee.organizationId) throw new Error("Unauthorized");

    await db.crmActivity.delete({ where: { id: activityId } });

    await AuditService.logMutation({
      actorId: user.id,
      action: "CRM_DOCUMENT_DELETED",
      entity: "Document",
      entityId: activityId,
      previousValue: { subject: activity.subject },
      metadata: { source: "document_service" },
    });

    return { success: true, id: activityId };
  }
}
