import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SalaryService } from "@/services/salary.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const assignSalarySchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  salaryStructureId: z.string().min(1, "Salary structure template is required"),
  baseSalary: z.number().min(1, "Base salary must be greater than 0"),
  paymentMethod: z.enum(["BANK_TRANSFER", "DIRECT_DEPOSIT", "CHEQUE"]).default("BANK_TRANSFER"),
  bankName: z.string().optional(),
  bankAccountMask: z.string().optional(),
  taxIdNumber: z.string().optional(),
  effectiveFrom: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const targetEmployeeId = searchParams.get("employeeId");

    // If querying specific employee
    if (targetEmployeeId) {
      const salary = await SalaryService.getEmployeeSalary(targetEmployeeId, user);
      return successResponse(salary);
    }

    // Otherwise querying company-wide directory of salaries -> STRICT PRIVILEGE CHECK
    if (!SalaryService.isPrivilegedPayrollUser(user)) {
      return errorResponse("Forbidden: Salary directory is restricted to authorized executive roles", "FORBIDDEN", 403);
    }

    const orgId = user.employee.organizationId;
    const assignments = await db.employeeSalaryStructure.findMany({
      where: {
        isActive: true,
        employee: { organizationId: orgId },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            designation: true,
            department: { select: { name: true, code: true } },
          },
        },
        salaryStructure: {
          select: { id: true, name: true, currency: true },
        },
      },
      orderBy: { employee: { employeeNumber: "asc" } },
    });

    return successResponse({ assignments });
  } catch (error: any) {
    console.error("[Employee Salaries GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve employee salaries", "BAD_REQUEST", 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!SalaryService.isPrivilegedPayrollUser(user)) {
      return errorResponse("Forbidden: Restricted to payroll administrators", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parse = assignSalarySchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const assignment = await SalaryService.assignSalaryPackage({
      actorId: user.id,
      employeeId: parse.data.employeeId,
      salaryStructureId: parse.data.salaryStructureId,
      baseSalary: parse.data.baseSalary,
      paymentMethod: parse.data.paymentMethod,
      bankName: parse.data.bankName,
      bankAccountMask: parse.data.bankAccountMask,
      taxIdNumber: parse.data.taxIdNumber,
      effectiveFrom: parse.data.effectiveFrom,
    });

    return successResponse(assignment, 201);
  } catch (error: any) {
    console.error("[Employee Salary Assignment Error]:", error);
    return errorResponse(error.message || "Failed to assign salary package", "BAD_REQUEST", 400);
  }
}
