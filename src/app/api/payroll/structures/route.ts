import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SalaryService } from "@/services/salary.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createStructureSchema = z.object({
  name: z.string().min(3, "Structure name must be at least 3 characters"),
  description: z.string().optional(),
  currency: z.string().default("INR"),
  items: z.array(
    z.object({
      componentId: z.string().min(1, "Component is required"),
      calcType: z.enum(["FIXED", "PERCENTAGE_OF_BASIC", "PERCENTAGE_OF_GROSS"]),
      value: z.number().min(0, "Value must be non-negative"),
      order: z.number().default(0),
    })
  ),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const orgId = user.employee.organizationId;

    const [components, structures] = await Promise.all([
      db.salaryComponent.findMany({
        where: { organizationId: orgId },
        orderBy: [{ type: "asc" }, { code: "asc" }],
      }),
      db.salaryStructure.findMany({
        where: { organizationId: orgId },
        include: {
          items: {
            include: { component: true },
            orderBy: { order: "asc" },
          },
          _count: { select: { assignments: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return successResponse({ components, structures });
  } catch (error: any) {
    console.error("[Salary Structures GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch salary structures", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!SalaryService.isPrivilegedPayrollUser(user)) {
      return errorResponse("Forbidden: Restricted to payroll administrators", "FORBIDDEN", 403);
    }

    const orgId = user.employee.organizationId;
    const body = await req.json();
    const parse = createStructureSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const structure = await db.salaryStructure.create({
      data: {
        organizationId: orgId,
        name: parse.data.name,
        description: parse.data.description || null,
        currency: parse.data.currency,
        items: {
          create: parse.data.items.map((item, idx) => ({
            componentId: item.componentId,
            calcType: item.calcType,
            value: item.value,
            order: item.order || idx + 1,
          })),
        },
      },
      include: {
        items: { include: { component: true } },
      },
    });

    return successResponse(structure, 201);
  } catch (error: any) {
    console.error("[Salary Structure POST Error]:", error);
    return errorResponse(error.message || "Failed to create structure", "BAD_REQUEST", 400);
  }
}
