import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { buildCrmScopeFilter } from "@/lib/crm-query";

export interface CrmSearchItem {
  id: string;
  type: "lead" | "client" | "contact" | "opportunity" | "task" | "meeting" | "proposal";
  title: string;
  subtitle: string;
  status?: string | null;
  owner?: string | null;
  date?: string | null;
  navigationTarget: string;
  extra?: Record<string, any>;
}

export interface CrmSearchResult {
  leads: Array<{
    id: string;
    name: string;
    company: string;
    status: string;
    email: string;
    phone?: string | null;
    owner?: string | null;
    date?: string | null;
    navigationTarget: string;
  }>;
  clients: Array<{
    id: string;
    name: string;
    code: string;
    tier: string;
    status: string;
    phone?: string | null;
    owner?: string | null;
    date?: string | null;
    navigationTarget: string;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    clientName: string;
    clientId: string;
    designation?: string | null;
    navigationTarget: string;
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    value: number;
    stage: string;
    clientName: string;
    clientId: string;
    owner?: string | null;
    expectedCloseDate?: string | null;
    navigationTarget: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    clientName?: string | null;
    dueDate?: string | null;
    assignee?: string | null;
    navigationTarget: string;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    type: string;
    startDate: string;
    endDate?: string | null;
    location?: string | null;
    organizer?: string | null;
    navigationTarget: string;
  }>;
  proposals: Array<{
    id: string;
    proposalNumber: string;
    title: string;
    status: string;
    grandTotal: number;
    clientName: string;
    clientId: string;
    date?: string | null;
    navigationTarget: string;
  }>;
}

export class CrmSearchService {
  static async search(user: AuthenticatedUser, query: string): Promise<CrmSearchResult> {
    if (!user.employee) throw new Error("Authenticated user has no employee profile");

    const cleanQuery = query.trim();
    if (!cleanQuery || cleanQuery.length < 2) {
      return {
        leads: [],
        clients: [],
        contacts: [],
        opportunities: [],
        tasks: [],
        meetings: [],
        proposals: [],
      };
    }

    const orgId = user.employee.organizationId;

    // Build base scoped filters for each entity
    const [leadScope, clientScope, oppScope] = await Promise.all([
      buildCrmScopeFilter(user, { entityOwnerField: "ownerId" }),
      buildCrmScopeFilter(user, { entityOwnerField: "ownerId" }),
      buildCrmScopeFilter(user, { entityOwnerField: "ownerId" }),
    ]);

    // Lead where clause
    const leadWhere: any = {
      ...leadScope,
      OR: [
        { firstName: { contains: cleanQuery, mode: "insensitive" } },
        { lastName: { contains: cleanQuery, mode: "insensitive" } },
        { companyName: { contains: cleanQuery, mode: "insensitive" } },
        { email: { contains: cleanQuery, mode: "insensitive" } },
        { phone: { contains: cleanQuery, mode: "insensitive" } },
      ],
    };

    // Client where clause
    const clientWhere: any = {
      ...clientScope,
      OR: [
        { name: { contains: cleanQuery, mode: "insensitive" } },
        { code: { contains: cleanQuery, mode: "insensitive" } },
        { email: { contains: cleanQuery, mode: "insensitive" } },
        { phone: { contains: cleanQuery, mode: "insensitive" } },
        { industry: { contains: cleanQuery, mode: "insensitive" } },
      ],
    };

    // Opportunity where clause (relational search across name, client name, and owner name)
    const oppWhere: any = {
      ...oppScope,
      OR: [
        { name: { contains: cleanQuery, mode: "insensitive" } },
        { client: { name: { contains: cleanQuery, mode: "insensitive" } } },
        { owner: { firstName: { contains: cleanQuery, mode: "insensitive" } } },
        { owner: { lastName: { contains: cleanQuery, mode: "insensitive" } } },
      ],
    };

    // Task where clause
    const isExec = user.roleLevel >= 80 || ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "ADMIN"].includes(user.roleCode);
    const taskWhere: any = {
      organizationId: orgId,
      OR: [
        { title: { contains: cleanQuery, mode: "insensitive" } },
        { description: { contains: cleanQuery, mode: "insensitive" } },
        { client: { name: { contains: cleanQuery, mode: "insensitive" } } },
      ],
    };
    if (!isExec && user.roleCode !== "DEPARTMENT_HEAD") {
      taskWhere.AND = [
        {
          OR: [{ assigneeId: user.employee.id }, { creatorId: user.employee.id }],
        },
      ];
    }

    // Meeting / CalendarEvent where clause
    const meetingWhere: any = {
      organizationId: orgId,
      OR: [
        { title: { contains: cleanQuery, mode: "insensitive" } },
        { description: { contains: cleanQuery, mode: "insensitive" } },
        { location: { contains: cleanQuery, mode: "insensitive" } },
      ],
    };

    // Proposal (CrmActivity type: PROPOSAL) where clause
    const proposalWhere: any = {
      organizationId: orgId,
      type: "PROPOSAL",
      OR: [
        { subject: { contains: cleanQuery, mode: "insensitive" } },
        { description: { contains: cleanQuery, mode: "insensitive" } },
        { client: { name: { contains: cleanQuery, mode: "insensitive" } } },
      ],
    };

