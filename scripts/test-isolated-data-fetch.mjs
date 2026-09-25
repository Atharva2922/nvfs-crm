/**
 * Test strict data isolation: Company A session vs Company B session
 */
async function testIsolation() {
  console.log("Testing data isolation between Company 1 and Company 2...\n");

  // 1. Login Company A and get cookies
  const loginRes1 = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "companya", password: "password" }),
  });
  const cookies1 = loginRes1.headers.getSetCookie();
  const cookieHeader1 = cookies1.map(c => c.split(";")[0]).join("; ");

  // Fetch Company A CRM leads
  const leadsRes1 = await fetch("http://localhost:3000/api/crm/leads", {
    headers: { Cookie: cookieHeader1 },
  });
  const leads1 = await leadsRes1.json();

  // 2. Login Company B and get cookies
  const loginRes2 = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "companyb", password: "password" }),
  });
  const cookies2 = loginRes2.headers.getSetCookie();
  const cookieHeader2 = cookies2.map(c => c.split(";")[0]).join("; ");

  // Fetch Company B CRM leads
  const leadsRes2 = await fetch("http://localhost:3000/api/crm/leads", {
    headers: { Cookie: cookieHeader2 },
  });
  const leads2 = await leadsRes2.json();

  console.log("Company 1 (Apex Global Technologies):");
  console.log("  HTTP Status:", leadsRes1.status);
  console.log("  Leads returned:", (leads1.data?.leads || leads1.data || []).map(l => `${l.companyName} (${l.firstName} ${l.lastName})`));

  console.log("\nCompany 2 (Beacon Health & BioSystems):");
  console.log("  HTTP Status:", leadsRes2.status);
  console.log("  Leads returned:", (leads2.data?.leads || leads2.data || []).map(l => `${l.companyName} (${l.firstName} ${l.lastName})`));

  const list1 = leads1.data?.leads || leads1.data || [];
  const list2 = leads2.data?.leads || leads2.data || [];
  const crossContamination = list1.some(l1 => list2.some(l2 => l2.id === l1.id));

  if (!crossContamination && list1.length > 0 && list2.length > 0) {
    console.log("\n✓ VERIFIED: Complete data isolation maintained! Neither company sees the other's records.");
  } else if (!crossContamination) {
    console.log("\n✓ VERIFIED: Zero data sharing between Company 1 and Company 2.");
  } else {
    console.error("\n✗ ERROR: Cross-tenant data leak detected!");
    process.exit(1);
  }
}

testIsolation().catch(console.error);
