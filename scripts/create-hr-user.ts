import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

async function main() {
  const email = "hr@nfvs.in";
  const passwordPlain = "sayalikale@123";
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  const org = await db.organization.findFirst({ where: { code: "NFVS" } });
  if (!org) {
    throw new Error("Organization NFVS not found");
  }

  const hrDept = await db.department.findFirst({
    where: { organizationId: org.id, code: "HR" },
  });

  const hrRole = await db.role.findFirst({ where: { code: "HR" } });
  if (!hrRole) {
    throw new Error("Role HR not found");
  }

  // 1. Create or Update User
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        passwordHash,
        roleId: hrRole.id,
        isActive: true,
      },
    });
    console.log("Created User successfully:", user.id, user.email);
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        roleId: hrRole.id,
        isActive: true,
      },
    });
    console.log("Updated User successfully:", user.id, user.email);
  }

  // 2. Create or Update Employee
  let employee = await db.employee.findFirst({
    where: { OR: [{ userId: user.id }, { email }] },
  });

  if (!employee) {
    const empCount = await db.employee.count({ where: { organizationId: org.id } });
    const empNumber = "NFVS-HR" + String(empCount + 10).padStart(3, "0");
    employee = await db.employee.create({
      data: {
        organizationId: org.id,
        departmentId: hrDept?.id,
        userId: user.id,
        employeeNumber: empNumber,
        firstName: "Sayali",
        lastName: "Kale",
        email,
        designation: "Chief Human Resources Officer",
        employmentType: "FULL_TIME",
        employmentStatus: "ACTIVE",
        workMode: "HYBRID",
        hireDate: new Date(),
      },
    });
    console.log("Created Employee:", employee.id, employee.firstName, employee.lastName, employee.employeeNumber);
  } else {
    employee = await db.employee.update({
      where: { id: employee.id },
      data: {
        userId: user.id,
        organizationId: org.id,
        departmentId: hrDept?.id,
        firstName: "Sayali",
        lastName: "Kale",
        designation: "Chief Human Resources Officer",
        employmentStatus: "ACTIVE",
        workMode: "HYBRID",
      },
    });
    console.log("Updated Employee:", employee.id, employee.firstName, employee.lastName);
  }

  // 3. UserCompanyMembership
  const existingMembership = await db.userCompanyMembership.findFirst({
    where: { userId: user.id, organizationId: org.id },
  });

  if (!existingMembership) {
    await db.userCompanyMembership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        roleId: hrRole.id,
        isPrimary: true,
        status: "ACTIVE",
      },
    });
    console.log("Created UserCompanyMembership");
  }

  console.log("ALL DONE! hr@nfvs.in is ready with password sayalikale@123");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Setup error:", e);
    process.exit(1);
  });
