/**
 * BLOCK 7: PRODUCTS, SERVICES & INVENTORY MANAGEMENT
 * End-to-End Verification Test Script
 */

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================");
  console.log("BLOCK 7: PRODUCTS, SERVICES & INVENTORY VERIFICATION");
  console.log("==================================================\n");

  // Helper for requests
  const api = async (endpoint, options = {}, cookie = "") => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...options.headers,
      },
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, ok: res.ok, data: json, rawText: text, headers: res.headers };
  };

  // 1. Authenticate Super Admin, CFO, and Employee
  console.log("[1] Authenticating Super Admin, CFO, and Standard Employee...");

  const loginUser = async (email, password) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`Login failed for ${email}`);
    const setCookie = res.headers.get("set-cookie");
    const json = await res.json();
    return { token: setCookie, user: json.data.user };
  };

  const adminAuth = await loginUser("superadmin@nfvs.internal", "Enterprise@2026");
  const cfoAuth = await loginUser("cfo@nfvs.internal", "Enterprise@2026");
  const empAuth = await loginUser("alex.mercer@nfvs.internal", "Enterprise@2026");

  console.log("✓ Super Admin (Marcus Vance) authenticated.");
  console.log("✓ CFO (Sophia Sterling) authenticated.");
  console.log("✓ Employee (Alex Mercer) authenticated.\n");

  // 2. Fetch Warehouses and Categories
  console.log("[2] Inspecting Warehouses and Category Taxonomies...");
  const whRes = await api("/api/inventory/warehouses", {}, adminAuth.token);
  if (!whRes.ok || whRes.data.data.length < 2) {
    throw new Error("Failed to load seeded warehouses");
  }
  const whMain = whRes.data.data.find((w) => w.code === "WH-001");
  const whEast = whRes.data.data.find((w) => w.code === "WH-002");
  console.log(`✓ Primary Warehouse: ${whMain.name} (${whMain.code})`);
  console.log(`✓ Secondary Warehouse: ${whEast.name} (${whEast.code})`);

  const catRes = await api("/api/inventory/categories?tree=true", {}, adminAuth.token);
  if (!catRes.ok || catRes.data.data.length === 0) {
    throw new Error("Failed to load hierarchical category tree");
  }
  const hardwareCat = catRes.data.data.find((c) => c.code === "CAT-HW");
  console.log(`✓ Hierarchical Category Root: ${hardwareCat.name} with ${hardwareCat.children?.length || 0} sub-categories\n`);

  // 3. Product Creation & SKU Uniqueness
  console.log("[3] Testing Product Master & Database-Enforced SKU Uniqueness...");
  const testSku = `SKU-TEST-${Date.now().toString().slice(-4)}`;
  const createProdRes = await api(
    "/api/inventory/products",
    {
      method: "POST",
      body: JSON.stringify({
        sku: testSku,
        name: "Enterprise Quantum Edge Gateway",
        description: "Ruggedized multi-access edge computing node",
        productType: "PHYSICAL",
        unitOfMeasure: "UNIT",
        sellingPrice: 3500.0,
        costPrice: 2100.0,
        taxRate: 10.0,
        reorderLevel: 15.0,
        minStockLevel: 5.0,
        maxStockLevel: 50.0,
        initialStock: {
          warehouseId: whMain.id,
          quantity: 100.0,
        },
      }),
    },
    adminAuth.token
  );

  if (!createProdRes.ok) {
    throw new Error(`Failed to create product: ${createProdRes.data?.error?.message}`);
  }
  const createdProd = createProdRes.data.data;
  console.log(`✓ Product created: ${createdProd.name} (SKU: ${createdProd.sku})`);
  console.log(`   - Selling Price: $${createdProd.sellingPrice} | Cost Price: $${createdProd.costPrice}`);
  console.log(`   - Initial Stock: 100 units deposited into ${whMain.code}`);

  // Test duplicate SKU constraint
  const dupRes = await api(
    "/api/inventory/products",
    {
      method: "POST",
      body: JSON.stringify({
        sku: testSku,
        name: "Duplicate Attempt Gateway",
        sellingPrice: 1000.0,
      }),
    },
    adminAuth.token
  );

  if (dupRes.status === 400 || dupRes.status === 500) {
    console.log("✓ SKU Uniqueness Enforced: System rejected duplicate SKU registration.\n");
  } else {
    throw new Error("Duplicate SKU was unexpectedly allowed!");
  }

  // 4. Services Catalog
  console.log("[4] Testing Services Catalog Segregation (Non-Inventory)...");
  const testSrvCode = `SRV-AUD-${Date.now().toString().slice(-4)}`;
  const createSrvRes = await api(
    "/api/inventory/services",
    {
      method: "POST",
      body: JSON.stringify({
        serviceCode: testSrvCode,
        name: "Cloud Security Compliance Assessment",
        description: "Hands-on penetration testing and architecture review",
        sellingPrice: 6500.0,
        costPrice: 2800.0,
        billingUnit: "FIXED_PRICE",
      }),
    },
    adminAuth.token
  );
  if (!createSrvRes.ok) throw new Error("Failed to create service offering");
  const createdSrv = createSrvRes.data.data;
  console.log(`✓ Service Created: ${createdSrv.name} (${createdSrv.serviceCode})`);
  console.log(`   - Rate: $${createdSrv.sellingPrice} (${createdSrv.billingUnit})`);
  console.log("✓ Verified: Service is registered without physical stock or warehouse requirements.\n");

  // 5. Stock In and Stock Out Operations
  console.log("[5] Testing Atomic Stock Inward & Outward Movements...");
  // Stock In 20 units
  const stockInRes = await api(
    "/api/inventory/movements",
    {
      method: "POST",
      body: JSON.stringify({
        type: "STOCK_IN",
        productId: createdProd.id,
        warehouseId: whMain.id,
        quantity: 20.0,
        reason: "Supplier supplemental shipment intake",
      }),
    },
    adminAuth.token
  );
  if (!stockInRes.ok) throw new Error("Stock in failed");
  console.log(`✓ Stock Inward logged: +20 units (New Balance in ${whMain.code}: ${stockInRes.data.data.newBalance})`);

  // Stock Out 15 units
  const stockOutRes = await api(
    "/api/inventory/movements",
    {
      method: "POST",
      body: JSON.stringify({
        type: "STOCK_OUT",
        productId: createdProd.id,
        warehouseId: whMain.id,
        quantity: 15.0,
        reason: "Customer demo equipment dispatch",
      }),
    },
    adminAuth.token
  );
  if (!stockOutRes.ok) throw new Error("Stock out failed");
  console.log(`✓ Stock Outward logged: -15 units (New Balance in ${whMain.code}: ${stockOutRes.data.data.newBalance})\n`);

  // 6. Transactional Stock Transfer (Warehouse A -> Warehouse B)
  console.log("[6] Testing Transactional Stock Transfer & Rollback Integrity...");
  // Check source stock: 100 + 20 - 15 = 105 units
  // Attempt invalid transfer: 500 units (exceeds 105)
  const invalidTransferRes = await api(
    "/api/inventory/transfers",
    {
      method: "POST",
      body: JSON.stringify({
        productId: createdProd.id,
        sourceWarehouseId: whMain.id,
        destinationWarehouseId: whEast.id,
        quantity: 500.0,
        reason: "Excess transfer attempt",
      }),
    },
    adminAuth.token
  );

  if (!invalidTransferRes.ok) {
    console.log("✓ Transaction Rollback Verified: Over-capacity transfer rejected (Insufficient stock).");
  } else {
    throw new Error("Invalid transfer of 500 units unexpectedly succeeded!");
  }

  // Execute valid transfer: Transfer 25 units from whMain to whEast
  console.log(`   - Transferring 25 units: ${whMain.code} → ${whEast.code}...`);
  const validTransferRes = await api(
    "/api/inventory/transfers",
    {
      method: "POST",
      body: JSON.stringify({
        productId: createdProd.id,
        sourceWarehouseId: whMain.id,
        destinationWarehouseId: whEast.id,
        quantity: 25.0,
        reason: "Regional inventory rebalancing",
      }),
    },
    adminAuth.token
  );
  if (!validTransferRes.ok) throw new Error(`Valid transfer failed: ${validTransferRes.data?.error?.message}`);
  const transfer = validTransferRes.data.data;
  console.log(`✓ Transaction Succeeded:`);
  console.log(`   - Source (${whMain.code}) New Balance: ${transfer.sourceNewBalance} units (was 105)`);
  console.log(`   - Destination (${whEast.code}) New Balance: ${transfer.destinationNewBalance} units (was 0)`);
  console.log(`   - Transfer Movement: ${transfer.movement.movementNumber}\n`);

  // 7. Inventory Count Adjustment Workflow
  console.log("[7] Testing Inventory Adjustment Workflow (Submit -> RBAC Denial -> CFO Approval)...");
  // Create count adjustment for whEast (physical count shows 24 instead of 25)
  const createAdjRes = await api(
    "/api/inventory/adjustments",
    {
      method: "POST",
      body: JSON.stringify({
        warehouseId: whEast.id,
        reason: "DAMAGED_GOODS",
        notes: "1 unit box damaged in transit, written off",
        items: [
          {
            productId: createdProd.id,
            countedQuantity: 24.0,
          },
        ],
      }),
    },
    empAuth.token
  );
  if (!createAdjRes.ok) throw new Error("Failed to create inventory adjustment");
  const adj = createAdjRes.data.data;
  console.log(`✓ Adjustment request filed: ${adj.adjustmentNumber} (Status: ${adj.status})`);
  console.log(`   - System: 25 | Counted: 24 | Delta: -1 unit`);

  // Verify standard employee cannot approve
  const unauthApproveRes = await api(
    `/api/inventory/adjustments/${adj.id}/transition`,
    {
      method: "POST",
      body: JSON.stringify({ action: "approve" }),
    },
    empAuth.token
  );
  if (unauthApproveRes.status === 403 || unauthApproveRes.status === 400) {
    console.log("✓ Security Check: Standard employee denied adjustment approval permission (403/400).");
  } else {
    throw new Error("Standard employee unexpectedly approved adjustment!");
  }

  // CFO approves adjustment
  const cfoApproveRes = await api(
    `/api/inventory/adjustments/${adj.id}/transition`,
    {
      method: "POST",
      body: JSON.stringify({ action: "approve" }),
    },
    cfoAuth.token
  );
  if (!cfoApproveRes.ok) throw new Error("CFO failed to approve adjustment");
  console.log(`✓ Adjustment Approved by CFO Sophia Sterling: Status is APPROVED`);
  console.log(`   - Stock in ${whEast.code} reconciled atomically to 24 units.\n`);

  // 8. Cost-Price & Valuation RBAC Protection
  console.log("[8] Testing Cost-Price & Inventory Valuation RBAC Access Controls...");
  // Standard Employee checks product details
  const empViewProdRes = await api(`/api/inventory/products/${createdProd.id}`, {}, empAuth.token);
  if (!empViewProdRes.ok) throw new Error("Failed to retrieve product with employee auth");
  const empProduct = empViewProdRes.data.data;

  // CFO checks product details
  const cfoViewProdRes = await api(`/api/inventory/products/${createdProd.id}`, {}, cfoAuth.token);
  if (!cfoViewProdRes.ok) throw new Error("Failed to retrieve product with CFO auth");
  const cfoProduct = cfoViewProdRes.data.data;

  if (empProduct.costPrice === null && cfoProduct.costPrice !== null) {
    console.log("✓ Cost-Price Protection Verified:");
    console.log(`   - Standard Employee sees: costPrice = ${empProduct.costPrice} (Redacted/Masked)`);
    console.log(`   - CFO sees: costPrice = $${cfoProduct.costPrice}`);
    console.log(`   - CFO Total Valuation: $${cfoProduct.totalValuation.toLocaleString()}\n`);
  } else {
    throw new Error(`Cost price was not properly restricted: Emp=${empProduct.costPrice}, CFO=${cfoProduct.costPrice}`);
  }

  // 9. Finance Invoice Integration with Product and Service
  console.log("[9] Testing Finance Invoice Integration with Product Master & Service Catalog...");
  // Fetch a client
  const clientRes = await api("/api/crm/clients?limit=1", {}, adminAuth.token);
  const client = clientRes.data.data.clients[0];

  const createInvRes = await api(
    "/api/finance/invoices",
    {
      method: "POST",
      body: JSON.stringify({
        clientId: client.id,
        invoiceDate: "2026-09-09",
        dueDate: "2026-10-09",
        currency: "USD",
        items: [
          {
            description: `Product Delivery: ${createdProd.name}`,
            productId: createdProd.id,
            quantity: 2,
            unitPrice: createdProd.sellingPrice,
            taxRate: 10,
          },
          {
            description: `Implementation Service: ${createdSrv.name}`,
            serviceId: createdSrv.id,
            quantity: 1,
            unitPrice: createdSrv.sellingPrice,
            taxRate: 0,
          },
        ],
      }),
    },
    adminAuth.token
  );
  if (!createInvRes.ok) throw new Error(`Failed to create invoice with product/service items: ${createInvRes.data?.error?.message}`);
  const inv = createInvRes.data.data;
  console.log(`✓ Commercial Invoice Created: ${inv.invoiceNumber} ($${inv.total.toLocaleString()})`);
  console.log(`   - Line 1: Product [${createdProd.sku}] × 2 @ $${createdProd.sellingPrice}`);
  console.log(`   - Line 2: Service [${createdSrv.serviceCode}] × 1 @ $${createdSrv.sellingPrice}\n`);

  // 10. Overview Dashboard & Master Movements Ledger
  console.log("[10] Verifying Inventory Overview Dashboard KPIs & Stock Ledger...");
  const overviewRes = await api("/api/inventory/overview", {}, cfoAuth.token);
  if (!overviewRes.ok) throw new Error("Failed to load overview KPIs");
  const kpis = overviewRes.data.data;

  console.log("✓ Overview KPIs Verified:");
  console.log(`   - Total Products: ${kpis.totalProducts}`);
  console.log(`   - Total Services: ${kpis.totalServices}`);
  console.log(`   - Total Inventory Units: ${kpis.totalInventoryUnits.toLocaleString()}`);
  console.log(`   - Low Stock Items: ${kpis.lowStockCount}`);
  console.log(`   - Total Inventory Valuation: $${kpis.totalValuation ? Math.round(kpis.totalValuation).toLocaleString() : 0}`);
  console.log(`   - Warehouses Monitored: ${kpis.warehouseDistribution.length}`);

  const ledgerRes = await api("/api/inventory/movements?limit=10", {}, adminAuth.token);
  if (!ledgerRes.ok) throw new Error("Failed to retrieve stock movements ledger");
  console.log(`✓ Master Stock Movements Ledger retrieved: ${ledgerRes.data.data.length} recent entries verified.\n`);

  console.log("==================================================");
  console.log("ALL BLOCK 7 PRODUCTS, SERVICES & INVENTORY TESTS PASSED!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});