    // Contact where clause: Only contacts from authorized clients
    const contactWhere: any = {
      client: {
        organizationId: orgId,
        ...(clientScope.ownerId ? { ownerId: clientScope.ownerId } : {}),
      },
      OR: [
        { firstName: { contains: cleanQuery, mode: "insensitive" } },
        { lastName: { contains: cleanQuery, mode: "insensitive" } },
        { email: { contains: cleanQuery, mode: "insensitive" } },
        { phone: { contains: cleanQuery, mode: "insensitive" } },
        { designation: { contains: cleanQuery, mode: "insensitive" } },
      ],
    };

    const [
      matchedLeads,
      matchedClients,
      matchedContacts,
      matchedOpps,
      matchedTasks,
      matchedMeetings,
      matchedProposals,
    ] = await Promise.all([
      db.lead.findMany({
        where: leadWhere,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          status: true,
          email: true,
          phone: true,
          createdAt: true,
          owner: { select: { firstName: true, lastName: true } },
        },
      }),
      db.client.findMany({
        where: clientWhere,
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          code: true,
          tier: true,
          status: true,
          phone: true,
          createdAt: true,
          owner: { select: { firstName: true, lastName: true } },
        },
      }),
      db.contact.findMany({
        where: contactWhere,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          designation: true,
          clientId: true,
          client: { select: { id: true, name: true } },
        },
      }),
      db.opportunity.findMany({
        where: oppWhere,
        take: 5,
        orderBy: { expectedCloseDate: "asc" },
        select: {
          id: true,
          name: true,
          value: true,
          stage: true,
          expectedCloseDate: true,
          clientId: true,
          client: { select: { id: true, name: true } },
          owner: { select: { firstName: true, lastName: true } },
        },
      }),
      db.task.findMany({
        where: taskWhere,
        take: 5,
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          dueDate: true,
          client: { select: { name: true } },
          assignee: { select: { firstName: true, lastName: true } },
        },
      }),
      db.calendarEvent.findMany({
        where: meetingWhere,
        take: 5,
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          startDate: true,
          endDate: true,
          location: true,
          creator: { select: { firstName: true, lastName: true } },
        },
      }),
      db.crmActivity.findMany({
        where: proposalWhere,
        take: 5,
        orderBy: { performedAt: "desc" },
        select: {
          id: true,
          subject: true,
          description: true,
          performedAt: true,
          metadata: true,
          clientId: true,
          client: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      leads: matchedLeads.map((l) => ({
        id: l.id,
        name: `${l.firstName} ${l.lastName}`.trim(),
        company: l.companyName,
        status: l.status,
        email: l.email,
        phone: l.phone,
        owner: l.owner ? `${l.owner.firstName} ${l.owner.lastName}` : null,
        date: l.createdAt.toISOString(),
        navigationTarget: `/app/crm/leads?id=${l.id}`,
      })),
      clients: matchedClients.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        tier: c.tier,
        status: c.status,
        phone: c.phone,
        owner: c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : null,
        date: c.createdAt.toISOString(),
        navigationTarget: `/app/crm/clients/${c.id}`,
      })),
      contacts: matchedContacts.map((con) => ({
        id: con.id,
        name: `${con.firstName} ${con.lastName}`.trim(),
        email: con.email,
        phone: con.phone,
        clientName: con.client.name,
        clientId: con.clientId,
        designation: con.designation,
        navigationTarget: `/app/crm/clients/${con.clientId}?tab=contacts&contactId=${con.id}`,
      })),
      opportunities: matchedOpps.map((o) => ({
        id: o.id,
        name: o.name,
        value: o.value,
        stage: o.stage,
        clientName: o.client.name,
        clientId: o.clientId,
        owner: o.owner ? `${o.owner.firstName} ${o.owner.lastName}` : null,
        expectedCloseDate: o.expectedCloseDate ? o.expectedCloseDate.toISOString() : null,
        navigationTarget: `/app/crm/opportunities?id=${o.id}`,
      })),
      tasks: matchedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        clientName: t.client?.name || null,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : null,
        navigationTarget: `/app/tasks?id=${t.id}`,
      })),
      meetings: matchedMeetings.map((m) => ({
        id: m.id,
        title: m.title,
        type: m.type,
        startDate: m.startDate.toISOString(),
        endDate: m.endDate ? m.endDate.toISOString() : null,
        location: m.location,
        organizer: m.creator ? `${m.creator.firstName} ${m.creator.lastName}` : null,
        navigationTarget: `/app/calendar?id=${m.id}`,
      })),
      proposals: matchedProposals.map((p) => {
        let meta: any = {};
        try {
          if (p.metadata) meta = JSON.parse(p.metadata);
        } catch {}

        return {
          id: p.id,
          proposalNumber: meta.proposalNumber || `PROP-${p.id.slice(-6).toUpperCase()}`,
          title: meta.title || p.subject,
          status: meta.status || "DRAFT",
          grandTotal: meta.grandTotal || 0,
          clientName: p.client?.name || "Client",
          clientId: p.clientId || "",
          date: p.performedAt ? p.performedAt.toISOString() : null,
          navigationTarget: p.clientId ? `/app/crm/clients/${p.clientId}?tab=proposals&proposalId=${p.id}` : "/app/crm",
        };
      }),
    };
  }
}
