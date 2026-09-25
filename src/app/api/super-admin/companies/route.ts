import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-response";
import { AuditService } from "@/services/audit.service";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    if (user.roleCode !== "SUPER_ADMIN" && user.roleLevel < 100) {
      return errorResponse(
        "Forbidden: Platform administration requires Super Admin credentials",
        "FORBIDDEN",
        403
      );
    }

    const companies = await db.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            departments: true,
            employees: true,
            clients: true,
            tasks: true,
            invoices: true,
            memberships: true,
          },
        },
      },
    });

    const formattedCompanies = companies.map((c) => ({
      id: c.id,
      companyId: c.id,
      name: c.name,
      companyName: c.name,
      code: c.code,
      companyCode: c.code,
      legalName: c.legalName,
      logo: c.logo,
      primaryColor: c.primaryColor || "#2563eb",
      secondaryColor: c.secondaryColor || "#1e40af",
      industry: c.industry,
      website: c.website,
      email: c.email,
      phone: c.phone,
      address: c.address,
      currency: c.currency,
      timezone: c.timezone,
      dateFormat: c.dateFormat,
      fiscalYear: c.fiscalYear,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      stats: {
        usersCount: c._count.employees + c._count.memberships,
        activeUsersCount: c._count.employees,
        departmentsCount: c._count.departments,
        clientsCount: c._count.clients,
        tasksCount: c._count.tasks,
        invoicesCount: c._count.invoices,
      },
    }));

    return successResponse({
      companies: formattedCompanies,
      totalCount: companies.length,
      activeCount: companies.filter((c) => c.status === "ACTIVE").length,
    });
  } catch (error) {
    console.error("[Super Admin Companies API GET Error]:", error);
    return errorResponse("Failed to fetch companies list", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    if (user.roleCode !== "SUPER_ADMIN" && user.roleLevel < 100) {
      return errorResponse("Forbidden: Super Admin credentials required", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const {
      name,
      code,
      legalName,
      logo,
      primaryColor,
      secondaryColor,
      industry,
      website,
      email,
      phone,
      address,
      currency,
      timezone,
      dateFormat,
      fiscalYear,
      adminEmail,
      adminPassword,
      adminName,
      departments,
    } = body;

    if (!name || !code) {
      return errorResponse("Company Name and Code are required", "VALIDATION_ERROR", 400);
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "-");

    // Check code uniqueness
    const existing = await db.organization.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return errorResponse(
        `A company with code '${cleanCode}' already exists`,
        "DUPLICATE_CODE",
        400
      );
    }

    // 1. Create Organization
    const newCompany = await db.organization.create({
      data: {
        name,
        code: cleanCode,
        legalName: legalName || name,
        logo: logo || null,
        primaryColor: primaryColor || "#2563eb",
        secondaryColor: secondaryColor || "#1e40af",
        industry: industry || "Technology & Enterprise Services",
        website: website || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        currency: currency || "USD",
        timezone: timezone || "UTC",
        dateFormat: dateFormat || "YYYY-MM-DD",
        fiscalYear: fiscalYear || "JAN-DEC",
        status: "ACTIVE",
      },
    });

    // 2. Create Default Departments
    const defaultDepts = departments && Array.isArray(departments) && departments.length > 0
      ? departments
      : [
          { name: "Executive Leadership", code: "EXEC" },
          { name: "Technology & Engineering", code: "ENG" },
          { name: "Commercial & Sales", code: "CRM" },
          { name: "Finance & Treasury", code: "FIN" },
          { name: "Operations & Delivery", code: "OPS" },
          { name: "Human Resources", code: "HR" },
        ];

    const createdDepts = [];
    for (const d of defaultDepts) {
      const dept = await db.department.create({
        data: {
          organizationId: newCompany.id,
          name: d.name,
          code: d.code,
        },
      });
      createdDepts.push(dept);
    }

    // 3. Create Admin Account if requested
    let createdAdminUser = null;
    if (adminEmail && adminPassword) {
      const adminRole = await db.role.findFirst({
        where: { code: "ADMIN" },
      });

      if (adminRole) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const nameParts = (adminName || "Company Admin").split(" ");
        const firstName = nameParts[0] || "Company";
        const lastName = nameParts.slice(1).join(" ") || "Admin";

        createdAdminUser = await db.user.create({
          data: {
            email: adminEmail.toLowerCase().trim(),
            passwordHash: hashedPassword,
            roleId: adminRole.id,
            isActive: true,
          },
        });

        // Add membership
        await db.userCompanyMembership.create({
          data: {
            userId: createdAdminUser.id,
            organizationId: newCompany.id,
            roleId: adminRole.id,
            isPrimary: true,
            status: "ACTIVE",
          },
        });

        // Create Admin Employee record
        const execDept = createdDepts.find((d) => d.code === "EXEC") || createdDepts[0];
        await db.employee.create({
          data: {
            organizationId: newCompany.id,
            departmentId: execDept?.id || null,
            userId: createdAdminUser.id,
            employeeNumber: `${cleanCode}-0001`,
            firstName,
            lastName,
            email: adminEmail.toLowerCase().trim(),
            designation: "Company Administrator",
            employmentType: "FULL_TIME",
            employmentStatus: "ACTIVE",
            hireDate: new Date(),
          },
        });
      }
    }

    // 4. Audit Log
    await AuditService.logMutation({
      actorId: user.id,
      organizationId: newCompany.id,
      action: "COMPANY_CREATED",
      entity: "Organization",
      entityId: newCompany.id,
      newValue: {
        id: newCompany.id,
        name: newCompany.name,
        code: newCompany.code,
        adminEmail: adminEmail || null,
      },
      metadata: { source: "super_admin_wizard" },
    });

    return successResponse({
      company: newCompany,
      departmentsCreated: createdDepts.length,
      adminCreated: !!createdAdminUser,
      message: `Company '${newCompany.name}' successfully provisioned.`,
    });
  } catch (error) {
    console.error("[Super Admin Company Creation Error]:", error);
    return errorResponse("Failed to provision new company", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
    }

    if (user.roleCode !== "SUPER_ADMIN" && user.roleLevel < 100) {
      return errorResponse("Forbidden: Super Admin credentials required", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const { companyId, status, settings } = body;

    if (!companyId) {
      return errorResponse("companyId is required", "VALIDATION_ERROR", 400);
    }

    const company = await db.organization.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return errorResponse("Company not found", "NOT_FOUND", 404);
    }

    const updateData: any = {};
    if (status && ["ACTIVE", "SUSPENDED", "ARCHIVED"].includes(status)) {
      updateData.status = status;
    }
    if (settings && typeof settings === "object") {
      if (settings.name) updateData.name = settings.name;
      if (settings.legalName) updateData.legalName = settings.legalName;
      if (settings.primaryColor) updateData.primaryColor = settings.primaryColor;
      if (settings.secondaryColor) updateData.secondaryColor = settings.secondaryColor;
      if (settings.currency) updateData.currency = settings.currency;
      if (settings.timezone) updateData.timezone = settings.timezone;
    }

    const updated = await db.organization.update({
      where: { id: companyId },
      data: updateData,
    });

    await AuditService.logMutation({
      actorId: user.id,
      organizationId: companyId,
      action: status === "SUSPENDED" ? "COMPANY_SUSPENDED" : status === "ACTIVE" ? "COMPANY_ACTIVATED" : "COMPANY_UPDATED",
      entity: "Organization",
      entityId: companyId,
      previousValue: { status: company.status },
      newValue: { status: updated.status, updateData },
    });

    return successResponse({
      company: updated,
      message: `Company '${updated.name}' updated successfully`,
    });
  } catch (error) {
    console.error("[Super Admin Company PATCH Error]:", error);
    return errorResponse("Failed to update company", "INTERNAL_ERROR", 500);
  }
}
