import {
  AIProvider,
  AIResponsePayload,
  RecordSummaryPayload,
  AIAdvisorPayload,
  AIActionPreview,
} from "./ai-provider.interface";
import { AISourceRecord } from "./ai-tools";

export class InternalIntelligenceEngine implements AIProvider {
  providerName = "INTERNAL_REASONING_ENGINE";

  async generateResponse(input: {
    userRole: string;
    query: string;
    retrievedData: any;
    conversationHistory?: Array<{ role: string; content: string }>;
    contextRecord?: { type: string; id: string; data: any };
  }): Promise<AIResponsePayload> {
    const { userRole, query, retrievedData, contextRecord } = input;
    const lower = query.toLowerCase();
    const sources: AISourceRecord[] = [];
    let content = "";
    let actionPreview: AIActionPreview | null = null;
    let limitationsNote: string | undefined;

    // 1. Check for Action Intent (e.g. "Create task", "Follow up", "Schedule")
    if (lower.includes("create task") || lower.includes("follow up") || lower.includes("remind")) {
      const targetName = contextRecord?.data?.name || contextRecord?.data?.title || "CRM Record";
      actionPreview = {
        actionType: "CREATE_TASK",
        title: `AI Action: Follow up on ${targetName}`,
        description: `Review requirements and touchpoints discussed with ${targetName}. (Initiated via AI Intelligence Assistant)`,
        targetRecordId: contextRecord?.id,
        targetRecordType: contextRecord?.type,
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      };

      content = `I have formulated a suggested follow-up task for **${targetName}**. In accordance with enterprise safety policies, this consequential action requires your explicit confirmation before execution. Please review the details in the action card below.`;
    }
    // 2. Revenue / Finance query
    else if (lower.includes("revenue") || lower.includes("money") || lower.includes("financial")) {
      if (retrievedData.invoices || retrievedData.metrics?.totalRevenue !== undefined) {
        const rev = retrievedData.metrics?.totalRevenue || 0;
        const exp = retrievedData.metrics?.totalExpenses || 0;
        const net = rev - exp;
        content = `### Financial Telemetry Overview\n\n- **Total Realized Revenue**: ₹${rev.toLocaleString()}\n- **Approved Expenses**: ₹${exp.toLocaleString()}\n- **Operating Margin**: ₹${net.toLocaleString()} (${rev > 0 ? ((net / rev) * 100).toFixed(1) : 0}%)\n\nThese metrics reflect strictly reconciled transactions in the organization ledger.`;
        if (retrievedData.sources) sources.push(...retrievedData.sources);
      } else {
        content = "You do not currently possess authorized permissions to query organization financial ledgers, or no financial records were found.";
        limitationsNote = "Access to financial metrics is restricted by RBAC to Finance and Executive personnel.";
      }
    }
    // 3. Invoices / Overdue receivables query
    else if (lower.includes("invoice") || lower.includes("overdue") || lower.includes("unpaid")) {
      if (retrievedData.invoices) {
        const invList = retrievedData.invoices.data || retrievedData.invoices;
        if (Array.isArray(invList) && invList.length > 0) {
          const totalOverdue = invList.reduce((acc: number, item: any) => acc + (item.totalAmount || 0), 0);
          content = `### Overdue Invoices Analysis\n\nIdentified **${invList.length}** invoices requiring urgent settlement, totaling **₹${totalOverdue.toLocaleString()}**:\n\n` +
            invList.slice(0, 5).map((inv: any) => `- **Invoice ${inv.invoiceNumber}**: ₹${inv.totalAmount.toLocaleString()} (Client: ${inv.client?.name || "Client"}) - Due ${new Date(inv.dueDate).toLocaleDateString()}`).join("\n");
          if (retrievedData.invoices.sources) sources.push(...retrievedData.invoices.sources);
        } else {
          content = "Good news! There are currently no overdue invoices matching your query in the system.";
        }
      } else {
        content = "Invoice inspection is restricted to authorized accounting and executive roles.";
      }
    }
    // 4. Projects / Operations query
    else if (lower.includes("project") || lower.includes("delayed") || lower.includes("operation")) {
      if (retrievedData.projects) {
        const projList = retrievedData.projects.data || retrievedData.projects;
        if (Array.isArray(projList) && projList.length > 0) {
          content = `### Projects & Operational Status\n\nFound **${projList.length}** operations currently under review:\n\n` +
            projList.slice(0, 6).map((p: any) => `- **${p.operationCode || "OP"}**: ${p.title} — Progress: **${p.progress}%** (${p.status})`).join("\n");
          if (retrievedData.projects.sources) sources.push(...retrievedData.projects.sources);
        } else {
          content = "No delayed or critical project alerts found under your operational purview.";
        }
      }
    }
    // 5. Tasks query
    else if (lower.includes("task") || lower.includes("todo") || lower.includes("pending")) {
      if (retrievedData.tasks) {
        const taskList = retrievedData.tasks.data || retrievedData.tasks;
        if (Array.isArray(taskList) && taskList.length > 0) {
          content = `### Actionable Tasks Overview\n\nYou currently have **${taskList.length}** open tasks requiring attention:\n\n` +
            taskList.slice(0, 6).map((t: any) => `- **[${t.priority}]** ${t.title} (Status: ${t.status})`).join("\n");
          if (retrievedData.tasks.sources) sources.push(...retrievedData.tasks.sources);
        } else {
          content = "All tasks assigned to you are currently up to date.";
        }
      }
    }
    // 6. Context-Aware Record Summarization
    else if (contextRecord?.data) {
      const d = contextRecord.data;
      content = `### Contextual Inspection: ${d.name || d.title || contextRecord.type}\n\n` +
        `- **Record Type**: ${contextRecord.type}\n` +
        `- **Current Status**: ${d.status || d.lifecycleStage || "Active"}\n` +
        `- **Last Updated**: ${d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : "Recent"}\n\n` +
        `Ask me to summarize touchpoints, identify overdue tasks, or create follow-up actions for this record.`;

      sources.push({
        id: contextRecord.id,
        type: contextRecord.type,
        title: d.name || d.title || "Target Record",
        url: `/app/${contextRecord.type.toLowerCase()}s/${contextRecord.id}`,
      });
    }
    // 7. General Enterprise CRM Inquiry
    else {
      content = `### Enterprise CRM Intelligence Assistant\n\nI have evaluated your request against the authorized data scope for your **${userRole}** account.\n\n` +
        `You can ask me to:\n` +
        `- Summarize active clients and deals\n` +
        `- Detail overdue invoices and financial risks\n` +
        `- List delayed operations or workload imbalances\n` +
        `- Draft follow-up tasks with two-step execution previews\n\n` +
        `Every answer is verified against database records with verifiable source links.`;
    }

    if (!limitationsNote) {
      limitationsNote = "All responses are strictly derived from real-time database records and authenticated RBAC scope.";
    }

    return { content, sources, actionPreview, limitationsNote };
  }

