import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { TaskService } from "@/services/task.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
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
    const parse = commentSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const comment = await TaskService.addComment(id, user, parse.data.content);
    return successResponse(comment, 201);
  } catch (error: any) {
    console.error("[Task Comment POST Error]:", error);
    return errorResponse(error.message || "Failed to post comment", "COMMENT_FAILED", 400);
  }
}
