/**
 * update-role-credentials.mjs
 *
 * Updates ALL role-based/internal user accounts with clean, role-based email IDs
 * and a single universal password.
 *
 * Email format:
 *   NFVS org  →  {role}@nfvs.in
 *   NAREE org →  {role}@nf.in
 *
 * Universal password: Admin@2025
 *
 * Real user accounts (gmail etc.) are left untouched.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const UNIVERSAL_PASSWORD = "Admin@2025";

// ── Designation / role prefix mapping ─────────────────────────────────────────
// Maps role name (or designation hint) → email prefix
const ROLE_PREFIX_MAP = {
  "Super Administrator": "superadmin",
  "Platform Administrator": "admin",
  "Chairperson of the Board": "chairperson",
  "Chief Executive Officer": "ceo",
  "Chief Operating Officer": "coo",
  "Chief Financial Officer": "cfo",
  "Chief Information Officer": "cio",
  "Chief Technology Officer": "cto",
  "Chief Marketing Officer": "cmo",
  "Chief Human Resources Officer": "hr",
  "Department Head": "depthead",
  "Team Manager": "manager",
  "Team Lead": "teamlead",
  "Team Staff Contributor": null, // handled by designation
};

// For Staff Contributors, derive prefix from designation keyword
function getPrefixFromDesignation(designation) {
  if (!designation) return null;
  const d = designation.toLowerCase();
  if (d.includes("operations")) return "operations";
  if (d.includes("finance") || d.includes("financial")) return "finance";
  if (d.includes("international")) return "international";
  if (d.includes("marketing")) return "marketing";
  if (d.includes("legal") || d.includes("compliance")) return "legal";
  if (d.includes("it") || d.includes("software") || d.includes("technology")) return "it";
  if (d.includes("hr") || d.includes("human resources")) return "hr";
  if (d.includes("procurement")) return "procurement";
  if (d.includes("accountant") || d.includes("account")) return "accounts";
  return null;
}

// Domain by org code
function getDomain(orgCode) {
  if (orgCode === "NFVS") return "nfvs.in";
  if (orgCode === "NAREE") return "nf.in";
  return null;
}

// Is this a real external email (not an internal system account)?
function isRealUser(email) {
  return !email.endsWith(".internal") && !email.endsWith("@nfvs.in") && !email.endsWith("@nf.in");
}

async function main() {
  console.log("🔐 Updating role-based credentials...\n");
  console.log(`Universal Password: ${UNIVERSAL_PASSWORD}\n`);

  const passwordHash = await bcrypt.hash(UNIVERSAL_PASSWORD, 12);

  // Fetch all users with role + employee org info
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: { select: { name: true } },
      employee: {
        select: {
          organizationId: true,
          organization: { select: { name: true, code: true } },
          designation: true,
        },
      },
    },
  });

  const updates = [];
  const skipped = [];
  const usedEmails = new Set();

  // Track collisions — if same prefix+domain already assigned, append number
  const emailCounters = {};

  for (const user of users) {
    // Skip real external users
    if (isRealUser(user.email)) {
      skipped.push({ id: user.id, email: user.email, reason: "Real user — skipped" });
      continue;
    }

    const roleName = user.role?.name;
    const orgCode = user.employee?.organization?.code;
    const designation = user.employee?.designation;
    const domain = getDomain(orgCode);

    if (!domain) {
      skipped.push({ id: user.id, email: user.email, reason: `No domain mapping for org: ${orgCode}` });
      continue;
    }

    // Determine prefix
    let prefix = ROLE_PREFIX_MAP[roleName];
    if (prefix === null) {
      // Staff contributor — derive from designation
      prefix = getPrefixFromDesignation(designation);
    }

    if (!prefix) {
      skipped.push({
        id: user.id,
        email: user.email,
        reason: `Could not determine email prefix for role "${roleName}" / designation "${designation}"`,
      });
      continue;
    }

    // Build new email, handling collisions
    let newEmail = `${prefix}@${domain}`;
    const key = `${prefix}@${domain}`;
    if (usedEmails.has(key)) {
      emailCounters[key] = (emailCounters[key] || 1) + 1;
      newEmail = `${prefix}${emailCounters[key]}@${domain}`;
    } else {
      usedEmails.add(key);
      emailCounters[key] = 1;
    }

    updates.push({
      id: user.id,
      oldEmail: user.email,
      newEmail,
      role: roleName,
      org: orgCode,
    });
  }

  // Apply updates
  console.log("Applying credential updates...\n");
  for (const upd of updates) {
    await prisma.user.update({
      where: { id: upd.id },
      data: {
        email: upd.newEmail,
        passwordHash,
      },
    });
    console.log(`  ✓ [${upd.org}] ${upd.oldEmail.padEnd(38)} →  ${upd.newEmail}`);
  }

  // ── Print Summary ────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(70));
  console.log("📋  CREDENTIAL SUMMARY");
  console.log("═".repeat(70));
  console.log(`Universal Password: ${UNIVERSAL_PASSWORD}\n`);

  const nfvsAccounts = updates.filter(u => u.org === "NFVS").sort((a, b) => a.newEmail.localeCompare(b.newEmail));
  const nareeAccounts = updates.filter(u => u.org === "NAREE").sort((a, b) => a.newEmail.localeCompare(b.newEmail));
  const otherAccounts = updates.filter(u => u.org !== "NFVS" && u.org !== "NAREE");

  if (nfvsAccounts.length) {
    console.log("🏢  NFVS (Naree Foundation Venture Studio)");
    console.log("─".repeat(70));
    nfvsAccounts.forEach(u => {
      console.log(`  ${u.newEmail.padEnd(35)} |  ${u.role}`);
    });
  }

  if (nareeAccounts.length) {
    console.log("\n🏥  NAREE (Naree Foundation)");
    console.log("─".repeat(70));
    nareeAccounts.forEach(u => {
      console.log(`  ${u.newEmail.padEnd(35)} |  ${u.role}`);
    });
  }

  if (otherAccounts.length) {
    console.log("\n🔹  Other");
    console.log("─".repeat(70));
    otherAccounts.forEach(u => {
      console.log(`  ${u.newEmail.padEnd(35)} |  ${u.role}`);
    });
  }

  if (skipped.length) {
    console.log("\n⏭️  Skipped (real user accounts — untouched)");
    console.log("─".repeat(70));
    skipped.forEach(u => {
      console.log(`  ${u.email.padEnd(35)} |  ${u.reason}`);
    });
  }

  console.log("\n" + "═".repeat(70));
  console.log(`✅  Updated: ${updates.length} accounts`);
  console.log(`⏭️  Skipped: ${skipped.length} accounts (real users kept as-is)`);
  console.log("═".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
