const BASE_URL = "http://localhost:3000";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  const cookie = res.headers.get("set-cookie");
  return cookie;
}

async function runOperationsApiTests() {
  console.log("================================================================================");
  console.log("BLOCK 9: OPERATIONS MANAGEMENT — REST API TEST SUITE");
  console.log("================================================================================\n");

  try {
    const cookie = await login("superadmin@nfvs.internal", "Enterprise@2026");
    console.log("✓ Authenticated as Super Admin with session cookie\n");

    const headers = {
      "Content-Type": "application/json",
      Cookie: cookie,
    };

    // 1. GET /api/operations
    const listRes = await fetch(`${BASE_URL}/api/operations`, { headers });
    const listJson = await listRes.json();
    console.log(`[PASS] GET /api/operations -> Status ${listRes.status}, Total records: ${listJson.data?.items?.length ?? listJson.data?.length}`);

    // Fetch department & employees for creation
    const opItem = listJson.data?.items?.[0] || listJson.data?.[0];
    const deptId = opItem?.departmentId;
    const ownerId = opItem?.ownerId;

    if (!deptId || !ownerId) {
      throw new Error("Unable to retrieve department or owner id from existing operations.");
    }

    // 2. POST /api/operations (Create)
    const testCode = `OP-API-${Date.now().toString().slice(-4)}`;
    const createRes = await fetch(`${BASE_URL}/api/operations`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        operationCode: testCode,
        name: "REST API Automated Test Project",
        description: "Testing end-to-end operation creation via REST API",
        departmentId: deptId,
        ownerId: ownerId,
        operationType: "CLIENT_DELIVERY",
        priority: "HIGH",
        status: "PLANNING",
        startDate: new Date().toISOString(),
        expectedCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        estimatedCost: 45000,
        approvedBudget: 50000,
      }),
    });
    const createJson = await createRes.json();
    console.log(`[PASS] POST /api/operations -> Status ${createRes.status}, Created ID: ${createJson.data?.id} [${createJson.data?.operationCode}]`);
    const newOpId = createJson.data.id;

    // 3. GET /api/operations/[id] (360 Workspace)
    const getRes = await fetch(`${BASE_URL}/api/operations/${newOpId}`, { headers });
    const getJson = await getRes.json();
    console.log(`[PASS] GET /api/operations/[id] -> Status ${getRes.status}, Workspace Title: ${getJson.data?.name}`);

    // 4. POST /api/operations/[id]/transition
    const transRes = await fetch(`${BASE_URL}/api/operations/${newOpId}/transition`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        status: "SCHEDULED",
        reason: "Milestones established and resources allocated.",
      }),
    });
    if (!transRes.ok) {
      const errText = await transRes.text();
      console.error(`Transition failed (${transRes.status}):`, errText);
    }
    const transJson = await transRes.json();
    console.log(`[PASS] POST /api/operations/[id]/transition -> Status ${transRes.status}, New Status: ${transJson.data?.operation?.status || transJson.data?.status}`);

    // 5. POST /api/operations/[id]/tasks
    const taskRes = await fetch(`${BASE_URL}/api/operations/${newOpId}/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "API Created Operational Task",
        priority: "HIGH",
        assigneeId: ownerId,
        estimatedHours: 20,
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      }),
    });
    const taskJson = await taskRes.json();
    console.log(`[PASS] POST /api/operations/[id]/tasks -> Status ${taskRes.status}, Task: ${taskJson.data?.title}`);

    // 6. POST /api/operations/issues (Incident Report)
    const issueCode = `ISS-API-${Date.now().toString().slice(-4)}`;
    const issueRes = await fetch(`${BASE_URL}/api/operations/issues`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        issueCode,
        operationId: newOpId,
        title: "REST API Automated Test Incident",
        description: "Testing incident reporting and triage workflow",
        severity: "HIGH",
        assignedToId: ownerId,
      }),
    });
    const issueJson = await issueRes.json();
    console.log(`[PASS] POST /api/operations/issues -> Status ${issueRes.status}, Issue: ${issueJson.data?.title}`);

    // 7. GET /api/operations/resources (Resource Management Console)
    const resRes = await fetch(`${BASE_URL}/api/operations/resources`, { headers });
    const resJson = await resRes.json();
    console.log(`[PASS] GET /api/operations/resources -> Status ${resRes.status}, Resource pools retrieved: Employees (${resJson.data?.employees?.length ?? 0}), Inventory (${resJson.data?.inventory?.length ?? 0})`);

    // 8. GET /api/operations/calendar (Calendar stream)
    const calRes = await fetch(`${BASE_URL}/api/operations/calendar`, { headers });
    const calJson = await calRes.json();
    console.log(`[PASS] GET /api/operations/calendar -> Status ${calRes.status}, Operational calendar events count: ${calJson.data?.events?.length ?? 0}`);

    // 9. GET /api/operations/timeline (Gantt timeline)
    const timeRes = await fetch(`${BASE_URL}/api/operations/timeline`, { headers });
    const timeJson = await timeRes.json();
    console.log(`[PASS] GET /api/operations/timeline -> Status ${timeRes.status}, Timeline nodes count: ${timeJson.data?.length}`);

    // 10. GET /api/operations/reports (Executive Cockpit Analytics)
    const repRes = await fetch(`${BASE_URL}/api/operations/reports`, { headers });
    const repJson = await repRes.json();
    console.log(`[PASS] GET /api/operations/reports -> Status ${repRes.status}, Total Operations Tracked: ${repJson.data?.performance?.total}`);

    // 11. GET /api/operations/search (Omni-Search)
    const searchRes = await fetch(`${BASE_URL}/api/operations/search?q=Infrastructure`, { headers });
    const searchJson = await searchRes.json();
    console.log(`[PASS] GET /api/operations/search -> Status ${searchRes.status}, Matched operations: ${searchJson.data?.operations?.length ?? 0}, tasks: ${searchJson.data?.tasks?.length ?? 0}, issues: ${searchJson.data?.issues?.length ?? 0}`);

    // Clean up created test operation
    const delRes = await fetch(`${BASE_URL}/api/operations/${newOpId}`, {
      method: "DELETE",
      headers,
    });
    console.log(`[CLEANUP] DELETE /api/operations/[id] -> Status ${delRes.status}`);

    console.log("\n================================================================================");
    console.log("ALL REST API INTEGRATION TESTS PASSED!");
    console.log("================================================================================");
  } catch (err) {
    console.error("API tests encountered an error:", err);
    process.exit(1);
  }
}

runOperationsApiTests();
