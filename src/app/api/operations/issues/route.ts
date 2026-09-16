import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { IssueService } from "@/services/issue.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createIssueSchema = z.object({
  title: z.string().min(2, "Issue title is required"),
  description: z.string().min(3, "Description is required"),
  operationId: z.string().min(1, "Operation is required"),
  clientId: z.string().optional(),
  assignedToId: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.string().optional(),
  attachments: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const filters = {
      operationId: searchParams.get("operationId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      severity: searchParams.get("severity") || undefined,
      status: searchParams.get("status") || undefined,
      assignedToId: searchParams.get("assignedToId") || undefined,
      reportedById: searchParams.get("reportedById") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const data = await IssueService.list(user, filters, page, limit);
    return successResponse(data);
  } catch (error: any) {
    console.error("[Issues GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve issues", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const validated = createIssueSchema.parse(body);

    const issue = await IssueService.create(user, validated);
    return successResponse(issue, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Issues POST Error]:", error);
    return errorResponse(error.message || "Failed to create issue", "INTERNAL_ERROR", 500);
  }
}
