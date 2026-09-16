import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AuditService } from "@/services/audit.service";
import { z } from "zod";

const createPolicySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.enum(["GENERAL", "WORKPLACE", "CONDUCT", "LEAVE_ATTENDANCE", "BENEFITS"]),
  version: z.string().default("1.0"),
  summary: z.string().optional(),
  content: z.string().min(10, "Policy content is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  isMandatory: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: any = { organizationId: user.employee.organizationId };
    if (category && category !== "ALL") where.category = category;

    const policies = await db.hrPolicy.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return successResponse({ policies });
  } catch (error: any) {
    console.error("[HR Policies GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch HR policies", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const userRole = user.roleCode;
    const isPrivileged = ["SUPER_ADMIN", "ADMIN", "CHAIRPERSON", "CEO", "DEPARTMENT_HEAD"].includes(userRole || "");
    if (!isPrivileged) {
      return errorResponse("Forbidden: HR or Admin privileges required", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parse = createPolicySchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const finalContent = parse.data.summary
      ? `${parse.data.summary}\n\n${parse.data.content}`
      : parse.data.content;

    const policy = await db.hrPolicy.create({
      data: {
        organizationId: user.employee.organizationId,
        title: parse.data.title,
        category: parse.data.category,
        version: parse.data.version,
        content: finalContent,
        effectiveDate: new Date(parse.data.effectiveDate),
        isMandatory: parse.data.isMandatory,
      },
    });

    await AuditService.logMutation({
      actorId: user.id,
      action: "HR_POLICY_CREATED",
      entity: "HrPolicy",
      entityId: policy.id,
      newValue: { title: policy.title, category: policy.category, version: policy.version },
    });

    return successResponse(policy, 201);
  } catch (error: any) {
    console.error("[HR Policies POST Error]:", error);
    return errorResponse(error.message || "Failed to create policy", "BAD_REQUEST", 400);
  }
}
