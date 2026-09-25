/**
 * HTTP Integration Test for Simple Company 1 & 2 Logins
 */
async function test() {
  console.log("Testing HTTP Login for Company 1 & Company 2 on http://localhost:3000...\n");

  // 1. Test Company 1 (Apex)
  const res1 = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "companya", password: "password" }),
  });
  const json1 = await res1.json();
  const setCookie1 = res1.headers.get("set-cookie") || "";

  console.log("Company 1 (companya):");
  console.log("  Status:", res1.status);
  console.log("  Success:", json1.success);
  console.log("  User Email:", json1.data?.email);
  console.log("  Target Dashboard:", json1.data?.targetDashboard);
  console.log("  Active Company Cookie Set:", setCookie1.includes("nfvs_active_company"));

  // 2. Test Company 2 (Beacon)
  const res2 = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "companyb", password: "password" }),
  });
  const json2 = await res2.json();
  const setCookie2 = res2.headers.get("set-cookie") || "";

  console.log("\nCompany 2 (companyb):");
  console.log("  Status:", res2.status);
  console.log("  Success:", json2.success);
  console.log("  User Email:", json2.data?.email);
  console.log("  Target Dashboard:", json2.data?.targetDashboard);
  console.log("  Active Company Cookie Set:", setCookie2.includes("nfvs_active_company"));

  if (json1.success && json2.success) {
    console.log("\n✓ SUCCESS: Both simple Company 1 & Company 2 logins are fully operational!");
  } else {
    console.error("\n✗ FAILURE: One or both logins failed.");
    process.exit(1);
  }
}

test().catch(console.error);
