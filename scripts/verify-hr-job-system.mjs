async function run() {
  console.log("=== TESTING HR JOB ASSIGNMENT SYSTEM & AUTHENTICATION ===\n");
  const baseUrl = "http://localhost:3000";

  // ========================================================
  // 1. TEST NON-HR ACCESS RESTRICTION (CEO cannot assign HR jobs)
  // ========================================================
  console.log("1. Logging in as non-HR user ('nfvs' CEO)...");
  const ceoLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nfvs", password: "password" }),
  });
  if (!ceoLoginRes.ok) throw new Error("CEO login failed");
  const ceoCookies = ceoLoginRes.headers.get("set-cookie") || "";

  console.log("2. Attempting to invoke HR job assignment API with CEO session...");
  const forbiddenRes = await fetch(`${baseUrl}/api/hr/jobs/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: ceoCookies,
    },
    body: JSON.stringify({
      employeeId: "test-emp",
      title: "Unauthorized Job Assignment",
    }),
  });
  console.log(`   Response Status: ${forbiddenRes.status} (Expected: 403 Forbidden)`);
  if (forbiddenRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for non-HR user, got ${forbiddenRes.status}`);
  }
  const forbiddenJson = await forbiddenRes.json();
  console.log(`   ✓ Correctly blocked: "${forbiddenJson.error?.message}"\n`);

  // ========================================================
  // 2. TEST HR LOGIN WITH ID 'hr' AND PASSWORD 'password'
  // ========================================================
  console.log("3. Logging in with HR ID 'hr' and password 'password'...");
  const hrLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "hr", password: "password" }),
  });
  if (!hrLoginRes.ok) {
    const errText = await hrLoginRes.text();
    throw new Error(`HR login failed: ${hrLoginRes.status}: ${errText}`);
  }
  const hrLoginJson = await hrLoginRes.json();
  const hrCookies = hrLoginRes.headers.get("set-cookie") || "";

  console.log(`   ✓ Authenticated User: ${hrLoginJson.data?.email}`);
  console.log(`   ✓ Role: ${hrLoginJson.data?.roleCode} (${hrLoginJson.data?.roleName})`);
  console.log(`   ✓ Active Company: ${hrLoginJson.data?.activeCompany?.name}`);
  console.log(`   ✓ Target Dashboard: ${hrLoginJson.data?.targetDashboard}`);

  if (hrLoginJson.data?.roleCode !== "HR") {
    throw new Error(`Expected roleCode 'HR', got ${hrLoginJson.data?.roleCode}`);
  }
  if (hrLoginJson.data?.targetDashboard !== "/app/dashboard/hr") {
    throw new Error(`Expected targetDashboard '/app/dashboard/hr', got ${hrLoginJson.data?.targetDashboard}`);
  }
  console.log("   ✓ HR Authentication & Routing verified successfully!\n");

  // ========================================================
  // 3. TEST HR LIST JOBS API
  // ========================================================
  console.log("4. Fetching existing company jobs via GET /api/hr/jobs...");
  const listRes = await fetch(`${baseUrl}/api/hr/jobs`, {
    headers: { cookie: hrCookies },
  });
  if (!listRes.ok) throw new Error(`GET /api/hr/jobs failed with status: ${listRes.status}`);
  const listJson = await listRes.json();
  console.log(`   ✓ Fetched ${listJson.data?.length} existing jobs\n`);

  // ========================================================
  // 4. TEST HR ASSIGN JOB TO EMPLOYEE
  // ========================================================
  // Fetch an active employee in NFVS to assign job to
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const nfvsEmp = await prisma.employee.findFirst({
    where: {
      organization: { code: "NFVS" },
      employmentStatus: "ACTIVE",
      designation: { contains: "Software" },
    },
  });

  if (!nfvsEmp) throw new Error("No active software employee found in NFVS");
  console.log(`5. HR assigning new job to employee: ${nfvsEmp.firstName} ${nfvsEmp.lastName} (${nfvsEmp.designation})...`);

  const assignRes = await fetch(`${baseUrl}/api/hr/jobs/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: hrCookies,
    },
    body: JSON.stringify({
      employeeId: nfvsEmp.id,
      title: "Lead Q4 Full-Stack Architecture Performance Audit",
      description: "Perform end-to-end telemetry profiling, database indexing review, and cache optimization.",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      estimatedHours: 40,
    }),
  });

  if (!assignRes.ok) {
    const errText = await assignRes.text();
    throw new Error(`Assign job failed: ${assignRes.status}: ${errText}`);
  }
  const assignJson = await assignRes.json();
  const createdJob = assignJson.data;
  console.log(`   ✓ Job Created Successfully! ID: ${createdJob.id}`);
  console.log(`   ✓ Title: ${createdJob.title}`);
  console.log(`   ✓ Assignee: ${createdJob.assignee?.firstName} ${createdJob.assignee?.lastName}`);
  console.log(`   ✓ Status: ${createdJob.status}\n`);

  // ========================================================
  // 5. TEST JOB LIFECYCLE: UPDATE TO IN_PROGRESS AND COMPLETED
  // ========================================================
  console.log("6. Updating job status to IN_PROGRESS...");
  const progressRes = await fetch(`${baseUrl}/api/hr/jobs/${createdJob.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      cookie: hrCookies,
    },
    body: JSON.stringify({ status: "IN_PROGRESS" }),
  });
  if (!progressRes.ok) throw new Error("Failed to update status to IN_PROGRESS");
  console.log("   ✓ Status updated to IN_PROGRESS");

  console.log("7. Updating job status to COMPLETED...");
  const completeRes = await fetch(`${baseUrl}/api/hr/jobs/${createdJob.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      cookie: hrCookies,
    },
    body: JSON.stringify({ status: "COMPLETED" }),
  });
  if (!completeRes.ok) throw new Error("Failed to update status to COMPLETED");
  console.log("   ✓ Status updated to COMPLETED\n");

  // ========================================================
  // 6. TEST SECONDARY HR LOGIN: 'hr_naree' (Naree Foundation)
  // ========================================================
  console.log("8. Testing Secondary HR Login ('hr_naree' / 'password')...");
  const nareeHrRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "hr_naree", password: "password" }),
  });
  if (!nareeHrRes.ok) throw new Error("Naree HR login failed");
  const nareeHrJson = await nareeHrRes.json();
  console.log(`   ✓ Authenticated: ${nareeHrJson.data?.email} (${nareeHrJson.data?.roleCode})`);
  console.log(`   ✓ Company: ${nareeHrJson.data?.activeCompany?.name}`);
  console.log(`   ✓ Target Dashboard: ${nareeHrJson.data?.targetDashboard}\n`);

  await prisma.$disconnect();

  console.log("=================================================");
  console.log("🎉 ALL HR JOB ASSIGNMENT & AUTHENTICATION TESTS PASSED 100%!");
  console.log("=================================================");
}

run().catch((err) => {
  console.error("\n❌ HR System Test failed:", err);
  process.exit(1);
});
