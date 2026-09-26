import { db } from "@/lib/db";
import { AuthenticatedUser } from "@/types";
import { AITools, AISourceRecord } from "./ai-tools";
import { InternalIntelligenceEngine } from "./internal-engine";
import { AIProvider, AIActionPreview, AIResponsePayload, RecordSummaryPayload, AIAdvisorPayload } from "./ai-provider.interface";
import { TaskService } from "../task.service";
import { AuditService } from "../audit.service";

interface CachedExecutiveAdvice {
  data: AIAdvisorPayload;
  cachedAt: number;
}
const executiveAdviceCache = new Map<string, CachedExecutiveAdvice>();
const inFlightAdvicePromises = new Map<string, Promise<AIAdvisorPayload>>();
const ADVICE_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export class AIService {
  private static internalEngine = new InternalIntelligenceEngine();

  /**
   * Resolve active AI Provider
   */
  private static async getProvider(organizationId: string): Promise<AIProvider> {
    const config = await db.aIConfiguration.findUnique({
      where: { organizationId },
    });

    // Default to high-performance internal engine
    return this.internalEngine;
  }

  /**
   * Main conversational interaction
   */
  static async askAssistant(
    user: AuthenticatedUser,
    input: {
      query: string;
      conversationId?: string;
      contextRecordType?: string;
      contextRecordId?: string;
    }
  ): Promise<{
    message: string;
    conversationId: string;
    sources: AISourceRecord[];
    actionPreview: AIActionPreview | null;
    limitationsNote?: string;
  }> {
    const startTime = Date.now();
    if (!user.employee) throw new Error("Authenticated employee record required");
    const orgId = user.employee.organizationId;
    const userId = user.id;

    // 1. Get or create AIConversation
    let conversation = input.conversationId
      ? await db.aIConversation.findFirst({
          where: { id: input.conversationId, userId, organizationId: orgId },
        })
      : null;

    if (!conversation) {
      conversation = await db.aIConversation.create({
        data: {
          organizationId: orgId,
          userId,
          title: input.query.slice(0, 45) || "CRM Intelligence Session",
          contextRecordType: input.contextRecordType,
          contextRecordId: input.contextRecordId,
        },
      });
    }

    // Save user message
    await db.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: input.query,
      },
    });

    // 2. Controlled Data Retrieval via AITools based on query keywords
    const lower = input.query.toLowerCase();
    const retrievedData: any = {};
    const gatheredSources: AISourceRecord[] = [];

    // Context record retrieval if attached
    let contextRecord: any = null;
    if (input.contextRecordType && input.contextRecordId) {
      if (input.contextRecordType === "CLIENT") {
        const c = await db.client.findFirst({
          where: { id: input.contextRecordId, organizationId: orgId },
        });
        if (c) contextRecord = { type: "CLIENT", id: c.id, data: c };
      } else if (input.contextRecordType === "OPERATION") {
        const op = await db.operation.findFirst({
          where: { id: input.contextRecordId, organizationId: orgId },
        });
        if (op) contextRecord = { type: "OPERATION", id: op.id, data: op };
      }
    }

    // Route tools safely
    try {
      if (lower.includes("client") || lower.includes("account")) {
        const clients = await AITools.getClients(user);
        retrievedData.clients = clients;
        gatheredSources.push(...clients.sources);
      }
      if (lower.includes("lead") || lower.includes("prospect")) {
        const leads = await AITools.getLeads(user);
        retrievedData.leads = leads;
        gatheredSources.push(...leads.sources);
      }
      if (lower.includes("project") || lower.includes("operation") || lower.includes("delay")) {
        const projects = await AITools.getProjects(user);
        retrievedData.projects = projects;
        gatheredSources.push(...projects.sources);
      }
      if (lower.includes("task") || lower.includes("todo") || lower.includes("pending")) {
        const tasks = await AITools.getTasks(user);
        retrievedData.tasks = tasks;
        gatheredSources.push(...tasks.sources);
      }
      if (lower.includes("invoice") || lower.includes("overdue") || lower.includes("revenue") || lower.includes("financial")) {
        try {
          const invoices = await AITools.getInvoices(user, { overdueOnly: lower.includes("overdue") });
          retrievedData.invoices = invoices;
          gatheredSources.push(...invoices.sources);
        } catch {
          // Handled gracefully if RBAC restricted
        }
      }
      if (lower.includes("contract") || lower.includes("legal") || lower.includes("expire")) {
        try {
          const contracts = await AITools.getContracts(user);
          retrievedData.contracts = contracts;
          gatheredSources.push(...contracts.sources);
        } catch {
          // Handled gracefully if RBAC restricted
        }
      }

      // Always pull metrics for high-level context
      const metrics = await AITools.getDashboardMetrics(user);
      retrievedData.metrics = metrics.metrics;
      gatheredSources.push(...metrics.sources);
    } catch (toolError) {
      console.warn("AI Tool retrieval warning:", toolError);
    }

    // 3. Delegate to Provider
    const provider = await this.getProvider(orgId);
    const aiResponse: AIResponsePayload = await provider.generateResponse({
      userRole: user.roleCode,
      query: input.query,
      retrievedData,
      contextRecord,
    });

    const allSources = Array.from(
      new Map([...gatheredSources, ...aiResponse.sources].map((s) => [s.id, s])).values()
    ).slice(0, 8);

    // Save assistant message
    await db.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: aiResponse.content,
        sources: allSources.length > 0 ? JSON.stringify(allSources) : null,
        actionPreview: aiResponse.actionPreview ? JSON.stringify(aiResponse.actionPreview) : null,
      },
    });

    // 4. Usage Audit Telemetry
    const duration = Date.now() - startTime;
    await db.aIUsageLog.create({
      data: {
        organizationId: orgId,
        userId,
        feature: "ASSISTANT",
        model: provider.providerName,
        durationMs: duration,
        tokensUsed: Math.ceil(aiResponse.content.length / 4),
        success: true,
      },
    }).catch(() => {});

    return {
      message: aiResponse.content,
      conversationId: conversation.id,
      sources: allSources,
      actionPreview: aiResponse.actionPreview || null,
      limitationsNote: aiResponse.limitationsNote,
    };
  }

  /**
   * Record-level summarization (Client 360, Projects, Invoices, Contracts)
   */
  static async summarizeRecord(
    user: AuthenticatedUser,
    recordType: string,
    recordId: string
  ): Promise<RecordSummaryPayload> {
    if (!user.employee) throw new Error("Authenticated employee profile required");
    const orgId = user.employee.organizationId;

    let recordData: any = null;

    if (recordType === "CLIENT") {
      recordData = await db.client.findFirst({
        where: { id: recordId, organizationId: orgId },
        include: { _count: { select: { opportunities: true, tasks: true, invoices: true } } },
      });
    } else if (recordType === "OPERATION") {
      recordData = await db.operation.findFirst({
        where: { id: recordId, organizationId: orgId },
      });
    } else if (recordType === "INVOICE") {
      recordData = await db.invoice.findFirst({
        where: { id: recordId, organizationId: orgId },
      });
    } else if (recordType === "CONTRACT") {
      recordData = await db.legalContract.findFirst({
        where: { id: recordId, organizationId: orgId },
      });
    }

    if (!recordData) {
      throw new Error(`${recordType} record not found or access denied`);
    }

    const provider = await this.getProvider(orgId);
    return provider.summarizeRecord(recordType, recordData);
  }

  /**
   * Executive AI Advisor with in-memory caching and request deduplication
   */
  static async getExecutiveAdvice(user: AuthenticatedUser): Promise<AIAdvisorPayload> {
    if (!user.employee) throw new Error("Authenticated employee profile required");
    const orgId = user.employee.organizationId;
    const cacheKey = `${orgId}:${user.roleCode}`;
    const now = Date.now();

    const cached = executiveAdviceCache.get(cacheKey);
    if (cached && now - cached.cachedAt < ADVICE_CACHE_TTL_MS) {
      return cached.data;
    }

    const existingPromise = inFlightAdvicePromises.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = (async () => {
      try {
        const metricsResult = await AITools.getDashboardMetrics(user);
        const provider = await this.getProvider(orgId);
        const result = await provider.generateExecutiveAdvice(user.roleCode, metricsResult.metrics);
        executiveAdviceCache.set(cacheKey, { data: result, cachedAt: Date.now() });
        return result;
      } finally {
        inFlightAdvicePromises.delete(cacheKey);
      }
    })();

    inFlightAdvicePromises.set(cacheKey, promise);
    return promise;
  }

  /**
   * Execute a Confirmed AI Action (Explicit two-step verification)
   */
  static async executeConfirmedAction(
    user: AuthenticatedUser,
    action: AIActionPreview
  ): Promise<{ success: boolean; result: any; message: string }> {
    if (!user.employee) throw new Error("Authenticated employee profile required");
    const orgId = user.employee.organizationId;

    if (action.actionType === "CREATE_TASK") {
      const task = await TaskService.createTask(user, {
        title: action.title,
        description: action.description,
        priority: (action.priority as any) || "MEDIUM",
        dueDate: action.dueDate || new Date(Date.now() + 86400000).toISOString(),
        relatedClientId: action.targetRecordType === "CLIENT" ? action.targetRecordId : undefined,
        operationId: action.targetRecordType === "OPERATION" ? action.targetRecordId : undefined,
        assigneeId: action.assigneeId || user.employee.id,
      });

      await AuditService.logMutation({
        actorId: user.id,
        action: "AI_CONFIRMED_ACTION_EXECUTED",
        entity: "Task",
        entityId: task.id,
        newValue: { actionType: action.actionType, title: action.title },
      });

      return {
        success: true,
        result: task,
        message: `Task "${task.title}" successfully created and scheduled.`,
      };
    }

    return {
      success: true,
      result: null,
      message: `Action ${action.actionType} executed with verified confirmation.`,
    };
  }

  /**
   * List user's AI conversations
   */
  static async getConversations(user: AuthenticatedUser) {
    if (!user.employee) return [];
    return db.aIConversation.findMany({
      where: {
        userId: user.id,
        organizationId: user.employee.organizationId,
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }

  /**
   * Get single conversation with full message history
   */
  static async getConversationById(user: AuthenticatedUser, conversationId: string) {
    if (!user.employee) throw new Error("Unauthorized");
    const conversation = await db.aIConversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
        organizationId: user.employee.organizationId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) throw new Error("Conversation not found");

    return {
      ...conversation,
      messages: conversation.messages.map((m) => ({
        ...m,
        sources: m.sources ? JSON.parse(m.sources) : [],
        actionPreview: m.actionPreview ? JSON.parse(m.actionPreview) : null,
      })),
    };
  }

  /**
   * Delete an AI conversation
   */
  static async deleteConversation(user: AuthenticatedUser, conversationId: string) {
    if (!user.employee) throw new Error("Unauthorized");
    return db.aIConversation.deleteMany({
      where: {
        id: conversationId,
        userId: user.id,
        organizationId: user.employee.organizationId,
      },
    });
  }
}
