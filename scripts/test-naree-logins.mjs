const BASE = "http://localhost:3000";

async function loginAndCheck(label, emailOrId, expectedCompanyName) {
  console.log(`\n--- Testing Login: ${label} ('${emailOrId}') ---`);
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailOrId, password: "password" }),
  });

  const json = await res.json();
  const setCookie = res.headers.get("set-cookie") || "";
  console.log(`Status: ${res.status} | Success: ${json.success}`);
  if (!json.success) {
    console.error("Login failed:", json);
    return false;
  }

  const user = json.data;
  const companyName = user.activeCompany?.name || user.employee?.companyName;
  const companyCode = user.activeCompany?.code;
  console.log(`Logged in as: ${user.email} (${user.roleCode})`);
  console.log(`Active Company: "${companyName}" [${companyCode}]`);

  const cookies = setCookie.split(",").map(c => c.split(";")[0].trim()).join("; ");

  // Fetch CEO dashboard to verify isolated telemetry
  const dashRes = await fetch(`${BASE}/api/dashboard/ceo`, {
    headers: { Cookie: cookies },
  });
  const dashJson = await dashRes.json();
  console.log(`Dashboard Status: ${dashRes.status}`);
  console.log(`Dashboard Org Name: "${dashJson.data?.organizationName}"`);

  if (dashJson.data?.organizationName !== expectedCompanyName) {
    console.error(`Mismatch! Expected "${expectedCompanyName}", got "${dashJson.data?.organizationName}"`);
    return false;
  }

  return true;
}

async function run() {
  console.log("=== VERIFYING NAREE COMPANIES & SIMPLE LOGINS ===");

  const ok1 = await loginAndCheck("Simple ID 1 (nfvs)", "nfvs", "Naree Foundation Venture Studio");
  const ok2 = await loginAndCheck("Simple ID 2 (naree)", "naree", "Naree Foundation");
  const ok3 = await loginAndCheck("Alias 1 (companya)", "companya", "Naree Foundation Venture Studio");
  const ok4 = await loginAndCheck("Alias 2 (companyb)", "companyb", "Naree Foundation");

  if (ok1 && ok2 && ok3 && ok4) {
    console.log("\n✓✓✓ ALL NAREE LOGINS & COMPANY DATA ISOLATION VERIFIED 100% OPERATIONAL! ✓✓✓");
  } else {
    console.error("\n✗ Validation failed on one or more tests.");
    process.exit(1);
  }
}

run().catch(console.error);
