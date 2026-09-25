async function test() {
  // Login as hr
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "hr", password: "password" }),
  });
  const loginJson = await loginRes.json();
  console.log("HR Login success:", loginJson.success);

  const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get("set-cookie")];
  const cookieHeader = setCookies.map(c => c.split(";")[0]).join("; ");

  const empRes = await fetch("http://localhost:3000/api/employees?limit=200", {
    headers: { Cookie: cookieHeader },
  });
  const empJson = await empRes.json();
  const list = empJson.data;
  
  console.log("\n=== /api/employees?limit=200 response ===");
  console.log("Success:", empJson.success);
  console.log("Is array:", Array.isArray(list));
  console.log("Total returned:", list?.length ?? 0);
  
  if (Array.isArray(list) && list.length > 0) {
    console.log("\nFree employees:", list.filter(e => e.isFree).length);
    console.log("Busy employees:", list.filter(e => !e.isFree).length);
    
    console.log("\nSample (first 3):");
    list.slice(0, 3).forEach(e => {
      console.log(`  ${e.isFree ? "🟢" : "🟡"} ${e.firstName} ${e.lastName} (${e.designation}) | isFree=${e.isFree} | busyReason=${e.busyReason}`);
    });
    
    const busy = list.filter(e => !e.isFree);
    if (busy.length > 0) {
      console.log("\nBusy employees:");
      busy.forEach(e => {
        console.log(`  🟡 ${e.firstName} ${e.lastName} | ${e.busyReason}`);
      });
    }
  } else {
    console.log("ERROR: employees list is empty or not array!", empJson);
  }
}

test().catch(console.error);
