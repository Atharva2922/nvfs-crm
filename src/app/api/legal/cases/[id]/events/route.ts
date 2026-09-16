import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LegalCaseService } from "@/services/legal-case.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { z } from "zod";

const createEventSchema = z.object({
  eventType: z.string().min(1, "Event type is required"),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  eventDate: z.string().min(1, "Event date is required"),
  location: z.string().optional(),
  outcome: z.string().optional(),
  nextSteps: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_CASES_MANAGE) && !hasPermission(user.roleCode as any, PERMISSIONS.LEGAL_UPDATE)) {
      return errorResponse("Forbidden: Insufficient permissions to log case event", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const validated = createEventSchema.parse(body);

    const event = await LegalCaseService.logEvent(user, id, {
      ...validated,
      eventDate: new Date(validated.eventDate),
    });

    return successResponse(event, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed", "VALIDATION_ERROR", 400, (error as any).errors || error.issues);
    }
    console.error("POST /api/legal/cases/[id]/events error:", error);
    return errorResponse(error.message || "Failed to log case event", "INTERNAL_ERROR", 500);
  }
}
