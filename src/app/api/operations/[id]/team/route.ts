import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OperationService } from "@/services/operation.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const assignMemberSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  role: z.string().optional(),
  assignedHours: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();
    const validated = assignMemberSchema.parse(body);

    const member = await OperationService.assignTeamMember(user, id, validated);
    return successResponse(member, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", "VALIDATION_ERROR", 400, error.issues);
    }
    console.error("[Team Assign Error]:", error);
    return errorResponse(error.message || "Failed to assign team member", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    if (!employeeId) return errorResponse("Employee ID required", "BAD_REQUEST", 400);

    const result = await OperationService.removeTeamMember(user, id, employeeId);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Team Remove Error]:", error);
    return errorResponse(error.message || "Failed to remove team member", "INTERNAL_ERROR", 500);
  }
}
