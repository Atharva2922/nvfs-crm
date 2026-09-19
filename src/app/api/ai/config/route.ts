import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const updateConfigSchema = z.object({
  isEnabled: z.boolean().optional(),
  provider: z.enum(["INTERNAL", "GEMINI", "OPENAI"]).optional(),
  model: z.string().optional(),
  maxTokensPerReq: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const config = await db.aIConfiguration.findUnique({
      where: { organizationId: user.employee.organizationId },
    });

    return successResponse({
      config: config || {
        isEnabled: true,
        provider: "INTERNAL",
        model: "crm-intelligence-v1",
        maxTokensPerReq: 4096,
      },
    }, 200);
  } catch (error: any) {
    console.error("GET /api/ai/config error:", error);
    return errorResponse(error.message || "Failed to load AI config", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Only Admin or Executive can change AI settings
    if (!["SUPER_ADMIN", "ADMIN", "CEO", "CTO"].includes(user.roleCode)) {
      return errorResponse("Forbidden: Insufficient privileges to configure AI settings", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validated = updateConfigSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(validated.error.issues[0]?.message || "Invalid payload", "BAD_REQUEST", 400);
    }

    const config = await db.aIConfiguration.upsert({
      where: { organizationId: user.employee.organizationId },
      update: validated.data,
      create: {
        organizationId: user.employee.organizationId,
        ...validated.data,
      },
    });

    return successResponse({ config }, 200);
  } catch (error: any) {
    console.error("POST /api/ai/config error:", error);
    return errorResponse(error.message || "Failed to update AI config", "INTERNAL_ERROR", 500);
  }
}
