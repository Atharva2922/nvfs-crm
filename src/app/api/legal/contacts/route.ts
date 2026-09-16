import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { AuditService } from "@/services/audit.service";
import { z } from "zod";

const createContactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  firmName: z.string().optional(),
  role: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  contactType: z.string().default("EXTERNAL_COUNSEL"),
  address: z.string().optional(),
  notes: z.string().optional(),
  clientId: z.string().optional(),
  vendorId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_READ)) {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const orgId = user.employee.organizationId;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const contactType = searchParams.get("contactType") || undefined;

    const where: any = { organizationId: orgId };
    if (contactType && contactType !== "ALL") where.contactType = contactType;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { firmName: { contains: search } },
        { email: { contains: search } },
        { role: { contains: search } },
      ];
    }

    const contacts = await db.legalContact.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        client: { select: { id: true, name: true } },
        vendor: { select: { id: true, displayName: true } },
        _count: { select: { cases: true } },
      },
    });

    return successResponse(contacts);
  } catch (error: any) {
    console.error("GET /api/legal/contacts error:", error);
    return errorResponse(error.message || "Failed to load legal contacts", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_WRITE) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_CREATE)) {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validated = createContactSchema.parse(body);
    const orgId = user.employee.organizationId;

    const contact = await db.legalContact.create({
      data: {
        organizationId: orgId,
        name: validated.name,
        firmName: validated.firmName || null,
        role: validated.role || null,
        email: validated.email,
        phone: validated.phone || null,
        contactType: validated.contactType,
        address: validated.address || null,
        notes: validated.notes || null,
        clientId: validated.clientId || null,
        vendorId: validated.vendorId || null,
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "LEGAL_CONTACT_CREATED",
      entity: "LegalContact",
      entityId: contact.id,
      newValue: { name: contact.name, firmName: contact.firmName, email: contact.email },
    });

    return successResponse(contact, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed", "VALIDATION_ERROR", 400, (error as any).errors || error.issues);
    }
    console.error("POST /api/legal/contacts error:", error);
    return errorResponse(error.message || "Failed to create contact", "INTERNAL_ERROR", 500);
  }
}
