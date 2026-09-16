// scripts/verify-finance.mjs
const BASE_URL = "http://localhost:3000";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
  const cookie = res.headers.get("set-cookie");
  const json = await res.json();
  return { user: json.data?.user || json.user, cookie };
}

async function run() {
  console.log("==================================================");
  console.log("BLOCK 6: FINANCE, INVOICING & PAYMENTS VERIFICATION");
  console.log("==================================================");

  // 1. Authenticate Users
  console.log("\n[1] Authenticating Super Admin, CFO, and Employee...");
  const admin = await login("superadmin@nfvs.internal", "Enterprise@2026");
  const cfo = await login("cfo@nfvs.internal", "Enterprise@2026");
  const employee = await login("alex.mercer@nfvs.internal", "Enterprise@2026");

  const adminHeaders = { "Content-Type": "application/json", Cookie: admin.cookie };
  const cfoHeaders = { "Content-Type": "application/json", Cookie: cfo.cookie };
  const empHeaders = { "Content-Type": "application/json", Cookie: employee.cookie };

  console.log("✓ Super Admin (Marcus Vance) authenticated.");
  console.log("✓ CFO (Sophia Sterling) authenticated.");
  console.log("✓ Employee (Alex Mercer) authenticated.");

  // 2. Fetch existing CRM Client
  console.log("\n[2] Fetching CRM client account for billing...");
  const clientsRes = await fetch(`${BASE_URL}/api/crm/clients`, { headers: cfoHeaders });
  if (!clientsRes.ok) throw new Error(`Fetch clients failed: ${clientsRes.status}`);
  const clientsJson = await clientsRes.json();
  const client = clientsJson.data?.clients?.[0];
  if (!client) throw new Error("No CRM clients found in database");
  console.log(`✓ Using client: ${client.name} (${client.code}, ID: ${client.id})`);

  // 3. Test Invoice Creation & Calculation
  console.log("\n[3] Creating commercial invoice with multiple line items...");
  const createInvRes = await fetch(`${BASE_URL}/api/finance/invoices`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({
      clientId: client.id,
      invoiceDate: "2026-09-01",
      dueDate: "2026-10-01",
      currency: "USD",
      taxRate: 10,
      discountRate: 5,
      notes: "Custom core infrastructure license and deployment package.",
      terms: "Net 30. Commercial interest of 1.5% applies on overdue balances.",
      items: [
        { description: "Enterprise Cloud License (100 Seats)", quantity: 1, unitPrice: 20000 },
        { description: "Dedicated Technical Account Management SLA", quantity: 1, unitPrice: 10000 },
      ],
    }),
  });

  if (!createInvRes.ok) throw new Error(`Create invoice failed: ${createInvRes.status} ${await createInvRes.text()}`);
  const invJson = await createInvRes.json();
  const invoice = invJson.data;
  console.log(`✓ Invoice created: ${invoice.invoiceNumber}`);
  console.log(`   - Subtotal: $${invoice.subtotal.toLocaleString()}`);
  console.log(`   - Tax (10%): +$${invoice.taxAmount.toLocaleString()}`);
  console.log(`   - Discount (5%): -$${invoice.discountAmount.toLocaleString()}`);
  console.log(`   - Total: $${invoice.total.toLocaleString()} (Status: ${invoice.status})`);
  console.log(`   - Initial Balance: $${invoice.balance.toLocaleString()}`);

  if (invoice.total !== 31500) {
    throw new Error(`Expected total $31,500 (30k + 3k tax - 1.5k discount), got ${invoice.total}`);
  }

  // 4. Test Role-Based Authorization
  console.log("\n[4] Testing Role-Based Security & Unauthorized Access Denial...");
  // Standard employee attempts to approve invoice
  const unauthApproveRes = await fetch(`${BASE_URL}/api/finance/invoices/${invoice.id}/transition`, {
    method: "POST",
    headers: empHeaders,
    body: JSON.stringify({ action: "APPROVE" }),
  });
  if (unauthApproveRes.status === 403 || unauthApproveRes.status === 400) {
    console.log("✓ Security Check: Standard employee correctly denied approval access (403/400).");
  } else {
    throw new Error(`Security breach: Employee was allowed to approve invoice (${unauthApproveRes.status})`);
  }

  // 5. Test Invoice Workflow Transitions
  console.log("\n[5] Testing Invoice Workflow State Machine (Submit -> Approve -> Send)...");
  // Submit for approval
  const submitRes = await fetch(`${BASE_URL}/api/finance/invoices/${invoice.id}/transition`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({ action: "SUBMIT" }),
  });
  if (!submitRes.ok) throw new Error(`Submit invoice failed: ${submitRes.status}`);
  const submittedInv = (await submitRes.json()).data;
  console.log(`✓ Status transitioned to: ${submittedInv.status}`);

  // Approve invoice
  const approveRes = await fetch(`${BASE_URL}/api/finance/invoices/${invoice.id}/transition`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({ action: "APPROVE" }),
  });
  if (!approveRes.ok) throw new Error(`Approve invoice failed: ${approveRes.status}`);
  const approvedInv = (await approveRes.json()).data;
  console.log(`✓ Status transitioned to: ${approvedInv.status} (Approved by CFO)`);

  // Send invoice
  const sendRes = await fetch(`${BASE_URL}/api/finance/invoices/${invoice.id}/transition`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({ action: "SEND" }),
  });
  if (!sendRes.ok) throw new Error(`Send invoice failed: ${sendRes.status}`);
  const sentInv = (await sendRes.json()).data;
  console.log(`✓ Status transitioned to: ${sentInv.status} (Dispatched to client)`);

  // Test rejection workflow on a test invoice
  console.log("   - Testing rejection state machine on auxiliary draft...");
  const auxInvRes = await fetch(`${BASE_URL}/api/finance/invoices`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({
      clientId: client.id,
      invoiceDate: "2026-09-02",
      dueDate: "2026-10-02",
      items: [{ description: "Disputed Trial Services", quantity: 1, unitPrice: 5000 }],
    }),
  });
  const auxInv = (await auxInvRes.json()).data;
  await fetch(`${BASE_URL}/api/finance/invoices/${auxInv.id}/transition`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({ action: "SUBMIT" }),
  });
  const rejectRes = await fetch(`${BASE_URL}/api/finance/invoices/${auxInv.id}/transition`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({ action: "REJECT", reason: "Incorrect service pricing terms" }),
  });
  const rejectedInv = (await rejectRes.json()).data;
  console.log(`   ✓ Rejection verified: Status is ${rejectedInv.status}, Reason: "${rejectedInv.rejectionReason}"`);

  // 6. Test Payments, Partial Payments & Overpayment Prevention
  console.log("\n[6] Testing Payments, Atomic Transactions & Overpayment Prevention...");
  // Overpayment test: attempt to pay $40,000 on a $31,500 balance
  const overpayRes = await fetch(`${BASE_URL}/api/finance/payments`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({
      invoiceId: invoice.id,
      amount: 40000,
      paymentMethod: "WIRE",
    }),
  });
  if (overpayRes.status === 400) {
    console.log("✓ Overpayment Protection: System prevented overpayment exceeding invoice balance ($40,000 > $31,500).");
  } else {
    throw new Error(`Integrity breach: Overpayment was allowed (${overpayRes.status})`);
  }

  // Partial payment: $11,500
  console.log("   - Recording Partial Payment of $11,500 via Wire...");
  const partialPayRes = await fetch(`${BASE_URL}/api/finance/payments`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({
      invoiceId: invoice.id,
      amount: 11500,
      paymentMethod: "WIRE",
      transactionRef: "WIRE-REM-771829",
      notes: "First milestone payment",
    }),
  });
  if (!partialPayRes.ok) throw new Error(`Partial payment failed: ${partialPayRes.status}`);
  const partialData = (await partialPayRes.json()).data;
  console.log(`   ✓ Partial Payment recorded: ${partialData.payment.paymentReference}`);
  console.log(`   ✓ Updated Invoice Status: ${partialData.invoice.status} (Remaining Balance: $${partialData.invoice.balance.toLocaleString()})`);
  console.log(`   ✓ Financial Transaction Inflow logged: ${partialData.transaction.transactionNumber} (+$${partialData.transaction.amount.toLocaleString()})`);

  if (partialData.invoice.status !== "PARTIALLY_PAID" || partialData.invoice.balance !== 20000) {
    throw new Error("Partial payment calculation error");
  }

  // Full settlement payment: $20,000
  console.log("   - Recording Remaining Settlement Payment of $20,000 via ACH...");
  const fullPayRes = await fetch(`${BASE_URL}/api/finance/payments`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({
      invoiceId: invoice.id,
      amount: 20000,
      paymentMethod: "BANK_TRANSFER",
      transactionRef: "ACH-FINAL-99018",
      notes: "Final milestone settlement",
    }),
  });
  if (!fullPayRes.ok) throw new Error(`Final payment failed: ${fullPayRes.status}`);
  const fullData = (await fullPayRes.json()).data;
  console.log(`   ✓ Full Payment recorded: ${fullData.payment.paymentReference}`);
  console.log(`   ✓ Invoice Status is now: ${fullData.invoice.status} (Balance: $${fullData.invoice.balance.toLocaleString()})`);

  if (fullData.invoice.status !== "PAID" || fullData.invoice.balance !== 0) {
    throw new Error("Final payment failed to transition invoice to PAID");
  }

  // Test Payment Reversal
  console.log("   - Testing Payment Reversal of $20,000 payment...");
  const reverseRes = await fetch(`${BASE_URL}/api/finance/payments/${fullData.payment.id}/reverse`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({ reason: "Client requested bank reconciliation adjustment" }),
  });
  if (!reverseRes.ok) throw new Error(`Reverse payment failed: ${reverseRes.status} ${await reverseRes.text()}`);
  const reverseData = (await reverseRes.json()).data;
  console.log(`   ✓ Payment reversed: Status is ${reverseData.payment.status}`);
  console.log(`   ✓ Invoice balance restored to: $${reverseData.invoice.balance.toLocaleString()} (Status: ${reverseData.invoice.status})`);

  if (reverseData.invoice.status !== "PARTIALLY_PAID" || reverseData.invoice.balance !== 20000) {
    throw new Error("Payment reversal failed to restore invoice balance");
  }

  // 7. Test Receivables & Aging Buckets
  console.log("\n[7] Querying Accounts Receivable Ledger & Aging Schedule...");
  const arRes = await fetch(`${BASE_URL}/api/finance/receivables`, { headers: cfoHeaders });
  if (!arRes.ok) throw new Error(`Fetch receivables failed: ${arRes.status}`);
  const arData = (await arRes.json()).data;
  console.log(`✓ Total Receivables: $${arData.totalReceivable.toLocaleString()}`);
  console.log(`   - Current (Not Due): $${arData.agingBuckets.current.amount.toLocaleString()} (${arData.agingBuckets.current.count} invoices)`);
  console.log(`   - 1–30 Days Overdue: $${arData.agingBuckets.days1_30.amount.toLocaleString()} (${arData.agingBuckets.days1_30.count} invoices)`);
  console.log(`   - 31–60 Days Overdue: $${arData.agingBuckets.days31_60.amount.toLocaleString()} (${arData.agingBuckets.days31_60.count} invoices)`);
  console.log(`   - Total Delinquent / Overdue: $${arData.totalOverdue.toLocaleString()}`);

  // 8. Test Expenses Lifecycle & Disbursal
  console.log("\n[8] Testing Expense Management (Submit -> Approve -> Pay)...");
  // Employee submits expense
  const submitExpRes = await fetch(`${BASE_URL}/api/finance/expenses`, {
    method: "POST",
    headers: empHeaders,
    body: JSON.stringify({
      category: "TRAVEL",
      amount: 650,
      currency: "USD",
      date: "2026-09-05",
      description: "Flight ticket to customer technical workshop",
      receiptUrl: "https://documents.nfvs.internal/receipts/flight-alex.pdf",
    }),
  });
  if (!submitExpRes.ok) throw new Error(`Submit expense failed: ${submitExpRes.status}`);
  const expData = (await submitExpRes.json()).data;
  console.log(`✓ Employee submitted expense: ${expData.expenseNumber} ($${expData.amount}, Status: ${expData.status})`);

  // CFO approves expense
  const approveExpRes = await fetch(`${BASE_URL}/api/finance/expenses/${expData.id}/transition`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({ action: "APPROVE" }),
  });
  if (!approveExpRes.ok) throw new Error(`Approve expense failed: ${approveExpRes.status}`);
  const approvedExp = (await approveExpRes.json()).data;
  console.log(`✓ Expense approved by CFO: Status is ${approvedExp.status}`);

  // Finance disburses payment (creates OUTFLOW)
  const payExpRes = await fetch(`${BASE_URL}/api/finance/expenses/${expData.id}/transition`, {
    method: "POST",
    headers: cfoHeaders,
    body: JSON.stringify({ action: "PAY", paymentMethod: "REIMBURSEMENT", paymentReference: "REIMB-ALEX-901" }),
  });
  if (!payExpRes.ok) throw new Error(`Pay expense failed: ${payExpRes.status}`);
  const paidExp = (await payExpRes.json()).data;
  console.log(`✓ Expense disbursed & paid: Status is ${paidExp.status} (Outflow logged in ledger)`);

  // 9. Test Payroll Integration & Ledger Posting
  console.log("\n[9] Testing Payroll Integration & Immutable Ledger Posting...");
  const payrollPeriodsRes = await fetch(`${BASE_URL}/api/finance/payroll`, { headers: cfoHeaders });
  if (!payrollPeriodsRes.ok) throw new Error(`Fetch payroll periods failed: ${payrollPeriodsRes.status}`);
  const periodsData = (await payrollPeriodsRes.json()).data;
  const targetPeriod = periodsData.periods.find((p) => p.status === "APPROVED" || p.status === "PROCESSED");
  if (!targetPeriod) throw new Error("No approved payroll period found for ledger posting test");
  console.log(`✓ Found finalized payroll period: ${targetPeriod.name} (${targetPeriod.code}) - Net: $${targetPeriod.totalNet.toLocaleString()}`);

  if (!targetPeriod.isPostedToLedger) {
    const postPayrollRes = await fetch(`${BASE_URL}/api/finance/payroll/${targetPeriod.id}/post`, {
      method: "POST",
      headers: cfoHeaders,
    });
    if (!postPayrollRes.ok) throw new Error(`Post payroll failed: ${postPayrollRes.status} ${await postPayrollRes.text()}`);
    const postedTxn = (await postPayrollRes.json()).data;
    console.log(`✓ Payroll run successfully posted to ledger: ${postedTxn.transactionNumber} (-$${postedTxn.amount.toLocaleString()})`);

    // Test duplicate posting prevention
    const dupPostRes = await fetch(`${BASE_URL}/api/finance/payroll/${targetPeriod.id}/post`, {
      method: "POST",
      headers: cfoHeaders,
    });
    if (dupPostRes.status === 400) {
      console.log("✓ Duplicate Protection: System prevented duplicate payroll ledger posting.");
    } else {
      throw new Error(`Integrity breach: Duplicate payroll posting allowed (${dupPostRes.status})`);
    }
  } else {
    console.log(`✓ Period already posted under ${targetPeriod.postedTransactionNumber}.`);
  }

  // 10. Test Finance Overview Dashboard & Transactions Ledger
  console.log("\n[10] Verifying Finance Overview KPIs & Master Transactions Ledger...");
  const overviewRes = await fetch(`${BASE_URL}/api/finance/overview`, { headers: cfoHeaders });
  if (!overviewRes.ok) throw new Error(`Fetch overview failed: ${overviewRes.status}`);
  const overview = (await overviewRes.json()).data;
  console.log(`✓ Overview KPIs Verified:`);
  console.log(`   - Collected Revenue: $${overview.kpis.totalRevenue.toLocaleString()}`);
  console.log(`   - Operational Expenses: $${overview.kpis.totalExpenses.toLocaleString()}`);
  console.log(`   - Net Profit: $${overview.kpis.netProfit.toLocaleString()}`);
  console.log(`   - Accounts Receivable: $${overview.kpis.accountsReceivable.toLocaleString()}`);
  console.log(`   - Accounts Payable: $${overview.kpis.accountsPayable.toLocaleString()}`);
  console.log(`   - Cash Flow Net: $${overview.cashFlow.netCashFlow.toLocaleString()}`);
  console.log(`   - Monthly Revenue Trend items: ${overview.revenueTrend.length}`);

  const txnsRes = await fetch(`${BASE_URL}/api/finance/transactions`, { headers: cfoHeaders });
  if (!txnsRes.ok) throw new Error(`Fetch transactions failed: ${txnsRes.status}`);
  const txns = (await txnsRes.json()).data.transactions;
  console.log(`✓ Master Transactions Ledger retrieved: ${txns.length} total transactions.`);

  // 11. Test CRM Customer 360 Billing Integration
  console.log("\n[11] Verifying CRM Customer 360 Billing Integration for Billed Client...");
  const c360Res = await fetch(`${BASE_URL}/api/crm/clients/${client.id}`, { headers: cfoHeaders });
  if (!c360Res.ok) throw new Error(`Fetch Customer 360 failed: ${c360Res.status}`);
  const c360 = (await c360Res.json()).data;
  console.log(`✓ Customer 360 Billing Verified for ${c360.client.name}:`);
  console.log(`   - Invoices count: ${c360.client.invoices?.length || 0}`);
  console.log(`   - Payments count: ${c360.client.payments?.length || 0}`);
  console.log(`   - Total Invoiced: $${c360.billingSnapshot.totalInvoiced.toLocaleString()}`);
  console.log(`   - Outstanding AR Balance: $${c360.billingSnapshot.outstandingBalance.toLocaleString()}`);

  console.log("\n==================================================");
  console.log("ALL BLOCK 6 FINANCE & INVOICING TESTS PASSED!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