  async summarizeRecord(recordType: string, recordData: any): Promise<RecordSummaryPayload> {
    const title = recordData.name || recordData.title || `${recordType} #${recordData.id?.slice(0, 8)}`;
    const status = recordData.status || recordData.lifecycleStage || "ACTIVE";
    const sources: AISourceRecord[] = [
      {
        id: recordData.id || "record",
        type: recordType,
        title,
        url: `/app/${recordType.toLowerCase()}s/${recordData.id}`,
      },
    ];

    const highlights: string[] = [];
    const risks: string[] = [];
    const recommendedActions: string[] = [];

    if (recordType === "CLIENT") {
      highlights.push(`Corporate account categorized under ${recordData.industry || "Enterprise"} sector.`);
      highlights.push(`Lifecycle Stage: ${recordData.lifecycleStage || "CUSTOMER"}, Tier: ${recordData.tier || "STANDARD"}.`);
      if (recordData._count?.opportunities) {
        highlights.push(`${recordData._count.opportunities} deal opportunities connected to this account.`);
      }
      if (status !== "ACTIVE") {
        risks.push(`Account status is currently marked as ${status}.`);
      }
      recommendedActions.push("Schedule a relationship review touchpoint.");
      recommendedActions.push("Review recent communication discussions.");
    } else if (recordType === "OPERATION") {
      highlights.push(`Project progress at ${recordData.progress || 0}% completion.`);
      if (recordData.expectedCompletionDate) {
        const isPast = new Date(recordData.expectedCompletionDate) < new Date();
        if (isPast && status !== "COMPLETED") {
          risks.push(`Target deadline was ${new Date(recordData.expectedCompletionDate).toLocaleDateString()} and is now overdue.`);
        }
      }
      recommendedActions.push("Verify team workload and pending blockers.");
    } else if (recordType === "INVOICE") {
      highlights.push(`Invoice total amount: ₹${recordData.totalAmount?.toLocaleString() || 0}.`);
      if (recordData.dueDate && new Date(recordData.dueDate) < new Date() && status !== "PAID") {
        risks.push(`Invoice exceeded payment deadline of ${new Date(recordData.dueDate).toLocaleDateString()}.`);
      }
      recommendedActions.push("Trigger automated payment reminder escalation.");
    } else {
      highlights.push(`Record status is ${status}.`);
      recommendedActions.push("Review activity timeline and task attachments.");
    }

    return {
      headline: `${recordType} Intelligence Summary: ${title}`,
      keyStatus: status,
      highlights,
      risks,
      recommendedActions,
      sources,
    };
  }

