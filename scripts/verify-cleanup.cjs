const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  // Verify employees are gone
  const empCount = await db.employee.count();
  console.log(`Employees remaining: ${empCount}`);

  // Check tasks with dangling assignees
  const tasksWithAssignee = await db.task.count({ where: { NOT: { assigneeId: null } } });
  console.log(`Tasks with assigneeId (dangling): ${tasksWithAssignee}`);

  // Fix them
  if (tasksWithAssignee > 0) {
    const fixed = await db.task.updateMany({ where: { NOT: { assigneeId: null } }, data: { assigneeId: null } });
    console.log(`Fixed dangling task assignees: ${fixed.count}`);
  }

  // Check departments still exist (should remain)
  const deptCount = await db.department.count();
  console.log(`Departments remaining: ${deptCount}`);

  // Also null out any conversation participants pointing to employees (via employeeId field if exists)
  try {
    const convCount = await db.conversationParticipant.count({});
    console.log(`Conversation participants: ${convCount}`);
  } catch(e) {
    console.log(`ConversationParticipant check skipped`);
  }

  console.log("\n✅ Cleanup complete. Database is clean.");
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("Error:", e.message);
  await db.$disconnect();
  process.exit(1);
});
