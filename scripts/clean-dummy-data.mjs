/**
 * clean-dummy-data.mjs
 *
 * Removes ALL dummy/seeded data from the CRM database while preserving:
 *   - Organizations, Departments, Roles, RolePermissions, Permissions
 *   - Users & Employees (all accounts)
 *   - SystemSettings
 *   - Products (only the 2 real user-created ones)
 *
 * Wipes:
 *   - CRM: clients, leads, contacts, opportunities, crmActivities
 *   - Tasks & comments
 *   - HR: attendance, leave requests, leave balances, leave policies, payroll,
 *          salary structures/components, work day configs, holidays,
 *          compliance records, HR policies
 *   - Finance: invoices, payments, expenses, financial transactions
 *   - Inventory: stock movements, inventory items/adjustments, warehouses,
 *                services, product categories
 *   - Notifications, calendar events, audit logs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting dummy data cleanup...\n");

  // ─── CRM ──────────────────────────────────────────────────────────────────
  console.log("Clearing CRM data...");
  await prisma.crmActivity.deleteMany();
  console.log("  ✓ CRM activities");

  await prisma.opportunity.deleteMany();
  console.log("  ✓ Opportunities");

  await prisma.lead.deleteMany();
  console.log("  ✓ Leads");

  await prisma.contact.deleteMany();
  console.log("  ✓ Contacts");

  await prisma.client.deleteMany();
  console.log("  ✓ Clients");

  // ─── Tasks ────────────────────────────────────────────────────────────────
  console.log("\nClearing tasks...");
  await prisma.taskComment.deleteMany();
  console.log("  ✓ Task comments");

  await prisma.task.deleteMany();
  console.log("  ✓ Tasks");

  // ─── Calendar & Notifications ─────────────────────────────────────────────
  console.log("\nClearing calendar & notifications...");
  await prisma.calendarEvent.deleteMany();
  console.log("  ✓ Calendar events");

  await prisma.notification.deleteMany();
  console.log("  ✓ Notifications");

  // ─── HR Data ──────────────────────────────────────────────────────────────
  console.log("\nClearing HR data...");
  await prisma.attendanceRecord.deleteMany();
  console.log("  ✓ Attendance records");

  await prisma.leaveRequest.deleteMany();
  console.log("  ✓ Leave requests");

  await prisma.leaveBalance.deleteMany();
  console.log("  ✓ Leave balances");

  await prisma.leavePolicy.deleteMany();
  console.log("  ✓ Leave policies");

  await prisma.complianceRecord.deleteMany();
  console.log("  ✓ Compliance records");

  await prisma.hrPolicy.deleteMany();
  console.log("  ✓ HR policies");

  await prisma.holiday.deleteMany();
  console.log("  ✓ Holidays");

  await prisma.workDayConfig.deleteMany();
  console.log("  ✓ Work day configs");

  // ─── Payroll & Salary ─────────────────────────────────────────────────────
  console.log("\nClearing payroll data...");
  await prisma.payrollEntry.deleteMany();
  console.log("  ✓ Payroll entries");

  await prisma.payrollPeriod.deleteMany();
  console.log("  ✓ Payroll periods");

  await prisma.employeeSalaryStructure.deleteMany();
  console.log("  ✓ Employee salary structures");

  await prisma.salaryStructureItem.deleteMany();
  console.log("  ✓ Salary structure items");

  await prisma.salaryStructure.deleteMany();
  console.log("  ✓ Salary structures");

  await prisma.salaryComponent.deleteMany();
  console.log("  ✓ Salary components");

  // ─── Finance ──────────────────────────────────────────────────────────────
  console.log("\nClearing finance data...");
  await prisma.financialTransaction.deleteMany();
  console.log("  ✓ Financial transactions");

  await prisma.payment.deleteMany();
  console.log("  ✓ Payments");

  await prisma.invoiceItem.deleteMany();
  console.log("  ✓ Invoice items");

  await prisma.invoice.deleteMany();
  console.log("  ✓ Invoices");

  await prisma.expense.deleteMany();
  console.log("  ✓ Expenses");

  // ─── Inventory ────────────────────────────────────────────────────────────
  console.log("\nClearing inventory data...");
  await prisma.inventoryAdjustmentItem.deleteMany();
  console.log("  ✓ Inventory adjustment items");

  await prisma.inventoryAdjustment.deleteMany();
  console.log("  ✓ Inventory adjustments");

  await prisma.stockMovement.deleteMany();
  console.log("  ✓ Stock movements");

  await prisma.inventoryItem.deleteMany();
  console.log("  ✓ Inventory items");

  await prisma.service.deleteMany();
  console.log("  ✓ Services");

  // NOTE: Products are preserved — they appear to be real user-created data
  // await prisma.product.deleteMany();

  await prisma.productCategory.deleteMany();
  console.log("  ✓ Product categories");

  await prisma.warehouse.deleteMany();
  console.log("  ✓ Warehouses");

  // ─── Audit Logs ───────────────────────────────────────────────────────────
  console.log("\nClearing audit logs...");
  await prisma.auditLog.deleteMany();
  console.log("  ✓ Audit logs");

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n✅ Cleanup complete!\n");
  console.log("Preserved:");
  console.log("  • Organizations:", await prisma.organization.count());
  console.log("  • Departments:", await prisma.department.count());
  console.log("  • Roles:", await prisma.role.count());
  console.log("  • Users:", await prisma.user.count());
  console.log("  • Employees:", await prisma.employee.count());
  console.log("  • Products:", await prisma.product.count());
  console.log("  • System settings:", await prisma.systemSetting.count());
}

main()
  .then(() => {
    console.log("\nDatabase is now clean and ready for real data. 🎉");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error during cleanup:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