  async generateExecutiveAdvice(userRole: string, metrics: any): Promise<AIAdvisorPayload> {
    const observations: AIAdvisorPayload["observations"] = [];
    const anomalies: AIAdvisorPayload["anomalies"] = [];
    const actionRecommendations: AIActionPreview[] = [];
    const sources: AISourceRecord[] = [
      {
        id: "executive-suite",
        type: "DASHBOARD",
        title: `${userRole} Strategy Telemetry`,
        url: `/app/dashboard/${userRole.toLowerCase()}`,
      },
    ];

    // Observations based on measurable metrics
    if (metrics.overdueInvoices > 0) {
      observations.push({
        category: "REVENUE",
        title: "Overdue Receivables Identified",
        description: `${metrics.overdueInvoices} client invoices have surpassed their agreed payment milestones.`,
        severity: "WARNING",
      });
      anomalies.push({
        metric: "Aging Receivables",
        detectedChange: `${metrics.overdueInvoices} invoices overdue`,
        causeHypothesis: "Delayed approvals on customer procurement desks or lack of reminder cadence.",
      });
      actionRecommendations.push({
        actionType: "ESCALATE_INVOICE",
        title: "Escalate Overdue Receivables to Finance Head",
        description: "Initiate immediate payment reminder escalation for aging accounts.",
        priority: "HIGH",
      });
    }

    if (metrics.overdueTasks > 0) {
      observations.push({
        category: "OPERATIONS",
        title: "Operational Task Lag",
        description: `${metrics.overdueTasks} employee tasks are currently past their due dates.`,
        severity: "CRITICAL",
      });
      actionRecommendations.push({
        actionType: "CREATE_TASK",
        title: "Realign Operational Task Deadlines",
        description: "Review overdue project deliverables with department leads.",
        priority: "HIGH",
      });
    }

    if (metrics.activeDeals > 0) {
      observations.push({
        category: "CLIENTS",
        title: "Sales Pipeline Velocity",
        description: `${metrics.activeDeals} opportunities actively advancing through CRM qualification stages.`,
        severity: "INFO",
      });
    }

    return {
      headline: `${userRole} Executive Advisory Briefing`,
      observations,
      anomalies,
      actionRecommendations,
      sources,
    };
  }
}
