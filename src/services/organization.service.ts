import { db } from "@/lib/db";

export class OrganizationService {
  static async getOrganization() {
    return db.organization.findFirst({
      include: {
        departments: {
          include: {
            _count: {
              select: { employees: true },
            },
          },
        },
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  static async getHierarchyTree() {
    // Top-level leaders (reporting manager is null)
    return db.employee.findMany({
      where: { managerId: null },
      include: {
        department: true,
        user: { select: { role: true } },
        directReports: {
          include: {
            department: true,
            user: { select: { role: true } },
            directReports: {
              include: {
                department: true,
                user: { select: { role: true } },
              },
            },
          },
        },
      },
    });
  }
}
