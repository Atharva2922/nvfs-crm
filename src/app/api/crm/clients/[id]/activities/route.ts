import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ClientService } from "@/services/client.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const activitySchema = z.object({
  type: z.enum(["CALL", "MEETING", "EMAIL", "NOTE", "TASK", "PROPOSAL", "STATUS_CHANGE"]),
  subject: z.string().min(2, "Subject is required"),
  description: z.string().optional(),
  opportunityId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = activitySchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const activity = await ClientService.logActivity(id, user, parse.data);
    return successResponse(activity, 201);
  } catch (error: any) {
    console.error("[Log Activity Error]:", error);
    return errorResponse(error.message || "Failed to log activity", "ACTIVITY_FAILED", 400);
  }
}
