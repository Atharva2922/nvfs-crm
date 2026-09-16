import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { AuthenticatedUser, SystemRoleCode } from "@/types";

export class AuthService {
  static async verifyCredentials(email: string, passwordPlain: string) {
    const user = await db.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        employee: {
          include: {
            department: true,
            organization: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isValid) {
      return null;
    }

    // Update lastLoginAt
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      roleCode: user.role.code as SystemRoleCode,
      roleName: user.role.name,
      roleLevel: user.role.level,
      isActive: user.isActive,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeNumber: user.employee.employeeNumber,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            designation: user.employee.designation,
            departmentName: user.employee.department?.name || null,
            organizationName: user.employee.organization.name,
            organizationId: user.employee.organization.id,
          }
        : null,
      permissions: user.role.rolePermissions.map((rp) => rp.permission.code),
    };

    return authenticatedUser;
  }

  static async loginWithGoogle(email: string, name?: string, avatarUrl?: string) {
    const normalizedEmail = email.toLowerCase().trim();

    let user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        employee: {
          include: {
            department: true,
            organization: true,
          },
        },
      },
    });

    if (!user) {
      // Find role: default to SUPER_ADMIN or first role
      let role = await db.role.findFirst({
        where: { code: "SUPER_ADMIN" },
      });
      if (!role) {
        role = await db.role.findFirst();
      }
      if (!role) {
        throw new Error("No system roles configured");
      }

      // Find or create organization
      let org = await db.organization.findFirst();
      if (!org) {
        org = await db.organization.create({
          data: {
            name: "CRM + NFVS Enterprise Group",
            code: "NFVS-CORP",
          },
        });
      }

      // Find department
      let dept = await db.department.findFirst({
        where: { organizationId: org.id },
      });

      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const nameParts = (name || "Google User").trim().split(" ");
      const firstName = nameParts[0] || "Google";
      const lastName = nameParts.slice(1).join(" ") || "User";

      const createdUser = await db.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: randomPassword,
          roleId: role.id,
          isActive: true,
          lastLoginAt: new Date(),
        },
      });

      const empNumber = `NFVS-G${Math.floor(1000 + Math.random() * 9000)}`;
      await db.employee.create({
        data: {
          organizationId: org.id,
          departmentId: dept?.id,
          userId: createdUser.id,
          employeeNumber: empNumber,
          firstName,
          lastName,
          email: normalizedEmail,
          avatarUrl: avatarUrl || null,
          designation: "Enterprise Executive",
          employmentType: "FULL_TIME",
          employmentStatus: "ACTIVE",
          hireDate: new Date(),
        },
      });

      user = await db.user.findUnique({
        where: { id: createdUser.id },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
          employee: {
            include: {
              department: true,
              organization: true,
            },
          },
        },
      });
    } else {
      if (!user.isActive) {
        return null;
      }
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    if (!user) return null;

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      roleCode: user.role.code as SystemRoleCode,
      roleName: user.role.name,
      roleLevel: user.role.level,
      isActive: user.isActive,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeNumber: user.employee.employeeNumber,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            designation: user.employee.designation,
            departmentName: user.employee.department?.name || null,
            organizationName: user.employee.organization.name,
            organizationId: user.employee.organization.id,
          }
        : null,
      permissions: user.role.rolePermissions.map((rp) => rp.permission.code),
    };

    return authenticatedUser;
  }
}
