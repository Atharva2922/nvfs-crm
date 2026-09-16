import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { AuditService } from "@/services/audit.service";
import { RbacService } from "@/services/rbac.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid corporate email required"),
  phone: z.string().optional(),
  designation: z.string().min(1, "Designation is required"),
  departmentId: z.string().min(1, "Department is required"),
  managerId: z.string().optional().nullable(),
  employmentType: z.enum(["FULL_TIME", "CONTRACT", "PART_TIME", "INTERN"]).default("FULL_TIME"),
  workMode: z.enum(["ON_SITE", "REMOTE", "HYBRID"]).default("ON_SITE"),
  location: z.string().default("Headquarters (Mumbai)"),
  emergencyContact: z.string().optional(),
  hireDate: z.string().default(() => new Date().toISOString()),
  // CRM System Portal Credentials
  createSystemAccount: z.boolean().default(true),
  loginPassword: z.string().optional(),
  roleCode: z.string().default("EMPLOYEE"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || undefined;
    const status = searchParams.get("status") || undefined;
    const designation = searchParams.get("designation") || undefined;
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(Number(searchParams.get("limit") || 10), 50);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeNumber: { contains: search } },
        { designation: { contains: search } },
      ];
    }

    if (departmentId && departmentId !== "ALL") {
      where.departmentId = departmentId;
    }

    if (status && status !== "ALL") {
      where.employmentStatus = status;
    }

    if (designation && designation !== "ALL") {
      where.designation = designation;
    }

    const [totalCount, employees] = await Promise.all([
      db.employee.count({ where }),
      db.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { employeeNumber: "asc" },
        include: {
          department: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              designation: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              role: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return successResponse(employees, 200, {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    } as any);
  } catch (error) {
    console.error("[Employees GET Error]:", error);
    return errorResponse("Failed to fetch employees", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    // RBAC Check: requires "employees.employee.create"
    const allowed = await RbacService.hasPermission(user.id, "employees.employee.create");
    if (!allowed) {
      return errorResponse("Forbidden: Missing employees.employee.create permission", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parse = createEmployeeSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const org = await db.organization.findFirst();
    if (!org) {
      return errorResponse("No organization configured", "INTERNAL_ERROR", 500);
    }

    const corporateEmail = parse.data.email.trim().toLowerCase();

    // Check duplicate employee email
    const existingEmp = await db.employee.findUnique({ where: { email: corporateEmail } });
    if (existingEmp) {
      return errorResponse(`An employee with email [${corporateEmail}] already exists`, "DUPLICATE_EMAIL", 400);
    }

    let createdUserId: string | null = null;

    // Handle CRM Login System Account Creation
    if (parse.data.createSystemAccount) {
      const existingUser = await db.user.findUnique({ where: { email: corporateEmail } });
      if (existingUser) {
        return errorResponse(`A CRM login account for [${corporateEmail}] already exists`, "DUPLICATE_USER", 400);
      }

      const roleCode = parse.data.roleCode || "EMPLOYEE";
      let role = await db.role.findUnique({ where: { code: roleCode } });
      if (!role) {
        role = await db.role.findUnique({ where: { code: "EMPLOYEE" } });
      }
      if (!role) {
        return errorResponse("Role configuration missing", "INTERNAL_ERROR", 500);
      }

      const rawPassword = parse.data.loginPassword && parse.data.loginPassword.trim().length >= 6
        ? parse.data.loginPassword.trim()
        : "Enterprise@2026";

      const passwordHash = await hashPassword(rawPassword);

      const createdUser = await db.user.create({
        data: {
          email: corporateEmail,
          passwordHash,
          roleId: role.id,
          isActive: true,
        },
      });

      createdUserId = createdUser.id;
    }

    // Auto-generate employee number
    const count = await db.employee.count();
    const employeeNumber = `NFVS-${String(count + 1).padStart(4, "0")}`;

    const newEmployee = await db.employee.create({
      data: {
        organizationId: org.id,
        departmentId: parse.data.departmentId,
        userId: createdUserId,
        managerId: parse.data.managerId || null,
        employeeNumber,
        firstName: parse.data.firstName.trim(),
        lastName: parse.data.lastName.trim(),
        email: corporateEmail,
        phone: parse.data.phone?.trim() || null,
        designation: parse.data.designation.trim(),
        employmentType: parse.data.employmentType,
        employmentStatus: "ACTIVE",
        workMode: parse.data.workMode,
        location: parse.data.location,
        emergencyContact: parse.data.emergencyContact?.trim() || null,
        hireDate: new Date(parse.data.hireDate),
      },
      include: {
        department: true,
        manager: true,
        user: { select: { id: true, email: true, role: true } },
      },
    });

    // Auto-allocate 2026 leave balances
    const leavePolicies = await db.leavePolicy.findMany({ where: { organizationId: org.id } });
    for (const policy of leavePolicies) {
      if (policy.annualAllowance > 0) {
        await db.leaveBalance.create({
          data: {
            employeeId: newEmployee.id,
            leavePolicyId: policy.id,
            year: new Date().getFullYear(),
            allocated: policy.annualAllowance,
            used: 0,
            pending: 0,
            remaining: policy.annualAllowance,
          },
        }).catch(() => {});
      }
    }

    // Record mutation in AuditLog
    await AuditService.logMutation({
      actorId: user.id,
      action: "EMPLOYEE_CREATED",
      entity: "Employee",
      entityId: newEmployee.id,
      newValue: {
        employeeNumber: newEmployee.employeeNumber,
        name: `${newEmployee.firstName} ${newEmployee.lastName}`,
        email: newEmployee.email,
        department: newEmployee.department?.name,
        designation: newEmployee.designation,
        hasCrmLogin: !!createdUserId,
      },
      metadata: { source: "employees_api" },
    });

    return successResponse(newEmployee, 201);
  } catch (error: any) {
    console.error("[Employees POST Error]:", error);
    return errorResponse(error.message || "Failed to create employee profile", "INTERNAL_ERROR", 500);
  }
}

