import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";

export interface AISourceRecord {
  id: string;
  type: string;
  title: string;
  url: string;
  snippet?: string;
}

export class AITools {
  /**
   * Helper to verify if user has any of the requested role codes or permissions
   */
  private static hasPermission(
    user: AuthenticatedUser,
    allowedRoles: string[],
    permissionPrefix?: string
  ): boolean {
    if (user.roleCode === "SUPER_ADMIN") return true;
    if (allowedRoles.includes(user.roleCode)) return true;
    if (permissionPrefix && user.permissions?.some((p) => p.startsWith(permissionPrefix))) {
      return true;
    }
    return false;
  }

  /**
   * Tool: get_clients
   */
  static async getClients(user: AuthenticatedUser, params: { search?: string; limit?: number } = {}) {
    if (!user.employee) throw new Error("Unauthenticated user profile");
    const orgId = user.employee.organizationId;
    const limit = Math.min(params.limit || 10, 50);

    const clients = await db.client.findMany({
      where: {
        organizationId: orgId,
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: "insensitive" } },
                { code: { contains: params.search, mode: "insensitive" } },
                { industry: { contains: params.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        code: true,
        name: true,
        industry: true,
        status: true,
        tier: true,
        annualRevenue: true,
        updatedAt: true,
      },
    });

    const sources: AISourceRecord[] = clients.map((c) => ({
      id: c.id,
      type: "CLIENT",
      title: `${c.name} (${c.code})`,
      url: `/app/crm/clients/${c.id}`,
      snippet: `Tier: ${c.tier}, Status: ${c.status}, Revenue: ₹${c.annualRevenue?.toLocaleString() || 0}`,
    }));

    return { data: clients, sources };
  }

  /**
   * Tool: get_leads
   */
  static async getLeads(user: AuthenticatedUser, params: { status?: string; search?: string; limit?: number } = {}) {
    if (!user.employee) throw new Error("Unauthenticated user profile");
    const orgId = user.employee.organizationId;
    const limit = Math.min(params.limit || 10, 50);

    const leads = await db.lead.findMany({
      where: {
        organizationId: orgId,
        ...(params.status ? { status: params.status } : {}),
        ...(params.search
          ? {
              OR: [
                { firstName: { contains: params.search, mode: "insensitive" } },
                { lastName: { contains: params.search, mode: "insensitive" } },
                { companyName: { contains: params.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        status: true,
        estimatedValue: true,
        updatedAt: true,
      },
    });

    const sources: AISourceRecord[] = leads.map((l) => ({
      id: l.id,
      type: "LEAD",
      title: `${l.firstName} ${l.lastName} - ${l.companyName || "Prospective"}`,
      url: `/app/crm/leads`,
      snippet: `Status: ${l.status}, Value: ₹${l.estimatedValue?.toLocaleString() || 0}`,
    }));

    return { data: leads, sources };
  }

  /**
   * Tool: get_projects (Operations)
   */
  static async getProjects(user: AuthenticatedUser, params: { delayedOnly?: boolean; limit?: number } = {}) {
    if (!user.employee) throw new Error("Unauthenticated user profile");
    const orgId = user.employee.organizationId;
    const limit = Math.min(params.limit || 10, 50);
    const now = new Date();

    const operations = await db.operation.findMany({
      where: {
        organizationId: orgId,
        ...(params.delayedOnly
          ? {
              status: { notIn: ["COMPLETED", "CANCELLED"] },
              expectedCompletionDate: { lt: now },
            }
          : {}),
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        operationCode: true,
        name: true,
        status: true,
        progress: true,
        priority: true,
        expectedCompletionDate: true,
        department: { select: { name: true } },
      },
    });

    const sources: AISourceRecord[] = operations.map((op) => ({
      id: op.id,
      type: "OPERATION",
      title: `${op.operationCode}: ${op.name}`,
      url: `/app/operations/${op.id}`,
      snippet: `Progress: ${op.progress}%, Status: ${op.status}, Due: ${op.expectedCompletionDate ? new Date(op.expectedCompletionDate).toLocaleDateString() : "N/A"}`,
    }));

    return { data: operations, sources };
  }

  /**
   * Tool: get_tasks
   */
  static async getTasks(user: AuthenticatedUser, params: { overdueOnly?: boolean; myTasksOnly?: boolean; limit?: number } = {}) {
    if (!user.employee) throw new Error("Unauthenticated user profile");
    const orgId = user.employee.organizationId;
    const empId = user.employee.id;
    const limit = Math.min(params.limit || 15, 50);
    const now = new Date();

    const isElevated = this.hasPermission(user, ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "CTO", "COO"]);

    const tasks = await db.task.findMany({
      where: {
        organizationId: orgId,
        ...(params.myTasksOnly || !isElevated ? { assigneeId: empId } : {}),
        ...(params.overdueOnly
          ? {
              status: { notIn: ["COMPLETED", "CANCELLED"] },
              dueDate: { lt: now },
            }
          : {}),
      },
      take: limit,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        dueDate: true,
        assignee: { select: { firstName: true, lastName: true } },
      },
    });

    const sources: AISourceRecord[] = tasks.map((t) => ({
      id: t.id,
      type: "TASK",
      title: t.title,
      url: `/app/tasks`,
      snippet: `Priority: ${t.priority}, Status: ${t.status}, Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No deadline"}`,
    }));

    return { data: tasks, sources };
  }

  /**
   * Tool: get_invoices (Strict Finance RBAC)
   */
  static async getInvoices(user: AuthenticatedUser, params: { overdueOnly?: boolean; minAmount?: number; limit?: number } = {}) {
    // RBAC check: Only Finance, Executives, or Admins
    if (!this.hasPermission(user, ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "CFO", "FINANCE_MANAGER"], "finance")) {
      throw new Error("Access Denied: You lack permissions to view financial invoice records.");
    }
    if (!user.employee) throw new Error("Unauthenticated user profile");
    const orgId = user.employee.organizationId;
    const limit = Math.min(params.limit || 15, 50);
    const now = new Date();

    const invoices = await db.invoice.findMany({
      where: {
        organizationId: orgId,
        ...(params.overdueOnly
          ? {
              status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] },
              dueDate: { lt: now },
            }
          : {}),
        ...(params.minAmount ? { total: { gte: params.minAmount } } : {}),
      },
      take: limit,
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        status: true,
        dueDate: true,
        client: { select: { id: true, name: true } },
      },
    });

