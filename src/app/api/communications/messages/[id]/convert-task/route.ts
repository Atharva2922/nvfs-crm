import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CommunicationService } from "@/services/communication.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const convertTaskSchema = z.object({
  title: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = convertTaskSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(validated.error.issues[0]?.message || "Invalid payload", "BAD_REQUEST", 400);
    }

    const task = await CommunicationService.convertMessageToTask(
      user,
      id,
      validated.data
    );

    return successResponse({ task }, 201);
  } catch (error: any) {
    console.error("POST /api/communications/messages/[id]/convert-task error:", error);
    return errorResponse(error.message || "Failed to convert message to task", "INTERNAL_ERROR", 500);
  }
}
