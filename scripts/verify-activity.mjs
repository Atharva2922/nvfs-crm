// scripts/verify-activity.mjs
const BASE_URL = "http://localhost:3000";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(json)}`);
  }
  const setCookie = res.headers.get("set-cookie");
  return {
    user: json.data,
    cookie: setCookie ? setCookie.split(";")[0] : "",
  };
}

async function main() {
  console.log("=== STARTING BLOCK 4: TASKS, CALENDAR & NOTIFICATIONS VERIFICATION ===\n");

  // 1. Authenticate Personas
  console.log("1. Authenticating Super Admin, Manager (HR Head), and Staff Employee...");
  const admin = await login("superadmin@nfvs.internal", "Enterprise@2026");
  const manager = await login("hr.head@nfvs.internal", "Enterprise@2026");
  const employee = await login("alex.mercer@nfvs.internal", "Enterprise@2026");

  console.log("✓ Super Admin (Marcus Vance) authenticated.");
  console.log("✓ Department Manager (Beatrice Dubois) authenticated.");
  console.log("✓ Staff Systems Engineer (Alex Mercer) authenticated.");

  const adminHeaders = { "Content-Type": "application/json", Cookie: admin.cookie };
  const mgrHeaders = { "Content-Type": "application/json", Cookie: manager.cookie };
  const empHeaders = { "Content-Type": "application/json", Cookie: employee.cookie };

  // 2. Test Task Creation & Hierarchical Assignment
  console.log("\n2. Testing Task Creation & Hierarchical Assignment (/api/tasks)...");
  const taskTitle = `SOC2 Type II Audit Preparation #${Date.now().toString().slice(-4)}`;
  const createTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: mgrHeaders,
    body: JSON.stringify({
      title: taskTitle,
      description: "Perform access control review and prepare evidence artifacts for auditors.",
      priority: "HIGH",
      assigneeId: employee.user.employee.id,
      dueDate: "2026-09-28",
      relatedProjectId: "PRJ-SOC2",
    }),
  });
  const createTaskData = await createTaskRes.json();
  if (!createTaskRes.ok || !createTaskData.success) {
    throw new Error(`Task creation failed: ${JSON.stringify(createTaskData)}`);
  }
  const createdTask = createTaskData.data;
  console.log(`✓ Manager successfully created & delegated task: "${createdTask.title}" (ID: ${createdTask.id}, Status: ${createdTask.status}).`);

  // 3. Test Task Permissions & Scoping
  console.log("\n3. Testing Task Authorization & Scoping...");
  // Employee querying my tasks
  const empTasksRes = await fetch(`${BASE_URL}/api/tasks?scope=my`, { headers: empHeaders });
  const empTasksData = await empTasksRes.json();
  const foundTask = empTasksData.data.tasks.find((t) => t.id === createdTask.id);
  if (!foundTask) {
    throw new Error("Assigned task not found in employee's personal task list");
  }
  console.log(`✓ Staff Employee (Alex Mercer) sees assigned task in personal backlog (${empTasksData.data.tasks.length} total personal tasks).`);

  // Executive querying all tasks
  const adminTasksRes = await fetch(`${BASE_URL}/api/tasks?scope=all`, { headers: adminHeaders });
  const adminTasksData = await adminTasksRes.json();
  console.log(`✓ Super Admin sees full organizational backlog (${adminTasksData.data.tasks.length} total tasks across company).`);

  // 4. Test Task Status Progression & Comments
  console.log("\n4. Testing Task Status Lifecycle & Discussion Thread...");
  // A. Advance to IN_PROGRESS
  const patchRes = await fetch(`${BASE_URL}/api/tasks/${createdTask.id}`, {
    method: "PATCH",
    headers: empHeaders,
    body: JSON.stringify({ status: "IN_PROGRESS" }),
  });
  const patchData = await patchRes.json();
  if (!patchRes.ok || !patchData.success) {
    throw new Error(`Task status update failed: ${JSON.stringify(patchData)}`);
  }
  console.log(`✓ Task advanced to status: ${patchData.data.status}`);

  // B. Post a Comment
  const commentRes = await fetch(`${BASE_URL}/api/tasks/${createdTask.id}/comments`, {
    method: "POST",
    headers: empHeaders,
    body: JSON.stringify({ content: "Completed initial cryptographic key rotation review. Findings uploaded." }),
  });
  const commentData = await commentRes.json();
  if (!commentRes.ok || !commentData.success) {
    throw new Error(`Posting comment failed: ${JSON.stringify(commentData)}`);
  }
  console.log(`✓ Employee posted progress comment: "${commentData.data.content}"`);

  // C. Mark as COMPLETED
  const completeRes = await fetch(`${BASE_URL}/api/tasks/${createdTask.id}`, {
    method: "PATCH",
    headers: empHeaders,
    body: JSON.stringify({ status: "COMPLETED" }),
  });
  const completeData = await completeRes.json();
  if (!completeRes.ok || completeData.data.status !== "COMPLETED" || !completeData.data.completedAt) {
    throw new Error(`Completion timestamping failed: ${JSON.stringify(completeData)}`);
  }
  console.log(`✓ Task marked as COMPLETED with timestamp: ${completeData.data.completedAt}`);

  // 5. Test Unified Corporate Calendar Aggregation
  console.log("\n5. Testing Unified Corporate Calendar Aggregation (/api/calendar)...");
  const calRes = await fetch(
    `${BASE_URL}/api/calendar?startDate=2026-09-01T00:00:00Z&endDate=2026-09-30T23:59:59Z`,
    { headers: empHeaders }
  );
  const calData = await calRes.json();
  if (!calRes.ok || !calData.success) {
    throw new Error(`Calendar aggregation failed: ${JSON.stringify(calData)}`);
  }

  const calItems = calData.data.events;
  const meetings = calItems.filter((e) => e.sourceEntity === "CalendarEvent");
  const tasksDue = calItems.filter((e) => e.sourceEntity === "Task");
  const holidays = calItems.filter((e) => e.sourceEntity === "Holiday");
  const leaves = calItems.filter((e) => e.sourceEntity === "LeaveRequest");

  console.log(`✓ Retrieved ${calItems.length} aggregated calendar items for September 2026:`);
  console.log(`  - Meetings & Corporate Events: ${meetings.length}`);
  console.log(`  - Task Deliverables & Due Dates: ${tasksDue.length}`);
  console.log(`  - Public & Corporate Holidays: ${holidays.length}`);
  console.log(`  - Approved Staff Leaves: ${leaves.length}`);

  // Schedule a new meeting
  const newMeetingRes = await fetch(`${BASE_URL}/api/calendar`, {
    method: "POST",
    headers: mgrHeaders,
    body: JSON.stringify({
      title: "Quarterly Audit Debrief & Review",
      description: "Post-audit review meeting with lead auditor.",
      type: "MEETING",
      startDate: "2026-09-29T14:00:00Z",
      endDate: "2026-09-29T15:00:00Z",
      location: "Virtual Room B",
      meetUrl: "https://meet.nfvs.internal/audit-debrief",
      attendees: [employee.user.employee.id],
    }),
  });
  const newMeetingData = await newMeetingRes.json();
  if (!newMeetingRes.ok || !newMeetingData.success) {
    throw new Error(`Meeting schedule failed: ${JSON.stringify(newMeetingData)}`);
  }
  console.log(`✓ Successfully scheduled new meeting: "${newMeetingData.data.title}" (Invite dispatched to Alex Mercer).`);

  // 6. Test In-App Notifications & Event Bus Dispatch
  console.log("\n6. Testing In-App Notifications & Event Bus Delivery (/api/notifications)...");
  // Check unread count for Alex Mercer
  const unreadCountRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, { headers: empHeaders });
  const unreadCountData = await unreadCountRes.json();
  console.log(`✓ Staff Employee has ${unreadCountData.data.unreadCount} unread notification(s).`);

  // Fetch notifications
  const notifsRes = await fetch(`${BASE_URL}/api/notifications`, { headers: empHeaders });
  const notifsData = await notifsRes.json();
  if (!notifsRes.ok || !notifsData.success || notifsData.data.notifications.length === 0) {
    throw new Error(`Failed to retrieve employee notifications: ${JSON.stringify(notifsData)}`);
  }
  const latestNotif = notifsData.data.notifications[0];
  console.log(`✓ Latest Notification received: "${latestNotif.title}" (Type: ${latestNotif.type}, Priority: ${latestNotif.priority})`);

  // Mark single as read
  const markReadRes = await fetch(`${BASE_URL}/api/notifications/${latestNotif.id}`, {
    method: "PATCH",
    headers: empHeaders,
  });
  const markReadData = await markReadRes.json();
  if (!markReadRes.ok || !markReadData.data.isRead) {
    throw new Error("Failed to mark single notification as read");
  }
  console.log(`✓ Marked notification "${latestNotif.id}" as read (readAt: ${markReadData.data.readAt}).`);

  // Bulk mark all read
  const markAllRes = await fetch(`${BASE_URL}/api/notifications`, {
    method: "PATCH",
    headers: empHeaders,
  });
  const markAllData = await markAllRes.json();
  console.log(`✓ Successfully marked all notifications as read.`);

  const finalUnreadRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, { headers: empHeaders });
  const finalUnreadData = await finalUnreadRes.json();
  if (finalUnreadData.data.unreadCount !== 0) {
    throw new Error(`Expected 0 unread notifications, got ${finalUnreadData.data.unreadCount}`);
  }
  console.log(`✓ Verified unread notification count is now 0.`);

  console.log("\n==================================================");
  console.log("🎉 ALL BLOCK 4 (TASKS, CALENDAR & NOTIFICATIONS) TESTS PASSED!");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});
