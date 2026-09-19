import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AIService } from "@/services/ai/ai.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const executeActionSchema = z.object({
  actionType: z.enum(["CREATE_TASK", "ASSIGN_LEAD", "CREATE_APPROVAL", "ESCALATE_INVOICE", "SEND_NOTIFICATION"]),
  title: z.string(),
  description: z.string(),
  targetRecordId: z.string().optional(),
  targetRecordType: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  confirmed: z.boolean().refine((val) => val === true, "Explicit user confirmation is mandatory"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const validated = executeActionSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(validated.error.issues[0]?.message || "Action confirmation required", "BAD_REQUEST", 400);
    }

    const result = await AIService.executeConfirmedAction(user, validated.data);

    return successResponse(result, 200);
  } catch (error: any) {
    console.error("POST /api/ai/actions/execute error:", error);
    return errorResponse(error.message || "Failed to execute confirmed action", "INTERNAL_ERROR", 500);
  }
}
