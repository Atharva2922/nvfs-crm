import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { IssueService } from "@/services/issue.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createIssueSchema = z.object({
  title: z.string().min(2, "Issue title is required"),
  description: z.string().min(3, "Description is required"),
  clientId: z.string().optional(),
  assignedToId: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.string().optional(),
  attachments: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const issues = await IssueService.list(user, { operationId: id });
    return successResponse(issues);
  } catch (error: any) {
    console.error("[Operation Issues GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve issues", "INTERNAL_ERROR", 500);
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
    const validated = createIssueSchema.parse(body);

    const issue = await IssueService.create(user, {
      ...validated,
      operationId: id,
    });

    return successResponse(issue, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Operation Issues POST Error]:", error);
    return errorResponse(error.message || "Failed to create issue", "INTERNAL_ERROR", 500);
  }
}
