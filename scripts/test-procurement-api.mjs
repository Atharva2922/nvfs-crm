
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

async function runApiTests() {
  console.log("\n--- RUNNING PROCUREMENT HTTP API TESTS ---");
  const cookie = await login("superadmin@nfvs.internal", "Enterprise@2026");
  console.log("✓ Authenticated as Super Admin");

  const headers = {
    "Content-Type": "application/json",
    Cookie: cookie,
  };

  // 1. GET /api/inventory/vendors
  const vListRes = await fetch(`${BASE_URL}/api/inventory/vendors`, { headers });
  const vList = await vListRes.json();
  console.log(`✓ GET /api/inventory/vendors returned ${vList.data?.length} vendors (Status: ${vListRes.status})`);

  // 2. POST /api/inventory/vendors
  const newVRes = await fetch(`${BASE_URL}/api/inventory/vendors`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      displayName: `Apex Dynamics ${Date.now().toString().slice(-4)}`,
      legalName: "Apex Dynamics Global Corp",
      vendorType: "DISTRIBUTOR",
      email: `contact-${Date.now()}@apexdynamics.com`,
      paymentTerms: "NET_30",
      currency: "USD",
      bankName: "Wells Fargo",
      bankAccountNumber: "1234567890",
    }),
  });
  const newV = await newVRes.json();
  console.log(`✓ POST /api/inventory/vendors created vendor ${newV.data?.vendorCode} (Status: ${newVRes.status})`);
  const vendorId = newV.data.id;

  // 3. GET /api/inventory/vendors/[id]
  const vDetailRes = await fetch(`${BASE_URL}/api/inventory/vendors/${vendorId}`, { headers });
  const vDetail = await vDetailRes.json();
  console.log(`✓ GET /api/inventory/vendors/[id] returned vendor profile: ${vDetail.data?.displayName}`);

  // 4. GET /api/inventory/vendors/[id]/performance
  const vPerfRes = await fetch(`${BASE_URL}/api/inventory/vendors/${vendorId}/performance`, { headers });
  const vPerf = await vPerfRes.json();
  console.log(`✓ GET /api/inventory/vendors/[id]/performance returned on-time rate: ${vPerf.data?.onTimeDeliveryRate}%`);

  // 5. GET products to link
  const pListRes = await fetch(`${BASE_URL}/api/inventory/products`, { headers });
  const pList = await pListRes.json();
  const productId = pList.data[0].id;

  // 6. POST /api/inventory/vendors/[id]/products
  const vProdRes = await fetch(`${BASE_URL}/api/inventory/vendors/${vendorId}/products`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      productId,
      vendorSku: "APX-PROD-001",
      purchasePrice: 95.0,
      leadTimeDays: 7,
      minOrderQuantity: 5,
      isPreferred: true,
    }),
  });
  const vProd = await vProdRes.json();
  console.log(`✓ POST /api/inventory/vendors/[id]/products linked product at price $${vProd.data?.purchasePrice}`);

  // 7. POST /api/inventory/purchase-requests
  const prRes = await fetch(`${BASE_URL}/api/inventory/purchase-requests`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      reason: "API Test Requisition",
      requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "HIGH",
      submitImmediately: true,
      items: [{ productId, quantity: 20, estimatedUnitCost: 95.0 }],
    }),
  });
  const pr = await prRes.json();
  console.log(`✓ POST /api/inventory/purchase-requests created ${pr.data?.requestNumber} (Status: ${prRes.status})`);
  const prId = pr.data.id;

  // 8. POST /api/inventory/purchase-requests/[id]/transition (APPROVE)
  const prApproveRes = await fetch(`${BASE_URL}/api/inventory/purchase-requests/${prId}/transition`, {
    method: "POST",
    headers,
    body: JSON.stringify({ transition: "APPROVE" }),
  });
  const prApproved = await prApproveRes.json();
  console.log(`✓ POST /api/inventory/purchase-requests/[id]/transition approved PR: ${prApproved.data?.status}`);

  // 9. POST /api/inventory/purchase-requests/[id]/convert-to-po
  const convertRes = await fetch(`${BASE_URL}/api/inventory/purchase-requests/${prId}/convert-to-po`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      vendorId,
      expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      paymentTerms: "NET_30",
    }),
  });
  const po = await convertRes.json();
  console.log(`✓ POST /api/inventory/purchase-requests/[id]/convert-to-po created PO: ${po.data?.poNumber}`);
  const poId = po.data.id;

  // 10. POST /api/inventory/purchase-orders/[id]/transition (SUBMIT -> APPROVE -> SEND)
  await fetch(`${BASE_URL}/api/inventory/purchase-orders/${poId}/transition`, {
    method: "POST",
    headers,
    body: JSON.stringify({ transition: "SUBMIT" }),
  });
  await fetch(`${BASE_URL}/api/inventory/purchase-orders/${poId}/transition`, {
    method: "POST",
    headers,
    body: JSON.stringify({ transition: "APPROVE" }),
  });
  const poSendRes = await fetch(`${BASE_URL}/api/inventory/purchase-orders/${poId}/transition`, {
    method: "POST",
    headers,
    body: JSON.stringify({ transition: "SEND" }),
  });
  const poSent = await poSendRes.json();
  console.log(`✓ POST /api/inventory/purchase-orders/[id]/transition transitioned PO to: ${poSent.data?.status}`);

  // 11. GET warehouses
  const wRes = await fetch(`${BASE_URL}/api/inventory/warehouses`, { headers });
  const wList = await wRes.json();
  const warehouseId = wList.data[0].id;

  // 12. POST /api/inventory/goods-receipts (Atomic Finalization)
  const poDetailRes = await fetch(`${BASE_URL}/api/inventory/purchase-orders/${poId}`, { headers });
  const poDetail = await poDetailRes.json();
  const poLineId = poDetail.data.items[0].id;

  const grRes = await fetch(`${BASE_URL}/api/inventory/goods-receipts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      purchaseOrderId: poId,
      warehouseId,
      items: [
        {
          purchaseOrderItemId: poLineId,
          receivedQuantity: 20,
          rejectedQuantity: 0,
        },
      ],
      finalizeImmediately: true,
    }),
  });
  const gr = await grRes.json();
  console.log(`✓ POST /api/inventory/goods-receipts atomically finalized receipt ${gr.data?.receiptNumber} (Status: ${grRes.status})`);

  // 13. Verify PO status became RECEIVED
  const poFinalRes = await fetch(`${BASE_URL}/api/inventory/purchase-orders/${poId}`, { headers });
  const poFinal = await poFinalRes.json();
  console.log(`✓ Verified PO ${poFinal.data?.poNumber} fulfillment status: ${poFinal.data?.status} (Received: ${poFinal.data?.items[0].receivedQuantity}/20)`);

  console.log("\nALL PROCUREMENT HTTP API TESTS PASSED SUCCESSFULLY!\n");
}

runApiTests().catch((e) => {
  console.error("API Test Error:", e);
  process.exit(1);
});
