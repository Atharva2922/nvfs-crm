import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { IssueService } from "@/services/issue.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateIssueSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  assignedToId: z.string().nullable().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "INVESTIGATING", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  dueDate: z.string().nullable().optional(),
  resolutionNotes: z.string().nullable().optional(),
  attachments: z.string().nullable().optional(),
});

const commentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const issue = await IssueService.getById(user, id);
    return successResponse(issue);
  } catch (error: any) {
    console.error("[Issue GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve issue", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();
    const validated = updateIssueSchema.parse(body);

    const updated = await IssueService.update(user, id, validated as any);
    return successResponse(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Issue PATCH Error]:", error);
    return errorResponse(error.message || "Failed to update issue", "INTERNAL_ERROR", 500);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();
    const validated = commentSchema.parse(body);

    const comment = await IssueService.addComment(user, id, validated.content);
    return successResponse(comment, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Issue Comment Error]:", error);
    return errorResponse(error.message || "Failed to add comment", "INTERNAL_ERROR", 500);
  }
}
