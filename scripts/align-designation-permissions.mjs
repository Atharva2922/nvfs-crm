import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

async function main() {
  console.log("================================================================================");
  console.log("ALIGNING ROLE PERMISSIONS STRICTLY TO CORPORATE DESIGNATIONS");
  console.log("================================================================================\n");

  const allPerms = await prisma.permission.findMany();
  const permMap = {};
  allPerms.forEach((p) => {
    permMap[p.code] = p.id;
  });

  const getPermIds = (codes) => codes.map((c) => permMap[c]).filter(Boolean);

  const designationPermissions = {
    SUPER_ADMIN: allPerms.map((p) => p.code),
    ADMIN: [
      "settings.general.manage",
      "settings.roles.manage",
      "organization.department.manage",
      "organization.department.read",
      "employees.employee.read",
      "employees.employee.create",
      "employees.employee.update",
      "audit.log.read",
      "hr.policies.read",
      "hr.policies.manage",
      "hr.compliance.read",
      "hr.compliance.manage",
    ],
    CEO: [
      "employees.employee.read",
      "organization.department.read",
      "hr.leave.read",
      "hr.leave.approve",
      "hr.attendance.read",
      "hr.policies.read",
      "finance.read",
      "invoice.read",
      "invoice.approve",
      "expense.read",
      "expense.approve",
      "products.read",
      "services.read",
      "inventory.read",
      "audit.log.read",
    ],
    HR: [
      "employees.employee.read",
      "employees.employee.create",
      "employees.employee.update",
      "organization.department.read",
      "hr.leave.read",
      "hr.leave.create",
      "hr.leave.approve",
      "hr.attendance.read",
      "hr.attendance.record",
      "hr.workdays.manage",
      "hr.policies.read",
      "hr.policies.manage",
      "hr.compliance.read",
      "hr.compliance.manage",
      "payroll.salary.read",
      "payroll.salary.manage",
      "payroll.structure.read",
      "payroll.structure.manage",
      "payroll.period.manage",
      "payroll.payslip.read_own",
      "audit.log.read",
    ],
    COO: [
      "products.read",
      "products.create",
      "products.update",
      "products.cost.read",
      "services.read",
      "services.create",
      "services.update",
      "inventory.read",
      "inventory.adjust",
      "inventory.transfer",
      "inventory.adjust.approve",
      "warehouses.read",
      "warehouses.create",
      "warehouses.update",
      "employees.employee.read",
      "organization.department.read",
      "hr.leave.read",
      "hr.leave.approve",
      "hr.attendance.read",
    ],
    CFO: [
      "finance.read",
      "finance.manage",
      "invoice.read",
      "invoice.create",
      "invoice.update",
      "invoice.approve",
      "invoice.cancel",
      "payment.read",
      "payment.create",
      "payment.reverse",
      "expense.read",
      "expense.create",
      "expense.approve",
      "expense.reject",
      "payroll.post",
      "payroll.salary.read",
      "payroll.salary.manage",
      "payroll.structure.read",
      "payroll.period.manage",
      "payroll.payslip.read_own",
      "employees.employee.read",
      "organization.department.read",
      "hr.leave.read",
    ],
    CIO: [
      "products.read",
      "products.create",
      "products.update",
      "products.cost.read",
      "services.read",
      "services.create",
      "services.update",
      "inventory.read",
      "inventory.adjust",
      "inventory.transfer",
      "warehouses.read",
      "employees.employee.read",
      "organization.department.read",
      "hr.leave.read",
      "hr.attendance.read",
      "audit.log.read",
    ],
    CTO: [
      "products.read",
      "products.create",
      "products.update",
      "products.cost.read",
      "services.read",
      "services.create",
      "services.update",
      "inventory.read",
      "inventory.adjust",
      "inventory.transfer",
      "warehouses.read",
      "employees.employee.read",
      "organization.department.read",
      "hr.leave.read",
      "hr.attendance.read",
      "audit.log.read",
    ],
    CMO: [
      "products.read",
      "services.read",
      "inventory.read",
      "employees.employee.read",
      "organization.department.read",
      "hr.leave.read",
      "hr.leave.approve",
      "hr.attendance.read",
      "expense.read",
      "expense.create",
    ],
    EMPLOYEE: [
      "hr.leave.read",
      "hr.leave.create",
      "hr.attendance.read",
      "hr.attendance.record",
      "hr.policies.read",
      "payroll.payslip.read_own",
      "expense.read",
      "expense.create",
      "products.read",
      "services.read",
    ],
  };

  for (const [roleCode, permCodes] of Object.entries(designationPermissions)) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) continue;

    // Clear old permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    // Insert exact new permissions
    const permIds = getPermIds(permCodes);
    if (permIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permIds.map((pid) => ({
          roleId: role.id,
          permissionId: pid,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`✓ [${role.code}] synced strictly with ${permIds.length} permissions.`);
  }

  console.log("\n================================================================================");
  console.log("ROLE PERMISSIONS STRICTLY ALIGNED TO DESIGNATIONS");
  console.log("================================================================================");
}

main().catch(console.error).finally(() => prisma.$disconnect());
