import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("===============================================================");
  console.log("TESTING REQUEST CENTER BORROWABLE EMPLOYEE FILTERING");
  console.log("===============================================================\n");

  const isExcludedExecutiveOrManager = (emp) => {
    const email = (emp.email || emp.user?.email || "").toLowerCase();
    if (email.endsWith(".internal")) return true;
    if (emp.directReports && emp.directReports.length > 0) return true;

    const roleCode = (emp.user?.role?.code || "").toUpperCase();
    const roleLevel = emp.user?.role?.level ?? 10;
    if (roleLevel >= 30 || (roleCode && roleCode !== "EMPLOYEE")) {
      return true;
    }

    const des = (emp.designation || "").toLowerCase();
    if (
      des.includes("chief") ||
      des.includes("ceo") ||
      des.includes("cto") ||
      des.includes("cio") ||
      des.includes("cfo") ||
      des.includes("coo") ||
      des.includes("cmo") ||
      des.includes("administrator") ||
      des.includes("admin") ||
      des.includes("chairperson") ||
      des.includes("director") ||
      des.includes("human resources") ||
      des.includes("head") ||
      des.includes("vp") ||
      des.includes("vice president") ||
      des.includes("manager") ||
      des.includes("lead") ||
      des.includes("controller") ||
      des.includes("officer") ||
      des.includes("supervisor")
    ) {
      return true;
    }

    return false;
  };

  for (const orgCode of ["NAREE", "NFVS"]) {
    const org = await prisma.organization.findFirst({ where: { code: orgCode } });
    const partnerOrg = await prisma.organization.findFirst({ where: { code: orgCode === "NFVS" ? "NAREE" : "NFVS" } });

    console.log(`🏢 Viewing Request Center from [${org.name}] -> Looking at Partner [${partnerOrg.name}]:`);

    const partnerEmployees = await prisma.employee.findMany({
      where: { organizationId: partnerOrg.id, employmentStatus: "ACTIVE" },
      include: {
        department: true,
        directReports: true,
        user: { include: { role: true } },
      },
    });

    const eligible = partnerEmployees.filter((e) => !isExcludedExecutiveOrManager(e));
    const excluded = partnerEmployees.filter((e) => isExcludedExecutiveOrManager(e));

    console.log(`   Total Partner Employees in DB: ${partnerEmployees.length}`);
    console.log(`   Excluded (Executives, Managers, Structural Personas): ${excluded.length}`);
    excluded.forEach((e) => {
      console.log(`     ⛔ Excluded: ${e.firstName} ${e.lastName} (${e.email}) - "${e.designation}"`);
    });

    console.log(`   ✅ Eligible for Request (Created by Admin/HR): ${eligible.length}`);
    eligible.forEach((e) => {
      console.log(`     🎯 SHOWING: ${e.firstName} ${e.lastName} (${e.email}) - "${e.designation}"`);
    });
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
