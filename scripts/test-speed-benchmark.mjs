const BASE = "http://localhost:3000";

async function timeRequest(name, fn) {
  const start = performance.now();
  try {
    const res = await fn();
    const elapsed = Math.round(performance.now() - start);
    console.log(`[${name}] status: ${res.status} | took: ${elapsed}ms`);
    return { res, elapsed };
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    console.log(`[${name}] FAILED after ${elapsed}ms:`, err.message);
    return { elapsed, err };
  }
}

async function run() {
  console.log("=== PERFORMANCE BENCHMARK (AFTER OPTIMIZATION) ===");

  // 1. Login companya
  let sessionCookie = "";
  const loginRes = await timeRequest("POST /api/auth/login (companya)", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "companya", password: "password" }),
    });
    sessionCookie = res.headers.get("set-cookie") || "";
    return res;
  });

  const cookies = sessionCookie;

  // 2. Fetch CEO Dashboard
  await timeRequest("GET /api/dashboard/ceo (cold)", async () => {
    return fetch(`${BASE}/api/dashboard/ceo?refresh=true`, {
      headers: { Cookie: cookies },
    });
  });

  // 3. Fetch CEO Dashboard again (warm cache)
  await timeRequest("GET /api/dashboard/ceo (warm cache)", async () => {
    return fetch(`${BASE}/api/dashboard/ceo`, {
      headers: { Cookie: cookies },
    });
  });

  // 4. Fetch Unread Communications (cold)
  await timeRequest("GET /api/communications/unread-count (cold)", async () => {
    return fetch(`${BASE}/api/communications/unread-count`, {
      headers: { Cookie: cookies },
    });
  });

  // 5. Fetch Unread Communications (warm cache)
  await timeRequest("GET /api/communications/unread-count (warm cache)", async () => {
    return fetch(`${BASE}/api/communications/unread-count`, {
      headers: { Cookie: cookies },
    });
  });

  // 6. Fetch Notifications (cold)
  await timeRequest("GET /api/notifications/unread-count", async () => {
    return fetch(`${BASE}/api/notifications/unread-count`, {
      headers: { Cookie: cookies },
    });
  });

  // 7. Fetch Leads (cold)
  await timeRequest("GET /api/crm/leads (cold)", async () => {
    return fetch(`${BASE}/api/crm/leads`, {
      headers: { Cookie: cookies },
    });
  });

  // 8. Fetch Leads (warm cache)
  await timeRequest("GET /api/crm/leads (warm cache)", async () => {
    return fetch(`${BASE}/api/crm/leads`, {
      headers: { Cookie: cookies },
    });
  });
}

run();
