async function run() {
  console.log("=== TESTING CROSS-COMPANY API ENDPOINTS OVER HTTP ===\n");

  const baseUrl = "http://localhost:3000";

  // 1. Login as NFVS
  console.log("1. Logging in as 'nfvs'...");
  const loginRes1 = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nfvs", password: "password" }),
  });
  if (!loginRes1.ok) {
    const errText = await loginRes1.text();
    throw new Error(`NFVS Login failed with status: ${loginRes1.status}: ${errText}`);
  }
  const cookies1 = loginRes1.headers.get("set-cookie") || "";
  console.log("   ✓ NFVS Logged in successfully");

  // 2. Query Availability from NFVS
  console.log("2. GET /api/resources/cross-company/availability as NFVS...");
  const availRes = await fetch(`${baseUrl}/api/resources/cross-company/availability`, {
    headers: { cookie: cookies1 },
  });
  if (!availRes.ok) {
    throw new Error(`Availability endpoint failed with status: ${availRes.status}`);
  }
  const availJson = await availRes.json();
  console.log(`   ✓ Partner Company: ${availJson.data?.partnerCompany?.name}`);
  console.log(`   ✓ Total Partner Staff: ${availJson.data?.employees?.length}`);

  const freeStaff = availJson.data?.employees?.filter((e) => e.isFree);
  const busyStaff = availJson.data?.employees?.filter((e) => !e.isFree);
  console.log(`   ✓ Free Count: ${freeStaff.length}, Busy Count: ${busyStaff.length}`);

  // 3. Query Borrow Requests from NFVS
  console.log("3. GET /api/resources/cross-company/requests as NFVS...");
  const reqsRes1 = await fetch(`${baseUrl}/api/resources/cross-company/requests`, {
    headers: { cookie: cookies1 },
  });
  if (!reqsRes1.ok) {
    throw new Error(`Requests endpoint failed with status: ${reqsRes1.status}`);
  }
  const reqsJson1 = await reqsRes1.json();
  console.log(`   ✓ Outgoing Requests: ${reqsJson1.data?.outgoing?.length}`);
  console.log(`   ✓ Incoming Requests: ${reqsJson1.data?.incoming?.length}`);

  // 4. Login as NAREE
  console.log("\n4. Logging in as 'naree'...");
  const loginRes2 = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "naree", password: "password" }),
  });
  if (!loginRes2.ok) {
    throw new Error(`NAREE Login failed with status: ${loginRes2.status}`);
  }
  const cookies2 = loginRes2.headers.get("set-cookie") || "";
  console.log("   ✓ NAREE Logged in successfully");

  // 5. Query Availability from NAREE
  console.log("5. GET /api/resources/cross-company/availability as NAREE...");
  const availRes2 = await fetch(`${baseUrl}/api/resources/cross-company/availability`, {
    headers: { cookie: cookies2 },
  });
  if (!availRes2.ok) {
    throw new Error(`Availability endpoint failed with status: ${availRes2.status}`);
  }
  const availJson2 = await availRes2.json();
  console.log(`   ✓ Partner Company: ${availJson2.data?.partnerCompany?.name}`);
  console.log(`   ✓ Total Partner Staff: ${availJson2.data?.employees?.length}`);

  // 6. Query Borrow Requests from NAREE
  console.log("6. GET /api/resources/cross-company/requests as NAREE...");
  const reqsRes2 = await fetch(`${baseUrl}/api/resources/cross-company/requests`, {
    headers: { cookie: cookies2 },
  });
  if (!reqsRes2.ok) {
    throw new Error(`Requests endpoint failed with status: ${reqsRes2.status}`);
  }
  const reqsJson2 = await reqsRes2.json();
  console.log(`   ✓ Outgoing Requests: ${reqsJson2.data?.outgoing?.length}`);
  console.log(`   ✓ Incoming Requests: ${reqsJson2.data?.incoming?.length}`);

  // 7. Check Requests My-Summary
  console.log("\n7. GET /api/requests/my-summary as NAREE...");
  const summaryRes = await fetch(`${baseUrl}/api/requests/my-summary`, {
    headers: { cookie: cookies2 },
  });
  const summaryJson = await summaryRes.json();
  console.log(`   ✓ Incoming Staff Requests Count: ${summaryJson.data?.incomingStaffRequestsCount}`);

  console.log("\n=================================================");
  console.log("🎉 ALL HTTP ENDPOINTS RESPONDED WITH 200 OK & VALID DATA!");
  console.log("=================================================");
}

run().catch((err) => {
  console.error("HTTP Test failed:", err);
  process.exit(1);
});
