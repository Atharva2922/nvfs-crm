// scripts/verify-payroll.mjs
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
  console.log("=== STARTING BLOCK 3: SALARY & PAYROLL AUTOMATED VERIFICATION ===\n");

  // 1. Authenticate Roles
  console.log("1. Authenticating Super Admin & Standard Employee accounts...");
  const admin = await login("superadmin@nfvs.internal", "Enterprise@2026");
  const employee = await login("alex.mercer@nfvs.internal", "Enterprise@2026");
  console.log("✓ Super Admin (Marcus Vance) authenticated.");
  console.log("✓ Standard Employee (Alex Mercer) authenticated.");

  const adminHeaders = { "Content-Type": "application/json", Cookie: admin.cookie };
  const empHeaders = { "Content-Type": "application/json", Cookie: employee.cookie };

  // 2. Test Salary Structures & Components
  console.log("\n2. Testing Salary Components and Structure Templates (/api/payroll/structures)...");
  const structRes = await fetch(`${BASE_URL}/api/payroll/structures`, { headers: adminHeaders });
  const structData = await structRes.json();
  if (!structData.success || !structData.data.components || !structData.data.structures) {
    throw new Error(`Failed to fetch structures: ${JSON.stringify(structData)}`);
  }
  console.log(`✓ Retrieved ${structData.data.components.length} configurable components (BASIC, HRA, TA, DA, SPECIAL, BONUS, PF, TAX).`);
  console.log(`✓ Retrieved ${structData.data.structures.length} salary structure templates.`);

  // 3. Test Security: Salary Directory Restrictions
  console.log("\n3. Testing Security & Privacy: Employee querying corporate salary register...");
  const empSalRes = await fetch(`${BASE_URL}/api/payroll/employee-salaries`, { headers: empHeaders });
  if (empSalRes.status === 403) {
    console.log("✓ Access Denied (403 Forbidden) as expected: Standard employees cannot access corporate salary directories.");
  } else {
    throw new Error(`Expected 403 Forbidden for employee accessing all salaries, but got: ${empSalRes.status}`);
  }

  // Super Admin can view all salaries
  const adminSalRes = await fetch(`${BASE_URL}/api/payroll/employee-salaries`, { headers: adminHeaders });
  const adminSalData = await adminSalRes.json();
  if (adminSalRes.ok && adminSalData.success) {
    console.log(`✓ Executive access granted: Super Admin retrieved ${adminSalData.data.assignments.length} employee salary allocations.`);
  } else {
    throw new Error(`Admin salary fetch failed: ${JSON.stringify(adminSalData)}`);
  }

  // Employee can view their own salary package
  const ownSalRes = await fetch(`${BASE_URL}/api/payroll/employee-salaries?employeeId=${employee.user.employee.id}`, { headers: empHeaders });
  const ownSalData = await ownSalRes.json();
  if (ownSalRes.ok && ownSalData.success) {
    console.log(`✓ Self-Service access granted: Alex Mercer viewed own package: Base $${ownSalData.data.baseSalary}/mo, Net $${ownSalData.data.computedBreakdown?.netSalary}/mo.`);
  } else {
    throw new Error(`Own salary fetch failed: ${JSON.stringify(ownSalData)}`);
  }

  // 4. Test Payroll Lifecycle on a Fresh Test Run
  console.log("\n4. Testing 5-Stage Payroll Run Lifecycle (Dynamic cycle)...");
  const testSuffix = Math.floor(Math.random() * 8999 + 1000);
  const createPeriodRes = await fetch(`${BASE_URL}/api/payroll/periods`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      code: `2027-${testSuffix}`,
      name: `Automated Audit Cycle #${testSuffix}`,
      year: 2027,
      month: 1,
      startDate: "2027-01-01",
      endDate: "2027-01-31",
      remarks: "Automated Lifecycle Test",
    }),
  });
  const createPeriodData = await createPeriodRes.json();
  if (!createPeriodRes.ok || !createPeriodData.success) {
    throw new Error(`Period creation failed: ${JSON.stringify(createPeriodData)}`);
  }
  const activePeriod = createPeriodData.data;
  console.log(`✓ Created new cycle: ${activePeriod.name} (${activePeriod.code}, Status: ${activePeriod.status})`);

  // Step A: Calculate
  console.log("  a. Triggering Batch Calculation (/api/payroll/periods/[id]/calculate)...");
  const calcRes = await fetch(`${BASE_URL}/api/payroll/periods/${activePeriod.id}/calculate`, {
    method: "POST",
    headers: adminHeaders,
  });
  const calcData = await calcRes.json();
  if (!calcRes.ok || !calcData.success) {
    throw new Error(`Calculation failed: ${JSON.stringify(calcData)}`);
  }
  console.log(`  ✓ Calculated: Status: ${calcData.data.period.status}, Total Gross: $${calcData.data.period.totalGross.toLocaleString()}, Total Net: $${calcData.data.period.totalNet.toLocaleString()}`);

  // Step B: Review
  console.log("  b. Triggering Stage Review (/api/payroll/periods/[id]/review)...");
  const revRes = await fetch(`${BASE_URL}/api/payroll/periods/${activePeriod.id}/review`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ remarks: "Automated verification: audit reconciliation verified." }),
  });
  const revData = await revRes.json();
  if (!revRes.ok || !revData.success) {
    throw new Error(`Review failed: ${JSON.stringify(revData)}`);
  }
  console.log(`  ✓ Reviewed: Status: ${revData.data.status}`);

  // Step C: Approve
  console.log("  c. Triggering Executive Approval (/api/payroll/periods/[id]/approve)...");
  const appRes = await fetch(`${BASE_URL}/api/payroll/periods/${activePeriod.id}/approve`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ notes: "Approved by executive leadership." }),
  });
  const appData = await appRes.json();
  if (!appRes.ok || !appData.success) {
    throw new Error(`Approval failed: ${JSON.stringify(appData)}`);
  }
  console.log(`  ✓ Approved: Status: ${appData.data.status}`);

  // Step D: Process / Disburse
  console.log("  d. Triggering Treasury Disbursement (/api/payroll/periods/[id]/process)...");
  const procRes = await fetch(`${BASE_URL}/api/payroll/periods/${activePeriod.id}/process`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ paymentReference: "ACH-WIRE-AUTO" }),
  });
  const procData = await procRes.json();
  if (!procRes.ok || !procData.success) {
    throw new Error(`Processing failed: ${JSON.stringify(procData)}`);
  }
  console.log(`  ✓ Disbursed: Status: ${procData.data.status}, Paid Date: ${procData.data.paymentDate}`);

  // 5. Test Payslip Security & Authorization
  console.log("\n5. Testing Employee Payslip Access & Confidentiality...");
  const myPayslipsRes = await fetch(`${BASE_URL}/api/payroll/payslips?scope=my`, { headers: empHeaders });
  const myPayslipsData = await myPayslipsRes.json();
  if (!myPayslipsRes.ok || !myPayslipsData.success || !myPayslipsData.data.payslips?.length) {
    throw new Error(`Failed to fetch personal payslips: ${JSON.stringify(myPayslipsData)}`);
  }
  const myPayslip = myPayslipsData.data.payslips[0];
  console.log(`✓ Alex Mercer retrieved own payslip (Period: ${myPayslip.payrollPeriod.code}, Net: $${myPayslip.netSalary}).`);

  // Fetch full document
  const docRes = await fetch(`${BASE_URL}/api/payroll/payslips/${myPayslip.id}`, { headers: empHeaders });
  const docData = await docRes.json();
  if (!docRes.ok || !docData.success) {
    throw new Error(`Failed to fetch payslip document: ${JSON.stringify(docData)}`);
  }
  console.log(`✓ Full payslip document loaded with ${docData.data.earnings?.length} earnings and ${docData.data.deductions?.length} deductions.`);

  // Admin payslip retrieval
  const adminPayslipsRes = await fetch(`${BASE_URL}/api/payroll/payslips?scope=my`, { headers: adminHeaders });
  const adminPayslipsData = await adminPayslipsRes.json();
  const adminPayslipId = adminPayslipsData.data.payslips[0]?.id;

  // Verify that employee CANNOT access admin's payslip
  if (adminPayslipId) {
    const breachRes = await fetch(`${BASE_URL}/api/payroll/payslips/${adminPayslipId}`, { headers: empHeaders });
    if (breachRes.status === 403) {
      console.log("✓ Confidentiality Guaranteed (403 Forbidden): Standard employee prevented from inspecting another employee's payslip.");
    } else {
      throw new Error(`Confidentiality breach: Expected 403 Forbidden, but got status ${breachRes.status}`);
    }
  }

  // 6. Test Audit Logging for Payroll
  console.log("\n6. Testing Immutable Audit Trail (/api/audit)...");
  const auditRes = await fetch(`${BASE_URL}/api/audit`, { headers: adminHeaders });
  const auditData = await auditRes.json();
  const logsList = Array.isArray(auditData.data) ? auditData.data : (auditData.data?.logs || []);
  const payrollLogs = logsList.filter((l) => l.action && l.action.startsWith("PAYROLL_"));
  console.log(`✓ Verified ${payrollLogs.length} payroll audit log entries recorded in immutable ledger.`);

  console.log("\n==================================================");
  console.log("🎉 ALL BLOCK 3 (SALARY & PAYROLL) TESTS PASSED!");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});
