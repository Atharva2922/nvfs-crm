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
    const targetOrgId =
      searchParams.get("organizationId") ||
      req.headers.get("x-company-id") ||
      user.activeCompany?.id ||
      user.employee?.organizationId;

    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || undefined;
    const status = searchParams.get("status") || undefined;
    const designation = searchParams.get("designation") || undefined;
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (targetOrgId) {
      where.organizationId = targetOrgId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
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

    const [totalCount, rawEmployees] = await Promise.all([
      db.employee.count({ where }),
      db.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        include: {
          department: true,
          assignedTasks: {
            where: { status: { in: ["TODO", "IN_PROGRESS"] } },
            select: { id: true, title: true, status: true, priority: true },
          },
          operationAssignments: {
            include: {
              operation: { select: { id: true, status: true } },
            },
          },
          onDutyAssignments: {
            where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
            select: { id: true },
          },
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

    // Calculate live availability (free vs busy)
    const employees = rawEmployees.map((emp) => {
      const activeTasksCount = emp.assignedTasks.length;
      const activeOpsCount = emp.operationAssignments.filter((oa) =>
        ["ACTIVE", "SCHEDULED", "IN_PROGRESS"].includes(oa.operation?.status)
      ).length;
      const activeOnDutyCount = emp.onDutyAssignments.length;

      const isFree =
        emp.employmentStatus === "ACTIVE" &&
        activeTasksCount === 0 &&
        activeOpsCount === 0 &&
        activeOnDutyCount === 0;

      let busyReason: string | null = null;
      if (emp.employmentStatus !== "ACTIVE") {
        busyReason = `Status: ${emp.employmentStatus}`;
      } else if (activeTasksCount > 0) {
        busyReason = `${activeTasksCount} active task(s)`;
      } else if (activeOpsCount > 0) {
        busyReason = `${activeOpsCount} active operation(s)`;
      } else if (activeOnDutyCount > 0) {
        busyReason = "On-duty assignment";
      }

      return {
        ...emp,
        isFree,
        busyReason,
        activeTasksCount,
        activeOpsCount,
      };
    });

    const responsePayload: any = employees;
    responsePayload.employees = employees; // Dual compatibility for both json.data and json.data.employees

    return successResponse(responsePayload, 200, {
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

    // RBAC Check: requires "employees.employee.create" or executive persona (SUPER_ADMIN, ADMIN, CEO, HR)
    const isExecutiveCreator = ["SUPER_ADMIN", "ADMIN", "CEO", "HR"].includes(user.roleCode);
    const hasPermission = await RbacService.hasPermission(user.id, "employees.employee.create");
    if (!hasPermission && !isExecutiveCreator) {
      return errorResponse("Forbidden: Missing employees.employee.create permission", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parse = createEmployeeSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    // Resolve the organization from request headers, query params, or active company context
    const companyId =
      req.headers.get("x-company-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      user.activeCompany?.id ||
      user.employee?.organizationId;

    const org = companyId
      ? await db.organization.findUnique({ where: { id: companyId } })
      : await db.organization.findFirst();

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

      // Ensure membership in this specific company
      await db.userCompanyMembership.upsert({
        where: {
          userId_organizationId: {
            userId: createdUserId,
            organizationId: org.id,
          },
        },
        create: {
          userId: createdUserId,
          organizationId: org.id,
          roleId: role.id,
          status: "ACTIVE",
          isPrimary: true,
        },
        update: {
          status: "ACTIVE",
          roleId: role.id,
        },
      }).catch(() => {});
    }

    // Validate and scope Department strictly to this organization
    let validDepartmentId = parse.data.departmentId;
    const deptInOrg = await db.department.findFirst({
      where: { id: validDepartmentId, organizationId: org.id },
    });
    if (!deptInOrg) {
      // Find matching department code/name in target company
      const submittedDept = await db.department.findUnique({ where: { id: parse.data.departmentId } });
      const matchingDept = submittedDept
        ? await db.department.findFirst({
            where: {
              organizationId: org.id,
              OR: [{ code: submittedDept.code }, { name: submittedDept.name }],
            },
          })
        : null;
      const fallbackDept =
        matchingDept || (await db.department.findFirst({ where: { organizationId: org.id } }));
      if (fallbackDept) {
        validDepartmentId = fallbackDept.id;
      }
    }

    // Validate and scope Manager strictly to this organization
    let validManagerId = parse.data.managerId || null;
    if (validManagerId) {
      const managerInOrg = await db.employee.findFirst({
        where: { id: validManagerId, organizationId: org.id },
      });
      if (!managerInOrg) {
        validManagerId = null;
      }
    }

    // Auto-generate company-scoped employee number (e.g. EMP-NAREE-EMP-001 or EMP-NFVS-EMP-001)
    const orgCode = org.code ? org.code.toUpperCase() : "EMP";
    const count = await db.employee.count({ where: { organizationId: org.id } });
    const employeeNumber = `EMP-${orgCode}-EMP-${String(count + 1).padStart(3, "0")}`;

    const newEmployee = await db.employee.create({
      data: {
        organizationId: org.id,
        departmentId: validDepartmentId,
        userId: createdUserId,
        managerId: validManagerId,
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

