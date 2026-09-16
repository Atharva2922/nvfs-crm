// scripts/verify-crm.mjs
const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("==================================================");
  console.log("BLOCK 5: CRM / CLIENT MANAGEMENT VERIFICATION TEST");
  console.log("==================================================");

  // 1. Authenticate as Super Admin
  console.log("\n[1] Authenticating as Super Admin...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "superadmin@nfvs.internal",
      password: "Enterprise@2026"
    })
  });

  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const cookies = loginRes.headers.get("set-cookie");
  console.log("✓ Super Admin authenticated successfully.");

  const headers = {
    "Content-Type": "application/json",
    ...(cookies ? { Cookie: cookies } : {})
  };

  // 2. Fetch existing clients
  console.log("\n[2] Fetching initial clients directory...");
  const clientsRes = await fetch(`${BASE_URL}/api/crm/clients`, { headers });
  if (!clientsRes.ok) throw new Error(`Fetch clients failed: ${clientsRes.status}`);
  const clientsJson = await clientsRes.json();
  const clients = clientsJson.data?.clients || [];
  console.log(`✓ Fetched ${clients.length} existing clients.`);

  const testCompanyName = `Apex Global Enterprises ${Date.now()}`;
  console.log(`\n[3] Creating new Enterprise Client '${testCompanyName}'...`);
  const createClientRes = await fetch(`${BASE_URL}/api/crm/clients`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: testCompanyName,
      tier: "ENTERPRISE",
      industry: "Financial Services",
      taxId: "TAX-APEX-999",
      email: "procurement@apexglobal.example.com",
      phone: "+1 (555) 777-8899",
      website: "https://apexglobal.example.com",
      annualRevenue: 15000000,
      notes: "Multinational fintech conglomerate evaluating our CRM + NFVS suite."
    })
  });
  if (!createClientRes.ok) throw new Error(`Create client failed: ${createClientRes.status} ${await createClientRes.text()}`);
  const clientPayload = await createClientRes.json();
  const apexClient = clientPayload.data;
  console.log(`✓ Created Client: ${apexClient.name} (ID: ${apexClient.id}, Code: ${apexClient.code})`);

  // 4. Add Contact to Apex Client
  console.log("\n[4] Adding Primary Contact to 'Apex Global Enterprises'...");
  const addContactRes = await fetch(`${BASE_URL}/api/crm/clients/${apexClient.id}/contacts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      firstName: "Michael",
      lastName: "Vance",
      email: "michael.vance@apexglobal.example.com",
      phone: "+1 (555) 777-1010",
      designation: "VP of Enterprise Infrastructure",
      department: "Information Technology",
      isPrimary: true
    })
  });
  if (!addContactRes.ok) throw new Error(`Add contact failed: ${addContactRes.status} ${await addContactRes.text()}`);
  const contactJson = await addContactRes.json();
  const contact = contactJson.data;
  console.log(`✓ Added Contact: ${contact.firstName} ${contact.lastName} (${contact.designation})`);

  // 5. Log Multichannel Interaction in Customer 360 Timeline
  console.log("\n[5] Logging Discovery Interaction to Customer 360 Timeline...");
  const logActivityRes = await fetch(`${BASE_URL}/api/crm/clients/${apexClient.id}/activities`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "CALL",
      subject: "Strategic Architecture Discovery Call",
      description: "Confirmed security requirements, multi-tenant compliance, and 500-seat initial pilot scope."
    })
  });
  if (!logActivityRes.ok) throw new Error(`Log activity failed: ${logActivityRes.status}`);
  const activityJson = await logActivityRes.json();
  const activity = activityJson.data;
  console.log(`✓ Logged Activity: [${activity.type}] ${activity.subject}`);

  // 6. Fetch Full Customer 360 Profile
  console.log("\n[6] Querying Customer 360 Aggregation for Apex Global...");
  const c360Res = await fetch(`${BASE_URL}/api/crm/clients/${apexClient.id}`, { headers });
  if (!c360Res.ok) throw new Error(`Fetch Customer 360 failed: ${c360Res.status}`);
  const c360Json = await c360Res.json();
  const c360 = c360Json.data;
  const clientObj = c360.client || c360;
  console.log(`✓ Customer 360 verified:`);
  console.log(`   - Client Name: ${clientObj.name}`);
  console.log(`   - Contacts Count: ${clientObj.contacts?.length || 0}`);
  console.log(`   - Timeline Activities Count: ${clientObj.activities?.length || 0}`);
  console.log(`   - Stats: Pipeline $${c360.stats?.totalPipelineValue || 0}, Won Revenue $${c360.stats?.totalWonRevenue || 0}`);

  // 7. Test Lead Lifecycle & Duplicate-Resistant Conversion
  console.log("\n[7] Testing Lead Lifecycle & Duplicate Prevention...");
  const leadRes = await fetch(`${BASE_URL}/api/crm/leads`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      firstName: "Elena",
      lastName: "Rostova",
      companyName: testCompanyName, // Exact match with existing client!
      email: "elena.rostova@apexglobal.example.com",
      phone: "+1 (555) 777-2020",
      jobTitle: "Director of Digital Transformation",
      source: "REFERRAL",
      estimatedValue: 120000
    })
  });
  if (!leadRes.ok) throw new Error(`Create lead failed: ${leadRes.status} ${await leadRes.text()}`);
  const leadJson = await leadRes.json();
  const lead = leadJson.data;
  console.log(`✓ Lead Created: ${lead.firstName} ${lead.lastName} at '${lead.companyName}' (Status: ${lead.status})`);

  // Qualify lead
  console.log("   - Qualifying lead...");
  const qualRes = await fetch(`${BASE_URL}/api/crm/leads/${lead.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "QUALIFIED" })
  });
  if (!qualRes.ok) throw new Error(`Qualify lead failed: ${qualRes.status}`);
  console.log("   ✓ Lead marked as QUALIFIED.");

  // Convert lead (should reuse existing Apex Global Enterprises client!)
  console.log("   - Converting lead into Opportunity + Contact without creating duplicate client...");
  const convertRes = await fetch(`${BASE_URL}/api/crm/leads/${lead.id}/convert`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      opportunityName: "Apex Global - Digital Transformation Rollout",
      opportunityValue: 120000
    })
  });
  if (!convertRes.ok) throw new Error(`Convert lead failed: ${convertRes.status} ${await convertRes.text()}`);
  const conversionJson = await convertRes.json();
  const conversionResult = conversionJson.data;
  console.log(`   ✓ Conversion Complete:`);
  console.log(`     - Reused Client ID: ${conversionResult.client.id} (Matches Apex Client ID: ${conversionResult.client.id === apexClient.id})`);
  console.log(`     - New Contact Created: ${conversionResult.contact?.id}`);
  console.log(`     - New Opportunity Created: ${conversionResult.opportunity?.name} ($${conversionResult.opportunity?.value})`);

  if (conversionResult.client.id !== apexClient.id) {
    throw new Error("Duplicate prevention failed: A new client was created instead of reusing existing!");
  }
  console.log("✓ Duplicate prevention verified! Reused existing corporate account cleanly.");

  // 8. Test Opportunity Pipeline & Real-Time Metrics
  console.log("\n[8] Testing Opportunity Stage Progression & Metrics...");
  const oppId = conversionResult.opportunity.id;
  
  // Advance to PROPOSAL (probability should automatically adjust)
  const advanceRes = await fetch(`${BASE_URL}/api/crm/opportunities/${oppId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ stage: "PROPOSAL" })
  });
  if (!advanceRes.ok) throw new Error(`Advance stage failed: ${advanceRes.status}`);
  const advJson = await advanceRes.json();
  const advOpp = advJson.data;
  console.log(`✓ Opportunity advanced to PROPOSAL. Auto-calculated probability: ${advOpp.probability}%`);

  // Advance to CLOSED_WON
  const wonRes = await fetch(`${BASE_URL}/api/crm/opportunities/${oppId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ stage: "CLOSED_WON" })
  });
  if (!wonRes.ok) throw new Error(`Won stage failed: ${wonRes.status}`);
  const wonJson = await wonRes.json();
  const wonOpp = wonJson.data;
  console.log(`✓ Opportunity closed as CLOSED_WON. Probability: ${wonOpp.probability}%`);

  // Fetch metrics
  const metricsRes = await fetch(`${BASE_URL}/api/crm/opportunities/metrics`, { headers });
  if (!metricsRes.ok) throw new Error(`Fetch metrics failed: ${metricsRes.status}`);
  const metricsJson = await metricsRes.json();
  const metrics = metricsJson.data;
  console.log(`✓ Revenue Metrics:`);
  console.log(`   - Pipeline Value: $${metrics.pipelineValue.toLocaleString()}`);
  console.log(`   - Weighted Forecast: $${metrics.weightedForecast.toLocaleString()}`);
  console.log(`   - Closed Won Revenue: $${metrics.wonValue.toLocaleString()}`);
  console.log(`   - Win Rate: ${metrics.winRate}%`);

  // 9. Test Sales Scoping with Standard Employee (Alex Mercer)
  console.log("\n[9] Testing Sales Hierarchy & Ownership Scoping...");
  const empLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "alex.mercer@nfvs.internal",
      password: "Enterprise@2026"
    })
  });
  if (!empLoginRes.ok) throw new Error(`Employee login failed: ${empLoginRes.status}`);
  const empCookies = empLoginRes.headers.get("set-cookie");
  const empHeaders = {
    "Content-Type": "application/json",
    ...(empCookies ? { Cookie: empCookies } : {})
  };
  console.log("✓ Alex Mercer (Sales Representative / Employee) authenticated.");

  // Employee queries my leads
  const empLeadsRes = await fetch(`${BASE_URL}/api/crm/leads?scope=my`, { headers: empHeaders });
  if (!empLeadsRes.ok) throw new Error(`Employee fetch leads failed: ${empLeadsRes.status}`);
  const empLeadsJson = await empLeadsRes.json();
  console.log(`✓ Alex Mercer 'my leads' scoped query returned: ${empLeadsJson.data.leads.length} leads.`);

  // Employee creates a lead owned by himself
  const empNewLeadRes = await fetch(`${BASE_URL}/api/crm/leads`, {
    method: "POST",
    headers: empHeaders,
    body: JSON.stringify({
      firstName: "David",
      lastName: "Kim",
      companyName: "Hyperion Defense",
      email: "david.kim@hyperion.example.com",
      jobTitle: "CTO",
      source: "COLD_OUTREACH",
      estimatedValue: 85000
    })
  });
  if (!empNewLeadRes.ok) throw new Error(`Employee create lead failed: ${empNewLeadRes.status}`);
  const empLeadData = (await empNewLeadRes.json()).data;
  console.log(`✓ Alex Mercer successfully captured personal deal lead: ${empLeadData.firstName} ${empLeadData.lastName}`);

  // Re-check employee scoped leads count
  const empLeadsCheckRes = await fetch(`${BASE_URL}/api/crm/leads?scope=my`, { headers: empHeaders });
  const empLeadsCheck = await empLeadsCheckRes.json();
  const foundLead = empLeadsCheck.data.leads.find(l => l.id === empLeadData.id);
  if (!foundLead) throw new Error("Scoped query failed to return employee-owned lead!");
  console.log("✓ Scoped query correctly returned personal lead under employee ownership.");

  console.log("\n==================================================");
  console.log("ALL BLOCK 5 CRM TESTS PASSED PERFECTLY!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
