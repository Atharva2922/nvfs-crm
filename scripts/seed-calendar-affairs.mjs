import { PrismaClient } from "@prisma/client";

async function executeWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const prisma = new PrismaClient();
    try {
      const res = await fn(prisma);
      await prisma.$disconnect();
      return res;
    } catch (err) {
      await prisma.$disconnect().catch(() => {});
      if (i === retries - 1) throw err;
      console.log(`Retry ${i + 1} after error:`, err.message);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function main() {
  const orgs = await executeWithRetry(p => p.organization.findMany());
  console.log("Found organizations:", orgs.map(o => o.name));

  const events = [
    {
      title: "🏛️ Corporate Affairs: Q3 Foundation Venture Review & Strategic Steering",
      description: "Quarterly strategic review meeting covering venture incubation milestones, cross-company operations, and key executive deliverables.",
      type: "COMPANY_EVENT",
      startDate: new Date("2026-09-28T10:00:00.000Z"),
      endDate: new Date("2026-09-28T11:30:00.000Z"),
      isAllDay: false,
      location: "Executive Boardroom / Hybrid Virtual Meet",
      meetUrl: "https://meet.nfvs.internal/executive-steering",
    },
    {
      title: "🇮🇳 National Observance: Bhagat Singh Jayanti Observance & Youth Summit",
      description: "Commemoration of Shaheed Bhagat Singh's birth anniversary, celebrating youth innovation, civic responsibility, and entrepreneurial courage.",
      type: "COMPANY_EVENT",
      startDate: new Date("2026-09-28T00:00:00.000Z"),
      endDate: new Date("2026-09-28T23:59:59.000Z"),
      isAllDay: true,
      location: "Innovation Amphitheatre & Hybrid Stream",
      meetUrl: "https://meet.nfvs.internal/youth-summit",
    },
    {
      title: "📌 Milestone: CRM Sprint Rollout & Live Deployment Verification",
      description: "Final verification and smoke testing of the unified attendance system, role-based workflows, and enterprise calendar.",
      type: "DEADLINE",
      startDate: new Date("2026-09-28T14:00:00.000Z"),
      endDate: new Date("2026-09-28T16:00:00.000Z"),
      isAllDay: false,
      location: "DevOps & Engineering Hub",
      meetUrl: "https://meet.nfvs.internal/sprint-rollout",
    },
    {
      title: "📊 Client Demo: Enterprise Workflow Suite Showcase with Alpha Corp",
      description: "Live demonstration of multi-tenant CRM automation and procurement modules for external venture partners.",
      type: "CLIENT_MEETING",
      startDate: new Date("2026-09-29T11:00:00.000Z"),
      endDate: new Date("2026-09-29T12:00:00.000Z"),
      isAllDay: false,
      location: "Virtual Conference Room A",
      meetUrl: "https://meet.nfvs.internal/client-alpha",
    },
    {
      title: "📑 Quarterly Statutory Compliance & GST/TDS Reconciliation Closure",
      description: "Finance and Legal departments filing Q3 advance tax reconciliations and statutory compliance returns.",
      type: "DEADLINE",
      startDate: new Date("2026-09-30T00:00:00.000Z"),
      endDate: new Date("2026-09-30T23:59:59.000Z"),
      isAllDay: true,
      location: "Finance & Accounts Office",
    },
    {
      title: "👥 All-Hands Town Hall: Q4 Strategic Roadmaps & Executive Keynote",
      description: "Company-wide assembly addressing foundation objectives, talent expansion, and hybrid workplace benchmarks.",
      type: "COMPANY_EVENT",
      startDate: new Date("2026-10-05T15:00:00.000Z"),
      endDate: new Date("2026-10-05T16:30:00.000Z"),
      isAllDay: false,
      location: "Main Auditorium & Global Hybrid Broadcast",
      meetUrl: "https://meet.nfvs.internal/townhall",
    },
    {
      title: "🚀 Product Launch: NFVS Venture Portal 2.0 Release",
      description: "Official production go-live for the next-generation venture studio incubation platform.",
      type: "COMPANY_EVENT",
      startDate: new Date("2026-10-10T10:00:00.000Z"),
      endDate: new Date("2026-10-10T12:00:00.000Z"),
      isAllDay: false,
      location: "Venture Accelerator Wing",
      meetUrl: "https://meet.nfvs.internal/launch-2",
    },
    {
      title: "⚖️ Legal Review: Annual Governance & Corporate Policy Audit",
      description: "Internal compliance review with corporate counsel and departmental heads.",
      type: "DEADLINE",
      startDate: new Date("2026-10-15T11:00:00.000Z"),
      endDate: new Date("2026-10-15T13:00:00.000Z"),
      isAllDay: false,
      location: "Legal Chambers",
    },
  ];

  const holidays = [
    {
      name: "Mahatma Gandhi Jayanti",
      description: "National Holiday celebrating the Father of the Nation and International Day of Non-Violence",
      date: new Date("2026-10-02T00:00:00.000Z"),
      year: 2026,
      isRecurring: true,
    },
    {
      name: "Dussehra / Vijayadashami",
      description: "Triumph of good over evil, celebrated with cultural festivities and corporate holiday observance",
      date: new Date("2026-10-20T00:00:00.000Z"),
      year: 2026,
      isRecurring: true,
    },
    {
      name: "Diwali (Deepavali) Festival of Lights",
      description: "Auspicious corporate holiday commemorating light, prosperity, and annual new fiscal ventures",
      date: new Date("2026-11-08T00:00:00.000Z"),
      year: 2026,
      isRecurring: true,
    }
  ];

  for (const org of orgs) {
    const creator = await executeWithRetry(p => p.employee.findFirst({
      where: { organizationId: org.id },
    }));
    if (!creator) continue;

    for (const ev of events) {
      await executeWithRetry(async (p) => {
        const exist = await p.calendarEvent.findFirst({
          where: { organizationId: org.id, title: ev.title },
        });
        if (!exist) {
          await p.calendarEvent.create({
            data: {
              organizationId: org.id,
              creatorId: creator.id,
              title: ev.title,
              description: ev.description,
              type: ev.type,
              startDate: ev.startDate,
              endDate: ev.endDate,
              isAllDay: ev.isAllDay,
              location: ev.location,
              meetUrl: ev.meetUrl,
            },
          });
          console.log(`Created event for ${org.name}: ${ev.title}`);
        }
      });
    }

    for (const hol of holidays) {
      await executeWithRetry(async (p) => {
        const exist = await p.holiday.findFirst({
          where: { organizationId: org.id, name: hol.name, year: hol.year },
        });
        if (!exist) {
          await p.holiday.create({
            data: {
              organizationId: org.id,
              name: hol.name,
              description: hol.description,
              date: hol.date,
              year: hol.year,
              isRecurring: hol.isRecurring,
            },
          });
          console.log(`Created holiday for ${org.name}: ${hol.name}`);
        }
      });
    }
  }

  console.log("Completed all seeding successfully!");
}

main().catch(console.error);
