const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  console.log("=== Starting Full Employee Cleanup ===\n");

  // Step 1: Delete child/dependent records that have a required employeeId FK
  // (in order of dependency — most nested first)

  const r1 = await db.taskComment.deleteMany({});
  console.log(`Deleted taskComments: ${r1.count}`);

  const r2 = await db.attendanceRecord.deleteMany({});
  console.log(`Deleted attendanceRecords: ${r2.count}`);

  const r3 = await db.leaveRequest.deleteMany({});
  console.log(`Deleted leaveRequests: ${r3.count}`);

  const r4 = await db.leaveBalance.deleteMany({});
  console.log(`Deleted leaveBalances: ${r4.count}`);

  const r5 = await db.employeeSalaryStructure.deleteMany({});
  console.log(`Deleted employeeSalaryStructures: ${r5.count}`);

  const r6 = await db.payrollEntry.deleteMany({});
  console.log(`Deleted payrollEntries: ${r6.count}`);

  const r7 = await db.onDutyAssignment.deleteMany({});
  console.log(`Deleted onDutyAssignments: ${r7.count}`);

  const r8 = await db.operationEmployee.deleteMany({});
  console.log(`Deleted operationEmployees: ${r8.count}`);

  const r9 = await db.employeeRequest.deleteMany({});
  console.log(`Deleted employeeRequests: ${r9.count}`);

  const r10 = await db.approvalRequest.deleteMany({});
  console.log(`Deleted approvalRequests: ${r10.count}`);

  const r11 = await db.expense.deleteMany({});
  console.log(`Deleted expenses: ${r11.count}`);

  const r12 = await db.calendarEvent.deleteMany({});
  console.log(`Deleted calendarEvents: ${r12.count}`);

  const r13 = await db.crmActivity.deleteMany({});
  console.log(`Deleted crmActivities: ${r13.count}`);

  const r14 = await db.announcement.deleteMany({});
  console.log(`Deleted announcements: ${r14.count}`);

  const r15 = await db.auditLog.deleteMany({});
  console.log(`Deleted auditLogs: ${r15.count}`);

  // Null out self-referential manager FK on employees
  const r16 = await db.employee.updateMany({ data: { managerId: null } });
  console.log(`Nulled manager references: ${r16.count}`);

  // Null out task assignee/creator FKs (tasks reference employees but might not cascade)
  try {
    const r17 = await db.task.updateMany({ data: { assigneeId: null } });
    console.log(`Nulled task assignees: ${r17.count}`);
    const r18 = await db.task.updateMany({ data: { creatorId: null } });
    console.log(`Nulled task creators: ${r18.count}`);
  } catch(e) {
    console.log(`Task nulling skipped: ${e.message}`);
  }

  // Unlink employees from users
  try {
    await db.employee.updateMany({ data: { userId: null } });
  } catch(e) {
    console.log(`userId unlink skipped: ${e.message}`);
  }

  // Step 2: Delete all employees
  const deleted = await db.employee.deleteMany({});
  console.log(`\n✅ DELETED ${deleted.count} employees\n`);

  // Verify
  const remaining = await db.employee.count();
  console.log(`Remaining employees: ${remaining}`);

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("\nERROR:", e.message);
  if (e.meta) console.error("Meta:", JSON.stringify(e.meta, null, 2));
  await db.$disconnect();
  process.exit(1);
});