    const sources: AISourceRecord[] = invoices.map((inv) => ({
      id: inv.id,
      type: "INVOICE",
      title: `Invoice ${inv.invoiceNumber} (${inv.client?.name || "Client"})`,
      url: `/app/finance/invoices/${inv.id}`,
      snippet: `Amount: ₹${inv.total.toLocaleString()}, Status: ${inv.status}, Due: ${new Date(inv.dueDate).toLocaleDateString()}`,
    }));

    return { data: invoices, sources };
  }

  /**
   * Tool: get_expenses (Strict Finance RBAC)
   */
  static async getExpenses(user: AuthenticatedUser, params: { status?: string; limit?: number } = {}) {
    if (!this.hasPermission(user, ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "CFO", "FINANCE_MANAGER"], "finance")) {
      throw new Error("Access Denied: You lack permissions to view organization expenditure data.");
    }
    if (!user.employee) throw new Error("Unauthenticated user profile");
    const orgId = user.employee.organizationId;
    const limit = Math.min(params.limit || 15, 50);

    const expenses = await db.expense.findMany({
      where: {
        organizationId: orgId,
        ...(params.status ? { status: params.status } : {}),
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        expenseNumber: true,
        description: true,
        amount: true,
        category: true,
        status: true,
        date: true,
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    const sources: AISourceRecord[] = expenses.map((exp) => ({
      id: exp.id,
      type: "EXPENSE",
      title: `${exp.expenseNumber || "EXP"}: ${exp.description}`,
      url: `/app/finance/expenses`,
      snippet: `Amount: ₹${exp.amount.toLocaleString()}, Category: ${exp.category}, Status: ${exp.status}`,
    }));

    return { data: expenses, sources };
  }

  /**
   * Tool: get_contracts (Strict Legal RBAC)
   */
  static async getContracts(user: AuthenticatedUser, params: { expiringDays?: number; limit?: number } = {}) {
    if (!this.hasPermission(user, ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "LEGAL_COUNSEL", "LEGAL_HEAD"], "legal")) {
      throw new Error("Access Denied: You lack permissions to view legal contracts.");
    }
    if (!user.employee) throw new Error("Unauthenticated user profile");
    const orgId = user.employee.organizationId;
    const limit = Math.min(params.limit || 10, 50);

    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + (params.expiringDays || 60));

    const contracts = await db.legalContract.findMany({
      where: {
        organizationId: orgId,
        ...(params.expiringDays
          ? {
              status: "ACTIVE",
              expiryDate: { gte: now, lte: horizon },
            }
          : {}),
      },
      take: limit,
      orderBy: { expiryDate: "asc" },
      select: {
        id: true,
        contractNumber: true,
        title: true,
        contractType: true,
        status: true,
        contractValue: true,
        effectiveDate: true,
        expiryDate: true,
        client: { select: { name: true } },
      },
    });

    const sources: AISourceRecord[] = contracts.map((c) => ({
      id: c.id,
      type: "CONTRACT",
      title: `${c.contractNumber}: ${c.title}`,
      url: `/app/legal/contracts/${c.id}`,
      snippet: `Type: ${c.contractType}, Value: ₹${c.contractValue?.toLocaleString() || 0}, Expires: ${c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "None"}`,
    }));

    return { data: contracts, sources };
  }

  /**
   * Tool: get_dashboard_metrics (Role-specific Executive telemetry)
   */
  static async getDashboardMetrics(user: AuthenticatedUser) {
    if (!user.employee) throw new Error("Unauthenticated user profile");
    const orgId = user.employee.organizationId;
    const roleCode = user.roleCode;

    // Fetch aggregate state safely
    const [clientsCount, activeDeals, totalTasks, overdueTasks, overdueInvoices, pendingApprovals] =
      await Promise.all([
        db.client.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
        db.opportunity.count({
          where: { organizationId: orgId, stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
        }),
        db.task.count({ where: { organizationId: orgId, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
        db.task.count({
          where: {
            organizationId: orgId,
            status: { notIn: ["COMPLETED", "CANCELLED"] },
            dueDate: { lt: new Date() },
          },
        }),
        this.hasPermission(user, ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "CFO"], "finance")
          ? db.invoice.count({
              where: {
                organizationId: orgId,
                status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] },
                dueDate: { lt: new Date() },
              },
            })
          : 0,
        db.employeeRequest.count({
          where: { organizationId: orgId, status: "PENDING" },
        }).catch(() => 0),
      ]);

    // Financial sums if authorized
    let revenueSum = 0;
    let expenseSum = 0;
    if (this.hasPermission(user, ["SUPER_ADMIN", "ADMIN", "CEO", "CHAIRPERSON", "CFO"], "finance")) {
      const rev = await db.payment.aggregate({
        where: { organizationId: orgId, status: "COMPLETED" },
        _sum: { amount: true },
      });
      revenueSum = rev._sum.amount || 0;

      const exp = await db.expense.aggregate({
        where: { organizationId: orgId, status: "APPROVED" },
        _sum: { amount: true },
      });
      expenseSum = exp._sum.amount || 0;
    }

    const sources: AISourceRecord[] = [
      {
        id: "crm-dashboard",
        type: "DASHBOARD",
        title: `${roleCode} Executive Telemetry`,
        url: `/app/dashboard/${roleCode.toLowerCase()}`,
        snippet: `Active Clients: ${clientsCount}, Open Deals: ${activeDeals}, Overdue Tasks: ${overdueTasks}`,
      },
    ];

    return {
      metrics: {
        role: roleCode,
        clientsCount,
        activeDeals,
        totalTasks,
        overdueTasks,
        overdueInvoices,
        pendingApprovals,
        totalRevenue: revenueSum,
        totalExpenses: expenseSum,
      },
      sources,
    };
  }
}
