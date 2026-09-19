import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AIService } from "@/services/ai/ai.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const summarizeSchema = z.object({
  recordType: z.enum(["CLIENT", "OPERATION", "INVOICE", "CONTRACT"]),
  recordId: z.string().min(1, "Record ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const validated = summarizeSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(validated.error.issues[0]?.message || "Invalid payload", "BAD_REQUEST", 400);
    }

    const summary = await AIService.summarizeRecord(
      user,
      validated.data.recordType,
      validated.data.recordId
    );

    return successResponse({ summary }, 200);
  } catch (error: any) {
    console.error("POST /api/ai/summarize error:", error);
    return errorResponse(error.message || "Failed to generate summary", "INTERNAL_ERROR", 500);
  }
}
