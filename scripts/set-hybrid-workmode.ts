import { db } from "../src/lib/db";

async function main() {
  const emps = await db.employee.findMany({
    include: {
      user: { include: { role: true } },
      department: true,
    },
  });

  let count = 0;
  for (const emp of emps) {
    const roleCode = (emp.user?.role?.code || "").toUpperCase();
    const roleLevel = emp.user?.role?.level || 10;
    const des = (emp.designation || "").toLowerCase();
    const deptCode = (emp.department?.code || "").toUpperCase();
    const email = (emp.email || "").toLowerCase();

    const isExecOrHrOrAdmin =
      roleLevel >= 40 ||
      [
        "SUPER_ADMIN",
        "ADMIN",
        "HR",
        "CHRO",
        "CEO",
        "COO",
        "CFO",
        "CIO",
        "CTO",
        "CMO",
        "DIRECTOR",
        "CHAIRPERSON",
        "VP",
      ].includes(roleCode) ||
      deptCode === "EXEC" ||
      des.includes("chief") ||
      des.includes("administrator") ||
      des.includes("admin") ||
      des.includes("human resources") ||
      des.includes("director") ||
      email.includes("hr@") ||
      email.includes("admin@") ||
      email.includes("ceo@") ||
      email.includes("cfo@") ||
      email.includes("coo@") ||
      email.includes("cio@") ||
      email.includes("cmo@");

    if (isExecOrHrOrAdmin) {
      await db.employee.update({
        where: { id: emp.id },
        data: { workMode: "HYBRID" },
      });
      count++;
      console.log("Updated to HYBRID:", emp.firstName, emp.lastName, "(" + emp.designation + ")");
    }
  }

  console.log(`Successfully updated ${count} executive, HR, and admin profiles to HYBRID workMode.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  });
