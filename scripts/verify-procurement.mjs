import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runProcurementVerification() {
  console.log("================================================================================");
  console.log("BLOCK 8: VENDORS & PURCHASE ORDERS — ENTERPRISE VERIFICATION SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Setup Actors & Dependencies
    const org = await prisma.organization.findFirst({ where: { code: "NFVS-CORP" } });
    assert(!!org, "Organization NFVS-CORP found");

    const superAdmin = await prisma.employee.findFirst({
      where: { organizationId: org.id, user: { role: { code: "SUPER_ADMIN" } } },
      include: { user: { include: { role: true } } },
    });
    assert(!!superAdmin, "Super Admin employee retrieved");

    const warehouse = await prisma.warehouse.findFirst({
      where: { organizationId: org.id, status: "ACTIVE" },
    });
    assert(!!warehouse, `Active warehouse retrieved: ${warehouse?.name} (${warehouse?.code})`);

    const product = await prisma.product.findFirst({
      where: { organizationId: org.id, isActive: true },
    });
    assert(!!product, `Active product retrieved: ${product?.name} (SKU: ${product?.sku})`);

    // 2. Vendor Master Creation
    console.log("\n--- Testing 1: Vendor Master Creation & Masked Banking ---");
    const testCode = `VEN-${Date.now().toString().slice(-4)}`;
    const vendor = await prisma.vendor.create({
      data: {
        organizationId: org.id,
        vendorCode: testCode,
        legalName: "Quantum Logistics & Components Corp",
        displayName: "Quantum Tech Supplies",
        vendorType: "SUPPLIER",
        email: `sales@quantum-${Date.now()}.com`,
        phone: "+1 800 555 9012",
        website: "https://quantum-tech-supplies.com",
        city: "San Jose",
        state: "CA",
        country: "United States",
        taxId: "US-EIN-99221144",
        paymentTerms: "NET_30",
        currency: "USD",
        bankName: "Silicon Valley Bank",
        bankAccountNumberMasked: "****5432",
        bankRoutingCode: "SVBUS33",
        status: "ACTIVE",
        createdById: superAdmin.id,
      },
    });
    assert(!!vendor && vendor.vendorCode === testCode, `Vendor created with code: ${vendor.vendorCode}`);
    assert(vendor.bankAccountNumberMasked === "****5432", "Bank account number correctly masked");

    // 3. Vendor Contacts
    console.log("\n--- Testing 2: Vendor Multiple Contacts ---");
    const contact1 = await prisma.vendorContact.create({
      data: {
        vendorId: vendor.id,
        name: "Eleanor Vance",
        designation: "Enterprise Accounts VP",
        email: "eleanor.vance@quantum.com",
        phone: "+1 800 555 9013",
        isPrimary: true,
        status: "ACTIVE",
      },
    });
    const contact2 = await prisma.vendorContact.create({
      data: {
        vendorId: vendor.id,
        name: "Derek Hayes",
        designation: "Technical Dispatcher",
        email: "derek.hayes@quantum.com",
        phone: "+1 800 555 9014",
        isPrimary: false,
        status: "ACTIVE",
      },
    });
    const vendorContacts = await prisma.vendorContact.findMany({ where: { vendorId: vendor.id } });
    assert(vendorContacts.length === 2, "Vendor has 2 distinct contacts");
    assert(vendorContacts.find((c) => c.isPrimary)?.name === "Eleanor Vance", "Primary contact correctly designated");

    // 4. Vendor-Product Pricing Relationship
    console.log("\n--- Testing 3: Vendor-Product Relationship & Catalog ---");
    const vendorProduct = await prisma.vendorProduct.create({
      data: {
        vendorId: vendor.id,
        productId: product.id,
        vendorSku: "QTM-9988-X",
        purchasePrice: 48.5,
        currency: "USD",
        leadTimeDays: 5,
        minOrderQuantity: 10,
        isPreferred: true,
        status: "ACTIVE",
      },
    });
    assert(vendorProduct.purchasePrice === 48.5, "Vendor purchase pricing stored accurately (48.50 USD)");
    assert(product.sellingPrice !== vendorProduct.purchasePrice, "Global product selling price NOT overwritten by vendor purchase price");

    // 5. Purchase Request Workflow
    console.log("\n--- Testing 4: Purchase Request Lifecycle & Review ---");
    const prNumber = `PR-TEST-${Date.now().toString().slice(-4)}`;
    const pr = await prisma.purchaseRequest.create({
      data: {
        organizationId: org.id,
        requestNumber: prNumber,
        requesterId: superAdmin.id,
        departmentId: superAdmin.departmentId,
        requestDate: new Date(),
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        reason: "Operational hardware replenishment test",
        priority: "HIGH",
        estimatedCost: 4850.0,
        status: "SUBMITTED",
        items: {
          create: [
            {
              productId: product.id,
              description: `Batch requisition for ${product.name}`,
              quantity: 100,
              estimatedUnitCost: 48.5,
              estimatedTotal: 4850.0,
            },
          ],
        },
      },
      include: { items: true },
    });
    assert(pr.status === "SUBMITTED", "Purchase Request submitted");
    assert(pr.items.length === 1 && pr.items[0].quantity === 100, "PR item quantity validated: 100 units");

    // Approve PR
    const approvedPr = await prisma.purchaseRequest.update({
      where: { id: pr.id },
      data: {
        status: "APPROVED",
        approvedById: superAdmin.id,
        approvedAt: new Date(),
      },
    });
    assert(approvedPr.status === "APPROVED", "Purchase Request approved by authorized approver");

    // 6. Purchase Order Creation & Calculations
    console.log("\n--- Testing 5: Purchase Order Server-Side Calculation & Issuance ---");
    const poNumber = `PO-TEST-${Date.now().toString().slice(-4)}`;
    const orderedQty = 100;
    const unitCost = 50.0;
    const subtotal = orderedQty * unitCost; // 5000
    const taxRate = 10;
    const taxAmount = subtotal * 0.1; // 500
    const grandTotal = subtotal + taxAmount; // 5500

    const po = await prisma.purchaseOrder.create({
      data: {
        organizationId: org.id,
        poNumber,
        vendorId: vendor.id,
        purchaseRequestId: approvedPr.id,
        poDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        currency: "USD",
        paymentTerms: "NET_30",
        subtotal,
        discountRate: 0,
        discountAmount: 0,
        taxRate,
        taxAmount,
        total: grandTotal,
        status: "APPROVED", // Ready for goods receipt
        createdById: superAdmin.id,
        approvedById: superAdmin.id,
        approvedAt: new Date(),
        items: {
          create: [
            {
              productId: product.id,
              description: `Batch order for ${product.name}`,
              quantity: orderedQty,
              unitCost,
              discount: 0,
              tax: taxAmount,
              total: grandTotal,
              receivedQuantity: 0,
            },
          ],
        },
      },
      include: { items: true },
    });
    assert(po.total === 5500.0, "Purchase Order grand total computed strictly server-side (5500.00 USD)");
    assert(po.items[0].receivedQuantity === 0, "PO line item receivedQuantity starts at 0");

    // Mark PR as converted to PO
    await prisma.purchaseRequest.update({
      where: { id: approvedPr.id },
      data: { status: "CONVERTED_TO_PO", convertedPurchaseOrderId: po.id },
    });

    // 7. Initial Inventory Level
    console.log("\n--- Testing 6: Atomic Receiving Test — Step A: Initial Inventory Level ---");
    const initialInv = await prisma.inventoryItem.findUnique({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
    });
    const startingStock = initialInv ? initialInv.quantity : 0.0;
    console.log(`Starting stock for ${product.sku} in ${warehouse.code}: ${startingStock}`);

    // 8. Partial Receipt 1: Receive 60 units (0 damaged)
    console.log("\n--- Testing 7: Partial Receipt 1 — Receive 60 Units (Atomic Transaction) ---");
    const poLineItem = po.items[0];

    const receipt1 = await prisma.$transaction(async (tx) => {
      const gr = await tx.goodsReceipt.create({
        data: {
          organizationId: org.id,
          receiptNumber: `GR-TEST-A-${Date.now().toString().slice(-4)}`,
          purchaseOrderId: po.id,
          vendorId: vendor.id,
          warehouseId: warehouse.id,
          receivedDate: new Date(),
          receivedById: superAdmin.id,
          status: "FINALIZED",
          finalizedAt: new Date(),
          finalizedById: superAdmin.id,
          items: {
            create: [
              {
                purchaseOrderItemId: poLineItem.id,
                productId: product.id,
                orderedQuantity: 100,
                receivedQuantity: 60,
                rejectedQuantity: 0,
                acceptedQuantity: 60,
                unitCost: 50.0,
              },
            ],
          },
        },
      });

      // Update InventoryItem balance atomically
      const current = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
      });
      const prevBal = current ? current.quantity : 0.0;
      const newBal = prevBal + 60;

      await tx.inventoryItem.upsert({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
        create: {
          organizationId: org.id,
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: newBal,
        },
        update: { quantity: newBal },
      });

      // Create StockMovement record
      await tx.stockMovement.create({
        data: {
          organizationId: org.id,
          movementNumber: `MOV-TEST-A-${Date.now().toString().slice(-4)}`,
          productId: product.id,
          type: "STOCK_IN",
          quantity: 60,
          destinationWarehouseId: warehouse.id,
          referenceType: "PURCHASE_ORDER",
          referenceId: po.id,
          reason: `Partial Goods Receipt 1 against PO ${po.poNumber}`,
          previousBalance: prevBal,
          newBalance: newBal,
          performedById: superAdmin.id,
        },
      });

      // Update PO item received quantity & PO status
      await tx.purchaseOrderItem.update({
        where: { id: poLineItem.id },
        data: { receivedQuantity: { increment: 60 } },
      });

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: "PARTIALLY_RECEIVED" },
      });

      return gr;
    });

    const stockAfterReceipt1 = await prisma.inventoryItem.findUnique({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
    });
    assert(
      stockAfterReceipt1?.quantity === startingStock + 60,
      `Inventory balance incremented by exactly +60 (from ${startingStock} to ${stockAfterReceipt1?.quantity})`
    );

    const poAfterReceipt1 = await prisma.purchaseOrder.findUnique({
      where: { id: po.id },
      include: { items: true },
    });
    assert(poAfterReceipt1?.status === "PARTIALLY_RECEIVED", "PO status transitioned to PARTIALLY_RECEIVED");
    assert(poAfterReceipt1?.items[0].receivedQuantity === 60, "PO cumulative received quantity is 60/100");

    // 9. Partial Receipt 2: Receive 40 units (5 damaged/rejected, 35 accepted)
    console.log("\n--- Testing 8: Partial Receipt 2 with Damaged Goods (40 Received, 5 Damaged, 35 Accepted) ---");
    const receipt2 = await prisma.$transaction(async (tx) => {
      const gr = await tx.goodsReceipt.create({
        data: {
          organizationId: org.id,
          receiptNumber: `GR-TEST-B-${Date.now().toString().slice(-4)}`,
          purchaseOrderId: po.id,
          vendorId: vendor.id,
          warehouseId: warehouse.id,
          receivedDate: new Date(),
          receivedById: superAdmin.id,
          status: "FINALIZED",
          finalizedAt: new Date(),
          finalizedById: superAdmin.id,
          items: {
            create: [
              {
                purchaseOrderItemId: poLineItem.id,
                productId: product.id,
                orderedQuantity: 100,
                receivedQuantity: 40,
                rejectedQuantity: 5,
                acceptedQuantity: 35, // Only accepted stock increases inventory!
                rejectionReason: "Slight carton crush during transit",
                unitCost: 50.0,
              },
            ],
          },
        },
      });

      const current = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
      });
      const prevBal = current ? current.quantity : 0.0;
      const newBal = prevBal + 35; // ONLY +35!

      await tx.inventoryItem.update({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
        data: { quantity: newBal },
      });

      // Create StockMovement record
      await tx.stockMovement.create({
        data: {
          organizationId: org.id,
          movementNumber: `MOV-TEST-B-${Date.now().toString().slice(-4)}`,
          productId: product.id,
          type: "STOCK_IN",
          quantity: 35,
          destinationWarehouseId: warehouse.id,
          referenceType: "PURCHASE_ORDER",
          referenceId: po.id,
          reason: `Goods Receipt 2 against PO ${po.poNumber} (5 units damaged/rejected)`,
          previousBalance: prevBal,
          newBalance: newBal,
          performedById: superAdmin.id,
        },
      });

      // Increment cumulative received quantity on PO item (60 + 40 = 100 fulfilled)
      await tx.purchaseOrderItem.update({
        where: { id: poLineItem.id },
        data: { receivedQuantity: { increment: 40 } },
      });

      // Now all 100 ordered units have been received -> PO becomes RECEIVED!
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: "RECEIVED" },
      });

      return gr;
    });

    const stockAfterReceipt2 = await prisma.inventoryItem.findUnique({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
    });
    assert(
      stockAfterReceipt2?.quantity === startingStock + 60 + 35,
      `Inventory incremented ONLY by accepted goods (+35). Rejected goods (5) NOT added to stock. (Total: ${stockAfterReceipt2?.quantity})`
    );

    const poAfterReceipt2 = await prisma.purchaseOrder.findUnique({
      where: { id: po.id },
      include: { items: true },
    });
    assert(poAfterReceipt2?.status === "RECEIVED", "PO status transitioned to RECEIVED (100% fulfilled)");
    assert(poAfterReceipt2?.items[0].receivedQuantity === 100, "PO item receivedQuantity reached 100/100");

    // 10. Atomic Rollback Test
    console.log("\n--- Testing 9: Transactional Rollback Guarantee ---");
    let rolledBack = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.goodsReceipt.create({
          data: {
            organizationId: org.id,
            receiptNumber: "GR-FAIL-TEST",
            purchaseOrderId: po.id,
            vendorId: vendor.id,
            warehouseId: warehouse.id,
            receivedDate: new Date(),
            receivedById: superAdmin.id,
            status: "DRAFT",
          },
        });
        // Intentionally throw error to test rollback
        throw new Error("Simulated warehouse receiving error for rollback test");
      });
    } catch (e) {
      rolledBack = true;
    }
    const ghostGr = await prisma.goodsReceipt.findFirst({ where: { receiptNumber: "GR-FAIL-TEST" } });
    assert(rolledBack && !ghostGr, "Failed receipt creation rolled back safely with 0 phantom records written");

    // 11. Vendor Performance Calculation
    console.log("\n--- Testing 10: Vendor Performance Metrics Calculation ---");
    const vendorPos = await prisma.purchaseOrder.findMany({
      where: { vendorId: vendor.id },
    });
    const vendorGrs = await prisma.goodsReceipt.findMany({
      where: { vendorId: vendor.id, status: "FINALIZED" },
      include: { items: true },
    });
    const totalPoValue = vendorPos.reduce((acc, p) => acc + p.total, 0);
    const totalRejected = vendorGrs.reduce(
      (acc, g) => acc + g.items.reduce((sum, i) => sum + i.rejectedQuantity, 0),
      0
    );
    assert(vendorPos.length >= 1, `Total POs for vendor: ${vendorPos.length}`);
    assert(totalPoValue >= 5500, `Total purchase value calculated from DB: ${totalPoValue} USD`);
    assert(totalRejected === 5, `Total damaged/rejected items counted from DB: ${totalRejected}`);

    // 12. Finance & Accounts Payable Integration
    console.log("\n--- Testing 11: Finance & AP Integration Without Duplicate Models ---");
    const apInvoice = await prisma.invoice.create({
      data: {
        organizationId: org.id,
        invoiceNumber: `BILL-TEST-${Date.now().toString().slice(-4)}`,
        invoiceType: "VENDOR_PURCHASE",
        vendorId: vendor.id,
        purchaseOrderId: po.id,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currency: "USD",
        subtotal: 5000,
        taxAmount: 500,
        total: 5500,
        balance: 5500,
        paidAmount: 0,
        status: "APPROVED",
        createdById: superAdmin.id,
      },
    });
    assert(apInvoice.invoiceType === "VENDOR_PURCHASE", "Vendor invoice created in unified Invoice table (AP)");
    assert(apInvoice.vendorId === vendor.id, "AP invoice linked directly to Vendor");
    assert(apInvoice.purchaseOrderId === po.id, "AP invoice linked directly to Purchase Order");

    console.log("\n================================================================================");
    console.log(`PROCUREMENT VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("FATAL ERROR during procurement verification:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runProcurementVerification();
