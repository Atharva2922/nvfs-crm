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

async function runLegalApiTests() {
  console.log("================================================================================");
  console.log("BLOCK 10: LEGAL MANAGEMENT — REST API INTEGRATION TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const cookie = await login("superadmin@nfvs.internal", "Enterprise@2026");
    console.log("✓ Authenticated as Super Admin with session cookie\n");

    const headers = {
      "Content-Type": "application/json",
      Cookie: cookie,
    };

    // 1. GET /api/legal/dashboard
    console.log("1. Testing Legal Executive Dashboard...");
    const dashRes = await fetch(`${BASE_URL}/api/legal/dashboard`, { headers });
    const dashJson = await dashRes.json();
    assert(dashRes.status === 200 && dashJson.success, "GET /api/legal/dashboard returns 200 OK");
    assert(dashJson.data.kpis?.activeContractsCount >= 0, "Dashboard returns active contract KPIs");
    assert(dashJson.data.kpis?.complianceHealthScore >= 0, "Dashboard returns compliance health score");

    // 2. GET /api/legal/contracts
    console.log("\n2. Testing Contracts API...");
    const contractsRes = await fetch(`${BASE_URL}/api/legal/contracts`, { headers });
    const contractsJson = await contractsRes.json();
    assert(contractsRes.status === 200 && contractsJson.success, "GET /api/legal/contracts returns 200 OK");
    const existingContract = contractsJson.data.contracts[0];
    assert(!!existingContract, "Existing contracts returned in list");

    // 3. POST /api/legal/contracts (Create)
    const createContractRes = await fetch(`${BASE_URL}/api/legal/contracts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "REST API Integration Test Agreement",
        contractType: "NDA",
        value: 15000,
        currency: "USD",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
        autoRenew: true,
        renewalTermMonths: 6,
        renewalNoticeDays: 30,
        notes: "Automated API Test Agreement",
      }),
    });
    const createContractJson = await createContractRes.json();
    assert(createContractRes.status === 201 && createContractJson.success, "POST /api/legal/contracts creates contract (201 Created)");
    const createdContractId = createContractJson.data.id;

    // 4. GET /api/legal/contracts/:id (360 Workspace)
    const getContractRes = await fetch(`${BASE_URL}/api/legal/contracts/${createdContractId}`, { headers });
    const getContractJson = await getContractRes.json();
    assert(getContractRes.status === 200 && getContractJson.success, "GET /api/legal/contracts/:id returns 360 workspace");

    // 5. POST /api/legal/contracts/:id/transition (State machine)
    const transitionRes = await fetch(`${BASE_URL}/api/legal/contracts/${createdContractId}/transition`, {
      method: "POST",
      headers,
      body: JSON.stringify({ targetState: "UNDER_REVIEW", notes: "Submitted by API test" }),
    });
    const transitionJson = await transitionRes.json();
    assert(transitionRes.status === 200 && transitionJson.success, "POST /api/legal/contracts/:id/transition updates state");

    // 6. GET /api/legal/renewals
    console.log("\n3. Testing Renewals Horizons API...");
    const renewalsRes = await fetch(`${BASE_URL}/api/legal/renewals`, { headers });
    const renewalsJson = await renewalsRes.json();
    assert(renewalsRes.status === 200 && renewalsJson.success, "GET /api/legal/renewals returns 200 OK");
    assert(Array.isArray(renewalsJson.data.horizon30), "Horizon 30 list returned");

    // 7. GET /api/legal/cases
    console.log("\n4. Testing Litigation Cases API...");
    const casesRes = await fetch(`${BASE_URL}/api/legal/cases`, { headers });
    const casesJson = await casesRes.json();
    assert(casesRes.status === 200 && casesJson.success, "GET /api/legal/cases returns 200 OK");

    // 8. POST /api/legal/cases (Create)
    const createCaseRes = await fetch(`${BASE_URL}/api/legal/cases`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "REST API Automated Trade Secret Case",
        caseType: "LITIGATION",
        opposingParty: "Apex Disputant Inc",
        claimAmount: 120000,
        exposureAmount: 45000,
        priority: "HIGH",
        courtName: "Delaware Superior Court",
      }),
    });
    const createCaseJson = await createCaseRes.json();
    assert(createCaseRes.status === 201 && createCaseJson.success, "POST /api/legal/cases creates case (201 Created)");
    const createdCaseId = createCaseJson.data.id;

    // 9. POST /api/legal/cases/:id/events (Log proceeding)
    const createEventRes = await fetch(`${BASE_URL}/api/legal/cases/${createdCaseId}/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Initial Case Management Conference",
        eventType: "HEARING",
        eventDate: new Date(Date.now() + 10 * 86400000).toISOString(),
        location: "Virtual Hearing",
      }),
    });
    const createEventJson = await createEventRes.json();
    assert(createEventRes.status === 201 && createEventJson.success, "POST /api/legal/cases/:id/events logs hearing (201 Created)");

    // 10. GET /api/legal/compliance
    console.log("\n5. Testing Statutory Compliance API...");
    const compRes = await fetch(`${BASE_URL}/api/legal/compliance`, { headers });
    const compJson = await compRes.json();
    assert(compRes.status === 200 && compJson.success, "GET /api/legal/compliance returns 200 OK");

    // 11. POST /api/legal/compliance (Create)
    const createCompRes = await fetch(`${BASE_URL}/api/legal/compliance`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "ISO/IEC 27001 Annual Surveillance Audit",
        regulation: "ISO27001",
        frequency: "YEARLY",
        nextDueDate: new Date(Date.now() + 90 * 86400000).toISOString(),
        riskLevel: "HIGH",
      }),
    });
    const createCompJson = await createCompRes.json();
    assert(createCompRes.status === 201 && createCompJson.success, "POST /api/legal/compliance creates obligation (201 Created)");
    const createdCompId = createCompJson.data.id;

    // 12. POST /api/legal/compliance/:id/evidence (Submit Evidence)
    const createEvidenceRes = await fetch(`${BASE_URL}/api/legal/compliance/${createdCompId}/evidence`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Stage 1 Audit Readiness Certificate",
        evidenceType: "CERTIFICATE",
        fileUrl: "/vault/compliance/iso_stage1.pdf",
      }),
    });
    const createEvidenceJson = await createEvidenceRes.json();
    assert(createEvidenceRes.status === 201 && createEvidenceJson.success, "POST /api/legal/compliance/:id/evidence submits proof (201 Created)");

    // 13. GET /api/legal/deadlines
    console.log("\n6. Testing Deadlines API...");
    const dlRes = await fetch(`${BASE_URL}/api/legal/deadlines`, { headers });
    const dlJson = await dlRes.json();
    assert(dlRes.status === 200 && dlJson.success, "GET /api/legal/deadlines returns 200 OK");

    // 14. GET /api/legal/contacts
    console.log("\n7. Testing External Legal Contacts API...");
    const contactsRes = await fetch(`${BASE_URL}/api/legal/contacts`, { headers });
    const contactsJson = await contactsRes.json();
    assert(contactsRes.status === 200 && contactsJson.success, "GET /api/legal/contacts returns 200 OK");

    // 15. GET /api/legal/documents
    console.log("\n8. Testing Document Vault API...");
    const docsRes = await fetch(`${BASE_URL}/api/legal/documents`, { headers });
    const docsJson = await docsRes.json();
    assert(docsRes.status === 200 && docsJson.success, "GET /api/legal/documents returns 200 OK");

    // 16. GET /api/legal/risks
    console.log("\n9. Testing Legal Risk Register API...");
    const risksRes = await fetch(`${BASE_URL}/api/legal/risks`, { headers });
    const risksJson = await risksRes.json();
    assert(risksRes.status === 200 && risksJson.success, "GET /api/legal/risks returns 200 OK");
    assert(!!risksJson.data.matrix, "Risk API returns 5x5 matrix aggregation");

    // 17. GET /api/legal/calendar
    console.log("\n10. Testing Unified Legal Calendar API...");
    const calRes = await fetch(`${BASE_URL}/api/legal/calendar`, { headers });
    const calJson = await calRes.json();
    assert(calRes.status === 200 && calJson.success, "GET /api/legal/calendar returns 200 OK");
    assert(Array.isArray(calJson.data), "Legal calendar stream returns unified event items array");

    // 18. GET /api/legal/reports
    console.log("\n11. Testing Executive Reports & Export API...");
    const repRes = await fetch(`${BASE_URL}/api/legal/reports?category=ALL`, { headers });
    const repJson = await repRes.json();
    assert(repRes.status === 200 && repJson.success, "GET /api/legal/reports returns 200 OK");
    assert(Array.isArray(repJson.data.contracts), "Reports return contracts dataset for export");

    console.log("\n================================================================================");
    console.log(`API TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================");
  } catch (err) {
    console.error("API test error:", err);
    failed++;
  } finally {
    process.exit(failed > 0 ? 1 : 0);
  }
}

runLegalApiTests();
